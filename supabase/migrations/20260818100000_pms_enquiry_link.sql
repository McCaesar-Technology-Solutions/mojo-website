-- Link website enquiries to PMS reservations (Property Management System).

alter table public.enquiries
  add column if not exists pms_reservation_id uuid,
  add column if not exists pms_sync_error text;

comment on column public.enquiries.pms_reservation_id is
  'Reservation id in the MOJO PMS after Request-to-Book ingest.';
