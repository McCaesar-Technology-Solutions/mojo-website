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
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', '2026-11-01', '2026-11-04', 2, 'F', 'f@example.com', '1', 1, 0, 0, 1),
  ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001', '2027-06-01', '2027-06-05', 2, 'G', 'g@example.com', '1', 1, 0, 0, 1),
  ('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000001', '2027-07-01', '2027-07-05', 2, 'H', 'h@example.com', '1', 1, 0, 0, 1),
  ('20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000001', '2027-08-01', '2027-08-05', 2, 'I', 'i@example.com', '1', 1, 0, 0, 1),
  ('20000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-000000000001', '2027-09-10', '2027-09-14', 2, 'J', 'j@example.com', '1', 1, 0, 0, 1);

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

-- Exclusion constraint rejects an overlap for every occupancy reason.
-- Adjacent [start, end) ranges stay allowed.
do $$
declare
  r text;
begin
  foreach r in array array['booked', 'manual', 'hold', 'pms'] loop
    insert into public.availability_blocks (property_id, start_date, end_date, reason)
    values ('10000000-0000-0000-0000-000000000002', '2028-01-01', '2028-01-04', r);

    begin
      insert into public.availability_blocks (property_id, start_date, end_date, reason)
      values ('10000000-0000-0000-0000-000000000002', '2028-01-03', '2028-01-06', r);
      raise exception 'FAIL: overlapping % block was committed', r;
    exception
      when exclusion_violation then
        null;
    end;

    insert into public.availability_blocks (property_id, start_date, end_date, reason)
    values ('10000000-0000-0000-0000-000000000002', '2028-01-04', '2028-01-07', r);

    delete from public.availability_blocks
    where property_id = '10000000-0000-0000-0000-000000000002'
      and start_date >= '2028-01-01'
      and start_date < '2028-02-01';
  end loop;
end $$;

-- Cross-reason overlap is the same constraint.
do $$
declare
  other text;
begin
  insert into public.availability_blocks (property_id, start_date, end_date, reason)
  values ('10000000-0000-0000-0000-000000000002', '2028-03-01', '2028-03-05', 'booked');
  foreach other in array array['manual', 'hold', 'pms'] loop
    begin
      insert into public.availability_blocks (property_id, start_date, end_date, reason)
      values ('10000000-0000-0000-0000-000000000002', '2028-03-02', '2028-03-03', other);
      raise exception 'FAIL: % overlapped a booked block', other;
    exception
      when exclusion_violation then
        null;
    end;
  end loop;
  delete from public.availability_blocks
  where property_id = '10000000-0000-0000-0000-000000000002'
    and start_date = '2028-03-01';
end $$;

-- Constraint installed by 20261007120100 is immediate, not deferrable.
do $$
declare
  is_deferrable boolean;
  is_deferred boolean;
begin
  select c.condeferrable, c.condeferred
    into is_deferrable, is_deferred
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  where t.relname = 'availability_blocks'
    and c.conname = 'availability_blocks_no_overlap';
  if is_deferrable is null then
    raise exception 'FAIL: exclusion constraint missing';
  end if;
  if is_deferrable or is_deferred then
    raise exception 'FAIL: exclusion constraint is deferrable';
  end if;
  if not exists (
    select 1 from pg_trigger
    where tgname = 'availability_blocks_serialize' and tgrelid = 'public.availability_blocks'::regclass
  ) then
    raise exception 'FAIL: availability_blocks serialize trigger missing';
  end if;
end $$;

-- Cancellation inside admin_update_booking frees the booked block in the same transaction.
select public.approve_enquiry('20000000-0000-0000-0000-000000000009', null);
select public.admin_update_booking(
  (select id from public.bookings where enquiry_id = '20000000-0000-0000-0000-000000000009'),
  '{"status":"cancelled"}'::jsonb
);
do $$
begin
  if (select status from public.bookings where enquiry_id = '20000000-0000-0000-0000-000000000009') <> 'cancelled' then
    raise exception 'FAIL: cancellation did not stick';
  end if;
  if exists (
    select 1 from public.availability_blocks
    where booking_id = (select id from public.bookings where enquiry_id = '20000000-0000-0000-0000-000000000009')
  ) then
    raise exception 'FAIL: cancelled booking still occupies the calendar';
  end if;
  if not public.property_is_available(
    '10000000-0000-0000-0000-000000000001', '2027-08-01', '2027-08-05'
  ) then
    raise exception 'FAIL: cancelled dates stayed unavailable';
  end if;
