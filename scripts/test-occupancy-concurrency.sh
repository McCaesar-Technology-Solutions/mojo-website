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

PSQL=("$PGBIN/psql" -h 127.0.0.1 -p "$PORT" -d occupancy_test -v ON_ERROR_STOP=1)

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
  supabase/migrations/20261007120000_property_is_available_include_pms.sql \
  supabase/migrations/20261007120100_availability_blocks_exclusion.sql \
  supabase/migrations/20261007120200_replace_pms_occupancy.sql \
  supabase/migrations/20261007120300_approve_enquiry_property_lock.sql \
  supabase/migrations/20261007130000_admin_update_booking_atomic.sql
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

echo "occupancy concurrency tests passed"
