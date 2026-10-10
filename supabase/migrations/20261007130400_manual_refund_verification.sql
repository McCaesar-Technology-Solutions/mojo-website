-- Manual recovery for a refund stuck in provider_pending.
--
-- This does not call Paystack and does not treat a button click as proof.
-- An administrator must supply the Paystack reference they read from the
-- dashboard and a written note of what they verified. Outcome "unknown"
-- writes an audit row and leaves provider_pending unchanged, so claim_paystack_refund
-- still refuses another provider call. Outcome "accepted" is stored only when
-- that reference matches the booking, then finalize_paystack_refund does the
-- local status, occupancy, and late-payment cleanup.
--
-- Rollback: drop function public.record_manual_refund_verification(uuid, uuid, text, text, text).
-- This migration adds no columns. Rolling back 20261007130300 still requires
-- restoring the previous function bodies and dropping paystack_refund_state,
-- paystack_checkout_state, audit_logs_one_payment_after_cancel, and
-- audit_logs_one_unmatched_payment. Do not drop those while this function exists.

create or replace function public.record_manual_refund_verification(
  p_booking_id uuid,
  p_actor_id uuid,
  p_outcome text,
  p_reference text,
  p_evidence text
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  b public.bookings%rowtype;
  evidence text := nullif(trim(coalesce(p_evidence, '')), '');
  reference text := nullif(trim(coalesce(p_reference, '')), '');
begin
  if p_actor_id is null or not exists (
    select 1 from public.profiles where id = p_actor_id and role = 'admin'
  ) then
    raise exception 'BOOKING_NOT_AUTHORIZED'
      using errcode = '42501';
  end if;

  if p_booking_id is null then
    raise exception 'BOOKING_INVALID: booking id is required'
      using errcode = '22023';
  end if;

  if p_outcome is distinct from 'accepted' and p_outcome is distinct from 'unknown' then
    raise exception 'BOOKING_INVALID: outcome must be accepted or unknown'
      using errcode = '22023';
  end if;

  if reference is null or evidence is null or char_length(evidence) < 8 then
    raise exception 'BOOKING_INVALID: reference and a verification note of at least 8 characters are required'
      using errcode = '22023';
  end if;

  select * into b
  from public.bookings
  where id = p_booking_id
  for update;

  if not found then
    raise exception 'BOOKING_NOT_FOUND'
      using errcode = 'P0002';
  end if;

  if b.paystack_reference is distinct from reference then
    raise exception 'BOOKING_INVALID: reference does not match this booking'
      using errcode = '22023';
  end if;

  if p_outcome = 'unknown' then
    if b.paystack_refund_state is distinct from 'provider_pending' then
      raise exception 'REFUND_NOT_PENDING'
        using errcode = '22023';
    end if;

    insert into public.audit_logs (actor_id, action, entity_type, entity_id, meta)
    values (
      p_actor_id,
      'booking.refund_verification',
      'booking',
      b.id,
      jsonb_build_object(
        'outcome', 'unknown',
        'reference', reference,
        'evidence', evidence,
        'verified_at', now(),
        'paystack_refund_state', b.paystack_refund_state
      )
    );

    return jsonb_build_object('ok', true, 'action', 'unchanged', 'booking_id', b.id);
  end if;

  if b.paystack_refund_state is distinct from 'provider_pending'
     and b.paystack_refund_state is distinct from 'provider_accepted' then
    raise exception 'REFUND_NOT_PENDING'
      using errcode = '22023';
  end if;

  if b.paystack_refund_state is distinct from 'provider_accepted' then
    update public.bookings
    set paystack_refund_state = 'provider_accepted'
    where id = b.id;
  end if;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, meta)
  values (
    p_actor_id,
    'booking.refund_verification',
    'booking',
    b.id,
    jsonb_build_object(
      'outcome', 'accepted',
      'reference', reference,
      'evidence', evidence,
      'verified_at', now(),
      'paystack_refund_state', 'provider_accepted'
    )
  );

  return jsonb_build_object('ok', true, 'action', 'finalize', 'booking_id', b.id);
end;
$$;

revoke all on function public.record_manual_refund_verification(uuid, uuid, text, text, text) from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on function public.record_manual_refund_verification(uuid, uuid, text, text, text) from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on function public.record_manual_refund_verification(uuid, uuid, text, text, text) from authenticated;
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.record_manual_refund_verification(uuid, uuid, text, text, text) to service_role;
  end if;
end
$$;