end $$;

-- A refund status alone does not free occupancy. The Paystack refund function
-- deletes blocks in a later request. This asserts the database rule the
-- edge function relies on, without calling Paystack.
insert into public.bookings (
  id, property_id, check_in, check_out, guests, guest_name, guest_email, guest_phone,
  status, nightly_rate, nights, cleaning_fee, service_fee, total, paystack_reference
) values (
  '50000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '2027-10-01', '2027-10-04', 2, 'Refund', 'refund@example.com', '1',
  'confirmed', 100, 3, 0, 0, 300, 'mojo_refund_fixture'
);
insert into public.availability_blocks (property_id, start_date, end_date, reason, booking_id)
values (
  '10000000-0000-0000-0000-000000000001', '2027-10-01', '2027-10-04', 'booked',
  '50000000-0000-0000-0000-000000000001'
);
update public.bookings set status = 'refunded' where id = '50000000-0000-0000-0000-000000000001';
do $$
begin
  if public.property_is_available(
    '10000000-0000-0000-0000-000000000001', '2027-10-01', '2027-10-04'
  ) then
    raise exception 'FAIL: refunded status freed occupancy before the block delete';
  end if;
end $$;
delete from public.availability_blocks where booking_id = '50000000-0000-0000-0000-000000000001';
do $$
begin
  if not public.property_is_available(
    '10000000-0000-0000-0000-000000000001', '2027-10-01', '2027-10-04'
  ) then
    raise exception 'FAIL: block delete after refund left the dates occupied';
  end if;
end $$;

-- Date move that hits an existing block rolls the booking and its block back.
select public.approve_enquiry('20000000-0000-0000-0000-00000000000a', null);
do $$
declare
  bid uuid;
begin
  select id into bid from public.bookings where enquiry_id = '20000000-0000-0000-0000-00000000000a';
  begin
    perform public.admin_update_booking(
      bid,
      '{"check_in":"2026-12-02","check_out":"2026-12-06"}'::jsonb
    );
    raise exception 'FAIL: date move overlapped a confirmed stay';
  exception
    when others then
      if sqlerrm <> 'BOOKING_DATES_UNAVAILABLE' then
        raise exception 'FAIL: unexpected date-move error: %', sqlerrm;
      end if;
  end;
  if (select check_in from public.bookings where id = bid) <> '2027-09-10'
     or (select check_out from public.bookings where id = bid) <> '2027-09-14' then
    raise exception 'FAIL: failed date move changed the booking';
  end if;
  if not exists (
    select 1 from public.availability_blocks
    where booking_id = bid and reason = 'booked'
      and start_date = '2027-09-10' and end_date = '2027-09-14'
  ) then
    raise exception 'FAIL: failed date move changed the booked block';
  end if;
end $$;

-- A statement failure after an occupancy write rolls the whole transaction back.
do $$
declare
  before_count int;
  after_count int;
begin
  select count(*) into before_count from public.availability_blocks;
  begin
    insert into public.availability_blocks (property_id, start_date, end_date, reason)
    values ('10000000-0000-0000-0000-000000000002', '2028-05-01', '2028-05-03', 'manual');
    insert into public.availability_blocks (property_id, start_date, end_date, reason)
    values ('10000000-0000-0000-0000-000000000002', '2028-05-02', '2028-05-04', 'hold');
    raise exception 'FAIL: second insert in the failed transaction committed';
  exception
    when exclusion_violation then
      null;
  end;
  select count(*) into after_count from public.availability_blocks;
  if before_count <> after_count then
    raise exception 'FAIL: failed occupancy mutation left a partial block';
  end if;
  if exists (
    select 1 from public.availability_blocks
    where property_id = '10000000-0000-0000-0000-000000000002'
      and start_date = '2028-05-01'
  ) then
    raise exception 'FAIL: rolled-back manual block is still present';
  end if;
