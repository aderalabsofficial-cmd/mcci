# 18 · Staging security hardening and production-readiness review

Self-hosted Supabase staging stack on the MCCI VPS (`vmi3652958`, `169.58.124.24`), Compose project `mcci-selfhost`,
runtime `/var/lib/mcci-selfhost/recovery-new`. Work of 23 Oct 2026 (UTC) on branch `db/schema-proposal`, code
commits `f1fd9f7` and `f82e5fe` (deployed from checkout `/opt/mcci-deploy-f82e5fe`) plus documentation and test-only
commits after them. Companion to `docs/17` (design)
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
| Integration total | staging, after deploy | **51/51, run twice, 0 skipped**; a third run after the test seed was removed: **51/51** |
| Baseline before the fixes (Auth + Storage, config of `aa0fd70`) | staging | 26/29: A10 and D-M24 failed (findings F1, F2); one failure was a regex bug in the test itself, fixed |
| Migrations + seed + pgTAP in a throwaway database (`scripts/db/dry-run.sh`) | local Docker, image 17.6.1.136 | 0 not ok (287 ok lines), exit 0 |
| Unit (`pnpm test`) | local | **165/165** (10 files) |
| typecheck, ESLint, Prettier, shell `bash -n` (11), `node --check`, upstream integrity 63/63, Compose config (on the VPS) | local / VPS | pass |
| T-B1 bundle scan (`pnpm scan:bundle`) | local build | 0 findings in 33 client files and 339 tracked files; a planted control was caught (5 rules) |
| Realtime soak > 10 min (`realtime-soak.test.ts`) | staging, 16:00:59 → 16:36:04 UTC | **PASS, completed: 35.08 min, 666 changes sent, 666 received, 0 missed, 0 later than 3 s, max 785 ms**; subscription confirmed at start and again after the token refresh at minute 20, no drop; cleanup deleted 666 rows, nothing left. Report: `docs/evidence/realtime-soak-20261023.json`. (Two earlier attempts were cut off by session loss after ~2 min; their data was removed.) |
| Proxy-path rate limits (§5) | staging, temporary nginx | **verified** |

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

**Realtime reconnect (supabase/realtime#2289).** Threat: missed live updates (stale status shown to a member or
officer). Evidence: the 35-minute soak (one subscription, one change every 3 s, token refresh at minute 20) delivered
666/666 changes across three 10-minute reconnect cycles, with upstream's `REGION: us-east-1` workaround in place.
Mitigation: keep the workaround until a pinned release has the fix; screens still re-read on focus/navigation
(docs/17 §4a), because one 35-minute run is evidence, not a guarantee. Regression test: `realtime-soak.test.ts`
(`MCCI_IT_SOAK_MINUTES=35`), rerun after every Realtime upgrade. No business decision needed.

## 4. Backup and restore — verified

