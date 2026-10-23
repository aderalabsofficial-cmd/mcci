# 18 · Staging security hardening and production-readiness review

Self-hosted Supabase staging stack on the MCCI VPS (`vmi3652958`, `169.58.124.24`), Compose project `mcci-selfhost`,
runtime `/var/lib/mcci-selfhost/recovery-new`. Work of 23 Oct 2026 (UTC) on branch `db/schema-proposal`, commits
`f1fd9f7` and `f82e5fe` (pushed), deployed from checkout `/opt/mcci-deploy-f82e5fe`. Companion to `docs/17` (design)
and `deploy/selfhost/README.md` (runbook). **The system is not production-ready** — see §7.

Status words: **verified** = run and passed on staging with the result kept; **validated** = run in a throwaway
database or locally, not on staging; **proposed** = written, not applied; **open** = not done.

## 1. Test results

| Suite | Where | Result |
|---|---|---|
| pgTAP (`scripts/selfhost/db-tests.sh`) | staging, after deploy | **Files=10, Tests=276, PASS** |
| Gateway G1–G8 (`gateway.test.ts`) | staging via SSH tunnel | **10/10** (G5b from the workstation is meaningless; replaced by the host and external probes in §5) |
| Auth A1–A12 (`auth.test.ts`) | staging via tunnel, SQL hook on | **15/15** (A5 and A7 each have a time-travel case) |
| Storage S1–S12 + D-M24 (`storage.test.ts`) | staging via tunnel, SQL hook on | **14/14** |
| Realtime (`realtime.test.ts`) | staging via tunnel | **12/12** |
| Integration total | staging, after deploy | **51/51, run twice, 0 skipped** |
| Baseline before the fixes (Auth + Storage, config of `aa0fd70`) | staging | 26/29: A10 and D-M24 failed (findings F1, F2); one failure was a regex bug in the test itself, fixed |
| Migrations + seed + pgTAP in a throwaway database (`scripts/db/dry-run.sh`) | local Docker, image 17.6.1.136 | 0 not ok (287 ok lines), exit 0 |
| Unit (`pnpm test`) | local | **162/162** (10 files) |
| typecheck, ESLint, Prettier, shell `bash -n` (11), `node --check`, upstream integrity 63/63, Compose config (on the VPS) | local / VPS | pass |
| T-B1 bundle scan (`pnpm scan:bundle`) | local build | 0 findings in 33 client files and 339 tracked files; a planted control was caught (5 rules) |
| Realtime soak > 10 min (`realtime-soak.test.ts`) | staging | **open — not completed** (interrupted twice by session loss; no result) |

## 2. Findings and fixes

| # | Finding (evidence) | Fix | Regression test |
|---|---|---|---|
| F1 | Auth applied **no per-IP rate limits**: 160 failed sign-ins and 40 wrong one-time codes in a row, no 429. GoTrue applies its IP limits only when `GOTRUE_RATE_LIMIT_HEADER` names a header that the request carries; upstream leaves it unset. A 6-digit email code could be brute-forced within its hour. | `GOTRUE_RATE_LIMIT_HEADER: X-Real-IP` (override). Effective only behind a proxy that **overwrites** `X-Real-IP` (§5); requests without the header are still unlimited. | A10 (limit per address; another address unaffected) |
| F2 | Storage **S3 protocol endpoint** answered through the gateway (`/storage/v1/s3`, S3 AccessDenied XML); its SigV4 access keys are set and bypass every object policy. Nothing in MCCI uses it. | `S3_PROTOCOL_ENABLED: 'false'` (D-M24, below) | D-M24 case in `storage.test.ts` (404, no S3 error) |
| F3 | Seed personas had NULL token columns; GoTrue's admin user list failed for the **whole instance** ("Database error finding users"). Test seed only. | `seed.sql` sets `''` where the columns exist (dry run still passes on the bare image) | teardown uses per-id checks; the list works after the fix on a fresh seed |
| F4 | **Public sign-up returns 500** ("Error sending confirmation email"): SMTP in the runtime `.env` is a placeholder. Email change and re-authentication fail the same way. | open — production SMTP (docs/17 §10) | A2/A4/A7 use admin-generated links/codes redeemed through the public verify endpoint; delivery itself is untested |
| F5 | Secure password change asks for re-authentication only when the session is **older than 24 h** (GoTrue rule). | documented; not a defect | A5 control (fresh session) + A5 (25 h old session refused) |
| F6 | The admin generate-link `token_hash` for `email_change_new` is not accepted by this GoTrue; the 6-digit code from the same call is. Test-harness quirk. | A4 uses the code for the second confirmation | A4 |