end $$;

-- Hold that cleanup will race with an approval. Seeded before the concurrent section.
insert into public.availability_blocks (id, property_id, start_date, end_date, reason, created_at)
values (
  '40000000-0000-0000-0000-000000000008',
  '10000000-0000-0000-0000-000000000001',
  '2027-07-01', '2027-07-05', 'hold', now() - interval '31 minutes'
);

-- Confirmed booking whose only block is still a stale hold. Expiry must keep it.
insert into public.bookings (
  id, property_id, check_in, check_out, guests, guest_name, guest_email, guest_phone,
  status, nightly_rate, nights, cleaning_fee, service_fee, total, paystack_reference
) values (
  '50000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000001',
  '2027-11-01', '2027-11-04', 2, 'Paid', 'paid@example.com', '1',
  'confirmed', 100, 3, 0, 0, 300, 'mojo_confirmed_hold'
);
insert into public.availability_blocks (id, property_id, start_date, end_date, reason, booking_id, created_at)
values (
  '40000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000001',
  '2027-11-01', '2027-11-04', 'hold',
  '50000000-0000-0000-0000-000000000002',
  now() - interval '31 minutes'
);
select public.release_expired_payment_hold('40000000-0000-0000-0000-000000000002');
do $$
begin
  if (select status from public.bookings where id = '50000000-0000-0000-0000-000000000002') <> 'confirmed' then
    raise exception 'FAIL: expiry changed a confirmed booking';
  end if;
  if (
    select count(*) from public.availability_blocks
    where booking_id = '50000000-0000-0000-0000-000000000002'
      and reason = 'booked'
      and start_date = '2027-11-01'
  ) <> 1 then
    raise exception 'FAIL: expiry deleted the confirmed booking occupancy block';
  end if;
end $$;

-- Expiry wins before payment confirmation. The webhook RPC must not confirm it.
insert into public.bookings (
  id, property_id, check_in, check_out, guests, guest_name, guest_email, guest_phone,
  status, nightly_rate, nights, cleaning_fee, service_fee, total, paystack_reference
) values (
  '50000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000001',
  '2027-12-01', '2027-12-04', 2, 'Late', 'late@example.com', '1',
  'pending_payment', 100, 3, 0, 0, 300, 'mojo_expired_then_paid'
);
insert into public.availability_blocks (id, property_id, start_date, end_date, reason, booking_id, created_at)
values (
  '40000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000001',
  '2027-12-01', '2027-12-04', 'hold',
  '50000000-0000-0000-0000-000000000003',
  now() - interval '31 minutes'
);
select public.release_expired_payment_hold('40000000-0000-0000-0000-000000000003');
select public.confirm_paid_booking('50000000-0000-0000-0000-000000000003');
select public.confirm_paid_booking('50000000-0000-0000-0000-000000000003');
do $$
declare
  result jsonb;
begin
  if (select status from public.bookings where id = '50000000-0000-0000-0000-000000000003') <> 'cancelled' then
    raise exception 'FAIL: payment after expiry confirmed a cancelled booking';
  end if;
  if exists (
    select 1 from public.availability_blocks
    where booking_id = '50000000-0000-0000-0000-000000000003'
  ) then
    raise exception 'FAIL: cancelled payment still occupies the calendar';
  end if;
  if (
    select count(*) from public.audit_logs
    where entity_id = '50000000-0000-0000-0000-000000000003'
      and action = 'booking.payment_after_cancel'
  ) <> 1 then
    raise exception 'FAIL: payment after expiry was not recorded once';
  end if;
  perform public.resolve_payment_after_cancel('50000000-0000-0000-0000-000000000003');
  if (
    select count(*) from public.audit_logs
    where entity_id = '50000000-0000-0000-0000-000000000003'
      and action = 'booking.payment_after_cancel'
      and coalesce(meta ->> 'resolved_at', '') <> ''
      and meta ->> 'resolution' = 'refunded'
  ) <> 1 then
    raise exception 'FAIL: late payment was not marked resolved';
  end if;
  result := public.confirm_paid_booking('50000000-0000-0000-0000-000000000003');
  if result ->> 'outcome' <> 'payment_after_cancel_resolved' or (result ->> 'ok')::boolean is distinct from true then
    raise exception 'FAIL: resolved late payment was not reported as resolved: %', result;
  end if;
  if (select status from public.bookings where id = '50000000-0000-0000-0000-000000000003') <> 'cancelled' then
    raise exception 'FAIL: resolving a late payment confirmed the booking';
  end if;
