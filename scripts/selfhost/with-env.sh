#!/usr/bin/env bash
# Runs a command with the values tests need, read from the runtime .env and exported without printing them:
#   MCCI_IT_LOCAL=1, MCCI_IT_SUPABASE_URL (loopback gateway), MCCI_IT_PUBLISHABLE_KEY, MCCI_IT_SECRET_KEY,
#   MCCI_IT_DASHBOARD_USER, MCCI_IT_DASHBOARD_PASSWORD,
#   PGPASSWORD + MCCI_SELFHOST_DB_URL (password-free URL for the opt-in loopback overlay, see compose.sh).
# The database password is only ever in PGPASSWORD, never in a URL or on a command line.
# Usage: MCCI_SELFHOST_RUNTIME=<dir> scripts/selfhost/with-env.sh <command…>
# Reference variables inside the command as "$MCCI_…" (single-quoted sh -c), never paste their values.
set -euo pipefail
. "$(dirname "$0")/lib.sh"

require_runtime
require_env_file
[ "$#" -gt 0 ] || die "usage: with-env.sh <command…>"

need() {
  local v
  v=$(env_get "$1") || die "$1 is missing from the runtime .env"
  [ -n "$v" ] || die "$1 is empty in the runtime .env"
  printf '%s' "$v"
}

port=$(need API_GW_HTTP_PORT)
case "$port" in '' | *[!0-9]*) die "API_GW_HTTP_PORT in the runtime .env is not a port number" ;; esac
db_port=${MCCI_DB_LOOPBACK_PORT:-15432}
case "$db_port" in '' | *[!0-9]*) die "MCCI_DB_LOOPBACK_PORT is not a port number" ;; esac

export MCCI_IT_LOCAL=1
export MCCI_IT_SUPABASE_URL="http://127.0.0.1:$port"
MCCI_IT_PUBLISHABLE_KEY=$(need SUPABASE_PUBLISHABLE_KEY)
MCCI_IT_SECRET_KEY=$(need SUPABASE_SECRET_KEY)
MCCI_IT_DASHBOARD_USER=$(need DASHBOARD_USERNAME)
MCCI_IT_DASHBOARD_PASSWORD=$(need DASHBOARD_PASSWORD)
PGPASSWORD=$(need POSTGRES_PASSWORD)
MCCI_SELFHOST_DB_URL="postgresql://postgres@127.0.0.1:$db_port/postgres"
export MCCI_IT_PUBLISHABLE_KEY MCCI_IT_SECRET_KEY MCCI_IT_DASHBOARD_USER MCCI_IT_DASHBOARD_PASSWORD PGPASSWORD MCCI_SELFHOST_DB_URL

exec "$@"
