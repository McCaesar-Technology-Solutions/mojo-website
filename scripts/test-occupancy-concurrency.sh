#!/usr/bin/env bash
# Database-level occupancy tests against a throwaway Postgres cluster.
# Two sessions prove the advisory lock: overlapping approvals cannot both commit.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PGBIN="/opt/homebrew/opt/postgresql@16/bin"
PORT="${OCCUPANCY_TEST_PORT:-54329}"
DATA="$(mktemp -d "${TMPDIR:-/tmp}/mojo-occ-pg.XXXXXX")"
LOG="$DATA/postgres.log"
export PGHOST=127.0.0.1
export PGPORT="$PORT"
export PGUSER="${USER}"
export PGDATABASE=occupancy_test

cleanup() {
  "$PGBIN/pg_ctl" -D "$DATA" -m fast stop >/dev/null 2>&1 || true
  rm -rf "$DATA"
}
trap cleanup EXIT

"$PGBIN/initdb" -D "$DATA" --username="$PGUSER" --auth=trust >/dev/null
"$PGBIN/pg_ctl" -D "$DATA" -l "$LOG" -o "-p $PORT -k $DATA" start >/dev/null
for _ in 1 2 3 4 5 6 7 8 9 10; do
  if "$PGBIN/pg_isready" -h 127.0.0.1 -p "$PORT" >/dev/null 2>&1; then
    break
  fi
  sleep 0.2
done
"$PGBIN/createdb" -h 127.0.0.1 -p "$PORT" occupancy_test

PSQL=("$PGBIN/psql" -h 127.0.0.1 -p "$PORT" -d occupancy_test -v ON_ERROR_STOP=1 -P pager=off)

"${PSQL[@]}" <<'SQL'
create schema if not exists auth;
create schema if not exists storage;
create table auth.users (
  id uuid primary key,
  email text,
  raw_user_meta_data jsonb
);
create table storage.buckets (id text primary key, name text, public boolean);
create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text,
  name text
);
create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
create or replace function auth.jwt() returns jsonb
language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb)
$$;
SQL

for f in \
  supabase/migrations/20260803220000_init_mojo.sql \
  supabase/migrations/20260805120000_enquiry_server_reprice.sql \
  supabase/migrations/20260805130000_request_only_launch.sql \
  supabase/migrations/20260806150000_reviews_admin_delete.sql \
  supabase/migrations/20260926000000_pms_occupancy_blocks.sql \
  supabase/migrations/20261007120000_property_is_available_include_pms.sql
do
  "${PSQL[@]}" -f "$ROOT/$f" >/dev/null
done

# 20260926000000 must land before the exclusion migration: it is what allows reason='pms'.
# 20261007120100 must abort, and leave no constraint, when overlaps already exist.
"${PSQL[@]}" <<'SQL'
insert into public.properties (id, slug, title, type, city)
values ('10000000-0000-0000-0000-0000000000ee', 'census-clash', 'Census', 'Apartment', 'Accra');
insert into public.availability_blocks (property_id, start_date, end_date, reason)
values
  ('10000000-0000-0000-0000-0000000000ee', '2026-05-01', '2026-05-05', 'manual'),
  ('10000000-0000-0000-0000-0000000000ee', '2026-05-04', '2026-05-08', 'hold');
SQL
set +e
"${PSQL[@]}" -f "$ROOT/supabase/migrations/20261007120100_availability_blocks_exclusion.sql" >/tmp/mojo-occ-excl.out 2>/tmp/mojo-occ-excl.err
excl_status=$?
set -e
if [[ "$excl_status" -eq 0 ]]; then
  echo "exclusion migration committed over existing overlaps" >&2
  exit 1
fi
if ! grep -q "availability_blocks_no_overlap" /tmp/mojo-occ-excl.err; then
  echo "exclusion migration failed for an unexpected reason" >&2
  cat /tmp/mojo-occ-excl.err >&2
  exit 1