Deployed by recreating only `auth` and `storage` (`compose.sh up -d --no-deps --wait auth storage`); the other seven
containers kept their ids and creation times; all nine healthy, 0 restarts. Effective values checked:
`GOTRUE_RATE_LIMIT_HEADER=X-Real-IP`, `S3_PROTOCOL_ENABLED=false`.

## 3. Security decisions (threat · evidence · mitigation · test · decision)

**D-M22 — Auth email and request limits.** Threat: account enumeration, email bombing, credential stuffing, code
guessing. Evidence: F1; per-address email frequency works (A10 per-address: a second code request within a minute →
`over_email_send_rate_limit`); instance email budget is Auth's default 30/hour. Mitigation now: per-IP limits active
behind the proxy (per address: token 150, verify 30, OTP 30 as configured; A10 verified that a 429 arrives within
limit + 1 requests and that another address is unaffected — the refill rate was not measured). Requirements that follow:
the TLS proxy must overwrite `X-Real-IP`; if the Next.js server calls Auth on a user's behalf it must forward that
user's address in `X-Real-IP` (otherwise those calls are unlimited, or all users share the server's bucket).
**MCCI decision still required:** instance email budget (`GOTRUE_RATE_LIMIT_EMAIL_SENT`, default 30/hour is too low
for a membership drive — proposal 200/hour once SMTP volume is known) and per-address interval (keep 1 min).

**D-M24 — Storage S3 endpoint.** Threat: S3 keys bypass RLS; any leak exposes every file. Evidence: F2. Mitigation:
endpoint off (no business impact: no component uses it). Test: D-M24 case. Decision: none unless MCCI later needs
S3 clients (then rotate the keys and scope them).

**R-RT1 — anonymous Realtime activity metadata.** Unchanged; evidence and design in docs/17 §4a, pinned by the
Realtime suite (12/12 on staging). Mitigation options: private-only channels with per-company topics, or updates
relayed by the Next.js server; none tested. **Security-review decision required before production.**

**R-RT2 — DELETE ids reach every subscriber.** Unchanged (docs/17 §4a); pinned by the suite. Options: soft-delete
or anonymise rows of published tables, change the `notifications` cascades. **Decision required before production
and before M9 account deletion / the retention job.**

**Realtime reconnect (supabase/realtime#2289).** The soak test exists (one subscription, one change every 3 s,
token refresh every 20 min, every change must arrive) but has **not completed** on staging. Status: unverified;
screens must still re-read on focus (docs/17 §4a).

## 4. Backup and restore — verified

| Item | Evidence |
|---|---|
| Set 1 `mcci-20261023T151612Z` | 7 encrypted files, LSN 0/4000028 → 0/4000120, `backup-verify`: ciphertext checksums OK, each file decrypts, plaintext checksum OK, readable (tar listing, JSON, `pg_restore --list`) |
| Set 2 `mcci-20261023T151718Z` (with the Vault canary) | same checks, all OK |
| Encryption | GnuPG 2.3.3: `cipher 9` (AES-256), `aead 0`, S2K mode 3 SHA-512, MDC-protected packet; files 600, directories 700, root |
| Restore drill on set 2 | 13 PASS, 0 FAIL: cluster starts; WAL replay reaches consistency; no network/ports; server version, 31 roles, 2 databases, 17 schemas, 8 extensions, 88 policies, 37 functions identical; row counts identical in all 101 tables (1,098 rows); the Vault secret decrypts with the restored pgsodium key; **negative control**: with a fresh key it does not. Containers, volumes and decrypted files removed afterwards; staging untouched (9/9 healthy). |
| Passphrase | `/root/.config/mcci-backup/passphrase` (600) on the VPS; off-server copy at the operator's workstation `C:\Users\DELL\.mcci-secrets\` (ACL: owner only, excluded from the home-folder git repository); both copies verified identical by hash. Move it into MCCI's password manager. |
| Not touched | `/var/lib/mcci-selfhost/recovery-backups/*`, the original cluster under `/opt/mcci-selfhost`, its `.env` |

