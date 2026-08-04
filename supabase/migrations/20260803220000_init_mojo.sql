-- MOJO production schema: profiles, inventory, enquiries, bookings, ops, trust

create extension if not exists "pgcrypto";

-- ---------- helpers ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'phone',
    'guest'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'guest' check (role in ('guest', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------- amenities ----------
create table public.amenities (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  icon text not null default 'solar:check-circle-bold',
  sort_order int not null default 0
);

-- ---------- properties ----------
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  type text not null check (type in ('Apartment', 'Hotel', 'Suite', 'Serviced')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  booking_mode text not null default 'request' check (booking_mode in ('request', 'instant')),
  city text not null,
  area text,
  country text not null default 'Ghana',
  description text,
  bedrooms int not null default 1 check (bedrooms >= 0),
  bathrooms int not null default 1 check (bathrooms >= 0),
  max_guests int not null default 2 check (max_guests >= 1),
  size_sqm int,
  rating numeric(3,2),
  review_count int not null default 0,
  is_featured boolean not null default false,
  check_in_time text not null default '15:00',
  check_out_time text not null default '11:00',
  house_rules jsonb not null default '[]'::jsonb,
  policies jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index properties_status_idx on public.properties (status);
create index properties_city_idx on public.properties (city);
create index properties_featured_idx on public.properties (is_featured) where status = 'published';

create trigger properties_updated_at
before update on public.properties
for each row execute function public.set_updated_at();

create table public.property_media (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  url text not null,
  storage_path text,
  sort_order int not null default 0,
  is_cover boolean not null default false,
  alt text
);

create index property_media_property_idx on public.property_media (property_id, sort_order);

create table public.property_amenities (
  property_id uuid not null references public.properties (id) on delete cascade,
  amenity_id uuid not null references public.amenities (id) on delete cascade,
  primary key (property_id, amenity_id)
);

create table public.property_pricing (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null unique references public.properties (id) on delete cascade,
  nightly_rate numeric(12,2) not null check (nightly_rate >= 0),
  original_nightly_rate numeric(12,2),
  cleaning_fee numeric(12,2) not null default 0 check (cleaning_fee >= 0),
  service_fee_rate numeric(8,6) not null default 0.046875 check (service_fee_rate >= 0),
  currency text not null default 'GHS' check (currency = 'GHS'),
  discount_label text
);

-- ---------- availability ----------
create table public.availability_blocks (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text not null check (reason in ('booked', 'manual', 'hold')),
  booking_id uuid,
  notes text,
  created_at timestamptz not null default now(),
  check (end_date > start_date)
);

create index availability_blocks_range_idx
  on public.availability_blocks (property_id, start_date, end_date);

-- ---------- enquiries ----------
create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete restrict,
  user_id uuid references auth.users (id) on delete set null,
  check_in date not null,
  check_out date not null,
  guests int not null check (guests >= 1),
  full_name text not null,
  email text not null,
  phone text not null,
  notes text,
  status text not null default 'new'
    check (status in ('new', 'in_review', 'approved', 'declined', 'expired')),
  admin_notes text,
  decline_reason text,
  nightly_rate numeric(12,2) not null,
  cleaning_fee numeric(12,2) not null default 0,
  service_fee numeric(12,2) not null default 0,
  total numeric(12,2) not null,
  currency text not null default 'GHS',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (check_out > check_in)
);

create index enquiries_status_idx on public.enquiries (status, created_at desc);
create index enquiries_user_idx on public.enquiries (user_id);

create trigger enquiries_updated_at
before update on public.enquiries
for each row execute function public.set_updated_at();

-- ---------- bookings ----------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete restrict,
  enquiry_id uuid unique references public.enquiries (id) on delete set null,
  user_id uuid references auth.users (id) on delete set null,
  check_in date not null,
  check_out date not null,
  guests int not null check (guests >= 1),
  guest_name text not null,
  guest_email text not null,
  guest_phone text not null,
  status text not null default 'confirmed'
    check (status in ('pending_payment', 'confirmed', 'checked_in', 'completed', 'cancelled', 'refunded')),
  nightly_rate numeric(12,2) not null,
  nights int not null check (nights >= 1),
  cleaning_fee numeric(12,2) not null default 0,
  service_fee numeric(12,2) not null default 0,
  total numeric(12,2) not null,
  currency text not null default 'GHS',
  paystack_reference text unique,
  paystack_access_code text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (check_out > check_in)
);

create index bookings_status_idx on public.bookings (status, check_in);
create index bookings_property_idx on public.bookings (property_id, check_in, check_out);

alter table public.availability_blocks
  add constraint availability_blocks_booking_fk
  foreign key (booking_id) references public.bookings (id) on delete set null;

create trigger bookings_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

-- ---------- trust / growth ----------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  body text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, property_id)
);