| Item | Evidence |
|---|---|
| Set 1 `mcci-20261023T151612Z` | 7 encrypted files, LSN 0/4000028 → 0/4000120, `backup-verify`: ciphertext checksums OK, each file decrypts, plaintext checksum OK, readable (tar listing, JSON, `pg_restore --list`) |
| Set 2 `mcci-20261023T151718Z` (with the Vault canary) | same checks, all OK |
| Set 3 `mcci-20261023T155814Z` (before recording the migration history) | same checks, all OK |
| Set 4 `mcci-20261023T163636Z` (before removing the test seed) | same checks, all OK |
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
| Rate limit through the proposed proxy, a **different forged** `X-Real-IP`/`X-Forwarded-For` on every request (15:55 UTC) | **verified** in a temporary, separate nginx 1.20.1 (own prefix and pid, `127.0.0.1:18081`, the proposal's API blocks; stopped and removed afterwards): `/verify` ×40 → first 429 at request 31 (30×403, 10×429); `/token` ×160 → first 429 at request 33 (41×400, 119×429); nginx logged all 203 requests as the one real client. Control, directly to the gateway with the same forged headers: 40×403 and 160×400, never limited — the overwrite is what enforces the limits, so the gateway must stay loopback-only. Through the proxy, Studio `/` and `/pg/` → 404. Password sign-in limits at ≈ 30, not 150: it is governed by a stricter limiter than token refresh. |
| Unrelated on the host (not changed) | nginx 80/443 for other sites, MariaDB `*:3306` (public), Node `0.0.0.0:3001`, host PostgreSQL `127.0.0.1:5432` |

**Production nginx, inspected read-only:** nginx 1.20.1 (`http_v2`, `ssl`, `realip` modules); `nginx.conf` includes
`/etc/nginx/conf.d/*.conf` and has the stock catch-all server on port 80 (that is the 404 `mcci.aderalabs.tech`
gets today); no `default_server` on 443, so HTTPS for an unknown name is answered by the first TLS site and fails the
name check. Five other sites (aderalabs.tech, fintax, tax/api.tax, iqpigeon.com, whatsappapi.iqpigeon.com) with
certbot certificates (webroot `/var/www/letsencrypt`, `certbot-renew.timer` active). `firewalld` is **inactive**: every
port bound to a public address is reachable (relevant to MariaDB `*:3306`). SELinux `httpd_can_network_connect` is on,
so nginx may proxy to `127.0.0.1:18000`. Live configuration fingerprint unchanged throughout (`39b2d943…`).

**TLS proposal (not applied), two stages** — nginx refuses a 443 block whose certificate does not exist yet:
1. `deploy/selfhost/nginx/mcci.aderalabs.tech.http-only.conf.proposed` → `/etc/nginx/conf.d/mcci.aderalabs.tech.conf`:
   port 80, ACME webroot `/var/www/letsencrypt`, everything else 404; proxies nothing.
2. `certbot certonly --webroot -w /var/www/letsencrypt -d mcci.aderalabs.tech` (renewed by the existing timer).
3. `deploy/selfhost/nginx/mcci.aderalabs.tech.conf.proposed` replaces the stage-1 file: 80 → HTTPS (+ ACME); 443
   (`listen 443 ssl http2`, TLS 1.2/1.3, HSTS, nosniff, no-referrer) proxies only `/rest|auth|storage|realtime/v1/` to
   `127.0.0.1:18000`, **overwriting** `X-Real-IP` and `X-Forwarded-For`, websockets for Realtime, 11 MB body limit;
   `/realtime/v1/api/`, Studio `/`, `/pg/`, `/mcp`, `/api/mcp`, `/functions/v1/`, `/graphql/v1/` → 404. Admins reach
   Studio only through `ssh -N -L 18000:127.0.0.1:18000 mcci-vps`.
4. Runtime `.env`: `API_EXTERNAL_URL` and `SUPABASE_PUBLIC_URL` = `https://mcci.aderalabs.tech`; recreate `auth`,
   `storage`, `studio` with `compose.sh up -d --no-deps --wait …`.

Both files pass `nginx -t` with the host's nginx 1.20.1 (isolated check, stage 2 with a throwaway certificate); unit
guards in `tests/unit/selfhost-scripts.test.ts` pin the header overwrite and the 404s. DNS for `mcci.aderalabs.tech`
already points at the VPS; no firewall change is needed for the stack.

## 6. Migration history and test seed

| Item | Status |
|---|---|
| `supabase/ops/record-applied-migrations.sql` | **validated** twice in a throwaway database with CLI 2.121 (before: `db push --dry-run` would re-run all 17; after: "Remote database is up to date"; second run no-op; refuses on a database without the migrations). **Verified on staging (15:58 UTC)**, after backup set `mcci-20261023T155814Z` (verified): run through `compose.sh psql-file`, 17 rows `20261023000100`–`20261023000260`, second run no-op; then the CLI against staging (temporary SSH tunnel to the db container, password only in `PGPASSWORD`): `migration list` 17 local / 17 remote / 0 pending, `db push --dry-run` "Remote database is up to date". No migration was re-applied. |
| `supabase/ops/remove-test-seed.sql` | **validated** (returns a throwaway database to the migrations-only state; refuses and changes nothing when a non-seed user is attached to a seed company; second run no-op). Rollback rehearsal on staging: guards passed, nothing changed. **Verified on staging (16:37 UTC)**, after backup set 4 and after all results above were recorded: exactly the seed's rows went (`auth.users`/`profiles` 16 → 0, `staff` 8 → 0, `company_users` 7 → 0, companies, applications, documents, vouchers, service requests, members, endorsements, invitations, meetings, print batches, overrides, 2 notifications → 0; `tests` schema dropped); 74 of 94 tables unchanged, including all reference data (settings 12, designations 9, document requirements 50, role permissions 108, service types 7), 7 buckets, 17 history rows and the Vault canary (still decrypts); `audit_log` 575 → 627 (the deletions are audited; append-only). Second run: no-op. Consequence: the pgTAP suite cannot run on staging until the seed is applied again (it ran 276/276 before). |
| Interrupted soak run `1df0d959` | removed after identification: 38 notifications `soak-1df0d959-*` and user `it-1df0d959-soak@test.local` (+ profile, 1 session) — verified 0 left |

## 7. Open gates (not production-ready)

Closed on 23 Oct: Auth/Storage suites, F1–F3, D-M24, the Realtime soak, rate limits through the proxy logic, backup +
restore drill, migration history, test-seed removal, T-B1 on an env-less build.

Still open — each blocks production:

1. **Production SMTP** (F4) and the **D-M22 email budget**: public sign-up, email change and re-authentication fail
   (500) until then.
2. **R-RT1 and R-RT2**: security-review decisions (accept, or adopt and test an alternative).
3. **TLS proxy and certificate** for `mcci.aderalabs.tech` and the admin-access rule (D-M23): proposed (§5), not
   applied. Until then the per-IP Auth limits are not in force for real clients, because only the proxy sets `X-Real-IP`.
4. **Backups off the host**: target, key holders, schedule and retention (D-M1, D-M3); no WAL archiving yet. Sets and
   passphrase are on the VPS (plus the operator's workstation copy of the passphrase).
5. **T-B1 on a build with the real environment** and a CSP `connect-src`; the Next.js app's host is not decided, and
   server-side Auth calls must forward the client address in `X-Real-IP` (D-M22).
6. **Host hygiene, not part of this stack** (owner's decision): `firewalld` is inactive, so MariaDB `*:3306` and Node
   `0.0.0.0:3001` are public.

**Actions that need approval** (exact steps in §5): (a) install the stage-1 nginx file, `nginx -t`, reload;
(b) `certbot certonly --webroot -w /var/www/letsencrypt -d mcci.aderalabs.tech`; (c) replace it with the stage-2 file,
`nginx -t`, reload; (d) set `API_EXTERNAL_URL` / `SUPABASE_PUBLIC_URL` to `https://mcci.aderalabs.tech` in the runtime
`.env` and recreate `auth`, `storage`, `studio`; (e) install the backup schedule (README §7 proposal); (f) firewall
rules for the host's other services — owner's decision; no change is needed for the stack.

## 8. Demonstration site `https://mcci.aderalabs.tech` (static prototype)

Approved by the owner on 23 Oct 2026 for a presentation, not as a launch. Deployed 23 Oct (17:16 UTC), commits
`7121eff` (configuration, build script) and `407e9ab` (global-search fix); verified again 24 Oct 05:25 UTC.

| Item | State |
|---|---|
| What is served | the presentation build of the v10 prototype (`scripts/demo/build-prototype-demo.mjs`): 64 static pages from `/var/www/mcci-demo` (root-owned, `httpd_sys_content_t`). Every rendered page carries "Demonstration prototype · sample data only · not connected to MCCI systems" (EN + UR) and `noindex`. |
| Left out | `/admin/psid/`, `/admin/integrations/`, `/plan/`: not shipped, blocked by nginx (404), and no menu entry, tile, link or global-search result points to them (12 counted patches; the build fails if one stops matching) |
| Not exposed | nothing is proxied: `/rest/v1/`, `/auth/v1/…` (so no sign-up), `/storage/v1/`, `/realtime/v1/` (incl. WebSocket), `/pg/`, `/graphql/v1`, `/functions/v1/`, `/mcp`, Studio → 404 |
| Access | HTTP basic auth, user `mcci-demo`; `/etc/nginx/mcci-demo.htpasswd` holds one SHA-512-crypt hash (`640 root:nginx`, `httpd_config_t`). The password was generated on the operator's workstation, sent to the host only on stdin, and is kept only in the owner-only file `C:\Users\DELL\.mcci-secrets\mcci-demo-credentials.txt` (excluded from the home-folder git repository). |
| TLS | Let's Encrypt (ECDSA) for `mcci.aderalabs.tech`, expires 2027-01-21, renewed by the host's `certbot-renew.timer` (webroot `/var/www/letsencrypt`, reload hook). No HSTS, so the demo can be withdrawn cleanly. DNS is Cloudflare DNS-only (grey cloud). |
| Verified | certificate valid (curl verify 0); HTTP → 301 HTTPS; no / wrong credentials → 401 with `WWW-Authenticate: Basic realm="MCCI demonstration"` (HTTP/1.1 and HTTP/2); valid credentials → 200 for `/`, `/site/home/`, `/site/login/`, `/member/dashboard/`, `/admin/dashboard/`, `/admin/payments/`; hidden and backend paths → 404; headers `X-Robots-Tag noindex, nofollow`, nosniff, `X-Frame-Options DENY`, no-referrer; 38/38 checks. The five other sites answer exactly as before; the nine `mcci-selfhost` containers kept their ids (0 restarts); runtime `.env` untouched. |
| Rollback | `/root/nginx-backup-20261023T171501Z/ROLLBACK.txt` (backup of `/etc/nginx` before any change; rehearsed: removing the site file restores the original configuration fingerprint `39b2d943`). Previous build kept at `/var/www/mcci-demo.prev-7121eff`. |

**Static, not functional** (everything below is the prototype's in-browser demo data; nothing reaches MCCI or the
database): sign-in and accounts (any "login" just opens the demo), membership applications, the join wizard and
endorsements, document upload and AI extraction, payments and receipt verification, service requests, certificates and
QR verification, notifications and email, search, reports, staff and permission changes, settings. Changes made while
clicking around are stored only in that browser (`localStorage`) and are not shared with anyone else.

**Browsers that do not show a sign-in dialog.** The 401 page ("401 Authorization Required") is what a browser displays
when it does not show the basic-auth dialog or the dialog was cancelled — e.g. in-app browsers of messaging apps, link
previews, some embedded viewers, or after pressing Cancel. Open the URL in a normal Chrome, Edge, Firefox or Safari
window (a private window if a cancelled prompt is remembered).
