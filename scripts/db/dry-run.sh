#!/usr/bin/env bash
# Review-time verification of the proposed migrations WITHOUT applying them anywhere real.
#
#   scripts/db/dry-run.sh [image]          default image: supabase/postgres:17.6.1.136 (self-hosted stack)
#   scripts/db/dry-run.sh supabase/postgres:17.11.0.004   (Supabase CLI 2.121 local image)
#
# What it does:
#   1. starts a throwaway container of the exact image (no published ports) and removes it on exit
#   2. creates a minimal stub of the tables the Storage service normally creates at boot (marked below)
#   3. for every supabase/tests/database/*.test.sql: BEGIN → all migrations → seed.sql → snapshot → test → leak check
#      → ROLLBACK. Each test file owns its transaction (begin … rollback, as `supabase test db` needs); inside the outer
#      transaction its own begin/rollback run as SAVEPOINT / ROLLBACK TO SAVEPOINT, so the leak check proves the file's
#      rollback undoes every row it wrote. Sequence movement is reported (nextval/setval are not transactional).
#   4. prints TAP output and exits non-zero if any migration fails, any test is "not ok", a plan is not met, a file
#      does not own its transaction, or a file leaks rows
# Nothing is committed in the container and no project database is touched. Requires Docker.
set -euo pipefail
export MSYS_NO_PATHCONV=1   # Git Bash: do not rewrite container paths such as /tmp/mcci

IMAGE="${1:-supabase/postgres:17.6.1.136}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
NAME="mcci-dryrun-$$"
WORK="$(mktemp -d)"

# docker on Windows (Git Bash) needs native host paths; on Linux/CI this is a no-op
hostpath() { if command -v cygpath >/dev/null 2>&1; then cygpath -m "$1"; else echo "$1"; fi; }

cleanup() { docker rm -f "$NAME" >/dev/null 2>&1 || true; rm -rf "$WORK"; }
trap cleanup EXIT

echo "# image: $IMAGE"
docker run -d --name "$NAME" -e POSTGRES_PASSWORD=dry-run-only "$IMAGE" >/dev/null
for _ in $(seq 1 90); do
  docker exec "$NAME" pg_isready -U postgres -h localhost >/dev/null 2>&1 && break
  sleep 2
done
# the image runs its own init scripts after the server first accepts connections; wait for the roles to exist
for _ in $(seq 1 60); do
  docker exec "$NAME" psql -U postgres -h localhost -tAc "select 1 from pg_roles where rolname = 'authenticated'" 2>/dev/null | grep -q 1 && break
  sleep 2
done
docker exec "$NAME" psql -U postgres -h localhost -tAc "select version()"

# ── Storage stub (ONLY for this dry run): in a real stack the Storage service creates these at boot. ──
docker exec -i "$NAME" psql -U supabase_admin -h localhost -d postgres -v ON_ERROR_STOP=1 -q <<'SQL'
do $$ begin
  if to_regclass('storage.objects') is null then
    create table storage.buckets (
      id text primary key, name text not null, owner uuid, owner_id text, public boolean default false,
      avif_autodetection boolean default false, file_size_limit bigint, allowed_mime_types text[],
      created_at timestamptz default now(), updated_at timestamptz default now());
    create table storage.objects (
      id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id), name text,
      owner uuid, owner_id text, created_at timestamptz default now(), updated_at timestamptz default now(),
      last_accessed_at timestamptz default now(), metadata jsonb, version text, user_metadata jsonb,
      path_tokens text[] generated always as (string_to_array(name, '/')) stored);
    create function storage.foldername(name text) returns text[] language plpgsql as
      $f$ declare _parts text[]; begin select string_to_array(name, '/') into _parts; return _parts[1:array_length(_parts,1)-1]; end $f$;
    alter table storage.buckets enable row level security;
    alter table storage.objects enable row level security;
    grant all on storage.buckets, storage.objects to postgres, anon, authenticated, service_role;
    grant usage on schema storage to postgres, anon, authenticated, service_role;
  end if;
