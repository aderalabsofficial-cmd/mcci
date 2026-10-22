#!/usr/bin/env bash
# Review-time verification of the proposed migrations WITHOUT applying them anywhere real.
#
#   scripts/db/dry-run.sh [image]          default image: supabase/postgres:17.6.1.136 (self-hosted stack)
#   scripts/db/dry-run.sh supabase/postgres:17.11.0.004   (Supabase CLI 2.121 local image)
#
# What it does:
#   1. starts a throwaway container of the exact image (no published ports) and removes it on exit
#   2. creates a minimal stub of the tables the Storage service normally creates at boot (marked below)
#   3. for every supabase/tests/database/*.test.sql: BEGIN → all migrations → seed.sql → pgtap → test → ROLLBACK
#   4. prints TAP output and exits non-zero if any migration fails or any test is "not ok"
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

bundle() { # $1 = test file inside the container, or empty for migrations only
  {
    echo '\set ON_ERROR_STOP 1'
    echo 'begin;'
    for f in "$ROOT"/supabase/migrations/*.sql; do echo "\\i /tmp/mcci/migrations/$(basename "$f")"; done
    echo '\i /tmp/mcci/seed.sql'
    if [ -n "$1" ]; then
      echo 'create extension if not exists pgtap with schema extensions;'
      echo 'set search_path = public, extensions, tests;'
      echo "\\i $1"
    fi
    echo 'rollback;'
  } > "$WORK/bundle.sql"
  docker cp "$(hostpath "$WORK/bundle.sql")" "$NAME:/tmp/mcci/bundle.sql"
  docker exec "$NAME" psql -U postgres -h localhost -X -q -t -A -v ON_ERROR_STOP=1 -f /tmp/mcci/bundle.sql
}

echo "# migrations + seed (rolled back)"
bundle "" >/dev/null && echo "ok - all migrations and seed apply cleanly"

status=0
for t in "$ROOT"/supabase/tests/database/*.test.sql; do
  [ -e "$t" ] || continue
  echo "# $(basename "$t")"
  out="$(bundle "/tmp/mcci/tests/database/$(basename "$t")" 2>&1)" || { echo "$out"; status=1; continue; }
  echo "$out" | grep -E '^(ok|not ok|#|1\.\.)' || true
  echo "$out" | grep -q '^not ok' && status=1
done
exit $status