fi
constraint_after_fail="$("${PSQL[@]}" -tA -c "select count(*) from pg_constraint where conname = 'availability_blocks_no_overlap'")"
overlaps_after_fail="$("${PSQL[@]}" -tA -c "select count(*) from public.availability_blocks where property_id = '10000000-0000-0000-0000-0000000000ee'")"
if [[ "$constraint_after_fail" != "0" || "$overlaps_after_fail" != "2" ]]; then
  echo "failed exclusion migration changed schema or occupancy (constraint=$constraint_after_fail overlaps=$overlaps_after_fail)" >&2
  exit 1
fi
"${PSQL[@]}" -c "delete from public.availability_blocks where property_id = '10000000-0000-0000-0000-0000000000ee'; delete from public.properties where id = '10000000-0000-0000-0000-0000000000ee';" >/dev/null

for f in \
  supabase/migrations/20261007120100_availability_blocks_exclusion.sql \
  supabase/migrations/20261007120200_replace_pms_occupancy.sql \
  supabase/migrations/20261007120300_approve_enquiry_property_lock.sql \
  supabase/migrations/20261007130000_admin_update_booking_atomic.sql \
  supabase/migrations/20261007130100_payment_hold_atomicity.sql \
  supabase/migrations/20261007130200_payment_lock_order_and_late_refund.sql \
  supabase/migrations/20261007130300_refund_recovery_and_hold_cancel.sql \
  supabase/migrations/20261007130400_manual_refund_verification.sql
do
  "${PSQL[@]}" -f "$ROOT/$f" >/dev/null
done

"${PSQL[@]}" -f "$ROOT/supabase/tests/occupancy_concurrency.sql"

PROP_A="10000000-0000-0000-0000-000000000001"
PROP_B="10000000-0000-0000-0000-000000000002"
ENQ_OVERLAP_1="20000000-0000-0000-0000-000000000001"
ENQ_OVERLAP_2="20000000-0000-0000-0000-000000000002"
ENQ_OTHER="20000000-0000-0000-0000-000000000005"
ADMIN_SQL="select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000aa', false);"

# Session-level advisory lock uses the same key as lock_property_inventory and
# is held across the gate update so other sessions can see that the lock is live.
"${PSQL[@]}" <<SQL &
select pg_advisory_lock(hashtextextended('mojo.availability.property:' || '${PROP_A}', 0));
update public.test_gate set open = true where id = 1;
select pg_sleep(6);
select pg_advisory_unlock(hashtextextended('mojo.availability.property:' || '${PROP_A}', 0));
SQL
LOCKER_PID=$!

for _ in 1 2 3 4 5 6 7 8 9 20; do
  open="$("${PSQL[@]}" -tA -c "select open from public.test_gate where id = 1")"
  if [[ "$open" == "t" ]]; then
    break
  fi
  sleep 0.1
done
if [[ "${open:-}" != "t" ]]; then
  echo "lock holder did not start" >&2
  exit 1
fi

# Different property is not blocked by A's lock.
"${PSQL[@]}" -c "${ADMIN_SQL} set statement_timeout = '2s'; select public.approve_enquiry('${ENQ_OTHER}', null);" >/dev/null

set +e
"${PSQL[@]}" -c "${ADMIN_SQL} set statement_timeout = '1s'; select public.approve_enquiry('${ENQ_OVERLAP_1}', null);" >/tmp/mojo-occ-blocked.out 2>/tmp/mojo-occ-blocked.err
blocked_status=$?
set -e
if [[ "$blocked_status" -eq 0 ]]; then
  echo "property A approval ran while its inventory lock was held" >&2
  cat /tmp/mojo-occ-blocked.err >&2
  exit 1
fi
if ! grep -q "canceling statement due to statement timeout" /tmp/mojo-occ-blocked.err; then
  echo "expected lock wait to hit statement timeout" >&2
  cat /tmp/mojo-occ-blocked.err >&2
  exit 1
fi