create table public.message_threads (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid unique references public.enquiries (id) on delete cascade,
  booking_id uuid unique references public.bookings (id) on delete cascade,
  guest_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.message_threads (id) on delete cascade,
  sender_id uuid references auth.users (id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create index messages_thread_idx on public.messages (thread_id, created_at);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_created_idx on public.audit_logs (created_at desc);

-- ---------- overlap helpers ----------
create or replace function public.dates_overlap(
  a_start date, a_end date, b_start date, b_end date
) returns boolean
language sql
immutable
as $$
  select a_start < b_end and b_start < a_end;
$$;

create or replace function public.property_is_available(
  p_property_id uuid,
  p_check_in date,
  p_check_out date,
  p_ignore_block_id uuid default null
) returns boolean
language sql
stable
as $$
  select not exists (
    select 1
    from public.availability_blocks b
    where b.property_id = p_property_id
      and (p_ignore_block_id is null or b.id <> p_ignore_block_id)
      and public.dates_overlap(b.start_date, b.end_date, p_check_in, p_check_out)
      and b.reason in ('booked', 'manual', 'hold')
  );
$$;

-- Approve enquiry → booking + calendar block (admin only)
create or replace function public.approve_enquiry(p_enquiry_id uuid, p_admin_notes text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  e public.enquiries%rowtype;
  bid uuid;
  n int;
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

  n := (e.check_out - e.check_in);

  insert into public.bookings (
    property_id, enquiry_id, user_id, check_in, check_out, guests,
    guest_name, guest_email, guest_phone, status,
    nightly_rate, nights, cleaning_fee, service_fee, total, currency, admin_notes
  ) values (
    e.property_id, e.id, e.user_id, e.check_in, e.check_out, e.guests,
    e.full_name, e.email, e.phone, 'confirmed',
    e.nightly_rate, n, e.cleaning_fee, e.service_fee, e.total, e.currency, p_admin_notes
  ) returning id into bid;

  insert into public.availability_blocks (property_id, start_date, end_date, reason, booking_id)
  values (e.property_id, e.check_in, e.check_out, 'booked', bid);

  update public.enquiries
  set status = 'approved', admin_notes = coalesce(p_admin_notes, admin_notes)
  where id = e.id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, meta)
  values (auth.uid(), 'enquiry.approved', 'enquiry', e.id, jsonb_build_object('booking_id', bid));

  return bid;
end;
$$;

create or replace function public.decline_enquiry(p_enquiry_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  update public.enquiries
  set status = 'declined', decline_reason = p_reason
  where id = p_enquiry_id and status not in ('approved', 'declined');

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, meta)
  values (auth.uid(), 'enquiry.declined', 'enquiry', p_enquiry_id, jsonb_build_object('reason', p_reason));
end;
$$;

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.amenities enable row level security;
alter table public.properties enable row level security;
alter table public.property_media enable row level security;
alter table public.property_amenities enable row level security;
alter table public.property_pricing enable row level security;
alter table public.availability_blocks enable row level security;
alter table public.enquiries enable row level security;
alter table public.bookings enable row level security;
alter table public.reviews enable row level security;
alter table public.wishlists enable row level security;
alter table public.message_threads enable row level security;
alter table public.messages enable row level security;
alter table public.audit_logs enable row level security;

-- profiles
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()));
create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- public catalog read
create policy "amenities_public_read" on public.amenities for select using (true);
create policy "amenities_admin_write" on public.amenities for all using (public.is_admin()) with check (public.is_admin());

