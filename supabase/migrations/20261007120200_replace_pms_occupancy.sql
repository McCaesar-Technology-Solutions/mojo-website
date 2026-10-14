-- CP-A02.3: one-transaction PMS occupancy replace + shared property inventory lock.
--
-- Empty p_blocks ('[]') deletes all reason='pms' rows for the property and inserts
-- none. That matches the previous HTTP contract: PMS-open inventory for that
-- property. NULL / non-array payloads are rejected and do not clear occupancy.
--
-- EXECUTE is revoked from PUBLIC. The occupancy HTTP route authenticates with
-- PMS_SYNC_SECRET, then calls this RPC as the service role.

create or replace function public.lock_property_inventory(p_property_id uuid)
returns void
language plpgsql
set search_path = public
as $$
begin
  -- This advisory lock serializes inventory mutations for one property.
  -- The exclusion constraint remains the database-level invariant.
  if p_property_id is null then
    raise exception 'OCCUPANCY_INVALID: property_id is required'
      using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(
    hashtextextended('mojo.availability.property:' || p_property_id::text, 0)
  );
end;
$$;

create or replace function public.replace_pms_occupancy(
  p_property_id uuid,
  p_blocks jsonb
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  n int;
  i int;
  j int;
  a jsonb;
  b jsonb;
  a_start date;
  a_end date;
  b_start date;
  b_end date;
  inserted int := 0;
begin
  if p_property_id is null then
    raise exception 'OCCUPANCY_INVALID: property_id is required'
      using errcode = '22023';
  end if;

  if p_blocks is null or jsonb_typeof(p_blocks) <> 'array' then
    raise exception 'OCCUPANCY_INVALID: blocks must be a JSON array'
      using errcode = '22023';
  end if;

  n := jsonb_array_length(p_blocks);
  if n > 2000 then
    raise exception 'OCCUPANCY_INVALID: too many blocks'
      using errcode = '22023';
  end if;

  if not exists (select 1 from public.properties p where p.id = p_property_id) then
    raise exception 'OCCUPANCY_NOT_FOUND: property not found'
      using errcode = 'P0002';
  end if;

  perform public.lock_property_inventory(p_property_id);

  for i in 0 .. n - 1 loop
    a := p_blocks -> i;
    if jsonb_typeof(a) <> 'object' then
      raise exception 'OCCUPANCY_INVALID: each block must be an object'
        using errcode = '22023';
    end if;
    begin
      a_start := (a ->> 'startDate')::date;
      a_end := (a ->> 'endDate')::date;
    exception
      when others then
        raise exception 'OCCUPANCY_INVALID: startDate and endDate must be YYYY-MM-DD'
          using errcode = '22023';
    end;
    if a_start is null or a_end is null then
      raise exception 'OCCUPANCY_INVALID: startDate and endDate are required'
        using errcode = '22023';
    end if;
    if a_end <= a_start then
      raise exception 'OCCUPANCY_INVALID: endDate must be after startDate'
        using errcode = '22023';
    end if;
    if (a ->> 'notes') is not null and char_length(a ->> 'notes') > 500 then
      raise exception 'OCCUPANCY_INVALID: notes too long'
        using errcode = '22023';
    end if;
    if (a ->> 'reservationId') is not null then
      begin
        perform (a ->> 'reservationId')::uuid;
      exception
        when others then
          raise exception 'OCCUPANCY_INVALID: reservationId must be a uuid'
            using errcode = '22023';
      end;
    end if;
  end loop;

  for i in 0 .. n - 1 loop
    a := p_blocks -> i;
    a_start := (a ->> 'startDate')::date;
    a_end := (a ->> 'endDate')::date;
    for j in i + 1 .. n - 1 loop
      b := p_blocks -> j;
      b_start := (b ->> 'startDate')::date;
      b_end := (b ->> 'endDate')::date;
      if public.dates_overlap(a_start, a_end, b_start, b_end) then
        raise exception 'OCCUPANCY_OVERLAP: incoming PMS blocks overlap'
          using errcode = '23P01';
      end if;
    end loop;
  end loop;

  delete from public.availability_blocks
  where property_id = p_property_id
    and reason = 'pms';

  if n > 0 then
    insert into public.availability_blocks (
      property_id,
      start_date,
      end_date,
      reason,
      pms_reservation_id,
      notes,
      booking_id
    )
    select
      p_property_id,
      (elem ->> 'startDate')::date,
      (elem ->> 'endDate')::date,
      'pms',
      nullif(elem ->> 'reservationId', '')::uuid,
      coalesce(nullif(elem ->> 'notes', ''), 'PMS occupancy'),
      null
    from jsonb_array_elements(p_blocks) as elem;
    get diagnostics inserted = row_count;
  end if;

  return jsonb_build_object(
    'ok', true,
    'propertyId', p_property_id,
    'blocks', inserted
  );
exception
  when exclusion_violation then
    -- Whole replace rolls back, including the delete of current PMS rows.
    raise exception 'OCCUPANCY_OVERLAP: PMS blocks overlap existing occupancy'
      using errcode = '23P01';
end;
$$;

comment on function public.lock_property_inventory(uuid) is
  'Transaction-scoped advisory lock for one property. Same key as approve_enquiry / replace_pms_occupancy.';

comment on function public.replace_pms_occupancy(uuid, jsonb) is
  'Atomically replace reason=pms blocks. Empty array clears PMS occupancy. Call only after PMS_SYNC_SECRET auth.';

revoke all on function public.lock_property_inventory(uuid) from public;
revoke all on function public.replace_pms_occupancy(uuid, jsonb) from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on function public.lock_property_inventory(uuid) from anon;
    revoke all on function public.replace_pms_occupancy(uuid, jsonb) from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on function public.lock_property_inventory(uuid) from authenticated;
    revoke all on function public.replace_pms_occupancy(uuid, jsonb) from authenticated;
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.lock_property_inventory(uuid) to service_role;
    grant execute on function public.replace_pms_occupancy(uuid, jsonb) to service_role;
  end if;
end
$$;

-- Every availability_blocks write takes the same transaction lock, including
-- service-role holds, refunds, and admin manual/hold edits. Callers cannot
-- skip it by writing the table directly. The exclusion constraint is the
-- invariant; the lock makes check-then-act and full PMS replaces atomic
-- with respect to other occupancy writers on this property.
create or replace function public.availability_blocks_serialize()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  first_id uuid;
  second_id uuid;
begin
  if tg_op = 'UPDATE' and new.property_id is distinct from old.property_id then
    if old.property_id < new.property_id then
      first_id := old.property_id;
      second_id := new.property_id;
    else
      first_id := new.property_id;
      second_id := old.property_id;
    end if;
    perform public.lock_property_inventory(first_id);
    perform public.lock_property_inventory(second_id);
  else
    perform public.lock_property_inventory(coalesce(new.property_id, old.property_id));
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists availability_blocks_serialize on public.availability_blocks;
create trigger availability_blocks_serialize
before insert or update or delete on public.availability_blocks
for each row execute function public.availability_blocks_serialize();

revoke all on function public.availability_blocks_serialize() from public;

do $$
begin
  -- SECURITY DEFINER trigger runs as the migration owner and must be able to
  -- call the lock helper after EXECUTE is revoked from PUBLIC.
  execute format(
    'grant execute on function public.lock_property_inventory(uuid) to %I',
    current_user
  );
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on function public.availability_blocks_serialize() from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on function public.availability_blocks_serialize() from authenticated;
  end if;
end
$$;
