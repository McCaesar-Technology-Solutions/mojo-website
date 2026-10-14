-- Recoverable Paystack refund state, cancellation of payment holds, and one late-payment audit row.
--
-- paystack_refund_state:
--   null               no refund has been sent, or Paystack explicitly rejected the last attempt
--   provider_pending   a refund call was started and its result is not known, or not yet marked accepted
--   provider_accepted  Paystack accepted the refund; local occupancy and audit cleanup may still be incomplete
-- A pending state must not send another refund. Paystack idempotency is not assumed.
--
-- Cancelling a booking deletes its hold and booked blocks in the same transaction as the status change.
-- Booking row lock, then property inventory lock, is unchanged.

alter table public.bookings
  add column paystack_refund_state text
  check (paystack_refund_state in ('provider_pending', 'provider_accepted'));

alter table public.bookings
  add column paystack_checkout_state text
  check (paystack_checkout_state in ('provider_unknown', 'provider_accepted'));

create unique index audit_logs_one_payment_after_cancel
  on public.audit_logs (entity_id)
  where action = 'booking.payment_after_cancel';

create unique index audit_logs_one_unmatched_payment
  on public.audit_logs ((meta ->> 'reference'))
  where action = 'booking.payment_unmatched';

create or replace function public.admin_update_booking(
  p_booking_id uuid,
  p_patch jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  b public.bookings%rowtype;
  next_status text;
  next_in date;
  next_out date;
  next_notes text;
  dates_changed boolean;
  status_changed boolean;
  notes_changed boolean;
  occupying boolean;
  block_count int;
  block_row public.availability_blocks%rowtype;
  repaired boolean := false;
  key text;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'BOOKING_NOT_AUTHORIZED'
      using errcode = '42501';
  end if;

  if p_booking_id is null then
    raise exception 'BOOKING_INVALID: booking id is required'
      using errcode = '22023';
  end if;

  if p_patch is null or jsonb_typeof(p_patch) <> 'object' then
    raise exception 'BOOKING_INVALID: patch must be an object'
      using errcode = '22023';
  end if;

  for key in select jsonb_object_keys(p_patch) loop
    if key not in ('status', 'admin_notes', 'check_in', 'check_out') then
      raise exception 'BOOKING_INVALID: unsupported field %', key
        using errcode = '22023';
    end if;
  end loop;

  select * into b
  from public.bookings
  where id = p_booking_id
  for update;

  if not found then
    raise exception 'BOOKING_NOT_FOUND'
      using errcode = 'P0002';
  end if;

  next_status := b.status;
  next_in := b.check_in;
  next_out := b.check_out;
  next_notes := b.admin_notes;

  if p_patch ? 'status' then
    next_status := p_patch ->> 'status';
    if next_status is null or next_status not in (
      'pending_payment', 'confirmed', 'checked_in', 'completed', 'cancelled', 'refunded'
    ) then
      raise exception 'BOOKING_INVALID: unknown status'
        using errcode = '22023';
    end if;
    if next_status is distinct from b.status then
      if not (
        (b.status = 'pending_payment' and next_status in ('confirmed', 'cancelled'))
        or (b.status = 'confirmed' and next_status in ('checked_in', 'completed', 'cancelled'))
        or (b.status = 'checked_in' and next_status in ('completed', 'cancelled'))
      ) then
        raise exception 'BOOKING_INVALID: status cannot change from % to %', b.status, next_status
          using errcode = '22023';
      end if;
    end if;
  end if;

  if p_patch ? 'check_in' then
    begin
      next_in := (p_patch ->> 'check_in')::date;
    exception
      when others then
        raise exception 'BOOKING_INVALID: check_in must be YYYY-MM-DD'
          using errcode = '22023';
    end;
    if next_in is null then
      raise exception 'BOOKING_INVALID: check_in is required'
        using errcode = '22023';
    end if;
  end if;

  if p_patch ? 'check_out' then
    begin
      next_out := (p_patch ->> 'check_out')::date;
    exception
      when others then
        raise exception 'BOOKING_INVALID: check_out must be YYYY-MM-DD'
          using errcode = '22023';
    end;
    if next_out is null then
      raise exception 'BOOKING_INVALID: check_out is required'
        using errcode = '22023';
    end if;
  end if;

  if next_out <= next_in then
    raise exception 'BOOKING_INVALID: check_out must be after check_in'
      using errcode = '22023';
  end if;

  if p_patch ? 'admin_notes' then
    next_notes := p_patch ->> 'admin_notes';
  end if;

  dates_changed := next_in is distinct from b.check_in or next_out is distinct from b.check_out;
  status_changed := next_status is distinct from b.status;
  notes_changed := next_notes is distinct from b.admin_notes;

  if not dates_changed and not status_changed and not notes_changed then
    return jsonb_build_object('ok', true, 'booking_id', b.id, 'unchanged', true);
  end if;

  occupying := next_status in ('pending_payment', 'confirmed', 'checked_in', 'completed');

  -- Serialize with approve_enquiry and replace_pms_occupancy on this property.
  perform public.lock_property_inventory(b.property_id);

  if occupying then
    select count(*) into block_count
    from public.availability_blocks
    where booking_id = b.id
      and reason = 'booked';

    if block_count > 1 then
      raise exception 'BOOKING_BLOCK_CORRUPT: multiple booked blocks'
        using errcode = 'P0001';
    end if;

    if block_count = 1 then
      select * into block_row
      from public.availability_blocks
      where booking_id = b.id
        and reason = 'booked';

      if block_row.property_id is distinct from b.property_id then
        raise exception 'BOOKING_BLOCK_CORRUPT: booked block property does not match booking'
          using errcode = 'P0001';
      end if;

      if dates_changed
        or block_row.start_date is distinct from next_in
        or block_row.end_date is distinct from next_out
      then
        update public.availability_blocks
        set start_date = next_in,
            end_date = next_out
        where id = block_row.id;
      end if;
    else
      insert into public.availability_blocks (
        property_id, start_date, end_date, reason, booking_id
      ) values (
        b.property_id, next_in, next_out, 'booked', b.id
      );
      repaired := true;
    end if;
  else
    delete from public.availability_blocks
    where booking_id = b.id
      and reason in ('booked', 'hold');
  end if;

  update public.bookings
  set
    status = next_status,
    check_in = next_in,
    check_out = next_out,
    nights = (next_out - next_in),
    admin_notes = next_notes
  where id = b.id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, meta)
  values (
    auth.uid(),
    'booking.updated',
    'booking',
    b.id,
    jsonb_build_object(
      'status', next_status,
      'check_in', next_in,
      'check_out', next_out,
      'admin_notes', next_notes,
      'previous_status', b.status,
      'previous_check_in', b.check_in,
      'previous_check_out', b.check_out,
      'repaired_missing_block', repaired
    )
  );

  return jsonb_build_object(
    'ok', true,
    'booking_id', b.id,
    'status', next_status,
    'check_in', next_in,
    'check_out', next_out,
    'repaired_missing_block', repaired
  );
