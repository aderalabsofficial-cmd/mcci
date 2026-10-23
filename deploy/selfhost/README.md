# MCCI self-hosted Supabase — runbook

Configuration for the self-hosted Supabase stack that MCCI will run (docs/01, docs/17). **Nothing here has been
started yet.** The isolated test run and staging need a host decision first (docs/17 §11 / §12).

```
deploy/selfhost/
  UPSTREAM.md / UPSTREAM.json        pinned upstream release, file hashes and modes, image digests, licence
  upstream/                          verbatim upstream docker/ (self-hosted/v0.8.3) — never edit, never run its scripts
  mcci/docker-compose.mcci.yml       every MCCI difference: digest pins, port bindings, security settings
  mcci/docker-compose.mcci.db-loopback.yml   opt-in: Postgres on 127.0.0.1 for migrations/tests only
  mcci/env.mcci.example              variable names + non-secret defaults (no credentials)
scripts/selfhost/
  sync-upstream.mjs   verify upstream/ against the pin (--offline needs no network); never overwrites
  init-runtime.sh     create the external runtime dir and generate secrets silently
  compose.sh          the only way to run Compose here: allowlisted subcommands and flags (see its header)
  with-env.sh         run a command with test variables exported from the runtime .env (not printed)
  db-tests.sh         pgTAP suite through psql inside the db container (no credentials on any command line)
  gateway-checks.sh   G1–G8 against the local isolated stack (tests/integration/gateway.test.ts)
```

## Rules

- Secrets and data live in the **runtime directory** `MCCI_SELFHOST_RUNTIME`: `.env` (mode 600), `data/db/data`,
  `data/storage`, `data/snippets` — plus one Docker named volume, `mcci-selfhost_db-config` (below). The scripts accept only an absolute path without `.`/`..`
  segments that resolves (symlinks and junctions followed, letter case ignored) outside this repository **and
  outside every git working tree**, and they validate before creating anything. On Windows, restrict the folder's ACL
  to your account; Postgres data on a Windows (NTFS) bind mount is not supported by Postgres — run the stack on Linux
  (the staging VM) or keep the runtime directory inside WSL.
- **Never run upstream's helper scripts** (`upstream/reset.sh`, `update.sh`, `setup.sh`, `run.sh`, `tests/*.sh`,
  `utils/*.sh`) from the vendored directory. `reset.sh` runs `docker compose down -v` for a project named `supabase`,
  `rm -rf`s `volumes/db/data` and `volumes/storage`, and replaces `.env` with upstream's public demo values;
  `update.sh` rewrites the vendored files. The only sanctioned use of an upstream script is `init-runtime.sh` running
  `utils/generate-keys.sh` / `utils/add-new-auth-keys.sh` inside the runtime directory. Any stray file in `upstream/`
  (e.g. `upstream/.env`) makes `node scripts/selfhost/sync-upstream.mjs --offline` fail.
- Run Compose only through `scripts/selfhost/compose.sh`. It fixes the project name (`mcci-selfhost`), files, runtime
  `.env` and data directory, clears shell variables that Compose would otherwise prefer over the `.env`, refuses
  `DOCKER_HOST`/`DOCKER_CONTEXT`, and accepts only: `config --quiet|--services|--images|--profiles|--volumes`,
  `pull`, `up`, `ps`, `start`, `stop`, `restart`, `images`, `down [--remove-orphans]`, `version`, `psql-file`,
  `pg-dump`. `exec`, `run`, `logs`, `top`, `cp`, global flags (`-p`, `-f`, `--env-file`, `--project-directory`) and
  data-deleting flags (`down -v`, `--rmi`) are refused. Container logs can contain sensitive values: read them only
  deliberately (`docker logs <container>`), never in shared sessions.
- Never print `.env`; never pass a password on a command line (`with-env.sh` exports `PGPASSWORD` and a password-free
  database URL instead).
- Local test stack: gateway on `127.0.0.1:18000` only. Postgres and the pooler publish no host ports.
- Studio (`/`) and postgres-meta (`/pg/`) share the gateway port. On staging they must be reachable from the admin
  network only (TLS proxy rules + firewall, decision D-M23). Basic auth for Studio is SHA-1 hashed: TLS required.
- Use only disposable test data. The pgTAP seed (`supabase/seed.sql`) belongs on the isolated test stack only.

## 0. Prerequisites

Docker Compose ≥ 2.24, `openssl`, Node ≥ 16, `git`, ~2–3 GiB free memory for the stack (do not run it next to the
Supabase CLI stack on a 4 GiB Docker VM), ports 18000 (and 15432 for the opt-in DB overlay) free on 127.0.0.1.

```bash
node scripts/selfhost/sync-upstream.mjs --offline   # content, unexpected files, LICENSE, modes (after commit: --require-tracked)
export MCCI_SELFHOST_RUNTIME="$HOME/mcci-selfhost-test"   # absolute, outside every git repository
```

