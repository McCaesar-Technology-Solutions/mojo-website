-- CP-A02.2: database-level overlap invariant for all availability reasons.
--
-- Production application requires a zero-overlap census and explicit resolution
-- of any existing conflicts before this migration is applied.
-- Do NOT apply to production until that census returns zero rows.
-- This migration does not delete, merge, or repair availability_blocks.

create extension if not exists btree_gist;

alter table public.availability_blocks
  add constraint availability_blocks_no_overlap
  exclude using gist (
    property_id with =,
    daterange(start_date, end_date, '[)') with &&
  )
  not deferrable;

comment on constraint availability_blocks_no_overlap on public.availability_blocks is
  'Half-open [start_date, end_date). Adjacent checkout/check-in is allowed. All reasons (booked, manual, hold, pms).';
