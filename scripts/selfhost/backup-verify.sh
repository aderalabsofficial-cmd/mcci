#!/usr/bin/env bash
# Verifies a backup set written by backup.sh without restoring it: ciphertext checksums (MANIFEST.sha256), then every
# file is decrypted in a stream (GnuPG's integrity check must pass), its plaintext sha256 must match PLAINTEXT.sha256
# and its structure must read back (tar listing, JSON object, pg_restore --list with the backed-up image). Nothing
# decrypted is written to disk or printed.
#   MCCI_BACKUP_PASSPHRASE_FILE=<file> scripts/selfhost/backup-verify.sh <set dir>
set -euo pipefail
umask 077
here=$(cd "$(dirname "$0")" && pwd -P)
. "$here/lib.sh"
. "$here/backup-lib.sh"

[ "$#" = 1 ] || die "usage: backup-verify.sh <backup set directory>"
set_dir=$(cd -P "$1" && pwd -P) || die "no such directory: $1"
for f in MANIFEST.sha256 PLAINTEXT.sha256 backup-info.txt; do [ -f "$set_dir/$f" ] || die "missing $f in $set_dir"; done
require_passphrase_file
image=$(sed -n 's/^db_image=//p' "$set_dir/backup-info.txt")
[ -n "$image" ] && docker image inspect "$image" >/dev/null 2>&1 || die "the backed-up db image $image is not present"

(cd "$set_dir" && sha256sum --quiet -c MANIFEST.sha256) || die "ciphertext checksum mismatch in $set_dir"
echo "  ciphertext checksums: OK ($(wc -l <"$set_dir/MANIFEST.sha256") files)"

# Each check reads its whole input (the rest is drained), so the stream is never cut short and the checksum covers
# every byte.
check_tar() { tar -tf - >/dev/null && cat >/dev/null; }
check_json() { grep -c '^{' >/dev/null; }
check_dump() {
  docker run --rm -i --network none --entrypoint sh "$image" -c 'pg_restore --list >/dev/null && cat >/dev/null'
}

gpg_home
trap gpg_cleanup EXIT
failed=0
for name in $BACKUP_FILES; do
  expected=$(awk -v n="$name" '$2 == n { print $1 }' "$set_dir/PLAINTEXT.sha256")
  [ -n "$expected" ] || die "no plaintext checksum for $name"
  case "$name" in
    *.tar) check=check_tar ;;
    *.dump) check=check_dump ;;
    *.json) check=check_json ;;
  esac
  fifo=$(mktemp -u)
  mkfifo -m 600 "$fifo"
  sha256sum <"$fifo" | cut -d' ' -f1 >"$fifo.sum" &
  hp=$!
  rc=0
  gpg_decrypt "$set_dir/$name.gpg" | tee "$fifo" | "$check" || rc=$?
  wait "$hp" || true
  actual=$(cat "$fifo.sum")
  rm -f "$fifo" "$fifo.sum"
  if [ "$rc" = 0 ] && [ "$actual" = "$expected" ]; then
    echo "  $name: decrypts, checksum OK, readable"
  else
    echo "  $name: FAILED (exit $rc, checksum $([ "$actual" = "$expected" ] && echo OK || echo MISMATCH))"
    failed=1
  fi
done
[ "$failed" = 0 ] || die "backup set $set_dir did not verify"
echo "verify: OK $set_dir"