# Direct hold insert has no explicit lock call. The BEFORE trigger must wait.
set +e
"${PSQL[@]}" -c "set statement_timeout = '1s'; insert into public.availability_blocks (property_id, start_date, end_date, reason) values ('${PROP_A}', '2027-02-01', '2027-02-03', 'hold');" >/tmp/mojo-occ-hold-lock.out 2>/tmp/mojo-occ-hold-lock.err
hold_lock_status=$?
set -e
if [[ "$hold_lock_status" -eq 0 ]]; then
  echo "hold insert ran while the property inventory lock was held" >&2
  exit 1
fi
if ! grep -q "canceling statement due to statement timeout" /tmp/mojo-occ-hold-lock.err; then
  echo "expected hold insert to wait on the property lock" >&2
  cat /tmp/mojo-occ-hold-lock.err >&2
  exit 1
fi

wait "$LOCKER_PID"

OUT1="$(mktemp)"
OUT2="$(mktemp)"
ERR1="$(mktemp)"
ERR2="$(mktemp)"
"${PSQL[@]}" -c "${ADMIN_SQL} select public.approve_enquiry('${ENQ_OVERLAP_1}', null);" >"$OUT1" 2>"$ERR1" &
PID1=$!
"${PSQL[@]}" -c "${ADMIN_SQL} select public.approve_enquiry('${ENQ_OVERLAP_2}', null);" >"$OUT2" 2>"$ERR2" &
PID2=$!
set +e
wait "$PID1"
S1=$?
wait "$PID2"
S2=$?
set -e

successes=0
failures=0
if [[ "$S1" -eq 0 ]]; then successes=$((successes + 1)); else failures=$((failures + 1)); fi
if [[ "$S2" -eq 0 ]]; then successes=$((successes + 1)); else failures=$((failures + 1)); fi
if [[ "$successes" -ne 1 || "$failures" -ne 1 ]]; then
  echo "expected exactly one overlapping approval to commit (s1=$S1 s2=$S2)" >&2
  echo "--- session 1 ---" >&2
  cat "$ERR1" >&2
  echo "--- session 2 ---" >&2
  cat "$ERR2" >&2
  exit 1
fi
cat "$ERR1" "$ERR2" | grep -q "dates unavailable"

bookings="$("${PSQL[@]}" -tA -c "select count(*) from public.bookings where enquiry_id in ('${ENQ_OVERLAP_1}', '${ENQ_OVERLAP_2}')")"
blocks="$("${PSQL[@]}" -tA -c "select count(*) from public.availability_blocks where reason = 'booked' and property_id = '${PROP_A}' and start_date < '2026-11-06' and end_date > '2026-11-01'")"
if [[ "$bookings" != "1" || "$blocks" != "1" ]]; then
  echo "overlapping race left bookings=$bookings blocks=$blocks" >&2
  exit 1
fi

# Hold insert racing an overlapping approval. Exactly one may commit.
ENQ_HOLD_RACE="20000000-0000-0000-0000-000000000007"
HOLD_OUT="$(mktemp)"
APPR_OUT="$(mktemp)"
HOLD_ERR="$(mktemp)"
APPR_ERR="$(mktemp)"
"${PSQL[@]}" -c "insert into public.availability_blocks (property_id, start_date, end_date, reason) values ('${PROP_A}', '2027-06-01', '2027-06-05', 'hold');" >"$HOLD_OUT" 2>"$HOLD_ERR" &
HPID=$!
"${PSQL[@]}" -c "${ADMIN_SQL} select public.approve_enquiry('${ENQ_HOLD_RACE}', null);" >"$APPR_OUT" 2>"$APPR_ERR" &
APID=$!
set +e
wait "$HPID"
HS=$?
wait "$APID"
AS=$?
set -e
if [[ "$HS" -eq "$AS" ]]; then
  echo "hold/approval race expected one winner (hold=$HS approve=$AS)" >&2
  cat "$HOLD_ERR" "$APPR_ERR" >&2
  exit 1
