#!/usr/bin/env bash
# Encrypted backup of the running self-hosted stack (docs/17 §10, deploy/selfhost/README.md §7), on the Docker host,
# as the user that owns the runtime directory. Writes a NEW set directory and never deletes or overwrites anything:
#   db-base.tar.gpg     online physical base backup (pg_backup_start / pg_backup_stop, non-exclusive) of the cluster
#   db-wal.tar.gpg      pg_wal after pg_backup_stop + backup_label: makes the base backup consistent on restore
#   state.json.gpg      roles, schemas, extensions, row counts and Vault fingerprints at backup time (restore drill)
#   postgres.dump.gpg   logical pg_dump -Fc of database postgres (portable, per-table restore)
#   storage.tar.gpg     data/storage (Storage file backend objects)
#   db-config.tar.gpg   named volume mcci-selfhost_db-config, including the secret pgsodium_root.key
#   runtime-env.tar.gpg the runtime .env (every secret the stack needs; without it a restore cannot start)
#   MANIFEST.sha256, PLAINTEXT.sha256, backup-info.txt   checksums and non-secret metadata
# Then runs backup-verify.sh on the set. On failure the set is renamed *.FAILED (kept, encrypted) and the script exits 1.
#
#   MCCI_SELFHOST_RUNTIME=<runtime dir> MCCI_BACKUP_DIR=<dir outside every repository and the runtime dir> \
#   MCCI_BACKUP_PASSPHRASE_FILE=<file, mode 600> scripts/selfhost/backup.sh
#
# Database access: psql / pg_dump inside the db container as supabase_admin over the local socket (the image trusts
# it), so no password is read or passed. The coprocess session keeps the backup open between start and stop; if the
# script dies, psql exits and Postgres aborts the backup by itself.
set -euo pipefail
umask 077
here=$(cd "$(dirname "$0")" && pwd -P)
. "$here/lib.sh"
. "$here/backup-lib.sh"

for c in docker gpg gpgconf tar sha256sum mkfifo base64 stat; do
  command -v "$c" >/dev/null 2>&1 || die "$c is required"
done
require_runtime
require_env_file
resolve_external_dir MCCI_BACKUP_DIR "the backup directory" new
backup_root=$RESOLVED_DIR
path_within "$backup_root" "$SELFHOST_RUNTIME" && die "the backup directory must be outside the runtime directory"
path_within "$SELFHOST_RUNTIME" "$backup_root" && die "the backup directory must not contain the runtime directory"
chmod 700 "$backup_root"
require_passphrase_file

datadir="$SELFHOST_RUNTIME/data/db/data"
[ -f "$datadir/PG_VERSION" ] || die "no Postgres cluster at $datadir"
[ -d "$SELFHOST_RUNTIME/data/storage" ] || die "no storage directory at $SELFHOST_RUNTIME/data/storage"
db=$("$here/compose.sh" ps -q db)
[ -n "$db" ] && [ "$(docker inspect -f '{{.State.Running}}' "$db")" = true ] || die "the db service is not running"
db_image=$(docker inspect -f '{{.Image}}' "$db")
config_mount=$(docker volume inspect -f '{{.Mountpoint}}' "$DB_CONFIG_VOLUME") || die "volume $DB_CONFIG_VOLUME not found"
[ -s "$config_mount/pgsodium_root.key" ] || die "$DB_CONFIG_VOLUME has no pgsodium_root.key"

stamp=$(date -u +%Y%m%dT%H%M%SZ)
set_dir="$backup_root/mcci-$stamp"
[ ! -e "$set_dir" ] || die "$set_dir already exists"
mkdir "$set_dir"
work="$set_dir/.work"
mkdir "$work"
gpg_home
done_ok=0
psql_pid=
cleanup() {
  [ -n "$psql_pid" ] && kill "$psql_pid" 2>/dev/null || true
  gpg_cleanup
  rm -rf "$work"
  if [ "$done_ok" != 1 ] && [ -d "$set_dir" ]; then
    mv "$set_dir" "$set_dir.FAILED"
    echo "backup: FAILED — the partial set was kept as $set_dir.FAILED (encrypted files only)" >&2
  fi
}
trap cleanup EXIT
trap 'exit 130' INT TERM HUP

