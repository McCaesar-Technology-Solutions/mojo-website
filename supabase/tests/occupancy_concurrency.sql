-- Sequential invariants. Concurrent cases are run by scripts/test-occupancy-concurrency.sh
-- against the fixed ids seeded here.

insert into auth.users (id, email)
values ('00000000-0000-0000-0000-0000000000aa', 'admin@example.com');

update public.profiles
set role = 'admin', full_name = 'Admin'
where id = '00000000-0000-0000-0000-0000000000aa';

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000aa', false);

insert into public.properties (id, slug, title, type, city)
values
  ('10000000-0000-0000-0000-000000000001', 'prop-a', 'Prop A', 'Apartment', 'Accra'),
  ('10000000-0000-0000-0000-000000000002', 'prop-b', 'Prop B', 'Apartment', 'Accra');

insert into public.property_pricing (property_id, nightly_rate, cleaning_fee, service_fee_rate)
values
  ('10000000-0000-0000-0000-000000000001', 100, 0, 0),
  ('10000000-0000-0000-0000-000000000002', 100, 0, 0);

-- Enquiries. The reprice trigger overwrites client totals.
insert into public.enquiries (
  id, property_id, check_in, check_out, guests, full_name, email, phone,
  nightly_rate, cleaning_fee, service_fee, total
) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '2026-11-01', '2026-11-05', 2, 'A', 'a@example.com', '1', 1, 0, 0, 1),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '2026-11-03', '2026-11-06', 2, 'B', 'b@example.com', '1', 1, 0, 0, 1),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '2026-12-01', '2026-12-04', 2, 'C', 'c@example.com', '1', 1, 0, 0, 1),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', '2026-12-04', '2026-12-08', 2, 'D', 'd@example.com', '1', 1, 0, 0, 1),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', '2026-11-01', '2026-11-05', 2, 'E', 'e@example.com', '1', 1, 0, 0, 1),
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', '2026-11-01', '2026-11-04', 2, 'F', 'f@example.com', '1', 1, 0, 0, 1);

-- PMS block overlaps enquiry 6. Website approval must fail and leave no booking.
select public.replace_pms_occupancy(
  '10000000-0000-0000-0000-000000000001',
  '[{"startDate":"2026-11-02","endDate":"2026-11-03","reservationId":"30000000-0000-0000-0000-000000000099","notes":"PMS"}]'::jsonb
);

do $$
begin
  if public.property_is_available(
    '10000000-0000-0000-0000-000000000001', '2026-11-01', '2026-11-04'
  ) then
    raise exception 'FAIL: PMS block was ignored';
  end if;
  begin
    perform public.approve_enquiry('20000000-0000-0000-0000-000000000006', null);
    raise exception 'FAIL: approval overlapped a PMS block';
  exception
    when others then
      if sqlerrm <> 'dates unavailable' then
        raise exception 'FAIL: unexpected overlap error: %', sqlerrm;
      end if;
  end;
  if exists (select 1 from public.bookings where enquiry_id = '20000000-0000-0000-0000-000000000006') then
    raise exception 'FAIL: rejected approval left a booking';
  end if;
  if (select status from public.enquiries where id = '20000000-0000-0000-0000-000000000006') <> 'new' then
    raise exception 'FAIL: rejected approval changed enquiry status';
  end if;
end $$;

-- Clear PMS occupancy. Empty array is the documented clear, and it is idempotent.
select public.replace_pms_occupancy('10000000-0000-0000-0000-000000000001', '[]'::jsonb);
select public.replace_pms_occupancy('10000000-0000-0000-0000-000000000001', '[]'::jsonb);
do $$
begin
  if exists (
    select 1 from public.availability_blocks
    where property_id = '10000000-0000-0000-0000-000000000001' and reason = 'pms'
  ) then
    raise exception 'FAIL: empty replace did not clear PMS blocks';
  end if;
end $$;

-- Non-overlapping stay.
select public.approve_enquiry('20000000-0000-0000-0000-000000000003', null);

-- Adjacent stay: checkout day is the next check-in.
select public.approve_enquiry('20000000-0000-0000-0000-000000000004', null);

do $$
begin
  if (
    select count(*) from public.bookings
    where property_id = '10000000-0000-0000-0000-000000000001'
      and status = 'confirmed'
  ) <> 2 then
    raise exception 'FAIL: adjacent or non-overlapping approval missing';
  end if;
end $$;

-- Second approval of a closed enquiry does not create another booking.
do $$
begin
  begin
    perform public.approve_enquiry('20000000-0000-0000-0000-000000000003', null);
    raise exception 'FAIL: closed enquiry was approved again';
  exception
    when others then
      if sqlerrm <> 'enquiry already closed' then
        raise exception 'FAIL: unexpected idempotency error: %', sqlerrm;
      end if;
  end;
end $$;

-- PMS replace that overlaps a website booking rolls back and keeps prior PMS rows.
select public.replace_pms_occupancy(
  '10000000-0000-0000-0000-000000000001',
  '[{"startDate":"2027-01-01","endDate":"2027-01-03","notes":"kept"}]'::jsonb
);
do $$
begin
  begin
    perform public.replace_pms_occupancy(
      '10000000-0000-0000-0000-000000000001',
      '[{"startDate":"2026-12-01","endDate":"2026-12-03","notes":"clash"}]'::jsonb
    );
    raise exception 'FAIL: PMS replace overlapped a website booking';
  exception
    when others then
      if sqlerrm not like 'OCCUPANCY_OVERLAP:%' then
        raise exception 'FAIL: unexpected PMS overlap error: %', sqlerrm;
      end if;
  end;
  if not exists (
    select 1 from public.availability_blocks
    where property_id = '10000000-0000-0000-0000-000000000001'
      and reason = 'pms'
      and start_date = '2027-01-01'
  ) then
    raise exception 'FAIL: failed PMS replace cleared the previous blocks';
  end if;
  if exists (
    select 1 from public.availability_blocks
    where reason = 'pms' and start_date = '2026-12-01'
  ) then
    raise exception 'FAIL: overlapping PMS block was committed';
  end if;
end $$;

-- Direct table insert cannot bypass the exclusion constraint.
do $$
begin
  begin
    insert into public.availability_blocks (property_id, start_date, end_date, reason)
    values ('10000000-0000-0000-0000-000000000001', '2026-12-02', '2026-12-03', 'manual');
    raise exception 'FAIL: direct insert overlapped a booking';
  exception
    when exclusion_violation then
      null;
  end;
end $$;

-- NULL payload must not clear occupancy.
do $$
begin
  begin
    perform public.replace_pms_occupancy('10000000-0000-0000-0000-000000000001', null);
    raise exception 'FAIL: null payload was accepted';
  exception
    when others then
      if sqlerrm not like 'OCCUPANCY_INVALID:%' then
        raise exception 'FAIL: unexpected null payload error: %', sqlerrm;
      end if;
  end;
end $$;

create table public.test_gate (
  id int primary key,
  open boolean not null default false
);
insert into public.test_gate (id, open) values (1, false);