## 1. Secrets (no terminal output)

```bash
scripts/selfhost/init-runtime.sh
```

Checks `openssl` and Node ≥ 16 first (otherwise upstream's script would start a Docker container), validates the
runtime path, copies `mcci/env.mcci.example` to `$MCCI_SELFHOST_RUNTIME/.env` (umask 077, mode 600), runs upstream
`utils/generate-keys.sh --update-env` and `utils/add-new-auth-keys.sh --update-env` with all output discarded (both
echo every secret), and prints only `OK`/`MISSING` per variable name. It refuses to overwrite an existing `.env`; on
any failure or interruption it deletes the partial `.env` and the generators' `.env.old` backups.
`add-new-auth-keys.sh` cannot find a `docker-compose.yml` to edit there — intended: the MCCI override carries the
`GOTRUE_JWT_KEYS` / `API_JWT_JWKS` / `JWT_JWKS` settings instead of editing upstream files. Generate the keys before
the first start: Realtime reads `API_JWT_JWKS` only when it seeds its tenant on first boot.

## 2. Start and health checks

```bash
scripts/selfhost/compose.sh config --quiet       # validate the merged configuration
scripts/selfhost/compose.sh pull
scripts/selfhost/compose.sh up -d --wait          # waits for every service healthcheck
scripts/selfhost/compose.sh ps                    # all "healthy"; no functions / imgproxy containers
docker port supabase-envoy                        # must show 127.0.0.1:18000 only
```

Upstream healthchecks: studio, api-gw, auth, rest, realtime, storage, db, supavisor (and imgproxy/functions when
their profiles are enabled). `restart: unless-stopped` everywhere.

## 3. Migrations and database tests (isolated stack only)

```bash
MCCI_SELFHOST_DB_LOOPBACK=1 scripts/selfhost/compose.sh up -d --wait db   # publish Postgres on 127.0.0.1:15432
scripts/selfhost/with-env.sh sh -c 'pnpm exec supabase migration up --db-url "$MCCI_SELFHOST_DB_URL"'   # (1)
scripts/selfhost/compose.sh up -d --wait db       # drop the loopback port again
scripts/selfhost/compose.sh psql-file supabase/seed.sql   # test personas
scripts/selfhost/db-tests.sh                      # expect Files=10, Tests=276, Result: PASS
```

(1) `$MCCI_SELFHOST_DB_URL` carries no password; the password is in `PGPASSWORD`. That the Supabase CLI 2.121 reads
`PGPASSWORD` for `--db-url` could not be verified offline (the binary contains the string; behaviour unproven):
verify on the first run, and if it does not, stop — do not put the password in the URL. Type generation against the
stack (`supabase gen types --db-url`) starts a helper container whose access to the host's loopback is unverified on
Docker Desktop; it is not part of this runbook until verified on the staging VM.

Then check, read-only: `supabase_realtime` publishes exactly applications, endorsements, notifications,
payment_vouchers, service_requests; RLS on all five; `authenticated` cannot read `endorsements.ip` / `user_agent`
(covered by supabase/tests/database/090 in `db-tests.sh`).

## 4. Realtime suite

```bash
scripts/selfhost/with-env.sh pnpm test:integration     # synthetic @test.local users, loopback only; run twice
```

The gateway test is skipped here (it needs `MCCI_IT_SELFHOST=1`). Teardown fails the run if any synthetic row remains.

## 5. Gateway checks G1–G8

```bash
scripts/selfhost/gateway-checks.sh
```

| | Check | Expected |
|---|---|---|
| G1 | no `apikey` on `/rest/v1/public_settings`, `/auth/v1/settings` | 401 |
| G2 | unknown `sb_publishable_…` key, `invalid-key` | 401 |
| G3 | publishable key on `/rest/v1/public_settings` | 200, 4 rows |
| G4 | OpenAPI root `/rest/v1/`: publishable / secret (control) | 403 / 200 |
| G5a | `/pg/config/version`: none / publishable / secret (control) | 401 / 403 / 200 |
| G5b | gateway port on every non-loopback IPv4 of the host — **fails** if the host has none (nothing to probe) | not open |
| G6 | `/realtime/v1/api/tenants`, `/realtime/v1/api/openapi` with either key | 403 |
| G7 | `rpc/settings_for_server` (service-role only): publishable / secret (control); `Accept-Profile: private`; `/mcp`, `/api/mcp` | 401–403 / 200; 406; 403 |
| G8a | Studio `/`: no credentials / wrong credentials / correct credentials (control, required) | 401 / 401 / 2xx–3xx |
| G8b | **unverified expectation, not a security check:** the 401 carries `WWW-Authenticate: Basic` | header present |

Not covered locally: G5 reachability through the TLS proxy and firewall, and the G7 client-bundle scan (T-B1). Both
need staging / the app build (docs/17 §11). If only G8b fails, correct that expectation; upstream's own tests assert
only the 401 status.

## 6. Settings: static vs runtime verification

Static = the variable name is one the service reads (upstream `CONFIG.md`, which lists the exact names in each
service's code) and the merged Compose configuration carries the value (`compose.sh config` parse). Runtime = the
effect has been observed on a running stack. **No setting is runtime-verified yet.**

| Setting (override) | Static | Runtime check that proves it |
|---|---|---|
| Auth: `GOTRUE_MAILER_AUTOCONFIRM=false`, `GOTRUE_EXTERNAL_PHONE_ENABLED=false`, `GOTRUE_EXTERNAL_ANONYMOUS_USERS_ENABLED=false`, `GOTRUE_SMS_AUTOCONFIRM=false` | yes (`CONFIG.md` Auth) | `GET /auth/v1/settings` (publishable key); A2, A8 |
| Auth: `GOTRUE_PASSWORD_MIN_LENGTH=10`, `GOTRUE_SECURITY_UPDATE_PASSWORD_REQUIRE_REAUTHENTICATION`, `GOTRUE_MAILER_SECURE_EMAIL_CHANGE_ENABLED` | yes | A3, A4, A5 |
| Auth: `GOTRUE_MFA_*`, `GOTRUE_SECURITY_REFRESH_TOKEN_*`, `GOTRUE_RATE_LIMIT_*` (not email), `GOTRUE_MAILER_OTP_*`, `GOTRUE_SECURITY_MANUAL_LINKING_ENABLED` | yes | A6, A7, A9, A10 |
| Auth email limits | **unset on purpose** — D-M22 | after the decision: A10 |
| Auth `GOTRUE_JWT_KEYS`; Storage `JWT_JWKS`; Realtime `API_JWT_JWKS` (seed-time only) | yes | G3/G4 with `sb_` keys; Realtime suite; S1 |
| REST `PGRST_DB_SCHEMAS=public,api`, `PGRST_DB_EXTRA_SEARCH_PATH`, `PGRST_DB_MAX_ROWS` | yes (`CONFIG.md` PostgREST section, also Studio) | G7 (`Accept-Profile: private` → 406) |
| Storage `FILE_SIZE_LIMIT=10485760`, `ENABLE_IMAGE_TRANSFORMATION=false` | yes (`CONFIG.md` Storage) | S4 |
| Realtime `REGION=us-east-1` (reconnect workaround) | name yes; the workaround's effect only from upstream's changelog | Realtime suite across > 10 minutes |
| Ports: gateway `127.0.0.1:18000`; no DB/pooler ports | yes (merged config) | `docker port`; G5b |

Storage's S3 protocol endpoint (`/storage/v1/s3`, SigV4 with `S3_PROTOCOL_ACCESS_KEY_*`, bypasses RLS like the
service role) is **on** by default. Upstream `CONFIG.md` documents `S3_PROTOCOL_ENABLED` (Storage, boolean, default
`true`) as the switch. Whether to set it to `false` is decision D-M24; it is not set here.

## 7. Backups (before any real data — docs/17 §10)

Self-hosted Supabase has no built-in backups. Nightly `scripts/selfhost/compose.sh pg-dump > <encrypted off-host
target>` (custom format of database `postgres`), WAL archiving, and a copy of `data/storage` and of the named volume
`mcci-selfhost_db-config` (below) to a second location, encrypted; restore tested quarterly.

### The database configuration volume `mcci-selfhost_db-config`

`/etc/postgresql-custom` in the `db` container is upstream's named volume `db-config` (Compose project
`mcci-selfhost`), not a runtime-directory bind mount. On first use Docker copies the image's files into a new named
volume — `supautils.conf`, `conf.d/`, `extension-custom-scripts/`, `read-replica.conf`, `wal-g.conf` — and the image
then generates **`pgsodium_root.key`, a secret**: it protects pgsodium/Vault-encrypted data, and losing it makes that
data unrecoverable. Treat the volume like the `.env`: include it in encrypted backups, never print or copy the key
anywhere else, and never remove the volume (the wrapper refuses `down -v`).

Never bind-mount a directory over `/etc/postgresql-custom`: an empty host directory hides the image's configuration
and Postgres cannot finish first-start initialisation — the cluster is left half-built (only `supabase_admin`, no
`postgres` role, no `_supabase` database) and later starts skip initialisation. This happened on the first staging
attempt (commit `7eede6d`); `tests/unit/selfhost-scripts.test.ts` now guards against it.

## 8. Stop / remove (isolated stack only)

```bash
scripts/selfhost/compose.sh down                  # keeps data (volumes and images are never removed by the wrapper)
# full reset: delete $MCCI_SELFHOST_RUNTIME/data by hand — never on staging/production without a verified backup
```