exception
  when exclusion_violation then
    raise exception 'BOOKING_DATES_UNAVAILABLE'
      using errcode = '23P01';
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

    begin
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
    exception
      when unique_violation then
        null;
    end;
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

    if found and b.status in ('cancelled', 'refunded') then
      delete from public.availability_blocks
      where id = blk.id
        and reason = 'hold';
      return jsonb_build_object(
        'ok', true,
        'outcome', 'released',
        'booking_id', b.id
      );
    end if;
  end if;

  if blk.created_at > now() - interval '30 minutes' then
    return jsonb_build_object('ok', true, 'outcome', 'not_expired');
  end if;

  if blk.booking_id is not null and found and b.status = 'pending_payment' then
    update public.bookings
    set status = 'cancelled'
    where id = b.id;
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

create or replace function public.claim_paystack_refund(p_booking_id uuid)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  b public.bookings%rowtype;
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

  if b.paystack_reference is null then
    raise exception 'BOOKING_INVALID: no Paystack reference'
      using errcode = '22023';
  end if;

  if b.paystack_refund_state = 'provider_pending' then
    return jsonb_build_object('ok', false, 'action', 'unknown', 'booking_id', b.id);
  end if;

  if b.paystack_refund_state = 'provider_accepted' or b.status = 'refunded' then
    return jsonb_build_object('ok', true, 'action', 'reconcile', 'booking_id', b.id);
  end if;

  update public.bookings
  set paystack_refund_state = 'provider_pending'
  where id = b.id;

  return jsonb_build_object(
    'ok', true,
    'action', 'call_provider',
    'booking_id', b.id,
    'reference', b.paystack_reference
  );
end;
$$;

