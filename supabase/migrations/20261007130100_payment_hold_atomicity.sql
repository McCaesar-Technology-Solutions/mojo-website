-- Payment hold confirmation and expiry share one property inventory lock.
--
-- confirm_paid_booking confirms a pending_payment booking and converts its hold
-- to reason=booked in the same transaction. A repeat delivery is idempotent when
-- a booked block still exists. It does not confirm a cancelled or refunded
-- booking. That case is recorded as booking.payment_after_cancel: the Paystack
-- charge must be refunded through the existing refund path. The booking stays
-- cancelled.
--
-- A confirmed booking with no hold and no booked block returns occupancy_missing
-- and is not reported as success.
--
-- release_expired_payment_hold cancels an eligible pending_payment booking and
-- deletes its hold in the same transaction. A hold whose booking is already
-- confirmed, checked_in, or completed is converted to reason=booked and kept.
-- Expiry cannot delete that booking's only occupancy row.

create or replace function public.confirm_paid_booking(p_booking_id uuid)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  b public.bookings%rowtype;
  hold_id uuid;
  booked_id uuid;
begin
  if p_booking_id is null then
    raise exception 'BOOKING_INVALID: booking id is required'
      using errcode = '22023';
  end if;

  select * into b
  from public.bookings
  where id = p_booking_id
  for update;

  if not found then
    raise exception 'BOOKING_NOT_FOUND'
      using errcode = 'P0002';
  end if;

  -- Same order as admin_update_booking: booking row, then property inventory.
  perform public.lock_property_inventory(b.property_id);

  if b.status in ('cancelled', 'refunded') then
    if not exists (
      select 1 from public.audit_logs
      where action = 'booking.payment_after_cancel'
        and entity_id = b.id
    ) then
      insert into public.audit_logs (action, entity_type, entity_id, meta)
      values (
        'booking.payment_after_cancel',
        'booking',
        b.id,
        jsonb_build_object(
          'reference', b.paystack_reference,
          'handling', 'Refund the Paystack charge. Do not confirm this booking.'
        )
      );
    end if;
    return jsonb_build_object(
      'ok', false,
      'outcome', 'payment_after_cancel',
      'booking_id', b.id
    );
  end if;

  if b.status not in ('pending_payment', 'confirmed', 'checked_in', 'completed') then
    raise exception 'BOOKING_INVALID: status % cannot be confirmed from payment', b.status
      using errcode = '22023';
  end if;

  select id into booked_id
  from public.availability_blocks
  where booking_id = b.id
    and reason = 'booked'
  order by created_at
  limit 1
  for update;

  select id into hold_id
  from public.availability_blocks
  where booking_id = b.id
    and reason = 'hold'
  order by created_at
  limit 1
  for update;

  if booked_id is null and hold_id is null then
    return jsonb_build_object(
      'ok', false,
      'outcome', 'occupancy_missing',
      'booking_id', b.id
    );
  end if;

  if hold_id is not null and booked_id is null then
    update public.availability_blocks
    set reason = 'booked'
    where id = hold_id;
  elsif hold_id is not null then
    delete from public.availability_blocks
    where id = hold_id
      and reason = 'hold';
  end if;

  if b.status = 'pending_payment' then
    update public.bookings
    set status = 'confirmed'
    where id = b.id;

    insert into public.audit_logs (action, entity_type, entity_id, meta)
    values (
      'booking.paid',
      'booking',
      b.id,
      jsonb_build_object('reference', b.paystack_reference)
    );

    return jsonb_build_object(
      'ok', true,
      'outcome', 'confirmed',
      'booking_id', b.id
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'outcome', 'already_confirmed',
    'booking_id', b.id
  );
end;
$$;

create or replace function public.release_expired_payment_hold(p_block_id uuid)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  blk public.availability_blocks%rowtype;
  b public.bookings%rowtype;
begin
  if p_block_id is null then
    raise exception 'HOLD_INVALID: block id is required'
      using errcode = '22023';
  end if;

  select * into blk
  from public.availability_blocks
  where id = p_block_id;

  if not found then
    return jsonb_build_object('ok', true, 'outcome', 'absent');
  end if;

  if blk.booking_id is not null then
    select * into b
    from public.bookings
    where id = blk.booking_id
    for update;
  end if;

  perform public.lock_property_inventory(blk.property_id);

  select * into blk
  from public.availability_blocks
  where id = p_block_id
  for update;

  if not found or blk.reason is distinct from 'hold' then
    return jsonb_build_object('ok', true, 'outcome', 'absent');
  end if;

  if blk.created_at > now() - interval '30 minutes' then
    return jsonb_build_object('ok', true, 'outcome', 'not_expired');
  end if;

  if blk.booking_id is not null then
    select * into b
    from public.bookings
    where id = blk.booking_id
    for update;

    if found and b.status in ('confirmed', 'checked_in', 'completed') then
      update public.availability_blocks
      set reason = 'booked'
      where id = blk.id;
      return jsonb_build_object(
        'ok', true,
        'outcome', 'preserved',
        'booking_id', b.id
      );
    end if;

    if found and b.status = 'pending_payment' then
      update public.bookings
      set status = 'cancelled'
      where id = b.id;
    end if;
  end if;

  delete from public.availability_blocks
  where id = blk.id
    and reason = 'hold';

  return jsonb_build_object(
    'ok', true,
    'outcome', 'released',
    'booking_id', blk.booking_id
  );
end;
$$;

comment on function public.confirm_paid_booking(uuid) is
  'Atomically confirm a paid booking and convert its hold to a booked block. Cancelled bookings stay cancelled and require a Paystack refund.';

comment on function public.release_expired_payment_hold(uuid) is
  'Atomically cancel an expired pending payment and delete its hold. Preserves occupancy for a booking that is already confirmed.';

revoke all on function public.confirm_paid_booking(uuid) from public;
revoke all on function public.release_expired_payment_hold(uuid) from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on function public.confirm_paid_booking(uuid) from anon;
    revoke all on function public.release_expired_payment_hold(uuid) from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on function public.confirm_paid_booking(uuid) from authenticated;
    revoke all on function public.release_expired_payment_hold(uuid) from authenticated;
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.confirm_paid_booking(uuid) to service_role;
    grant execute on function public.release_expired_payment_hold(uuid) to service_role;
  end if;
end
$$;
