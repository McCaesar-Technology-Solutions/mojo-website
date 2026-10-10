-- CP-A03.1: one transaction for admin booking mutations and their booked blocks.
--
-- Occupying statuses (block must exist): pending_payment, confirmed, checked_in, completed.
-- Freeing statuses (block must be absent): cancelled, refunded.
-- refunded is freeing if it is already the row status, but this RPC does not
-- transition into refunded. The admin UI does not offer that status; Paystack
-- refund stays deferred.
--
-- Property changes are rejected. There is no admin UI for them.
-- Date changes keep half-open [check_in, check_out) and nights = check_out - check_in.
-- Totals are not repriced.
--
-- Missing booked block on an occupying booking is created inside this transaction
-- (repair of absence only). More than one booked block, or a booked block whose
-- property_id disagrees with the booking, aborts with BOOKING_BLOCK_CORRUPT.
-- Cancellation deletes every reason=booked row for this booking_id.
--
-- No uniqueness constraint is added. Existing rows are not updated or deleted
-- by this migration.

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
      and reason = 'booked';
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

comment on function public.admin_update_booking(uuid, jsonb) is
  'Admin booking mutation. Updates the booking, its booked availability block, and the audit row in one transaction.';

revoke all on function public.admin_update_booking(uuid, jsonb) from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on function public.admin_update_booking(uuid, jsonb) from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on function public.admin_update_booking(uuid, jsonb) from authenticated;
    grant execute on function public.admin_update_booking(uuid, jsonb) to authenticated;
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.admin_update_booking(uuid, jsonb) to service_role;
  end if;
end
$$;

-- Authenticated admins can no longer update bookings through the Data API.
-- SELECT remains. approve_enquiry and this RPC are security definer.
-- The service role (deferred Paystack functions) still bypasses RLS.
drop policy if exists "bookings_admin_write" on public.bookings;

-- Clients may still create and remove manual/hold blocks.
-- booked and pms rows are written only by security-definer RPCs or the service role.
drop policy if exists "availability_admin_write" on public.availability_blocks;

create policy "availability_admin_mutate_manual_hold"
  on public.availability_blocks
  for all
  using (public.is_admin() and reason in ('manual', 'hold'))
  with check (public.is_admin() and reason in ('manual', 'hold'));
