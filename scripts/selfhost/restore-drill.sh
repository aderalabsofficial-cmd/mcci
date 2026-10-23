#!/usr/bin/env bash
# Restore drill for a backup set from backup.sh (docs/17 §10: "restore tested"). Restores into a NEW drill directory
# and NEW Docker volumes and containers with no network, never touching the running stack, its data directory, its
# volumes or the backup set. Steps:
#   1. backup-verify.sh on the set
#   2. base backup + WAL + backup_label → <drill>/data; db-config (pgsodium_root.key) → a new volume
#   3. start the backed-up db image on them (--network none, no ports); Postgres must replay to a consistent state
#   4. compare roles, databases, schemas, extensions, policy and function counts, row counts and Vault secret
#      fingerprints with state.json taken at backup time
#   5. negative control (when the backup holds Vault secrets): the same data with a FRESH config volume (new
#      pgsodium key) must NOT decrypt them — proves the volume backup is what makes encrypted data recoverable
#   6. remove the drill containers, volumes and the decrypted drill directory (MCCI_DRILL_KEEP=1 keeps them)
#
#   MCCI_BACKUP_PASSPHRASE_FILE=<file> MCCI_DRILL_DIR=<new dir outside every repository> \
#   scripts/selfhost/restore-drill.sh <backup set directory>
# Prints PASS/FAIL lines and counts only; never a secret or a row.
set -euo pipefail
umask 077
here=$(cd "$(dirname "$0")" && pwd -P)
. "$here/lib.sh"
. "$here/backup-lib.sh"

for c in docker gpg gpgconf tar jq; do command -v "$c" >/dev/null 2>&1 || die "$c is required"; done
[ "$#" = 1 ] || die "usage: restore-drill.sh <backup set directory>"
set_dir=$(cd -P "$1" && pwd -P) || die "no such directory: $1"
require_passphrase_file
[ -n "${MCCI_DRILL_DIR:-}" ] && [ ! -e "$MCCI_DRILL_DIR" ] || die "set MCCI_DRILL_DIR to a directory that does not exist yet"
resolve_external_dir MCCI_DRILL_DIR "the drill directory" new
drill=$RESOLVED_DIR
path_within "$drill" "$set_dir" && die "the drill directory must be outside the backup set"
image=$(sed -n 's/^db_image=//p' "$set_dir/backup-info.txt")

