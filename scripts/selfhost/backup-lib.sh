# Shared helpers for backup.sh, backup-verify.sh and restore-drill.sh (sourced after lib.sh). Encryption is GnuPG
# symmetric AES-256 (MDC-protected, so a modified file fails to decrypt) with the passphrase read from a file that
# only its owner can read. Nothing here prints the passphrase, a key or a decrypted byte.

DB_CONFIG_VOLUME=mcci-selfhost_db-config
BACKUP_FILES="db-base.tar db-wal.tar state.json postgres.dump storage.tar db-config.tar runtime-env.tar"

# require_passphrase_file — MCCI_BACKUP_PASSPHRASE_FILE: a regular file, owned by the caller, mode 600 or 400, at least
# 32 bytes, outside this repository. Sets BACKUP_PASSPHRASE_FILE. Never reads it into a variable.
require_passphrase_file() {
  local f=${MCCI_BACKUP_PASSPHRASE_FILE:-} mode owner size
  [ -n "$f" ] || die "set MCCI_BACKUP_PASSPHRASE_FILE to the backup passphrase file (mode 600, outside every repository)"
  case "$f" in /*) ;; *) die "MCCI_BACKUP_PASSPHRASE_FILE must be an absolute path" ;; esac
  [ -f "$f" ] && [ ! -L "$f" ] || die "MCCI_BACKUP_PASSPHRASE_FILE is not a regular file: $f"
  path_within "$f" "$SELFHOST_ROOT" && die "the passphrase file must be outside this repository"
  mode=$(stat -c %a "$f") owner=$(stat -c %u "$f") size=$(stat -c %s "$f")
  case "$mode" in 600 | 400) ;; *) die "the passphrase file must have mode 600 or 400 (has $mode)" ;; esac
  [ "$owner" = "$(id -u)" ] || die "the passphrase file must be owned by the user running the backup"
  [ "$size" -ge 32 ] || die "the passphrase file is shorter than 32 bytes"
  BACKUP_PASSPHRASE_FILE=$f
}

# gpg_home — private, throw-away GnuPG home (no keyring of the caller is touched); gpg_cleanup stops its agent.
gpg_home() {
  GNUPG_TMP=$(mktemp -d)
  chmod 700 "$GNUPG_TMP"
}
gpg_cleanup() {
  [ -n "${GNUPG_TMP:-}" ] && [ -d "$GNUPG_TMP" ] || return 0
  gpgconf --homedir "$GNUPG_TMP" --kill all >/dev/null 2>&1 || true
  rm -rf "$GNUPG_TMP"
}

# --rfc4880: classic MDC-protected packets (SEIPD v1) instead of GnuPG 2.3's OCB/AEAD default, so any OpenPGP tool
# (GnuPG 2.2+, Sequoia, …) can decrypt the set off-host; integrity is still checked on decryption.
gpg_encrypt() { # stdin → $1
  gpg --homedir "$GNUPG_TMP" --batch --yes --quiet --no-tty --pinentry-mode loopback --rfc4880 \
    --passphrase-file "$BACKUP_PASSPHRASE_FILE" --symmetric --cipher-algo AES256 --s2k-mode 3 \
    --s2k-digest-algo SHA512 --s2k-count 65011712 --compress-algo none --output "$1"
}
gpg_decrypt() { # $1 → stdout
  gpg --homedir "$GNUPG_TMP" --batch --quiet --no-tty --pinentry-mode loopback \
    --passphrase-file "$BACKUP_PASSPHRASE_FILE" --decrypt "$1"
}

# GNU tar exits 1 when a file changed while it was read; for a live data directory that is expected (the WAL makes
# the copy consistent on restore). 2 and above are real failures.
tar_live() {
  local rc=0
  tar "$@" || rc=$?
  [ "$rc" -le 1 ] || return "$rc"
}

# One JSON line describing the database: roles, databases, schemas, extensions, policy/function counts, exact row
# counts of the application, Auth and Storage tables, and a sha256 per Vault secret (proves the pgsodium key decrypts
# them; kept only inside the encrypted state.json).
STATE_SQL="select json_build_object(
 'server_version', current_setting('server_version'),
 'roles', (select json_agg(rolname order by rolname) from pg_roles),
 'databases', (select json_agg(datname order by datname) from pg_database where not datistemplate),
 'schemas', (select json_agg(nspname order by nspname) from pg_namespace where nspname !~ '^pg_(temp|toast)'),
 'extensions', (select json_agg(extname || ' ' || extversion order by extname) from pg_extension),
 'policies', (select count(*) from pg_policies),
 'functions', (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
               where n.nspname in ('public', 'private', 'api')),
 'counts', (select json_object_agg(n.nspname || '.' || c.relname,
              (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I.%I', n.nspname, c.relname),
                false, true, '')))[1]::text::bigint order by n.nspname || '.' || c.relname)
            from pg_class c join pg_namespace n on n.oid = c.relnamespace
            where c.relkind in ('r', 'p') and n.nspname in
              ('public', 'private', 'api', 'auth', 'storage', 'vault', 'realtime', 'supabase_migrations')),
 'vault', (select coalesce(json_object_agg(name, encode(extensions.digest(convert_to(coalesce(decrypted_secret, ''),
              'UTF8'), 'sha256'), 'hex') order by name), '{}'::json) from vault.decrypted_secrets)
)::text;"