end $$;

-- Duplicate confirmation keeps one booked block and one paid audit row.
insert into public.bookings (
  id, property_id, check_in, check_out, guests, guest_name, guest_email, guest_phone,
  status, nightly_rate, nights, cleaning_fee, service_fee, total, paystack_reference
) values (
  '50000000-0000-0000-0000-000000000004',
  '10000000-0000-0000-0000-000000000001',
  '2028-02-01', '2028-02-04', 2, 'Twice', 'twice@example.com', '1',
  'pending_payment', 100, 3, 0, 0, 300, 'mojo_duplicate_webhook'
);
insert into public.availability_blocks (id, property_id, start_date, end_date, reason, booking_id, created_at)
values (
  '40000000-0000-0000-0000-000000000004',
  '10000000-0000-0000-0000-000000000001',
  '2028-02-01', '2028-02-04', 'hold',
  '50000000-0000-0000-0000-000000000004',
  now() - interval '5 minutes'
);
select public.confirm_paid_booking('50000000-0000-0000-0000-000000000004');
select public.confirm_paid_booking('50000000-0000-0000-0000-000000000004');
select public.release_expired_payment_hold('40000000-0000-0000-0000-000000000004');
do $$
begin
  if (select status from public.bookings where id = '50000000-0000-0000-0000-000000000004') <> 'confirmed' then
    raise exception 'FAIL: duplicate confirmation lost the booking';
  end if;
  if (
    select count(*) from public.availability_blocks
    where booking_id = '50000000-0000-0000-0000-000000000004' and reason = 'booked'
  ) <> 1 then
    raise exception 'FAIL: duplicate confirmation did not leave one booked block';
  end if;
  if (
    select count(*) from public.audit_logs
    where entity_id = '50000000-0000-0000-0000-000000000004' and action = 'booking.paid'
  ) <> 1 then
    raise exception 'FAIL: duplicate confirmation wrote more than one paid audit';
  end if;
end $$;

-- Confirmed with no occupancy block is not a successful confirmation.
insert into public.bookings (
  id, property_id, check_in, check_out, guests, guest_name, guest_email, guest_phone,
  status, nightly_rate, nights, cleaning_fee, service_fee, total, paystack_reference
) values (
  '50000000-0000-0000-0000-000000000005',
  '10000000-0000-0000-0000-000000000001',
  '2028-04-01', '2028-04-04', 2, 'Bare', 'bare@example.com', '1',
  'confirmed', 100, 3, 0, 0, 300, 'mojo_missing_occupancy'
);
do $$
declare
  result jsonb;
begin
  result := public.confirm_paid_booking('50000000-0000-0000-0000-000000000005');
  if result ->> 'outcome' <> 'occupancy_missing' or (result ->> 'ok')::boolean then
    raise exception 'FAIL: confirmed booking without occupancy reported success: %', result;
  end if;
end $$;

create table public.test_gate (
  id int primary key,
  open boolean not null default false
);
insert into public.test_gate (id, open) values (1, false), (2, false);

insert into public.properties (id, slug, title, type, city)
values ('10000000-0000-0000-0000-000000000003', 'prop-c', 'Prop C', 'Apartment', 'Accra');

