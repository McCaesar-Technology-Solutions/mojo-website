-- Repair for the unapplied tail of 20261007120200_replace_pms_occupancy.sql.
--
-- That migration's lock and replace functions are already live. This file adds
-- only the missing BEFORE row trigger so every availability_blocks write takes
-- the same transaction advisory lock as replace_pms_occupancy and approve_enquiry.
-- The exclusion constraint remains the overlap invariant. The lock makes
-- check-then-act and full PMS replaces atomic against other occupancy writers
-- on the same property, including direct service-role holds, refunds, and
-- admin edits. A property_id change locks both properties in uuid order.
--
-- Live evidence used to choose the owner, not current_user:
--   public.availability_blocks owner = postgres
--   public.lock_property_inventory(uuid) owner = postgres
--   EXECUTE on lock_property_inventory is already held by postgres and service_role
-- A SECURITY DEFINER function owned by postgres therefore calls the lock with
-- the privilege postgres already has. This migration does not GRANT or REVOKE
-- anything on lock_property_inventory, replace_pms_occupancy, or approve_enquiry.
--
-- Default privileges on public functions grant EXECUTE to anon, authenticated,
-- and service_role. Those grants are revoked. Trigger execution does not require
-- the writer to hold EXECUTE on the trigger function.

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

alter function public.availability_blocks_serialize() owner to postgres;

comment on function public.availability_blocks_serialize() is
  'BEFORE row trigger on availability_blocks. Takes lock_property_inventory for the row property, or both properties in uuid order when property_id changes. SECURITY DEFINER so the lock call uses the postgres privilege already granted on lock_property_inventory. Not callable by API roles.';

revoke all on function public.availability_blocks_serialize() from public;
revoke all on function public.availability_blocks_serialize() from anon;
revoke all on function public.availability_blocks_serialize() from authenticated;
revoke all on function public.availability_blocks_serialize() from service_role;

drop trigger if exists availability_blocks_serialize on public.availability_blocks;
create trigger availability_blocks_serialize
before insert or update or delete on public.availability_blocks
for each row execute function public.availability_blocks_serialize();

comment on trigger availability_blocks_serialize on public.availability_blocks is
  'Serializes occupancy writes for one property with replace_pms_occupancy and approve_enquiry. Exclusion constraint availability_blocks_no_overlap remains the overlap invariant.';
