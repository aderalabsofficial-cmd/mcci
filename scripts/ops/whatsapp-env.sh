#!/usr/bin/env bash
# Copies the five IQPIGEON_* values from the git-ignored .env.iqpigeon.local to the live server's /etc/mcci-web/env, then
# restarts mcci-web only. Prints names, never values. The owner runs it, so the values never pass through chat or the repo.
#   bash scripts/ops/whatsapp-env.sh           check the file, change the server
#   bash scripts/ops/whatsapp-env.sh --check   check the file only
set -euo pipefail

FILE="${MCCI_WA_ENV_FILE:-$(dirname "$0")/../../.env.iqpigeon.local}"
SSH="${MCCI_SSH:-/c/Windows/System32/OpenSSH/ssh.exe -o BatchMode=yes mcci-vps}"
KEYS="IQPIGEON_API_URL IQPIGEON_API_KEY IQPIGEON_CONNECTION_ID IQPIGEON_PHONE_NUMBER_ID IQPIGEON_WEBHOOK_SECRET"

[ -r "$FILE" ] || { echo "Cannot read $FILE"; exit 1; }

lines=""
bad=0
for k in $KEYS; do
  v=$(sed -n "s/^$k=//p" "$FILE" | tail -n 1 | tr -d '\r')
  if [ -z "$v" ]; then echo "Empty: $k"; bad=1; continue; fi
  case "$v" in
    *[[:space:]\"\'\#\$\`\\]*) echo "Remove spaces, quotes or special characters from: $k"; bad=1; continue ;;
  esac
  if [ "$k" = IQPIGEON_API_URL ]; then
    case "$v" in https://*) ;; *) echo "Must start with https://: $k"; bad=1; continue ;; esac
  fi
  echo "OK: $k"
  lines+="$k=$v"$'\n'
done
[ "$bad" = 0 ] || { echo "Nothing was changed on the server."; exit 1; }
[ "${1:-}" != "--check" ] || { echo "The file is ready. Nothing was changed on the server."; exit 0; }

# values travel over stdin, so they appear in no command line; the file keeps its owner and permissions
printf '%s' "$lines" | $SSH 'bash -c '\''
  set -euo pipefail
  f=${MCCI_REMOTE_ENV:-/etc/mcci-web/env}
  t=$(mktemp "$f.XXXXXX")
  trap "rm -f \"$t\"" EXIT
  { grep -v "^IQPIGEON_" "$f" || true; cat; } > "$t"
  chown --reference="$f" "$t"
  chmod --reference="$f" "$t"
  cp -p "$f" "$f.before-whatsapp"
  mv "$t" "$f"
  trap - EXIT
  echo "server file updated: $(grep -c "^IQPIGEON_" "$f") of 5 values"
  systemctl restart mcci-web
  for i in $(seq 1 30); do
    if curl -sf -m 3 http://127.0.0.1:3200/api/health >/dev/null; then echo "app restarted and healthy"; exit 0; fi
    sleep 2
  done
  echo "app did not answer after the restart. To undo: mv $f.before-whatsapp $f and restart mcci-web"
  exit 1
'\'''
echo "Done. Now open WhatsApp, Settings on the live site and click Test connection. Sending stays off."