id="mcci-restore-drill-$(date -u +%Y%m%dT%H%M%SZ)"
vol="$id-db-config"
vol_fresh="$id-fresh-db-config"
ctr="$id"
ctr_fresh="$id-fresh"
# never adopt (and later remove) something that already exists under these names
for v in "$vol" "$vol_fresh"; do ! docker volume inspect "$v" >/dev/null 2>&1 || die "volume $v already exists"; done
for c in "$ctr" "$ctr_fresh"; do ! docker container inspect "$c" >/dev/null 2>&1 || die "container $c already exists"; done
cleanup() {
  gpg_cleanup
  if [ "${MCCI_DRILL_KEEP:-0}" = 1 ]; then
    echo "drill: kept $drill, containers $ctr / $ctr_fresh, volumes $vol / $vol_fresh (remove them yourself)"
    return
  fi
  docker rm -f "$ctr" "$ctr_fresh" >/dev/null 2>&1 || true
  docker volume rm "$vol" "$vol_fresh" >/dev/null 2>&1 || true
  case "$drill" in */*) rm -rf "$drill" ;; esac
}
trap cleanup EXIT
trap 'exit 130' INT TERM HUP

"$here/backup-verify.sh" "$set_dir"
gpg_home
chmod 700 "$drill"
mkdir -m 700 "$drill/data"
gpg_decrypt "$set_dir/db-base.tar.gpg" | tar --numeric-owner -xf - -C "$drill/data"
gpg_decrypt "$set_dir/db-wal.tar.gpg" | tar --numeric-owner -xf - -C "$drill/data"
[ -f "$drill/data/backup_label" ] || die "the WAL archive holds no backup_label"
gpg_decrypt "$set_dir/state.json.gpg" >"$drill/state.json"
cp -a "$drill/data" "$drill/data-fresh"

docker volume create --label mcci.restore-drill="$id" "$vol" >/dev/null
gpg_decrypt "$set_dir/db-config.tar.gpg" |
  docker run --rm -i --network none -v "$vol":/dst --entrypoint tar "$image" --numeric-owner -xf - -C /dst
echo "  restored data directory and config volume $vol"

start() { # NAME DATA VOLUME
  docker run -d --name "$1" --label mcci.restore-drill="$id" --network none \
    -v "$2":/var/lib/postgresql/data -v "$3":/etc/postgresql-custom \
    "$image" postgres -c config_file=/etc/postgresql/postgresql.conf >/dev/null
  local i
  for i in $(seq 1 90); do
    if docker exec "$1" pg_isready -U postgres -h localhost -q 2>/dev/null; then return 0; fi
    [ "$(docker inspect -f '{{.State.Running}}' "$1")" = true ] || break
    sleep 2
  done
  return 1
}
state() { docker exec -i "$1" psql -X -q -A -t -U supabase_admin -d postgres -v ON_ERROR_STOP=1 <<<"$STATE_SQL"; }

result=0
pass() { echo "PASS  $*"; }
fail() {
  echo "FAIL  $*"
  result=1
}

if start "$ctr" "$drill/data" "$vol"; then pass "restored cluster started and accepts connections"; else
  fail "restored cluster did not start"
  docker logs "$ctr" 2>&1 | grep -E 'FATAL|PANIC|could not|invalid' | head -n 5 || true
  exit 1
fi
if docker logs "$ctr" 2>&1 | grep -q 'consistent recovery state reached\|redo done'; then
  pass "WAL replay from the backup reached a consistent state"
else fail "no consistent-recovery message in the restored cluster's log"; fi
[ -z "$(docker port "$ctr")" ] && pass "drill container publishes no ports (network none)" || fail "drill container has ports"

state "$ctr" >"$drill/restored.json"
for key in server_version roles databases schemas extensions policies functions; do
  if [ "$(jq -c ".$key" "$drill/state.json")" = "$(jq -c ".$key" "$drill/restored.json")" ]; then
    pass "$key identical ($(jq -c ".$key | if type == \"array\" then length else . end" "$drill/state.json"))"
  else fail "$key differs from the backup"; fi
done
diffs=$(jq -r --slurpfile r "$drill/restored.json" \
  '.counts as $a | $r[0].counts as $b | ($a + $b | keys[]) as $k | select($a[$k] != $b[$k]) | "\($k): \($a[$k]) -> \($b[$k])"' \
  "$drill/state.json")
tables=$(jq '.counts | length' "$drill/state.json")
rows=$(jq '[.counts[]] | add' "$drill/state.json")
if [ -z "$diffs" ]; then pass "row counts identical in all $tables tables ($rows rows)"; else
  fail "row counts differ:"
  printf '        %s\n' "$diffs"
fi
secrets=$(jq '.vault | length' "$drill/state.json")
if [ "$secrets" = 0 ]; then
  echo "NOTE  the backup holds no Vault secrets: encrypted-data recovery was NOT exercised"
elif [ "$(jq -c .vault "$drill/state.json")" = "$(jq -c .vault "$drill/restored.json")" ]; then
  pass "all $secrets Vault secret(s) decrypt to the backed-up values with the restored pgsodium key"
else fail "Vault secrets do not decrypt to the backed-up values"; fi
docker rm -f "$ctr" >/dev/null

if [ "$secrets" != 0 ]; then
  docker volume create --label mcci.restore-drill="$id" "$vol_fresh" >/dev/null
  if start "$ctr_fresh" "$drill/data-fresh" "$vol_fresh"; then
    fresh=$(state "$ctr_fresh" 2>/dev/null | jq -c .vault 2>/dev/null || echo error)
    if [ "$fresh" != "$(jq -c .vault "$drill/state.json")" ]; then
      pass "negative control: with a fresh pgsodium key the Vault secrets do NOT decrypt (the volume backup is required)"
    else fail "negative control: secrets decrypted without the backed-up key"; fi
  else
    pass "negative control: the cluster cannot even start without the backed-up config volume"
  fi
fi

[ "$result" = 0 ] && echo "drill: PASS $set_dir" || echo "drill: FAIL $set_dir"
exit "$result"