fi
race_blocks="$("${PSQL[@]}" -tA -c "select count(*) from public.availability_blocks where property_id = '${PROP_A}' and start_date < '2027-06-05' and end_date > '2027-06-01'")"
race_bookings="$("${PSQL[@]}" -tA -c "select count(*) from public.bookings where enquiry_id = '${ENQ_HOLD_RACE}'")"
if [[ "$race_blocks" != "1" ]]; then
  echo "hold/approval race left blocks=$race_blocks" >&2
  exit 1
fi
if [[ "$HS" -eq 0 && "$race_bookings" != "0" ]]; then
  echo "winning hold still created a booking" >&2
  exit 1
fi
if [[ "$AS" -eq 0 && "$race_bookings" != "1" ]]; then
  echo "winning approval did not create exactly one booking" >&2
  exit 1
fi

# Expired-hold delete racing approval. Never both a hold and a booking.
ENQ_CLEAN="20000000-0000-0000-0000-000000000008"
HOLD_ID="40000000-0000-0000-0000-000000000008"
CLEAN_ERR="$(mktemp)"
CLEAN_APPR_ERR="$(mktemp)"
"${PSQL[@]}" -c "delete from public.availability_blocks where id = '${HOLD_ID}' and reason = 'hold';" >/dev/null 2>"$CLEAN_ERR" &
CPID=$!
"${PSQL[@]}" -c "${ADMIN_SQL} select public.approve_enquiry('${ENQ_CLEAN}', null);" >/dev/null 2>"$CLEAN_APPR_ERR" &
CAPID=$!
set +e
wait "$CPID"
CS=$?
wait "$CAPID"
CAS=$?
set -e
if [[ "$CS" -ne 0 ]]; then
  echo "expired-hold delete failed" >&2
  cat "$CLEAN_ERR" >&2
  exit 1
fi
clean_holds="$("${PSQL[@]}" -tA -c "select count(*) from public.availability_blocks where id = '${HOLD_ID}'")"
clean_bookings="$("${PSQL[@]}" -tA -c "select count(*) from public.bookings where enquiry_id = '${ENQ_CLEAN}'")"
clean_blocks="$("${PSQL[@]}" -tA -c "select count(*) from public.availability_blocks where property_id = '${PROP_A}' and start_date < '2027-07-05' and end_date > '2027-07-01'")"
if [[ "$clean_holds" != "0" ]]; then
  echo "expired hold remained after cleanup" >&2
  exit 1
fi
if [[ "$clean_blocks" != "$clean_bookings" || "$clean_bookings" -gt 1 ]]; then
  echo "cleanup/approval race left bookings=$clean_bookings blocks=$clean_blocks approve=$CAS" >&2
  cat "$CLEAN_APPR_ERR" >&2
  exit 1
fi

# Webhook confirmation and expiry cleanup both block on the property lock,
# then exactly one consistent outcome remains.
PROP_C="10000000-0000-0000-0000-000000000003"
BOOK_RACE="50000000-0000-0000-0000-000000000010"
HOLD_RACE="40000000-0000-0000-0000-000000000010"
"${PSQL[@]}" -c "update public.test_gate set open = false where id = 2;" >/dev/null
"${PSQL[@]}" <<SQL &
select pg_advisory_lock(hashtextextended('mojo.availability.property:' || '${PROP_C}', 0));
update public.test_gate set open = true where id = 2;
select pg_sleep(3);
select pg_advisory_unlock(hashtextextended('mojo.availability.property:' || '${PROP_C}', 0));
SQL
RACE_LOCK_PID=$!
for _ in 1 2 3 4 5 6 7 8 9 20; do
  open="$("${PSQL[@]}" -tA -c "select open from public.test_gate where id = 2")"
  if [[ "$open" == "t" ]]; then
    break
  fi
  sleep 0.1
done
if [[ "${open:-}" != "t" ]]; then
  echo "payment race lock holder did not start" >&2
  exit 1
fi

