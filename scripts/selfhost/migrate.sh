#!/usr/bin/env bash
# Applies pending supabase/migrations to the self-hosted stack WITHOUT restarting anything or publishing a database
# port: each file runs through `compose.sh psql-file` (psql inside the db container, as postgres) wrapped in ONE
# transaction together with its row in supabase_migrations.schema_migrations — so a failing migration leaves neither
# its objects nor its history row behind, and `supabase migration list` stays truthful.
#
#   MCCI_SELFHOST_RUNTIME=<dir> scripts/selfhost/migrate.sh --dry-run    list what is applied and what is pending
#   MCCI_SELFHOST_RUNTIME=<dir> scripts/selfhost/migrate.sh --apply      apply the pending ones, oldest first
#
# Take and verify a backup first (deploy/selfhost/README.md §7). Migrations are forward-only; never "undo" one by
# hand — restore the backup instead. Temporary wrapper files live in supabase/.migrate-tmp/ (git-ignored, removed).
set -euo pipefail
. "$(dirname "$0")/lib.sh"

mode=${1:-}
case "$mode" in --dry-run | --apply) ;; *) die "usage: migrate.sh --dry-run | --apply" ;; esac

compose="$SELFHOST_ROOT/scripts/selfhost/compose.sh"
tmp="$SELFHOST_ROOT/supabase/.migrate-tmp"
mkdir -p "$tmp"
trap 'rm -rf "$tmp"' EXIT

# what the database has recorded (empty when the history table does not exist yet)
cat >"$tmp/applied.sql" <<'SQL'
select version from supabase_migrations.schema_migrations
 where to_regclass('supabase_migrations.schema_migrations') is not null
 order by version;
SQL
applied=$("$compose" psql-file "$tmp/applied.sql" 2>/dev/null || true)
[ -n "$applied" ] || die "no migration history found on the stack (run supabase/ops/record-applied-migrations.sql first)"

pending=()
for f in "$SELFHOST_ROOT"/supabase/migrations/*.sql; do
  name=$(basename "$f" .sql)
  version=${name%%_*}
  [[ "$version" =~ ^[0-9]{14}$ ]] || die "unexpected migration file name: $name"
  if grep -qx "$version" <<<"$applied"; then
    echo "applied  $name"
  else
    pending+=("$f")
    echo "PENDING  $name"
  fi
done
# never apply a migration older than the newest applied one (history would no longer match the files)
newest=$(tail -n 1 <<<"$applied")
for f in ${pending[@]+"${pending[@]}"}; do
  v=$(basename "$f"); v=${v%%_*}
  [[ "$v" > "$newest" ]] || die "pending migration $v is older than the newest applied one ($newest): refusing"
done

if [ "$mode" = --dry-run ] || [ "${#pending[@]}" = 0 ]; then
  echo "${#pending[@]} pending"
  exit 0
fi

for f in "${pending[@]}"; do
  name=$(basename "$f" .sql)
  version=${name%%_*}
  short=${name#*_}
  grep -qiE '^[[:space:]]*(begin|commit|rollback)[[:space:]]*;' "$f" && die "$name has its own transaction control: refusing"
  {
    printf 'begin;\n'
    cat "$f"
    printf "\ninsert into supabase_migrations.schema_migrations (version, name) values ('%s', '%s');\n" "$version" "$short"
    printf 'commit;\n'
  } >"$tmp/$name.sql"
  echo "applying $name"
  "$compose" psql-file "$tmp/$name.sql" >/dev/null || die "$name failed and was rolled back; later migrations were not run"
done
echo "${#pending[@]} applied"
