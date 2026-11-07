#!/usr/bin/env bash
# Retention for the encrypted backup sets written by backup.sh (INF-002). Runs after a SUCCESSFUL nightly backup
# (deploy/selfhost/mcci-backup.service ExecStartPost), so a failing backup never thins out the good ones.
#
# Keeps: every set newer than MCCI_BACKUP_KEEP_DAYS (default 30); always the newest MCCI_BACKUP_KEEP_MIN sets (default 7,
# at least 3); every set holding a file named KEEP (release and restore-drill backups: `touch <set>/KEEP`).
# Deletes only directories named mcci-YYYYMMDDTHHMMSSZ directly under MCCI_BACKUP_DIR; nothing else is touched.
#   --dry-run   list what would be deleted, delete nothing
set -euo pipefail

dry=0
[ "${1:-}" = "--dry-run" ] && dry=1
dir=${MCCI_BACKUP_DIR:?MCCI_BACKUP_DIR is not set}
days=${MCCI_BACKUP_KEEP_DAYS:-30}
min=${MCCI_BACKUP_KEEP_MIN:-7}
[[ $days =~ ^[0-9]+$ && $min =~ ^[0-9]+$ ]] || { echo "prune: retention values must be whole numbers" >&2; exit 2; }
(( days >= 7 && min >= 3 )) || { echo "prune: refusing a retention under 7 days or 3 sets" >&2; exit 2; }
[ -d "$dir" ] || { echo "prune: no backup directory $dir" >&2; exit 2; }

cutoff=$(date -u -d "-$days days" +%Y%m%dT%H%M%SZ)
mapfile -t sets < <(find "$dir" -mindepth 1 -maxdepth 1 -type d -regextype posix-extended \
  -regex '.*/mcci-[0-9]{8}T[0-9]{6}Z' -printf '%f\n' | sort -r)

removed=0
for i in "${!sets[@]}"; do
  s=${sets[$i]}
  stamp=${s#mcci-}
  (( i < min )) && continue                 # the newest sets, whatever their age
  [[ "$stamp" > "$cutoff" ]] && continue    # fixed-width UTC stamps compare as text
  [ -e "$dir/$s/KEEP" ] && continue         # kept on purpose
  if (( dry )); then echo "prune: would delete $s"; else rm -rf -- "${dir:?}/$s"; echo "prune: deleted $s"; fi
  removed=$((removed + 1))
done
echo "prune: ${#sets[@]} sets, $removed $( ((dry)) && echo 'to delete' || echo deleted ), keep ${days} days / newest ${min}"