create policy "properties_public_read" on public.properties
  for select using (status = 'published' or public.is_admin());
create policy "properties_admin_write" on public.properties
  for all using (public.is_admin()) with check (public.is_admin());

create policy "media_public_read" on public.property_media
  for select using (
    exists (select 1 from public.properties p where p.id = property_id and (p.status = 'published' or public.is_admin()))
  );
create policy "media_admin_write" on public.property_media
  for all using (public.is_admin()) with check (public.is_admin());

create policy "property_amenities_public_read" on public.property_amenities
  for select using (
    exists (select 1 from public.properties p where p.id = property_id and (p.status = 'published' or public.is_admin()))
  );
create policy "property_amenities_admin_write" on public.property_amenities
  for all using (public.is_admin()) with check (public.is_admin());

create policy "pricing_public_read" on public.property_pricing
  for select using (
    exists (select 1 from public.properties p where p.id = property_id and (p.status = 'published' or public.is_admin()))
  );
create policy "pricing_admin_write" on public.property_pricing
  for all using (public.is_admin()) with check (public.is_admin());

create policy "availability_public_read" on public.availability_blocks for select using (true);
create policy "availability_admin_write" on public.availability_blocks
  for all using (public.is_admin()) with check (public.is_admin());

-- enquiries
create policy "enquiries_insert" on public.enquiries
  for insert with check (
    (user_id is null or user_id = auth.uid())
  );
create policy "enquiries_select_own_or_admin" on public.enquiries
  for select using (
    public.is_admin()
    or user_id = auth.uid()
    or (auth.jwt() ->> 'email') = email
  );
create policy "enquiries_admin_update" on public.enquiries
  for update using (public.is_admin()) with check (public.is_admin());

-- bookings
create policy "bookings_select_own_or_admin" on public.bookings
  for select using (public.is_admin() or user_id = auth.uid() or guest_email = (auth.jwt() ->> 'email'));
create policy "bookings_admin_write" on public.bookings
  for all using (public.is_admin()) with check (public.is_admin());

-- reviews
create policy "reviews_public_approved" on public.reviews
  for select using (status = 'approved' or public.is_admin() or user_id = auth.uid());
create policy "reviews_insert_own" on public.reviews
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.bookings b
      where b.id = booking_id and b.user_id = auth.uid() and b.status = 'completed'
    )
  );
create policy "reviews_admin_update" on public.reviews
  for update using (public.is_admin()) with check (public.is_admin());

-- wishlists
create policy "wishlists_own" on public.wishlists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- messaging
create policy "threads_select" on public.message_threads
  for select using (public.is_admin() or guest_id = auth.uid());
create policy "threads_insert" on public.message_threads
  for insert with check (public.is_admin() or guest_id = auth.uid());
create policy "messages_select" on public.messages
  for select using (
    exists (
      select 1 from public.message_threads t
      where t.id = thread_id and (public.is_admin() or t.guest_id = auth.uid())
    )
  );
create policy "messages_insert" on public.messages
  for insert with check (
    exists (
      select 1 from public.message_threads t
      where t.id = thread_id and (public.is_admin() or t.guest_id = auth.uid())
    )
  );

create policy "audit_admin_read" on public.audit_logs
  for select using (public.is_admin());
create policy "audit_admin_insert" on public.audit_logs
  for insert with check (public.is_admin());

-- ---------- storage ----------
insert into storage.buckets (id, name, public)
values ('property-media', 'property-media', true)
on conflict (id) do nothing;

create policy "property_media_public_read"
on storage.objects for select
using (bucket_id = 'property-media');

create policy "property_media_admin_write"
on storage.objects for insert
with check (bucket_id = 'property-media' and public.is_admin());

create policy "property_media_admin_update"
on storage.objects for update
using (bucket_id = 'property-media' and public.is_admin());

create policy "property_media_admin_delete"
on storage.objects for delete
using (bucket_id = 'property-media' and public.is_admin());