insert into public.bookings (
  id, property_id, check_in, check_out, guests, guest_name, guest_email, guest_phone,
  status, nightly_rate, nights, cleaning_fee, service_fee, total, paystack_reference
) values (
  '50000000-0000-0000-0000-000000000010',
  '10000000-0000-0000-0000-000000000003',
  '2027-04-01', '2027-04-04', 2, 'Race', 'race@example.com', '1',
  'pending_payment', 100, 3, 0, 0, 300, 'mojo_webhook_expiry_race'
);
insert into public.availability_blocks (id, property_id, start_date, end_date, reason, booking_id, created_at)
values (
  '40000000-0000-0000-0000-000000000010',
  '10000000-0000-0000-0000-000000000003',
  '2027-04-01', '2027-04-04', 'hold',
  '50000000-0000-0000-0000-000000000010',
  now() - interval '31 minutes'
);

-- Cancelling a pending payment removes a hold that is still inside the expiry window.
insert into public.bookings (
  id, property_id, check_in, check_out, guests, guest_name, guest_email, guest_phone,
  status, nightly_rate, nights, cleaning_fee, service_fee, total, paystack_reference
) values (
  '50000000-0000-0000-0000-000000000020',
  '10000000-0000-0000-0000-000000000001',
  '2028-06-01', '2028-06-04', 2, 'Young', 'young@example.com', '1',
  'pending_payment', 100, 3, 0, 0, 300, 'mojo_young_hold'
);
insert into public.availability_blocks (id, property_id, start_date, end_date, reason, booking_id, created_at)
values (
  '40000000-0000-0000-0000-000000000020',
  '10000000-0000-0000-0000-000000000001',
  '2028-06-01', '2028-06-04', 'hold',
  '50000000-0000-0000-0000-000000000020',
  now()
);
select public.admin_update_booking(
  '50000000-0000-0000-0000-000000000020',
  '{"status":"cancelled"}'::jsonb
);

do $$
declare
  result jsonb;
  audit_count int;
begin
  if (select status from public.bookings where id = '50000000-0000-0000-0000-000000000020') <> 'cancelled' then
    raise exception 'FAIL: young hold cancellation did not cancel the booking';
  end if;
  if exists (
    select 1 from public.availability_blocks where booking_id = '50000000-0000-0000-0000-000000000020'
  ) then
    raise exception 'FAIL: young hold remained after cancellation';
  end if;
  if not public.property_is_available(
    '10000000-0000-0000-0000-000000000001', '2028-06-01', '2028-06-04'
  ) then
    raise exception 'FAIL: cancelled young hold left the dates unavailable';
  end if;
  result := public.confirm_paid_booking('50000000-0000-0000-0000-000000000020');
  if result ->> 'outcome' <> 'payment_after_cancel' then
    raise exception 'FAIL: payment after young-hold cancel returned %', result;
  end if;
  perform public.confirm_paid_booking('50000000-0000-0000-0000-000000000020');
  select count(*) into audit_count
  from public.audit_logs
  where action = 'booking.payment_after_cancel'
    and entity_id = '50000000-0000-0000-0000-000000000020';
  if audit_count <> 1 then
    raise exception 'FAIL: late payment created % audit rows', audit_count;
  end if;
end $$;

insert into public.bookings (
  id, property_id, check_in, check_out, guests, guest_name, guest_email, guest_phone,
  status, nightly_rate, nights, cleaning_fee, service_fee, total, paystack_reference
) values (
  '50000000-0000-0000-0000-000000000021',
  '10000000-0000-0000-0000-000000000001',
  '2028-07-01', '2028-07-04', 2, 'RefundRetry', 'retry@example.com', '1',
  'cancelled', 100, 3, 0, 0, 300, 'mojo_refund_retry'
);
insert into public.availability_blocks (property_id, start_date, end_date, reason, booking_id)
values (
  '10000000-0000-0000-0000-000000000001', '2028-07-01', '2028-07-04', 'booked',
  '50000000-0000-0000-0000-000000000021'
);
insert into public.audit_logs (action, entity_type, entity_id, meta)
values (
  'booking.payment_after_cancel', 'booking', '50000000-0000-0000-0000-000000000021',
  jsonb_build_object('reference', 'mojo_refund_retry')
);
do $$
declare
  claim jsonb;
