#!/usr/bin/env bash
# Builds and switches one release of the MCCI app on the VPS (docs/20-deployment-plan.md §4). Run as root:
#
#   scripts/deploy/release.sh <commit>          build <commit> of db/schema-proposal, switch, health-check
#   scripts/deploy/release.sh --rollback        point `current` back at the previous release and restart
#   scripts/deploy/release.sh --status          which release runs, and the ones kept
#
# Layout: /opt/mcci-web/releases/<commit>/ (full checkout + node_modules + .next), /opt/mcci-web/current → one of them.
# The build runs as the unprivileged user mcci-web and sees only the two PUBLIC settings it needs
# (NEXT_PUBLIC_SUPABASE_URL / _PUBLISHABLE_KEY, read from /etc/mcci-web/env); secrets reach the app only at run time
# through systemd. The switch is one rename of a symlink; if /api/health does not answer within 60 s the previous
# release is restored automatically. Nothing here touches the database, nginx or the Supabase stack.
set -euo pipefail

ROOT=/opt/mcci-web
APP_HOME=/opt/mcci-web/home   # mcci-web's home: git/npm/pnpm caches survive between releases
REPO=https://github.com/aderalabsofficial-cmd/mcci.git
BRANCH=db/schema-proposal
ENV_FILE=/etc/mcci-web/env
RELEASE_ENV=/etc/mcci-web/release.env
TEMPLATES_DIR=/var/www/mcci-app-email-templates
SERVICE=mcci-web
HEALTH=http://127.0.0.1:3200/api/health
KEEP=3
PNPM=(npx --yes pnpm@11.15.1)

die() { echo "release: $*" >&2; exit 1; }
# every unprivileged step: user mcci-web, a clean environment, its own home
as_app() { runuser -u mcci-web -- env -i HOME="$APP_HOME" PATH=/usr/local/bin:/usr/bin:/bin NEXT_TELEMETRY_DISABLED=1 "$@"; }
log() { echo "release: $*"; }

[ "$(id -u)" = 0 ] || die "run as root"
id mcci-web >/dev/null 2>&1 || die "user mcci-web is missing (docs/20 §4 step 4)"
[ -d "$ROOT/releases" ] && [ -d "$APP_HOME" ] || die "$ROOT/releases or $APP_HOME is missing (docs/20 §4 step 4)"

current_release() { [ -L "$ROOT/current" ] && basename "$(readlink "$ROOT/current")" || true; }

switch_to() { # atomic: new symlink beside the old one, then rename over it
  ln -sfn "$ROOT/releases/$1" "$ROOT/current.new"
  mv -Tf "$ROOT/current.new" "$ROOT/current"
  printf 'MCCI_RELEASE=%s\n' "$1" >"$RELEASE_ENV"
  chmod 0644 "$RELEASE_ENV"
}

publish_templates() { # Auth fetches its email templates from /email-templates/ (nginx alias to this directory)
  install -d -m 0755 "$TEMPLATES_DIR"
  install -m 0644 "$ROOT/releases/$1/supabase/templates/"*.html "$TEMPLATES_DIR/"
  command -v restorecon >/dev/null && restorecon -R "$TEMPLATES_DIR" || true
}

healthy() {
  local want=$1 body
  for _ in $(seq 1 30); do
    body=$(curl -fsS --max-time 3 "$HEALTH" 2>/dev/null || true)
    case "$body" in *'"ok":true'*"\"release\":\"$want\""*) return 0 ;; esac
    sleep 2
  done
  return 1
}

case "${1:-}" in
  --status)
    echo "current: $(current_release)"
    ls -1t "$ROOT/releases"
    curl -fsS --max-time 3 "$HEALTH" || echo "(health endpoint not answering)"
    exit 0
    ;;
  --rollback)
    cur=$(current_release)
    prev=$(ls -1t "$ROOT/releases" | grep -vx "$cur" | head -n 1 || true)
    [ -n "$prev" ] || die "no previous release to roll back to"
    log "rolling back $cur → $prev"
    switch_to "$prev"
    publish_templates "$prev"
    systemctl restart "$SERVICE"
    healthy "$prev" && log "rolled back to $prev" || die "previous release $prev is not healthy either — check journalctl -u $SERVICE"
    exit 0
    ;;
  '' | -*) die "usage: release.sh <commit> | --rollback | --status" ;;
esac

want=$1
[[ "$want" =~ ^[0-9a-f]{7,40}$ ]] || die "commit must be a hex id"
[ -r "$ENV_FILE" ] || die "$ENV_FILE is missing (docs/20 §4 step 4)"
public_url=$(sed -n 's/^NEXT_PUBLIC_SUPABASE_URL=//p' "$ENV_FILE" | tail -n 1)
public_key=$(sed -n 's/^NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=//p' "$ENV_FILE" | tail -n 1)
[ -n "$public_url" ] && [ -n "$public_key" ] || die "NEXT_PUBLIC_SUPABASE_URL / _PUBLISHABLE_KEY are not set in $ENV_FILE"
case "$public_key" in sb_publishable_*) ;; *) die "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be the publishable key (sb_publishable_…)" ;; esac

work="$ROOT/releases/.build-$want-$$"
trap 'rm -rf "$work"' EXIT
log "fetching $BRANCH"
install -d -o mcci-web -g mcci-web -m 0755 "$work"
as_app git clone --quiet --branch "$BRANCH" "$REPO" "$work"
sha=$(as_app git -C "$work" rev-parse --verify --quiet "$want^{commit}") || die "commit $want is not on $BRANCH"
as_app git -C "$work" merge-base --is-ancestor "$sha" "origin/$BRANCH" || die "commit $want is not on $BRANCH"
as_app git -C "$work" checkout --quiet --detach "$sha"

short=${sha:0:7}
[ ! -e "$ROOT/releases/$short" ] || die "release $short already exists (use --rollback, or remove it first)"

log "installing dependencies and building $short (as mcci-web)"
# devDependencies are needed to build (TypeScript, Tailwind), so NODE_ENV is set only for the build itself
as_app bash -c 'cd "$1" && shift && "$@" install --frozen-lockfile >/dev/null' _ "$work" "${PNPM[@]}"
as_app env NODE_ENV=production NEXT_PUBLIC_SUPABASE_URL="$public_url" NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$public_key" \
  bash -c 'cd "$1" && shift && "$@" build' _ "$work" "${PNPM[@]}"
mv "$work" "$ROOT/releases/$short"
trap - EXIT

prev=$(current_release)
log "switching ${prev:-(none)} → $short"
switch_to "$short"
publish_templates "$short"
systemctl restart "$SERVICE"
if healthy "$short"; then
  log "release $short is live"
else
  log "release $short failed its health check"
  if [ -n "$prev" ]; then
    switch_to "$prev"
    publish_templates "$prev"
    systemctl restart "$SERVICE"
    healthy "$prev" && die "rolled back to $prev; see journalctl -u $SERVICE for why $short failed"
  fi
  die "no healthy release — see journalctl -u $SERVICE"
fi

# keep the newest $KEEP releases (never the current one)
ls -1t "$ROOT/releases" | grep -vx "$short" | tail -n +"$KEEP" | while read -r old; do
  log "removing old release $old"
  rm -rf "${ROOT:?}/releases/$old"
done
