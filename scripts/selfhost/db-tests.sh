#!/usr/bin/env bash
# Runs every pgTAP file in supabase/tests/database through psql INSIDE the db container (compose.sh psql-file), so no
# credential appears on any command line and no helper container has to reach the host's loopback. Summarises the TAP
# output like `supabase test db`. Isolated test stack only: apply the migrations and supabase/seed.sql first.
#   MCCI_SELFHOST_RUNTIME=<dir> scripts/selfhost/db-tests.sh
set -euo pipefail
cd "$(dirname "$0")/../.."

files=0
tests=0
failed=0
for f in supabase/tests/database/*.test.sql; do
  files=$((files + 1))
  if ! out=$(scripts/selfhost/compose.sh psql-file "$f" 2>&1); then
    echo "ERROR    $f (psql failed)"
    failed=$((failed + 1))
    continue
  fi
  plan=$(printf '%s\n' "$out" | sed -n 's/^1\.\.\([0-9][0-9]*\)$/\1/p' | head -n 1)
  ok=$(printf '%s\n' "$out" | grep -cE '^ok [0-9]+' || true)
  not_ok=$(printf '%s\n' "$out" | grep -cE '^not ok [0-9]+' || true)
  tests=$((tests + ok + not_ok))
  if [ -z "$plan" ] || [ "$not_ok" != 0 ] || [ "$((ok + not_ok))" != "$plan" ]; then
    echo "FAIL     $f (plan ${plan:-none}, ok $ok, not ok $not_ok)"
    printf '%s\n' "$out" | grep -E '^not ok|^# ' | head -n 20
    failed=$((failed + 1))
  else
    echo "ok       $f ($ok)"
  fi
done
echo "Files=$files, Tests=$tests"
[ "$failed" = 0 ] && echo "Result: PASS" || { echo "Result: FAIL ($failed file(s))"; exit 1; }
