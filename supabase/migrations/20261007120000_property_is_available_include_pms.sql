-- CP-A02.1: count PMS occupancy in website availability checks.
-- Signature, half-open overlap (dates_overlap), and adjacent-night behavior are unchanged.

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
      and b.reason in ('booked', 'manual', 'hold', 'pms')
  );
$$;

comment on function public.property_is_available(uuid, date, date, uuid) is
  'True when no availability_blocks row (booked, manual, hold, or pms) overlaps [check_in, check_out).';