begin
  claim := public.claim_paystack_refund('50000000-0000-0000-0000-000000000021');
  if claim ->> 'action' <> 'call_provider' then
    raise exception 'FAIL: first refund claim returned %', claim;
  end if;
  claim := public.claim_paystack_refund('50000000-0000-0000-0000-000000000021');
  if claim ->> 'action' <> 'unknown' then
    raise exception 'FAIL: pending refund claim allowed another provider call: %', claim;
  end if;
  if (select status from public.bookings where id = '50000000-0000-0000-0000-000000000021') <> 'cancelled' then
    raise exception 'FAIL: unknown refund claim changed the booking';
  end if;
end $$;

create or replace function public.test_fail_refund_status()
returns trigger language plpgsql as $$
begin
  raise exception 'REFUND_STATUS_FAILED';
end $$;
create trigger test_fail_refund_status
before update on public.bookings
for each row
when (old.id = '50000000-0000-0000-0000-000000000021' and new.status = 'refunded')
execute function public.test_fail_refund_status();

do $$
begin
  perform public.mark_paystack_refund_accepted('50000000-0000-0000-0000-000000000021');
  begin
    perform public.finalize_paystack_refund('50000000-0000-0000-0000-000000000021');
    raise exception 'FAIL: status update failure did not abort';
  exception
    when others then
      if sqlerrm <> 'REFUND_STATUS_FAILED' then
        raise exception 'FAIL: unexpected status-fail error: %', sqlerrm;
      end if;
  end;
end $$;
drop trigger test_fail_refund_status on public.bookings;

do $$
begin
  if (select status from public.bookings where id = '50000000-0000-0000-0000-000000000021') <> 'cancelled' then
    raise exception 'FAIL: failed status update committed refunded';
  end if;
  if (select paystack_refund_state from public.bookings where id = '50000000-0000-0000-0000-000000000021') <> 'provider_accepted' then
    raise exception 'FAIL: accepted refund was lost when status update failed';
  end if;
  if not exists (
    select 1 from public.availability_blocks where booking_id = '50000000-0000-0000-0000-000000000021'
  ) then
    raise exception 'FAIL: occupancy was released when the status update failed';
  end if;
  if exists (
    select 1 from public.audit_logs
    where action = 'booking.payment_after_cancel'
      and entity_id = '50000000-0000-0000-0000-000000000021'
      and coalesce(meta ->> 'resolved_at', '') <> ''
  ) then
    raise exception 'FAIL: late-payment audit resolved before occupancy cleanup';
  end if;
end $$;

create or replace function public.test_fail_refund_blocks()
returns trigger language plpgsql as $$
begin
  raise exception 'REFUND_BLOCKS_FAILED';
end $$;
create trigger test_fail_refund_blocks
before delete on public.availability_blocks
for each row
when (old.booking_id = '50000000-0000-0000-0000-000000000021')
execute function public.test_fail_refund_blocks();

do $$
begin
  begin
    perform public.finalize_paystack_refund('50000000-0000-0000-0000-000000000021');
    raise exception 'FAIL: block delete failure did not abort';
  exception
    when others then
      if sqlerrm <> 'REFUND_BLOCKS_FAILED' then
        raise exception 'FAIL: unexpected block-fail error: %', sqlerrm;
      end if;
  end;
end $$;
drop trigger test_fail_refund_blocks on public.availability_blocks;

do $$
declare
  result jsonb;
