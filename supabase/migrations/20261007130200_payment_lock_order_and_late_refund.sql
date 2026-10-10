-- Keep payment-hold linking on the same lock order as confirm_paid_booking:
-- booking row, then property inventory, then the availability row.
-- A direct update of availability_blocks.booking_id takes the property advisory
-- lock in the BEFORE trigger and only then takes a key share on the booking,
-- which deadlocks with confirmation.
--
-- resolve_payment_after_cancel records that the late charge was refunded.
-- confirm_paid_booking then reports payment_after_cancel_resolved instead of
-- asking for another refund.

create or replace function public.attach_paystack_hold(
  p_booking_id uuid,
  p_block_id uuid
)
returns void
language plpgsql
set search_path = public
as $$
declare
  b public.bookings%rowtype;
  linked int;
begin
  if p_booking_id is null or p_block_id is null then
    raise exception 'HOLD_INVALID: booking and block are required'
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

  perform public.lock_property_inventory(b.property_id);

  update public.availability_blocks
  set booking_id = b.id
  where id = p_block_id
    and property_id = b.property_id
    and reason = 'hold'
    and booking_id is null;

  get diagnostics linked = row_count;
  if linked <> 1 then
    raise exception 'HOLD_INVALID: payment hold could not be linked'
      using errcode = '22023';
  end if;
end;
$$;

create or replace function public.resolve_payment_after_cancel(p_booking_id uuid)
returns void
language plpgsql
set search_path = public
as $$
begin
  if p_booking_id is null then
    raise exception 'BOOKING_INVALID: booking id is required'
      using errcode = '22023';
  end if;

  update public.audit_logs
  set meta = meta || jsonb_build_object(
    'resolved_at', now(),
    'resolution', 'refunded'
  )
  where action = 'booking.payment_after_cancel'
    and entity_id = p_booking_id
    and coalesce(meta ->> 'resolved_at', '') = '';
end;
$$;

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
    if exists (
      select 1 from public.audit_logs
      where action = 'booking.payment_after_cancel'
        and entity_id = b.id
        and coalesce(meta ->> 'resolved_at', '') <> ''
    ) then
      return jsonb_build_object(
        'ok', true,
        'outcome', 'payment_after_cancel_resolved',
        'booking_id', b.id
      );
    end if;

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

revoke all on function public.attach_paystack_hold(uuid, uuid) from public;
revoke all on function public.resolve_payment_after_cancel(uuid) from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on function public.attach_paystack_hold(uuid, uuid) from anon;
    revoke all on function public.resolve_payment_after_cancel(uuid) from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on function public.attach_paystack_hold(uuid, uuid) from authenticated;
    revoke all on function public.resolve_payment_after_cancel(uuid) from authenticated;
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.attach_paystack_hold(uuid, uuid) to service_role;
    grant execute on function public.resolve_payment_after_cancel(uuid) to service_role;
  end if;
end
$$;