create or replace function public.abort_paystack_refund(p_booking_id uuid)
returns void
language plpgsql
set search_path = public
as $$
begin
  update public.bookings
  set paystack_refund_state = null
  where id = p_booking_id
    and paystack_refund_state = 'provider_pending';
end;
$$;

create or replace function public.mark_paystack_refund_accepted(p_booking_id uuid)
returns void
language plpgsql
set search_path = public
as $$
declare
  updated int;
begin
  update public.bookings
  set paystack_refund_state = 'provider_accepted'
  where id = p_booking_id
    and paystack_refund_state in ('provider_pending', 'provider_accepted');
  get diagnostics updated = row_count;
  if updated <> 1 then
    raise exception 'REFUND_NOT_PENDING'
      using errcode = '22023';
  end if;
end;
$$;

create or replace function public.finalize_paystack_refund(p_booking_id uuid)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  b public.bookings%rowtype;
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

  if b.paystack_refund_state is distinct from 'provider_accepted' and b.status is distinct from 'refunded' then
    raise exception 'REFUND_NOT_ACCEPTED'
      using errcode = '22023';
  end if;

  perform public.lock_property_inventory(b.property_id);

  if b.status is distinct from 'refunded' then
    update public.bookings
    set status = 'refunded',
        paystack_refund_state = 'provider_accepted'
    where id = b.id;
  end if;

  delete from public.availability_blocks
  where booking_id = b.id;

  update public.audit_logs
  set meta = meta || jsonb_build_object('resolved_at', now(), 'resolution', 'refunded')
  where action = 'booking.payment_after_cancel'
    and entity_id = b.id
    and coalesce(meta ->> 'resolved_at', '') = '';

  if b.status is distinct from 'refunded' then
    insert into public.audit_logs (action, entity_type, entity_id, meta)
    values (
      'booking.refunded',
      'booking',
      b.id,
      jsonb_build_object('reference', b.paystack_reference, 'occupancy_released', true)
    );
  end if;

  return jsonb_build_object('ok', true, 'booking_id', b.id, 'occupancy_released', true);
end;
$$;

create or replace function public.record_unmatched_paystack_charge(
  p_reference text,
  p_amount integer,
  p_currency text
)
returns jsonb
language plpgsql
set search_path = public
as $$
begin
  if p_reference is null or length(trim(p_reference)) = 0 then
    raise exception 'BOOKING_INVALID: reference is required'
      using errcode = '22023';
  end if;

  begin
    insert into public.audit_logs (action, entity_type, entity_id, meta)
    values (
      'booking.payment_unmatched',
      'payment',
      null,
      jsonb_build_object(
        'reference', p_reference,
        'paid_amount', p_amount,
        'currency', p_currency,
        'handling', 'No local booking was found. Do not treat this charge as settled.'
      )
    );
  exception
    when unique_violation then
      null;
  end;

  return jsonb_build_object('ok', true, 'reference', p_reference);
end;
$$;

revoke all on function public.claim_paystack_refund(uuid) from public;
revoke all on function public.abort_paystack_refund(uuid) from public;
revoke all on function public.mark_paystack_refund_accepted(uuid) from public;
revoke all on function public.finalize_paystack_refund(uuid) from public;
revoke all on function public.record_unmatched_paystack_charge(text, integer, text) from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on function public.claim_paystack_refund(uuid) from anon;
    revoke all on function public.abort_paystack_refund(uuid) from anon;
    revoke all on function public.mark_paystack_refund_accepted(uuid) from anon;
    revoke all on function public.finalize_paystack_refund(uuid) from anon;
    revoke all on function public.record_unmatched_paystack_charge(text, integer, text) from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on function public.claim_paystack_refund(uuid) from authenticated;
    revoke all on function public.abort_paystack_refund(uuid) from authenticated;
    revoke all on function public.mark_paystack_refund_accepted(uuid) from authenticated;
    revoke all on function public.finalize_paystack_refund(uuid) from authenticated;
    revoke all on function public.record_unmatched_paystack_charge(text, integer, text) from authenticated;
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.claim_paystack_refund(uuid) to service_role;
    grant execute on function public.abort_paystack_refund(uuid) to service_role;
    grant execute on function public.mark_paystack_refund_accepted(uuid) to service_role;
    grant execute on function public.finalize_paystack_refund(uuid) to service_role;
    grant execute on function public.record_unmatched_paystack_charge(text, integer, text) to service_role;
  end if;
end
$$;
