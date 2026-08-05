-- Server-trust pricing for enquiries + approve path
-- Recomputes nightly/cleaning/service/total from property_pricing on insert/update

create or replace function public.reprice_enquiry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pr public.property_pricing%rowtype;
  n int;
  subtotal numeric(12,2);
begin
  select * into pr from public.property_pricing where property_id = new.property_id;
  if not found then
    raise exception 'property has no pricing';
  end if;

  if new.check_out <= new.check_in then
    raise exception 'check_out must be after check_in';
  end if;

  n := (new.check_out - new.check_in);
  subtotal := pr.nightly_rate * n;

  new.nightly_rate := pr.nightly_rate;
  new.cleaning_fee := pr.cleaning_fee;
  new.service_fee := round(subtotal * pr.service_fee_rate);
  new.total := subtotal + pr.cleaning_fee + new.service_fee;
  new.currency := 'GHS';
  return new;
end;
$$;

drop trigger if exists enquiries_reprice on public.enquiries;
create trigger enquiries_reprice
before insert or update of property_id, check_in, check_out
on public.enquiries
for each row execute function public.reprice_enquiry();

-- Approve must re-read pricing from property (not trust enquiry row if somehow stale)
create or replace function public.approve_enquiry(p_enquiry_id uuid, p_admin_notes text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  e public.enquiries%rowtype;
  pr public.property_pricing%rowtype;
  bid uuid;
  n int;
  subtotal numeric(12,2);
  service_fee numeric(12,2);
  total numeric(12,2);
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  select * into e from public.enquiries where id = p_enquiry_id for update;
  if not found then raise exception 'enquiry not found'; end if;
  if e.status in ('approved', 'declined', 'expired') then
    raise exception 'enquiry already closed';
  end if;
  if not public.property_is_available(e.property_id, e.check_in, e.check_out) then
    raise exception 'dates unavailable';
  end if;

  select * into pr from public.property_pricing where property_id = e.property_id;
  if not found then raise exception 'property has no pricing'; end if;

  n := (e.check_out - e.check_in);
  subtotal := pr.nightly_rate * n;
  service_fee := round(subtotal * pr.service_fee_rate);
  total := subtotal + pr.cleaning_fee + service_fee;

  insert into public.bookings (
    property_id, enquiry_id, user_id, check_in, check_out, guests,
    guest_name, guest_email, guest_phone, status,
    nightly_rate, nights, cleaning_fee, service_fee, total, currency, admin_notes
  ) values (
    e.property_id, e.id, e.user_id, e.check_in, e.check_out, e.guests,
    e.full_name, e.email, e.phone, 'confirmed',
    pr.nightly_rate, n, pr.cleaning_fee, service_fee, total, 'GHS', p_admin_notes
  ) returning id into bid;

  insert into public.availability_blocks (property_id, start_date, end_date, reason, booking_id)
  values (e.property_id, e.check_in, e.check_out, 'booked', bid);

  update public.enquiries
  set
    status = 'approved',
    admin_notes = coalesce(p_admin_notes, admin_notes),
    nightly_rate = pr.nightly_rate,
    cleaning_fee = pr.cleaning_fee,
    service_fee = service_fee,
    total = total
  where id = e.id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, meta)
  values (auth.uid(), 'enquiry.approved', 'enquiry', e.id, jsonb_build_object('booking_id', bid));

  return bid;
end;
$$;
