-- PMS occupancy blocks on the public website calendar.

alter table public.availability_blocks
  drop constraint if exists availability_blocks_reason_check;

alter table public.availability_blocks
  add constraint availability_blocks_reason_check
  check (reason in ('booked', 'manual', 'hold', 'pms'));

alter table public.availability_blocks
  add column if not exists pms_reservation_id uuid;

create index if not exists availability_blocks_pms_property_idx
  on public.availability_blocks (property_id)
  where reason = 'pms';

comment on column public.availability_blocks.pms_reservation_id is
  'Optional PMS reservation id when reason = pms (occupancy pushed from the Property Management System).';