begin
  if (select status from public.bookings where id = '50000000-0000-0000-0000-000000000021') <> 'cancelled' then
    raise exception 'FAIL: failed block delete committed refunded';
  end if;
  result := public.claim_paystack_refund('50000000-0000-0000-0000-000000000021');
  if result ->> 'action' <> 'reconcile' then
    raise exception 'FAIL: retry after partial refund asked for another provider call: %', result;
  end if;
  perform public.finalize_paystack_refund('50000000-0000-0000-0000-000000000021');
  if (select status from public.bookings where id = '50000000-0000-0000-0000-000000000021') <> 'refunded' then
    raise exception 'FAIL: refund retry did not mark the booking refunded';
  end if;
  if exists (
    select 1 from public.availability_blocks where booking_id = '50000000-0000-0000-0000-000000000021'
  ) then
    raise exception 'FAIL: refund retry left occupancy';
  end if;
  if exists (
    select 1 from public.audit_logs
    where action = 'booking.payment_after_cancel'
      and entity_id = '50000000-0000-0000-0000-000000000021'
      and coalesce(meta ->> 'resolved_at', '') = ''
  ) then
    raise exception 'FAIL: refund retry left the late payment unresolved';
  end if;
end $$;

select public.record_unmatched_paystack_charge('mojo_missing_booking', 30000, 'GHS');
select public.record_unmatched_paystack_charge('mojo_missing_booking', 30000, 'GHS');
do $$
begin
  if (
    select count(*) from public.audit_logs
    where action = 'booking.payment_unmatched'
      and meta ->> 'reference' = 'mojo_missing_booking'
  ) <> 1 then
    raise exception 'FAIL: unmatched payment was recorded more than once';
  end if;
end $$;

-- Manual verification of a provider_pending refund. Paystack is not called.
insert into public.bookings (
  id, property_id, check_in, check_out, guests, guest_name, guest_email, guest_phone,
  status, nightly_rate, nights, cleaning_fee, service_fee, total, paystack_reference, paystack_refund_state
) values (
  '50000000-0000-0000-0000-000000000023',
  '10000000-0000-0000-0000-000000000001',
  '2028-08-01', '2028-08-04', 2, 'Manual', 'manual@example.com', '1',
  'cancelled', 100, 3, 0, 0, 300, 'mojo_manual_refund', 'provider_pending'
);
insert into public.availability_blocks (property_id, start_date, end_date, reason, booking_id)
values (
  '10000000-0000-0000-0000-000000000001', '2028-08-01', '2028-08-04', 'booked',
  '50000000-0000-0000-0000-000000000023'
);
insert into public.audit_logs (action, entity_type, entity_id, meta)
values (
  'booking.payment_after_cancel', 'booking', '50000000-0000-0000-0000-000000000023',
  jsonb_build_object('reference', 'mojo_manual_refund')
);

do $$
declare
  result jsonb;
begin
  begin
    perform public.record_manual_refund_verification(
      '50000000-0000-0000-0000-000000000023',
      '00000000-0000-0000-0000-0000000000bb',
      'accepted',
      'mojo_manual_refund',
      'dashboard refund RF_1 succeeded'
    );
    raise exception 'FAIL: non-admin verification was accepted';
  exception
    when others then
      if sqlerrm <> 'BOOKING_NOT_AUTHORIZED' then
        raise exception 'FAIL: unexpected unauthorized error: %', sqlerrm;
      end if;
  end;

  result := public.record_manual_refund_verification(
    '50000000-0000-0000-0000-000000000023',
    '00000000-0000-0000-0000-0000000000aa',
    'unknown',
    'mojo_manual_refund',
    'dashboard shows no completed refund'
  );
  if result ->> 'action' <> 'unchanged' then
    raise exception 'FAIL: unknown verification changed the recovery action: %', result;
  end if;
  if (select paystack_refund_state from public.bookings where id = '50000000-0000-0000-0000-000000000023') <> 'provider_pending' then
    raise exception 'FAIL: unknown verification did not leave provider_pending';
  end if;
  if (select public.claim_paystack_refund('50000000-0000-0000-0000-000000000023') ->> 'action') <> 'unknown' then
    raise exception 'FAIL: unknown verification allowed another provider claim';
  end if;
  if not exists (
    select 1 from public.audit_logs
    where action = 'booking.refund_verification'
      and entity_id = '50000000-0000-0000-0000-000000000023'
      and actor_id = '00000000-0000-0000-0000-0000000000aa'
      and meta ->> 'outcome' = 'unknown'
      and meta ->> 'evidence' = 'dashboard shows no completed refund'
  ) then
    raise exception 'FAIL: unknown verification was not audited';
  end if;