# encrypt NAME — plaintext on stdin → $set_dir/NAME.gpg; the plaintext sha256 goes to $work/NAME.sha256
encrypt() {
  local name=$1 fifo="$work/$1.fifo" hp
  mkfifo "$fifo"
  sha256sum <"$fifo" | cut -d' ' -f1 >"$work/$name.sha256" &
  hp=$!
  tee "$fifo" | gpg_encrypt "$set_dir/$name.gpg"
  wait "$hp"
  rm -f "$fifo"
  [ -s "$work/$name.sha256" ] || die "no checksum for $name"
  echo "  wrote $name.gpg ($(stat -c %s "$set_dir/$name.gpg") bytes)"
}

# Warnings and errors only: pg_backup_stop's NOTICE about WAL archiving must not be read as the label line.
coproc PSQL {
  docker exec -i -e PGOPTIONS='-c client_min_messages=warning' "$db" \
    psql -X -q -A -t -U supabase_admin -d postgres -v ON_ERROR_STOP=1 2>&1
}
psql_pid=$PSQL_PID # bash unsets PSQL_PID when the coprocess ends
# sql STATEMENT LABEL — sends one statement; its single output line is left in ROW
sql() {
  printf '%s\n' "$1" >&"${PSQL[1]}"
  IFS= read -r -t 600 ROW <&"${PSQL[0]}" || die "no answer from psql ($2)"
  case "$ROW" in ERROR:* | FATAL:* | psql:*) die "psql failed ($2): $ROW" ;; esac
}

echo "backup set: $set_dir"
sql "select pg_backup_start('mcci-$stamp', true);" "pg_backup_start"
start_lsn=$ROW
echo "  backup started at $start_lsn"
tar_live --numeric-owner -cf - -C "$datadir" \
  --exclude='./pg_wal/*' --exclude=./postmaster.pid --exclude=./postmaster.opts --exclude=./backup_label \
  --exclude=./tablespace_map --exclude='./pg_replslot/*' --exclude='./pg_stat_tmp/*' --exclude='./pg_dynshmem/*' \
  --exclude='./pg_notify/*' --exclude='./pg_serial/*' --exclude='./pg_snapshots/*' --exclude='./pg_subtrans/*' \
  --exclude=pg_internal.init . | encrypt db-base.tar
sql "select translate(encode(convert_to(labelfile, 'UTF8'), 'base64'), E'\\n', '') || ' ' ||
  coalesce(nullif(translate(encode(convert_to(spcmapfile, 'UTF8'), 'base64'), E'\\n', ''), ''), '-') || ' ' || lsn
  from pg_backup_stop(false);" "pg_backup_stop"
read -r label_b64 map_b64 stop_lsn <<<"$ROW"
printf '%s' "$label_b64" | base64 -d >"$work/backup_label"
extra=(backup_label)
if [ "$map_b64" != - ]; then
  printf '%s' "$map_b64" | base64 -d >"$work/tablespace_map"
  extra+=(tablespace_map)
fi
echo "  backup stopped at $stop_lsn"
sql "$STATE_SQL" "state"
printf '%s\n' "$ROW" | encrypt state.json
printf '\\q\n' >&"${PSQL[1]}"
wait "$psql_pid" 2>/dev/null || true
psql_pid=
tar_live --numeric-owner -cf - -C "$datadir" pg_wal -C "$work" "${extra[@]}" | encrypt db-wal.tar

docker exec "$db" pg_dump -U supabase_admin -Fc -d postgres | encrypt postgres.dump
tar_live --numeric-owner -cf - -C "$SELFHOST_RUNTIME/data" storage | encrypt storage.tar
tar --numeric-owner -cf - -C "$config_mount" . | encrypt db-config.tar
tar --numeric-owner -cf - -C "$SELFHOST_RUNTIME" .env | encrypt runtime-env.tar

(cd "$set_dir" && sha256sum -- *.gpg) >"$set_dir/MANIFEST.sha256"
for f in $BACKUP_FILES; do printf '%s  %s\n' "$(cat "$work/$f.sha256")" "$f"; done >"$set_dir/PLAINTEXT.sha256"
{
  echo "created_utc=$stamp"
  echo "checkout_commit=$(git -C "$SELFHOST_ROOT" rev-parse HEAD 2>/dev/null || echo unknown)"
  echo "db_image=$db_image"
  echo "start_lsn=$start_lsn"
  echo "stop_lsn=$stop_lsn"
  echo "encryption=gpg symmetric AES256 (RFC 4880, MDC), s2k SHA512 x65011712, no compression"
} >"$set_dir/backup-info.txt"
chmod 600 "$set_dir"/*

"$here/backup-verify.sh" "$set_dir"
done_ok=1
echo "backup: OK $set_dir"
