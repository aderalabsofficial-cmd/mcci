#!/usr/bin/env bash
# Creates the external runtime directory for the MCCI self-hosted stack and fills its .env with fresh secrets using
# upstream's own generators, WITHOUT printing them (both upstream scripts echo every secret, so their output is
# discarded). Refuses to touch an existing .env. Prints variable names and OK/MISSING only. On any failure or
# interruption the partial .env and the generators' .env.old backups are deleted.
#   MCCI_SELFHOST_RUNTIME=<dir outside every repository> scripts/selfhost/init-runtime.sh
# Needs: openssl and node >= 16 (checked first: otherwise upstream's script would start a Docker container instead).
set -euo pipefail
umask 077
. "$(dirname "$0")/lib.sh"

command -v openssl >/dev/null 2>&1 || die "openssl is required"
node_major=$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null) || die "node >= 16 is required"
[ "$node_major" -ge 16 ] 2>/dev/null || die "node >= 16 is required (found major version $node_major)"

require_runtime new
env_file="$SELFHOST_RUNTIME/.env"
[ -e "$env_file" ] && die "$env_file already exists; refusing to overwrite secrets"

completed=0
cleanup() {
  rm -f "$SELFHOST_RUNTIME/.env.old" "$SELFHOST_RUNTIME/docker-compose.yml.old"
  if [ "$completed" != 1 ]; then
    rm -f "$env_file"
    echo "selfhost: initialisation did not complete; the partial .env was deleted (run again)" >&2
  fi
}
trap cleanup EXIT
trap 'exit 130' INT TERM HUP

cp "$SELFHOST_MCCI/env.mcci.example" "$env_file"
chmod 600 "$env_file"
cd "$SELFHOST_RUNTIME"

sh "$SELFHOST_UPSTREAM/utils/generate-keys.sh" --update-env >/dev/null 2>&1 ||
  die "utils/generate-keys.sh failed (its output is suppressed because it contains secrets)"
# add-new-auth-keys.sh writes the publishable/secret keys, then tries to uncomment four lines in a docker-compose.yml
# in the current directory. There is none here on purpose: docker-compose.mcci.yml sets GOTRUE_JWT_KEYS,
# API_JWT_JWKS and JWT_JWKS instead, so upstream files stay unedited. Its non-zero exit at that last step is expected;
# the checks below decide success.
sh "$SELFHOST_UPSTREAM/utils/add-new-auth-keys.sh" --update-env >/dev/null 2>&1 || true

status=0
for name in POSTGRES_PASSWORD JWT_SECRET ANON_KEY SERVICE_ROLE_KEY DASHBOARD_PASSWORD SECRET_KEY_BASE \
  REALTIME_DB_ENC_KEY VAULT_ENC_KEY PG_META_CRYPTO_KEY SUPABASE_PUBLISHABLE_KEY SUPABASE_SECRET_KEY \
  ANON_KEY_ASYMMETRIC SERVICE_ROLE_KEY_ASYMMETRIC JWT_KEYS JWT_JWKS; do
  if [ -n "$(env_get "$name" || true)" ]; then echo "OK       $name"; else echo "MISSING  $name"; status=1; fi
done
case "$(env_get SUPABASE_PUBLISHABLE_KEY || true)" in sb_publishable_*) ;; *) echo "BAD FORMAT  SUPABASE_PUBLISHABLE_KEY"; status=1 ;; esac
case "$(env_get SUPABASE_SECRET_KEY || true)" in sb_secret_*) ;; *) echo "BAD FORMAT  SUPABASE_SECRET_KEY"; status=1 ;; esac
[ "$status" = 0 ] || die "the generated .env is incomplete"

mkdir -p data/db/data data/db/config data/storage data/snippets
completed=1
echo "runtime ready: $SELFHOST_RUNTIME (.env mode 600; on Windows restrict the folder's ACL to your account)"