Limitations and the runbook: `deploy/selfhost/README.md` §7.

## 5. Exposure, proxy and TLS

| Check | Result |
|---|---|
| Published ports of `mcci-selfhost` | only `127.0.0.1:18000` (Envoy) — verified |
| From the VPS to its own addresses (169.58.124.24, 172.17.0.1, 172.18.0.1) × ports 18000, 15432, 5432, 6543, 4000, 8000, 3000, 8080, 5000, 9999 | 30/30 closed — verified |
| From outside to 169.58.124.24, same ports | refused or filtered — verified |
| Public routing | `http://mcci.aderalabs.tech/rest/v1/` → 404 (no route to the stack); HTTPS for that name not configured |
| Rate limit through the proposed proxy (`X-Real-IP` overwritten, forged per request) | **open** — test ran in a temporary separate nginx on `127.0.0.1:18081` but the session was lost before its result was recorded |
| Unrelated on the host (not changed) | nginx 80/443 for other sites, MariaDB `*:3306` (public), Node `0.0.0.0:3001`, host PostgreSQL `127.0.0.1:5432` |

**TLS proposal** (`deploy/selfhost/nginx/mcci.aderalabs.tech.conf.proposed`, not applied): port 80 → HTTPS plus ACME
webroot; 443 proxies only `/rest|auth|storage|realtime/v1/` to `127.0.0.1:18000`, overwriting `X-Real-IP` and
`X-Forwarded-For`, websockets for Realtime, 11 MB body limit, HSTS; `/realtime/v1/api/`, Studio, `/pg/`, `/mcp`,
`/api/mcp`, `/functions/v1/`, `/graphql/v1/` → 404. Admins use an SSH tunnel to Studio. DNS for
`mcci.aderalabs.tech` already points at the VPS. Approval package: §7.

## 6. Migration history and test seed

| Item | Status |
|---|---|
| `supabase/ops/record-applied-migrations.sql` | **validated** in a throwaway database with CLI 2.121: before, `db push --dry-run` would re-run all 17; after, "Remote database is up to date"; second run no-op; refuses (records nothing) on a database without the migrations. **Staging: open.** |
| `supabase/ops/remove-test-seed.sql` | **validated**: removal returns the database to the migrations-only state (schemas + every row count; `audit_log` kept, append-only); refuses and changes nothing when a non-seed user is attached to a seed company; second run no-op. **Staging: open** (run after the soak, it disables the pgTAP suite there until re-seeded). |
| Interrupted soak run `1df0d959` | removed after identification: 38 notifications `soak-1df0d959-*` and user `it-1df0d959-soak@test.local` (+ profile, 1 session) — verified 0 left |

## 7. Open gates (not production-ready)

1. Realtime soak > 10 min on staging — open.
2. Rate limit through the real proxy path — open (and the proxy itself awaits approval).
3. Migration history recorded on staging; test seed removed from staging — open.
4. Production SMTP (F4) and D-M22 email budget — open; sign-up does not work until then.
5. R-RT1 and R-RT2 security-review decisions — open.
6. Off-host backup target, key holders, schedule and retention (D-M1, D-M3) — open.
7. TLS proxy + certificate for `mcci.aderalabs.tech`, admin access rule (D-M23) — proposed, needs approval.
8. T-B1 on a build with the real environment, and CSP `connect-src` — open (scan of an env-less build is clean).
9. Unrelated but material: MariaDB listens publicly on `*:3306` — owner's decision.

**Actions that need approval:** (a) copy the proposed nginx file to `/etc/nginx/conf.d/mcci.aderalabs.tech.conf`,
`nginx -t`, reload; (b) issue the certificate (`certbot certonly --webroot -w /var/www/certbot -d mcci.aderalabs.tech`);
(c) set `API_EXTERNAL_URL` / `SUPABASE_PUBLIC_URL` in the runtime `.env` to `https://mcci.aderalabs.tech` and
recreate `auth`, `storage`, `studio`; (d) install the backup schedule; (e) firewall: no change needed for the stack
(nothing of it is public), 3306 is an owner decision.