end $$;

create or replace function public.test_fail_manual_finalize()
returns trigger language plpgsql as $$
begin
  raise exception 'REFUND_BLOCKS_FAILED';
end $$;
create trigger test_fail_manual_finalize
before delete on public.availability_blocks
for each row
when (old.booking_id = '50000000-0000-0000-0000-000000000023')
execute function public.test_fail_manual_finalize();

do $$
declare
  result jsonb;
begin
  begin
    perform public.record_manual_refund_verification(
      '50000000-0000-0000-0000-000000000023',
      '00000000-0000-0000-0000-0000000000aa',
      'accepted',
      'mojo_other_reference',
      'dashboard refund RF_1 succeeded'
    );
    raise exception 'FAIL: mismatched reference was accepted';
  exception
    when others then
      if sqlerrm <> 'BOOKING_INVALID: reference does not match this booking' then
        raise exception 'FAIL: unexpected reference error: %', sqlerrm;
      end if;
  end;

  result := public.record_manual_refund_verification(
    '50000000-0000-0000-0000-000000000023',
    '00000000-0000-0000-0000-0000000000aa',
    'accepted',
    'mojo_manual_refund',
    'Paystack dashboard refund RF_9 succeeded'
  );
  if result ->> 'action' <> 'finalize' then
    raise exception 'FAIL: verified acceptance did not request finalize: %', result;
  end if;
  if not exists (
    select 1 from public.audit_logs
    where action = 'booking.refund_verification'
      and entity_id = '50000000-0000-0000-0000-000000000023'
      and actor_id = '00000000-0000-0000-0000-0000000000aa'
      and meta ->> 'outcome' = 'accepted'
      and meta ->> 'reference' = 'mojo_manual_refund'
      and meta ? 'verified_at'
  ) then
    raise exception 'FAIL: accepted verification audit is incomplete';
  end if;

  begin
    perform public.finalize_paystack_refund('50000000-0000-0000-0000-000000000023');
    raise exception 'FAIL: manual finalize failure did not abort';
  exception
    when others then
      if sqlerrm <> 'REFUND_BLOCKS_FAILED' then
        raise exception 'FAIL: unexpected manual finalize error: %', sqlerrm;
      end if;
  end;
end $$;
drop trigger test_fail_manual_finalize on public.availability_blocks;

do $$
begin
  if (select paystack_refund_state from public.bookings where id = '50000000-0000-0000-0000-000000000023') <> 'provider_accepted' then
    raise exception 'FAIL: failed finalize lost the verified acceptance';
  end if;
  if (select status from public.bookings where id = '50000000-0000-0000-0000-000000000023') <> 'cancelled' then
    raise exception 'FAIL: failed finalize committed refunded';
  end if;
  if not exists (
    select 1 from public.availability_blocks where booking_id = '50000000-0000-0000-0000-000000000023'
  ) then
    raise exception 'FAIL: failed finalize released occupancy';
  end if;
  perform public.finalize_paystack_refund('50000000-0000-0000-0000-000000000023');
  if (select status from public.bookings where id = '50000000-0000-0000-0000-000000000023') <> 'refunded' then
    raise exception 'FAIL: retry after verified acceptance did not refund locally';
  end if;
  if exists (
    select 1 from public.availability_blocks where booking_id = '50000000-0000-0000-0000-000000000023'
  ) then
    raise exception 'FAIL: retry after verified acceptance left occupancy';
  end if;
  if exists (
    select 1 from public.audit_logs
    where action = 'booking.payment_after_cancel'
      and entity_id = '50000000-0000-0000-0000-000000000023'
      and coalesce(meta ->> 'resolved_at', '') = ''
  ) then
    raise exception 'FAIL: retry after verified acceptance left the late payment open';
  end if;
end $$;