CONFIRM_OUT="$(mktemp)"
RELEASE_OUT="$(mktemp)"
CONFIRM_ERR="$(mktemp)"
RELEASE_ERR="$(mktemp)"
"${PSQL[@]}" -c "set statement_timeout = '8s'; select public.confirm_paid_booking('${BOOK_RACE}');" >"$CONFIRM_OUT" 2>"$CONFIRM_ERR" &
CONFIRM_PID=$!
"${PSQL[@]}" -c "set statement_timeout = '8s'; select public.release_expired_payment_hold('${HOLD_RACE}');" >"$RELEASE_OUT" 2>"$RELEASE_ERR" &
RELEASE_PID=$!
sleep 0.4
if ! kill -0 "$CONFIRM_PID" 2>/dev/null || ! kill -0 "$RELEASE_PID" 2>/dev/null; then
  echo "webhook and expiry did not both wait on the property lock" >&2
  cat "$CONFIRM_ERR" "$RELEASE_ERR" >&2
  exit 1
fi
wait "$RACE_LOCK_PID"
set +e
wait "$CONFIRM_PID"
CONFIRM_STATUS=$?
wait "$RELEASE_PID"
RELEASE_STATUS=$?
set -e
if [[ "$CONFIRM_STATUS" -ne 0 || "$RELEASE_STATUS" -ne 0 ]]; then
  echo "webhook/expiry race failed (confirm=$CONFIRM_STATUS release=$RELEASE_STATUS)" >&2
  cat "$CONFIRM_ERR" "$RELEASE_ERR" >&2
  exit 1
fi
race_status="$("${PSQL[@]}" -tA -c "select status from public.bookings where id = '${BOOK_RACE}'")"
race_blocks="$("${PSQL[@]}" -tA -c "select count(*) from public.availability_blocks where booking_id = '${BOOK_RACE}'")"
race_booked="$("${PSQL[@]}" -tA -c "select count(*) from public.availability_blocks where booking_id = '${BOOK_RACE}' and reason = 'booked'")"
if [[ "$race_status" == "confirmed" && "$race_booked" != "1" ]]; then
  echo "confirmed booking lost its occupancy block (blocks=$race_blocks)" >&2
  exit 1
fi
if [[ "$race_status" == "cancelled" && "$race_blocks" != "0" ]]; then
  echo "cancelled booking still occupies the calendar" >&2
  exit 1
fi
if [[ "$race_status" != "confirmed" && "$race_status" != "cancelled" ]]; then
  echo "webhook/expiry race left status=$race_status" >&2
  exit 1
fi
if [[ "$race_status" == "cancelled" ]] && ! grep -q "payment_after_cancel" "$CONFIRM_OUT"; then
  echo "expiry won but confirmation did not report payment_after_cancel" >&2
  cat "$CONFIRM_OUT" >&2
  exit 1
fi
if [[ "$race_status" == "confirmed" ]] && ! grep -Eq "preserved|absent" "$RELEASE_OUT"; then
  echo "confirmation won but expiry did not preserve or skip the block" >&2
  cat "$RELEASE_OUT" >&2
  exit 1
fi