end $$;
SQL

docker exec "$NAME" mkdir -p /tmp/mcci
docker cp "$(hostpath "$ROOT/supabase/migrations")" "$NAME:/tmp/mcci/migrations"
docker cp "$(hostpath "$ROOT/supabase/seed.sql")" "$NAME:/tmp/mcci/seed.sql"
docker cp "$(hostpath "$ROOT/supabase/tests")" "$NAME:/tmp/mcci/tests"

# row count of every table in the schemas the tests touch, and the last value of every public sequence
SNAPSHOT_SQL="create temp table _leak_before as
  select n.nspname || '.' || c.relname as t,
         (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I.%I', n.nspname, c.relname), false, true, '')))[1]::text::bigint as n
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where c.relkind = 'r' and n.nspname in ('public','private','auth','storage');
create temp table _seq_before as select schemaname || '.' || sequencename as s, coalesce(last_value, 0) as v from pg_sequences where schemaname = 'public';"

LEAK_SQL="select '# leak: ' || b.t || ' ' || b.n || ' -> ' || a.n
  from _leak_before b
  cross join lateral (select (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %s', b.t), false, true, '')))[1]::text::bigint as n) a
  where a.n <> b.n;
select '# note: sequence ' || q.s || ' advanced by ' || (coalesce(p.last_value, 0) - q.v) || ' (not transactional)'
  from _seq_before q join pg_sequences p on p.schemaname || '.' || p.sequencename = q.s
  where coalesce(p.last_value, 0) <> q.v;"

bundle() { # $1 = test file on the host, or empty for migrations only
  {
    echo '\set ON_ERROR_STOP 1'
    echo 'begin;'
    for f in "$ROOT"/supabase/migrations/*.sql; do echo "\\i /tmp/mcci/migrations/$(basename "$f")"; done
    echo '\i /tmp/mcci/seed.sql'
    if [ -n "$1" ]; then
      echo "$SNAPSHOT_SQL"
      # the file's own transaction becomes a savepoint inside the outer, always rolled-back transaction
      sed -e 's/^begin;$/savepoint test_file;/' -e 's/^rollback;$/rollback to savepoint test_file;/' "$1"
      echo "$LEAK_SQL"
    fi
    echo 'rollback;'
  } > "$WORK/bundle.sql"
  docker cp "$(hostpath "$WORK/bundle.sql")" "$NAME:/tmp/mcci/bundle.sql"
  docker exec "$NAME" psql -U postgres -h localhost -X -q -t -A -v ON_ERROR_STOP=1 -f /tmp/mcci/bundle.sql
}

# each test file must own its transaction: first statement 'begin;', last statement 'rollback;'
owns_transaction() {
  local first last
  first="$(grep -vE '^[[:space:]]*(--.*)?$' "$1" | head -1)"
  last="$(grep -vE '^[[:space:]]*(--.*)?$' "$1" | tail -1)"
  [ "$first" = "begin;" ] && [ "$last" = "rollback;" ]
}

echo "# migrations + seed (rolled back)"
bundle "" >/dev/null && echo "ok - all migrations and seed apply cleanly"

status=0
for t in "$ROOT"/supabase/tests/database/*.test.sql; do
  [ -e "$t" ] || continue
  echo "# $(basename "$t")"
  if ! owns_transaction "$t"; then echo "not ok - $(basename "$t") must start with 'begin;' and end with 'rollback;'"; status=1; continue; fi
  out="$(bundle "$t" 2>&1)" || { echo "$out"; status=1; continue; }
  echo "$out" | grep -E '^(ok|not ok|#|1[.][.])' || true
  echo "$out" | grep -qE '^not ok|^# Looks like you planned|^# leak:' && status=1
  echo "$out" | grep -q '^# leak:' || echo "ok - $(basename "$t") leaves no rows behind after its rollback"
done
exit $status