# Linking a hold must wait on the booking row, not on the property lock.
# The reverse order deadlocks with confirm_paid_booking.
PROP_D="10000000-0000-0000-0000-000000000004"
BOOK_LINK="50000000-0000-0000-0000-000000000011"
HOLD_LINK="40000000-0000-0000-0000-000000000011"
"${PSQL[@]}" <<SQL
insert into public.properties (id, slug, title, type, city)
values ('${PROP_D}', 'prop-d', 'Prop D', 'Apartment', 'Accra');
insert into public.bookings (
  id, property_id, check_in, check_out, guests, guest_name, guest_email, guest_phone,
  status, nightly_rate, nights, cleaning_fee, service_fee, total, paystack_reference
) values (
  '${BOOK_LINK}', '${PROP_D}', '2027-08-01', '2027-08-04', 2, 'Link', 'link@example.com', '1',
  'pending_payment', 100, 3, 0, 0, 300, 'mojo_link_hold'
);
insert into public.availability_blocks (id, property_id, start_date, end_date, reason, created_at)
values (
  '${HOLD_LINK}', '${PROP_D}', '2027-08-01', '2027-08-04', 'hold', now()
);
SQL
# Session advisory lock is visible before the transaction commits. The row lock
# is held until commit, which is the window attach_paystack_hold must wait on.
"${PSQL[@]}" <<SQL &
begin;
select pg_advisory_lock(hashtextextended('mojo.hold-link-gate', 0));
select id from public.bookings where id = '${BOOK_LINK}' for update;
select pg_sleep(2);
select public.lock_property_inventory('${PROP_D}'::uuid);
select pg_advisory_unlock(hashtextextended('mojo.hold-link-gate', 0));
commit;
SQL
LINK_LOCK_PID=$!
held=f
for _ in 1 2 3 4 5 6 7 8 9 20; do
  got="$("${PSQL[@]}" -tA -c "select pg_try_advisory_lock(hashtextextended('mojo.hold-link-gate', 0))")"
  if [[ "$got" == "f" ]]; then
    held=t
    break
  fi
  "${PSQL[@]}" -c "select pg_advisory_unlock(hashtextextended('mojo.hold-link-gate', 0));" >/dev/null
  sleep 0.1
done
if [[ "$held" != "t" ]]; then
  echo "hold-link lock holder did not start" >&2
  exit 1
fi
set +e
"${PSQL[@]}" -c "set statement_timeout = '8s'; select public.attach_paystack_hold('${BOOK_LINK}', '${HOLD_LINK}');" >/tmp/mojo-occ-link.out 2>/tmp/mojo-occ-link.err
link_status=$?
set -e
wait "$LINK_LOCK_PID"
if [[ "$link_status" -ne 0 ]]; then
  echo "attach_paystack_hold deadlocked or failed while the booking row was locked" >&2
  cat /tmp/mojo-occ-link.err >&2
  exit 1
fi
linked="$("${PSQL[@]}" -tA -c "select booking_id from public.availability_blocks where id = '${HOLD_LINK}'")"
if [[ "$linked" != "$BOOK_LINK" ]]; then
  echo "attach_paystack_hold did not link the hold" >&2
  exit 1
fi

# Two sessions insert the same late-payment audit. The partial unique index keeps one row.
LATE_A="$(mktemp)"
LATE_B="$(mktemp)"
LATE_A_ERR="$(mktemp)"
LATE_B_ERR="$(mktemp)"
LATE_SQL="insert into public.audit_logs (action, entity_type, entity_id, meta) values ('booking.payment_after_cancel', 'booking', '50000000-0000-0000-0000-000000000022', '{\"reference\":\"mojo_concurrent_late\"}'::jsonb);"
"${PSQL[@]}" -c "$LATE_SQL" >"$LATE_A" 2>"$LATE_A_ERR" &
LATE_A_PID=$!
"${PSQL[@]}" -c "$LATE_SQL" >"$LATE_B" 2>"$LATE_B_ERR" &
LATE_B_PID=$!
set +e
wait "$LATE_A_PID"
LATE_A_STATUS=$?
wait "$LATE_B_PID"
LATE_B_STATUS=$?
set -e
if [[ "$LATE_A_STATUS" -eq "$LATE_B_STATUS" ]]; then
  echo "concurrent late-payment audits expected one winner (a=$LATE_A_STATUS b=$LATE_B_STATUS)" >&2
  cat "$LATE_A_ERR" "$LATE_B_ERR" >&2
  exit 1
fi
late_rows="$("${PSQL[@]}" -tA -c "select count(*) from public.audit_logs where action = 'booking.payment_after_cancel' and entity_id = '50000000-0000-0000-0000-000000000022'")"
if [[ "$late_rows" != "1" ]]; then
  echo "concurrent late-payment audits left rows=$late_rows" >&2
  exit 1
fi

echo "occupancy concurrency tests passed"
