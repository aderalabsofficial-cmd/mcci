# 20 · Application deployment runbook — `app.mcci.aderalabs.tech` beside the demo (option A, chosen 24 Oct 2026)

Status on 24 Oct 2026, from read-only inspection of the VPS (`vmi3652958.contaboserver.net`, AlmaLinux 9, 12 GB RAM,
182 GB free). Builds on `docs/18` §5 (TLS proxy proposal) and §7 (open gates).

## 1. What is live today (verified 24 Oct)

| Item | State |
|---|---|
| `https://mcci.aderalabs.tech` | static prototype demo (`/var/www/mcci-demo`) behind Basic Auth; config `/etc/nginx/conf.d/mcci.aderalabs.tech.conf` (demo file, `docs/18` §8). Proxies nothing to Supabase |
| TLS | Let's Encrypt (YE1) for `mcci.aderalabs.tech`, expires 21 Jan 2027; `certbot-renew.timer` active (next run 24 Oct 20:52 CEST) |
| Supabase stack `mcci-selfhost` | 9 containers healthy; gateway only on `127.0.0.1:18000`; migrations **0100–0260 applied (17)**, **0270, 0280, 0290 not applied**; 0 users, 0 companies, 0 staff (seed removed 23 Oct) |
| Auth settings (staging) | `GOTRUE_SMTP_HOST=smtp.example.invalid` (no mail), `GOTRUE_SITE_URL=http://127.0.0.1:3000`, `API_EXTERNAL_URL=http://127.0.0.1:18000/auth/v1`, sign-up enabled, autoconfirm off, MCCI templates not loaded |
| Backups | 4 encrypted sets of 23 Oct in `/var/lib/mcci-selfhost/backups`; no schedule, nothing off the host |
| Shared host | other production sites on the same nginx (aderalabs.tech, fintax, taxdesk on `127.0.0.1:3100`, iqpigeon); public `*:3306` MariaDB, `0.0.0.0:3001` Node, `rpcbind :111`; no host firewall tool installed (`firewall-cmd` absent) — owner's decision, not changed |
| Next.js app | **not deployed anywhere**; Node 22.23 on the host (the app needs ≥ 22.12 — fine) |

## 2. Why the real app is not on the domain yet

1. **Email does not work on the stack.** Registration, email codes, password reset and invitations all depend on a
   working SMTP relay for `mcci@aderalabs.tech` (SPF/DKIM). Without it, sign-up answers 500 and invitations cannot be
   delivered. Needs: SMTP host, port, user and password, entered by the owner on the server (never in chat or git).
2. **Auth URLs point at 127.0.0.1.** `GOTRUE_SITE_URL`, `API_EXTERNAL_URL`, `SUPABASE_PUBLIC_URL` must become
   `https://mcci.aderalabs.tech`, and the MCCI email templates must be loaded — a recreate of the `auth` (and
   `storage`, `studio`) containers: a few seconds of Auth downtime on a stack with no users.
3. **Migrations 0270–0290** are not on the stack (forward-only, additive: functions + one private table).
4. **Only M0–M1 screens exist** (sign-in, Staff & Roles, Company Profile). Replacing the demo now would take the
   prototype's 59 screens off the domain and put 6 working ones in their place — the handover says keep the demo
   until the real app passes acceptance.

## 3. Topology (option A)

```
browser ─ https ─> nginx :443 app.mcci.aderalabs.tech           (mcci.aderalabs.tech keeps the demo, unchanged)
                    ├─ /rest|auth|storage|realtime/v1/  → 127.0.0.1:18000  Supabase gateway (X-Real-IP overwritten)
                    ├─ /email-templates/               → /var/www/mcci-app-email-templates (Auth fetches templates)
                    └─ /                               → 127.0.0.1:3200   Next.js, systemd mcci-web
```

| File in the repo | Installed as |
|---|---|
| `deploy/web/nginx/app.mcci.aderalabs.tech.http-only.conf` (stage 1: ACME only) | `/etc/nginx/conf.d/app.mcci.aderalabs.tech.conf` |
| `deploy/web/nginx/app.mcci.aderalabs.tech.conf` (stage 2) | same path, replacing stage 1 |
| `deploy/web/mcci-web.service` | `/etc/systemd/system/mcci-web.service` |
| `deploy/web/env.example` | filled in by the owner as `/etc/mcci-web/env` (root, 0600) |
| `scripts/deploy/release.sh` | run from a checkout: build → switch → health check → automatic rollback |
| `scripts/selfhost/migrate.sh` | applies pending migrations through `compose.sh psql-file`, one transaction each |
| `scripts/selfhost/first-secretary-general.sh` | one-off: the first Secretary General |

Tooling checkout on the server: `/opt/mcci-deploy-<commit>` (as before), with
`export MCCI_SELFHOST_RUNTIME=/var/lib/mcci-selfhost/recovery-new`. Commands below run as root from that checkout.

## 4. Runbook — one approval per gate

Nothing in gates 1–5 touches the demo site, the other sites' files or their services. `nginx -t` runs before every
reload; a failing test means no reload.

### Gate 1 — backup and database migrations 0270, 0280, 0290 (can run now)

```bash
export MCCI_BACKUP_DIR=/var/lib/mcci-selfhost/backups MCCI_BACKUP_PASSPHRASE_FILE=/root/.config/mcci-backup/passphrase
scripts/selfhost/backup.sh                       # new encrypted set + verify (non-disruptive, online)
scripts/selfhost/migrate.sh --dry-run            # expect: 17 applied, 3 PENDING
scripts/selfhost/migrate.sh --apply              # each file + its history row in one transaction
scripts/selfhost/migrate.sh --dry-run            # expect: 0 pending
```
Impact: new functions and one private table only; no existing table or data changes; no restart.
Rollback: not needed for additive functions; if anything is wrong, restore the set taken first (README §7).
Check: pgTAP cannot run on staging (test seed removed, docs/18 §6); the same migrations passed 355/355 locally and in
the dry run.

**Done 24 Oct 2026 (approved by the owner), evidence:**

| Check | Result |
|---|---|
| Target | container `supabase-db` (Compose project `mcci-selfhost`, image `supabase/postgres:17.6.1.136@sha256:f371b5f3…`, data `/var/lib/mcci-selfhost/recovery-new/data/db/data`), cluster id `7699865745449013283`; `compose.sh psql-file` and `docker exec` reach the same cluster; the host's own PostgreSQL (another app, id `7695695179632187426`) is not reachable this way |
| Backup before | `mcci-20261024T085935Z`: 7 parts decrypt, checksums OK; restore drill 13/13 PASS (WAL replay, row counts in 102 tables, Vault decrypts, negative control) |
| Review | top-level statements of 0270/0280/0290: only `create function`, `revoke`/`grant` on those new functions, and `create table private.role_permission_defaults as select …` + its primary key, RLS and revoke. No `drop`, `truncate`, `delete`, `update`, `alter` of existing objects, no `create or replace`. DML exists only inside function bodies (runs when an authorised user calls them). No name clashes; all dependencies present |
| Applied | one at a time with `migrate.sh --apply-next` (each file + its history row in one transaction), checked after each: definer + pinned `search_path` on every function; `invite_lookup`/`invite_accept` service role only; the rest `authenticated` only; no `anon` execute on any `api` function |
| History | 20 rows, newest `20261024000290`; `migrate.sh --dry-run`: 0 pending |
| Data | before/after row counts of 93 tables: identical except the new `private.role_permission_defaults` (108 rows, equal to `role_permissions`, RLS on, no client select); `audit_log` unchanged (743) |
| pgTAP | not runnable on staging (seed removed). Ran on an isolated copy: backup `mcci-20261024T090339Z` → restore drill PASS → test container (`--network none`, no ports) + seed → **13 files, 355/355** → container, volumes and directory removed |
| Out of scope, unchanged | nginx fingerprint `9ebe5743f2a9` before and after; stack `.env` last modified 23 Oct; Auth container not restarted; demo still answers 401 without its password; no `app.mcci` nginx file, no `mcci-web` unit |
| Backup sets added | `mcci-20261024T085935Z` (before), `…T090249Z` and `…T090339Z` (after; both drilled PASS) |

Observation (unchanged design, not a defect): `private.normal_email(text)` keeps PostgreSQL's default `EXECUTE` for
PUBLIC; it is a pure validator, and `anon` has no `USAGE` on schema `private`.

### Gate 2 — DNS (owner) and certificate

Owner: Cloudflare `A app.mcci → 169.58.124.24`, **DNS only** (grey cloud). Then:
```bash
cp deploy/web/nginx/app.mcci.aderalabs.tech.http-only.conf /etc/nginx/conf.d/app.mcci.aderalabs.tech.conf
nginx -t && systemctl reload nginx
certbot certonly --webroot -w /var/www/letsencrypt -d app.mcci.aderalabs.tech   # renewed by certbot-renew.timer
```
Impact: a new name on port 80 that answers only the ACME challenge. Rollback: remove the file, `nginx -t`, reload.

**Done 24 Oct 2026 (approved by the owner), evidence:** DNS at both authoritative Cloudflare nameservers
(`robert`, `zariyah`): `A app.mcci.aderalabs.tech → 169.58.124.24`, no AAAA. Stage-1 file installed (did not exist
before), `nginx -t` OK, reload; nginx fingerprint `9ebe5743f2a9` → `29439f6c1dcd` (the new file only). Challenge path
served over the public address; every other path 404. `certbot --dry-run` (staging) OK, then the real certificate:
`CN=app.mcci.aderalabs.tech`, issuer Let's Encrypt YE2, ECDSA, expires 22 Jan 2027, webroot renewal; `certbot renew
--dry-run` for it OK; `certbot-renew.timer` active. Unchanged: demo (401 without its password), aderalabs.tech 404,
tax.aderalabs.tech 307, iqpigeon.com 200 — same as before. Port 443 for the new name is not configured until gate 5.

### Gate 3 — Auth settings and email (owner enters the SMTP values)

Owner, on the server, edits the stack's runtime `.env` (`/var/lib/mcci-selfhost/recovery-new/.env`, never printed):
`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_ADMIN_EMAIL=mcci@aderalabs.tech`. Then (copy first):
```bash
cp -p /var/lib/mcci-selfhost/recovery-new/.env /root/mcci-stack-env.before-gate3        # rollback copy, mode 600
# set (sed in place, values not printed):
#   SITE_URL=https://app.mcci.aderalabs.tech
#   API_EXTERNAL_URL=https://app.mcci.aderalabs.tech/auth/v1
#   SUPABASE_PUBLIC_URL=https://app.mcci.aderalabs.tech
#   ADDITIONAL_REDIRECT_URLS=https://app.mcci.aderalabs.tech/**
#   MAILER_TEMPLATES_{CONFIRMATION,MAGIC_LINK,RECOVERY,EMAIL_CHANGE,REAUTHENTICATION}=https://app.mcci.aderalabs.tech/email-templates/<file>.html
scripts/selfhost/compose.sh config --quiet
scripts/selfhost/compose.sh up -d --no-deps --wait auth storage studio
```
Impact: Auth, Storage and Studio restart (seconds; no users yet). The JWT issuer follows `API_EXTERNAL_URL`, so any
existing session ends (there are none). Rollback: copy the saved `.env` back and run the same `up` line.
Templates are served only after gate 4; until then Auth uses its built-in English emails.

**Done 24 Oct 2026 (approved by the owner), evidence:** SMTP values entered by the owner (host set, port 465 =
implicit TLS, user and password set, `SMTP_ADMIN_EMAIL=mcci@aderalabs.tech`; checked without printing them). Copy
`/root/mcci-stack-env.before-gate3` (600). The owner had also already set `SITE_URL`, `API_EXTERNAL_URL`,
`SUPABASE_PUBLIC_URL`, `ADDITIONAL_REDIRECT_URLS` to the documented values; the gate added the five
`MAILER_TEMPLATES_*` keys and verified that all nine hold exactly the documented values and no other key changed.
`compose.sh config --quiet` OK; `up -d --no-deps --wait auth storage studio`: those three recreated and healthy, the
other six containers kept their start times (db, rest, realtime, pooler, meta, envoy). Auth runs with the public URLs,
the template URLs, the bilingual subjects, SMTP set, `X-Real-IP` rate-limit header; Storage with the public URL and
`S3_PROTOCOL_ENABLED=false`. `/auth/v1/settings` 200 (email on, phone off, autoconfirm off, sign-up on),
`/auth/v1/health` 200, `/storage/v1/version` 200, REST table read 200. SMTP server: TLS handshake OK (no login, no mail
sent). nginx fingerprint and the demo unchanged. The gateway was not recreated: it uses `SUPABASE_PUBLIC_URL` only as a
CORS origin for `/pg/`, which nginx blocks publicly. Not yet verified: an actual email delivery (after gate 5, in the
smoke tests) — until gate 5 the templates are not reachable and Auth is not reachable from outside.
Note for gate 4: with port 465 the app needs `SMTP_SECURE=1` in `/etc/mcci-web/env`.

### Gate 4 — the app service and first release

```bash
useradd --system --home-dir /opt/mcci-web/home --shell /sbin/nologin mcci-web
install -d -o root -g root -m 0755 /opt/mcci-web /opt/mcci-web/releases
install -d -o mcci-web -g mcci-web -m 0700 /opt/mcci-web/home
install -d -o root -g root -m 0700 /etc/mcci-web
install -o root -g root -m 0600 deploy/web/env.example /etc/mcci-web/env     # owner fills in the secrets on the server
install -m 0644 deploy/web/mcci-web.service /etc/systemd/system/mcci-web.service
systemctl daemon-reload && systemctl enable mcci-web
scripts/deploy/release.sh <commit>               # build as mcci-web, switch, wait for /api/health, else roll back
curl -fsS http://127.0.0.1:3200/api/health
```
Impact: a new process on 127.0.0.1:3200 (≈ 200–300 MB RAM; 7.7 GB available). Not reachable from outside yet.
Rollback: `systemctl disable --now mcci-web`.

**Part 1 done 24 Oct 2026 (approved by the owner):** system user `mcci-web` (uid 990, shell `/sbin/nologin`, password
locked, no sudo rights, not in wheel); `/opt/mcci-web` and `/opt/mcci-web/releases` (root, 755),
`/opt/mcci-web/home` (mcci-web, 700), `/etc/mcci-web` (root, 700); `/etc/mcci-web/env` from `deploy/web/env.example`
(root, 600); `/etc/systemd/system/mcci-web.service` (644, SELinux `systemd_unit_file_t`), `daemon-reload` only — the
unit is **disabled and inactive** until the first release (enable after it, so a reboot before then does not start a
restart loop). Port 3200 free; nginx and the stack unchanged (9/9 healthy). Next: the owner fills in
`/etc/mcci-web/env` (publishable and secret key from the stack `.env`, SMTP values with `SMTP_PORT=465` and
`SMTP_SECURE=1`); then `scripts/deploy/release.sh <commit>` and `systemctl enable mcci-web`.

**Part 2 verified 24 Oct 2026 (10:24 UTC, read-only re-check):** release `e20dcc2` is `/opt/mcci-web/current`;
`mcci-web` **enabled and active** since 12:11:08 CEST, 0 restarts, running as `mcci-web`; `/api/health` → 200
`{"ok":true,"release":"e20dcc2"}`; listens on `127.0.0.1:3200` only; `/etc/mcci-web/env` root 600 with exactly one
`SMTP_SECURE=1`, also present in the running process; secret scan of the deployed release
(`scripts/security/scan-client-bundle.mjs` as `mcci-web`): 0 findings in 46 client files and 415 tracked files.
Nginx (`nginx -t` OK, fingerprint `39965382`), the demo (401 basic auth, site file unchanged, 86 files), the five
other sites (same answers as every baseline) and the stack (9/9 healthy, 20 migrations recorded up to 0290) unchanged.
**Not yet verified:** an SMTP login and an actual email delivered through the app (needs Gate 5 and a real address).

### Gate 5 — go public on the new name

**Preview 24 Oct 2026 (read-only, nothing changed):** DNS `app.mcci.aderalabs.tech` A → 169.58.124.24 (no AAAA);
certificate issued (Let's Encrypt, valid to 2027-01-22); installed stage-1 file identical to the repository's; the
email-templates directory holds the 5 templates (`httpd_sys_content_t`); a full temporary copy of `/etc/nginx` with
the stage-2 file swapped in passes `nginx -t`; only this one file differs, every other site file is identical;
upstreams `127.0.0.1:3200` and `127.0.0.1:18000` are loopback-only. Backup before applying:
`cp -a /etc/nginx /root/nginx-backup-<UTC stamp>` + `diff -r`. Note: once applied, the Supabase Auth API is public on
this name, so anyone who finds the URL can register (email confirmation still required; staff access still needs an
invitation + TOTP); and HSTS tells browsers to use HTTPS for this host for one year.

```bash
cp deploy/web/nginx/app.mcci.aderalabs.tech.conf /etc/nginx/conf.d/app.mcci.aderalabs.tech.conf
nginx -t && systemctl reload nginx
```
Impact: `https://app.mcci.aderalabs.tech` serves the app and the four client APIs. Rollback: stage-1 file back,
`nginx -t`, reload.

**Attempt 1, 24 Oct 2026 (approved by the owner) — failed smoke tests, rolled back.** Backup
`/root/nginx-backup-20261024T102837Z` (`diff -r` clean), stage-2 file installed, `nginx -t` OK, reload. TLS, HSTS,
the blocked endpoints, Supabase routing and `/ur` were fine, but every English page answered **500** and `/portal`
redirected to `https://localhost:3200/login`. Rolled back as instructed: stage-1 file back, `nginx -t`, reload;
fingerprint `39965382` again, `diff -r` against the backup clean, demo 401, other sites unchanged (notes in
`ROLLBACK-gate5.txt` inside the backup). **Cause (app, not nginx):** the unit ran `next start -H 127.0.0.1`. Inside
middleware Next.js renames 127.0.0.1 to `localhost`, so next-intl's rewrite `/` → `/en` became
`https://localhost:3200/en`, which Next treats as a different origin and proxies as an external URL (TLS to a plain
HTTP port → 500). Redirects were also built from that loopback origin. **Fix (commit after `43b4231`):** the unit binds
`-H localhost` with `NODE_OPTIONS=--dns-result-order=ipv4first` (still 127.0.0.1 only, which nginx proxies to), and
middleware re-bases same-origin redirects on `APP_URL` when `X-Forwarded-Host` is APP_URL's host
(`lib/net/public-url.ts`). Verified locally against a production build with the proxy's headers: `/`, `/login`,
`/register`, `/ur`, `/ur/login` 200; `/portal`, `/ur/portal`, `/admin`, `/en/login`, `/auth/confirm` redirect to
`https://app.mcci.aderalabs.tech/…`; listener `127.0.0.1` only. To apply: install the new unit
(`install -m 0644 deploy/web/mcci-web.service /etc/systemd/system/` + `daemon-reload`), `release.sh <commit>`, check
on loopback with the proxy headers, then Gate 5 again with a new backup.

**Attempt 2, 24 Oct 2026 — applied, smoke tests passed.** Release `6b47981` via `release.sh` (health OK), then the
new unit from that release (old unit kept in `/root/mcci-web.service.bak-20261024T105529Z`), `daemon-reload`,
restart: health `{"ok":true,"release":"6b47981"}`, listener `127.0.0.1:3200` only, `NODE_OPTIONS` in the process.
Loopback with the proxy headers: EN/UR pages 200 (`lang`/`dir` right), redirects to `https://app.mcci.aderalabs.tech/…`,
no errors in the journal. Gate 5: backup `/root/nginx-backup-gate5b-20261024T105636Z` (`diff -r` clean, 33 files),
the reviewed stage-2 file (sha256 `3c0b1f726030ce90…`) installed, `nginx -t` OK, reload 10:56:37Z; fingerprint
`39965382` → `d856d27a`, `diff -rq` against the backup: only this file. External HTTPS checks (from outside):

| Check | Result |
|---|---|
| App | `/`, `/login`, `/register`, `/login/forgot`, `/ur`, `/ur/login`, `/ur/register`, `/invite/<bad>` 200; `/api/health` 200 release `6b47981`; `/` `lang="en" dir="ltr"`, `/ur` `lang="ur" dir="rtl"` |
| Redirects | `/portal`, `/ur/portal`, `/admin`, `/en`, `/en/login`, `/auth/confirm` (bad token) → `https://app.mcci.aderalabs.tech/…`; `http://` → 301 `https://` |
| TLS / headers | Let's Encrypt `CN=app.mcci.aderalabs.tech` to 2027-01-22; TLS 1.2 + 1.3, TLS 1.1 refused; HTTP/2; HSTS `max-age=31536000`, nosniff, Referrer-Policy, `X-Frame-Options DENY`, `X-Robots-Tag noindex, nofollow` |
| Supabase API | `/auth/v1/health` 200 with the publishable key, 401 without; settings: signup on, autoconfirm off, phone off; `/rest/v1/companies` as anon → 401 (42501, no grant); `/storage/v1/bucket` anon → `[]`; `/storage/v1/s3` 404; Realtime websocket → 101 |
| Blocked | `/pg/`, `/pg/tables`, `/mcp`, `/api/mcp`, `/functions/v1/x`, `/graphql/v1/`, `/graphql/v1`, `/realtime/v1/api/tenants`, `/project/default` → 404 |
| Auth rate limit | 40 wrong sign-ins from one outside address, each with a different spoofed `X-Real-IP`/`X-Forwarded-For`: 39 × 400 then 429 (30 per 5 min + refill) — the proxy overwrites the header |
| Email templates | 5 × 200 `text/html` |
| Unchanged | other site files same sha256 prefixes (`fe55b2ab 159e9bdb 5581210d 029d1920 5a222ab2 ba25b003 5d64f463`); aderalabs.tech 200, www 301, fintax 200, tax 307, api.tax 404, iqpigeon.com 200, whatsappapi.iqpigeon.com 200; demo 401 realm "MCCI demonstration", 86 files; stack 9/9 healthy |
| SMTP | app transport `verify()` from the server: connected, implicit TLS (465), AUTH accepted; the Auth container uses the same host, port, user and password (compared, not printed), sender `mcci@aderalabs.tech`, `SITE_URL` and the confirmation template on the live name. **Delivery FAILED** (owner's test, 24 Oct 11:11 UTC): Auth sent the bilingual MCCI confirmation email and `mail.aderalabs.tech` accepted it, but the host's outbound relay MailChannels refused it to Gmail — bounce `550 5.7.1 [CS] Message blocked` (content scanner; txid `14e906596a670f09`). `aderalabs.tech` has SPF and DKIM (`default`) but no DMARC. Decision needed: report the false positive to the host, or move app + Auth SMTP to a transactional provider with its own DKIM/SPF + a DMARC record |

### Then — first Secretary General and smoke tests (no infra change)

1. The Secretary General registers at `https://app.mcci.aderalabs.tech/register` and opens the confirmation email.
2. `scripts/selfhost/first-secretary-general.sh <their email>` (refuses if any active staff already exists).
3. They sign in on the Staff tab and set up 2-step login; from `/admin/staff` they invite everyone else.
4. Smoke tests against the live name: `/`, `/login`, `/api/health`, register + email, email code, password reset,
   staff TOTP, invitation round trip, `/admin/staff`, `/portal/profile`, Auth rate limit (30 bad sign-ins → 429),
   `/pg/` and `/realtime/v1/api/` → 404, TLS and HSTS headers.

Updating later: `scripts/deploy/release.sh <new commit>` (gate 1 first when the commit adds migrations).
Rolling back the app: `scripts/deploy/release.sh --rollback`.

### Gate 6 — membership application (M3): migration 0300 + release (awaiting the owner's approval)

Review of `supabase/migrations/20261024000300_app_wizard.sql` against production (read-only checks, 25 Oct 2026):

| Change | Effect on what exists |
|---|---|
| `insert into private.settings ('membership', {"stampRequiredForProprietor":false,"requireEndorsersAtSubmit":false}) on conflict do nothing` | new row only (production has 12 keys, no `membership`); no existing setting changes |
| `create or replace view public.public_settings` — key list `chamber, fees, lang, app` → `+ membership, sla` | same columns (`key text, value jsonb`), same `security_invoker=false`; PostgreSQL keeps owner and grants on replace (now `anon=r`, `authenticated=r`, `service_role`); 0 dependent views. Newly public: the two rules above and `sla` (`{"hours":24,"processDays":15}`), nothing secret |
| `grant update (field_confidence) on public.applications to authenticated` | applicants may write the AI confidence of their own draft (RLS `app_editable`: own company, draft/returned, Owner/Manager) |
| new functions `private.class_of`, `private.app_missing`, `api.app_start`, `api.app_missing`, `api.app_doc_remove`, `api.app_submit`, `api.app_resubmit`, `api.app_withdraw`, `api.ai_extraction_finish` | none of the 9 names exist in production; all `security definer` with `search_path = ''`, revoked from `public`/`anon`, granted to `authenticated` only |
| no `drop`, `alter`, `update`, `delete`, `truncate` of existing objects or data | production has 0 applications, 0 companies, 0 members, 2 profiles — no data is touched |

Tests: pgTAP 386/386 in the dry run (includes `130_app_wizard`, 31 checks); unit 216/216; e2e 239 passed, 0 failed.

Plan (each step stops on the first error):
```bash
export MCCI_BACKUP_DIR=/var/lib/mcci-selfhost/backups MCCI_BACKUP_PASSPHRASE_FILE=/root/.config/mcci-backup/passphrase
scripts/selfhost/backup.sh                    # encrypted set + verify; then restore drill on it (README §7)
scripts/selfhost/migrate.sh --dry-run         # expect: 20 applied, 1 PENDING (0300)
scripts/selfhost/migrate.sh --apply-next      # 0300 + its history row in one transaction
scripts/selfhost/migrate.sh --dry-run         # expect: 0 pending
# verify: 9 functions definer + pinned search_path, no anon execute; public_settings 6 keys and same grants;
# row counts unchanged; then pgTAP 386/386 on an isolated restored copy (as for gate 1)
scripts/deploy/release.sh <commit>            # app build + atomic switch + health check (auto-rollback)
```
`/etc/mcci-web/env` keeps `AI_EXTRACTION` unset/off: the OpenAI key alone does not enable document reading.
Rollback: the app with `release.sh --rollback` (the previous release still runs on the old schema: it never calls
the new functions or the new view keys). The migration is additive; to undo it fully, restore the backup taken first
(downtime of the restore; only applications created after the migration would be lost).

**Gate 6 done 25 Oct 2026 (approved by the owner), evidence:**

| Check | Result |
|---|---|
| Tooling | `/opt/mcci-deploy-4dd464c` (detached at `4dd464c`); migration file sha256 `5f1277f52015010e…` = reviewed file; stack compose files and selfhost scripts identical to `1b29934` |
| Backup before | `mcci-20261025T045402Z`: 7 parts decrypt, checksums OK; restore drill 13/13 PASS (WAL replay, roles/schemas/policies/55 functions, row counts in 103 tables, Vault decrypts, negative control); drill removed |
| Ledger | dry run: 20 applied, exactly 1 pending (`20261024000300_app_wizard`); `--apply-next` → 21 rows, 0 pending |
| Permissions | the 7 new `api` functions: definer, `search_path=""`, execute for `authenticated` only (no `anon`, no PUBLIC); `private.app_missing`: no client execute; `private.class_of`: pure invoker function with default execute, unreachable to clients (no `private` schema usage), same as `private.normal_email` |
| View | `public_settings` = `chamber, fees, lang, app, membership, sla`; `security_invoker=false`, owner and grants unchanged; anon sees 6 keys |
| Data | 94 tables before/after: only `private.settings` 12→13, `audit_log` 745→746 (the audited insert), ledger 20→21 |
| Backup after | `mcci-20261025T045933Z`: restore drill 13/13 PASS (64 functions). pgTAP on that copy did not run (the drill had already removed its container; nothing left behind) — covered by the dry run 386/386 on the same image |
| Release | `release.sh 4dd464c`: built as `mcci-web`, switched `1b29934 → 4dd464c`, health `{"ok":true,"release":"4dd464c"}`; `1b29934` kept for `--rollback`; `sharp` loads as `mcci-web` |
| Smoke (no account) | `/`, `/login`, `/register`, `/ur`, `/ur/login`, `/ur/register`, `/api/health` 200; `/portal`, `/portal/join`, `/ur/portal/mtrack`, `/portal/form` → login with `next`; no errors in the journal |
| AI | process has `OPENAI_API_KEY` (167 chars) and no `AI_EXTRACTION` → document reading off (unit test: the key alone never enables it) |
| Unchanged | nginx fingerprint `d856d27a`; aderalabs.tech, fintax, iqpigeon.com, whatsappapi 200; demo 401; stack 9/9 healthy |

Member smoke (sign-in, application, upload, submit, receipt email) is done by the owner with their own account; the
server-side results are checked afterwards. Until the staff review desk (Release 2), submitted applications are listed
for MCCI by a read-only query on request.

### Gate 7 — Release 2: staff review (migration 0310 + release; awaiting the owner's approval)

Review of `supabase/migrations/20261025000310_staff_review.sql` against production (read-only, 25 Oct 2026):

| Change | Effect on what exists |
|---|---|
| `create or replace function private.staff_level` — returns 0 unless the JWT says `aal = aal2` | the only change to existing behaviour: 10 functions and 52 policies use it, so every staff right now also needs a 2-step session (docs/09). Production has 0 staff rows and 0 verified authenticators, so nobody is affected today; members are not affected (they never had staff levels) |
| `update private.settings` (`membership` gains `checklist: docs, identity, ntn, address`) | only when the key is absent; existing keys kept |
| `alter table public.email_log add column created_by, application_id, error` + index + policy `email_log_select_mem` | nullable columns on an empty table (0 rows); the existing `email_log_select` policy unchanged |
| new functions `private.staff_name`, `private.app_email`, `private.app_notify` (no client execute), `api.app_open`, `app_check`, `app_edit_field`, `app_set_class`, `app_return`, `app_verify`, `app_reject`, `email_mark` | none of the 11 names exist; `api` ones definer + `search_path=""`, `authenticated` only |
| no drop / delete / truncate | 0 applications in production |

Tests: pgTAP dry run 427/427 (new `140_staff_review`, 41 checks; every existing staff test passes with 2-step sessions);
unit 216/216; e2e 277 passed, 0 failed (new `review.spec.ts`: return → correct → resubmit → verify).

Plan: same steps as gate 6 (backup + restore drill → dry run expects exactly 1 pending → `--apply-next` → verify
functions, policy, columns, unchanged counts → `release.sh <commit>` → smoke). Then, for the review desk to have users:
the Secretary General registers, `scripts/selfhost/first-secretary-general.sh <email>`, sets up 2-step login and
invites officers from `/admin/staff`. Rollback: `release.sh --rollback` (the Release 1 app works on the new schema;
staff could not use it anyway); full undo of 0310 = restore the backup taken first.

**Gate 7 done 25 Oct 2026 (approved by the owner: "make live … membership application process"), evidence:**
backup `mcci-20261025T061903Z` verified, restore drill 13/13 PASS; migration file sha256 `ec7303bf…` = reviewed; dry
run exactly 1 pending → `--apply-next` → ledger 22, 0 pending; 8 `api` functions definer + `search_path=""`,
`authenticated` only; `private.app_email/app_notify/staff_name` no client execute; `private.staff_level` requires
aal2; `email_log` + 3 columns + policy `email_log_select_mem`; `membership.checklist` added; 94 tables before/after:
only `audit_log` +1 and the ledger +1. Release `156aa3e` live (health OK; `4dd464c` kept for rollback).

**AI document reading switched on 25 Oct 2026 (owner: "it should be enabled"):** `/etc/mcci-web/env` copied to
`/root/mcci-web-env.before-ai-on-<UTC>`, `AI_EXTRACTION=on` added (the key was already there); the running process has
it. Live check with a synthetic NTN certificate (no real data): `gpt-4.1-mini-2025-04-14`, strict JSON schema, 2.6 s,
all four fields read correctly. Switch off again: remove the line (or set `off`) and `systemctl restart mcci-web`.

### Gate 8 — Release 3: proposer & seconder + Members Register (migration 0320 + release)

**Done 25 Oct 2026 (owner: "commit and push to live what we have built"), evidence:** tooling `/opt/mcci-deploy-057713d`,
migration file sha256 `881376fd…` = tested file; backup `mcci-20261025T093603Z` verified, restore drill 13/13 PASS;
dry run exactly 1 pending → `--apply-next` → 0 pending; 11 `api` functions definer + `search_path=""`, no `anon`;
`end_code_issue` and `end_jobs` service role only; new `private` helpers no client execute; `public_settings` =
`app, chamber, endorse, fees, lang, membership, sla`; data unchanged (1 application, 0 members, 0 endorsements).
Release `057713d` live (health OK; `156aa3e` kept for rollback); `/portal/endorse`, `/admin/members` → login;
`POST /api/cron/endorsements` without the secret → 401. Tests before release: pgTAP 480/480 in the dry run, unit
216/216, e2e endorse + review + application + a11y/orphans/overflow/access green.
First Secretary General: `secretary-mcci@aderalabs.tech` (demo address, to be replaced on the MCCI domain), via
`first-secretary-general.sh`.
**Not yet on:** the hourly endorsement job (reminder on day N, expiry). It needs `CRON_SECRET` in `/etc/mcci-web/env` and a
timer; until then requests stay open past 7 days and reminders are sent by hand (Send reminder).

### Gate 9 — Release 4: Membership Committee decisions (migration 0330 + release; awaiting the owner's approval)

Review of `supabase/migrations/20261026000330_committee_decisions.sql` against production (read-only, 25 Oct 2026:
0 meetings, 0 agenda items, 0 vouchers, 0 members, 1 application not yet with the committee; sequences
`member_no_c/_a` unused at 1134 / 2205; none of the new names exist):

| Change | Effect on what exists |
|---|---|
| `applications.member_no` (unique, format `MCCI-[CA]-n`) | new nullable column; no client grant (column grants are explicit) |
| `meetings` + `name`, `minutes`, `created_by` (on delete set null); checks on `status` (Pending/Approved) and `committee` | table is empty |
| unique partial indexes on `committee_items`: one open item per application, one final decision per application | table is empty |
| `meeting_seq` (MC-2026-01 …), revoked from every API role | new |
| `notifications` + `template`, `vars` (portal messages rendered in the reader's language) | nullable / default `{}`; older rows keep their English text |
| `settings.bank` gains `"confirmed": false` (only when absent) | vouchers show "to be confirmed by MCCI" instead of the placeholder account (docs/14 item 4) |
| trigger `applications_to_committee` (after update of stage → committee) | places the file on the earliest open Membership Committee meeting; nothing in production is in committee |
| new functions: `api.cmt_meeting_create`, `cmt_minutes`, `cmt_decide`, `cmt_approve_all`, `voucher_view` (definer, `search_path=""`, `authenticated` only); `private.alloc_member_no`, `app_fee`, `app_notify_t`, `cmt_place`, `cmt_decide_one`, `app_to_committee` (no API role) | none exist |
| `api.member_add` replaced (same signature/grants): typed or allocated numbers also checked against committee allocations | behaviour otherwise unchanged |
| no drop / delete / truncate | — |

Rules enforced in the database: decisions `cmt ≥ 3` (Committee Secretary, SG) with a 2-step session, meetings and
minutes `cmt ≥ 2`; only a file in `committee` with an open item on that meeting; on or after the meeting date; defer
and reject need the committee's reason; one final decision per file (row lock + unique index); approval allocates the
next unused number of the class, creates one Unpaid membership voucher from `settings.fees` (Women rates, extra cards)
due after `settings.voucher.dueDays`, moves the file to `payment`, writes history, audit reason, portal message and the
queued email. Tests: pgTAP 510/510 locally (new `160_committee`, 47 checks); unit 226/226; e2e see below.

Plan: same steps as gates 6–8 (backup + restore drill → dry run expects exactly 1 pending → `--apply-next` → verify
functions/grants, columns, indexes, trigger, settings, unchanged counts → `release.sh <commit>` → smoke).
Rollback: `release.sh --rollback` (the Release 3 app ignores the new columns and functions); full undo = restore the
backup taken first.

E2E: full suite 365 passed, 2 failed, 1 not run (192 skipped by project). The 2 failures were fixed: a real bug (the
success message vanished when the last file left the agenda: the agenda now stays mounted) and a stale shell test
(Endorsement Requests is built since Release 3); the affected 69 tests (committee, shells, a11y/orphans/overflow of the
new pages, all projects) then passed. Dry run (`pnpm db:dry-run`): all migrations + seed + pgTAP, 0 failures.
Also fixed during testing: two meetings scheduled at the same moment could both try to place the same waiting file
(the unique index refused the second; `cmt_place` now locks the application first), and forms no longer clear their
fields when the server refuses (meetings, Members Register).

**Gate 9 done 25 Oct 2026 (approved by the owner with conditions 1–8), evidence:** tooling `/opt/mcci-deploy-784d9b1`;
migration sha256 `3e540980a9c9c767` on the server = committed = reviewed. Backup `mcci-20261025T103257Z`: 7 parts
decrypt, checksums OK; restore drill 13/13 PASS (92 functions, 103 tables / 1,962 rows, Vault + negative control),
drill removed. Isolated dry run at `784d9b1`: all migrations + seed + pgTAP, 17 files, 0 failures, no rows left behind.
Production dry run: exactly 1 pending (0330) → `--apply-next` (one transaction) → 0 pending. Verified: 5 `api`
functions definer + `search_path=""`, `authenticated` only (no anon, no service role); 6 `private` helpers and
`next_member_no` no client execute; no client INSERT/UPDATE on the new columns; `meeting_seq` unusable by clients;
4 indexes and trigger `applications_to_committee` present; `settings.bank.confirmed = false`; `public_settings` keys
unchanged; member-number sequences untouched (1134 / 2205); row counts in 93 tables unchanged except `audit_log`
790 → 791 (the audited bank flag). Release `784d9b1` live (`057713d` and `156aa3e` kept; health
`{"ok":true,"release":"784d9b1"}`). Smoke: `/`, `/ur`, `/login`, `/register`, `/ur/login` 200; `/portal`,
`/portal/payments`, `/ur/portal/payments` (→ `/ur/login`), `/portal/mtrack`, `/admin`, `/admin/committee`,
`/admin/meetings`, `/admin/mreview`, `/admin/members` → login with `next`; cron without secret 401; anonymous RPC 401;
no errors in the journal. Process: `AI_EXTRACTION=on` and the OpenAI key present (unchanged); no `CRON_SECRET`, no
jobs unit or timer (condition 8). Stack 9/9 healthy; `nginx -t` OK, nothing changed; aderalabs.tech, iqpigeon.com 200.
Signed-in smoke of the committee screens is done by the Secretary General with their own account.

### Incident 25 Oct 2026 — staff sign-in 502 ("Application error: a client-side exception"); nginx fix awaiting approval

**Root cause.** nginx answered the sign-in server action (`POST /login`) with 502 "upstream sent too big header"
(3 entries in `/var/log/nginx/error.log`, 11:41 server time); the app itself logged no error. nginx keeps a proxied
response's headers in one buffer, `proxy_buffer_size`, which defaults to one memory page (4096 B on this server) and
was not set for the app. Sign-in responses carry the Supabase session cookie, which grows with the account's metadata
(copied into the JWT, the user and the identity) and its 2-step factors: the Secretary General's account (186 B of
metadata, one unfinished 2-step set-up) needs about 4.46 KB of headers for the sign-in and 4.41 KB for the 2-step
confirmation. The browser's server-action client cannot read nginx's 502 page and shows "Application error". Not
caused by Release 4's code (`784d9b1` and `057713d` send the same headers); it appeared with the first staff sign-in.
Session refreshes on ordinary page loads write the same cookie, so they could fail the same way.

**Reproduced locally** with the production build behind nginx 1.20.1 (the production version) and a production-shaped
staff account: the old app block gives exactly "Application error: a client-side exception" and "upstream sent too big
header … POST /login"; with the fix, sign-in → 2-step set-up → `/admin` → `/admin/committee` → `/admin/meetings` work,
and the committee, review and endorsement flows (9 tests) pass through nginx with no 5xx.

**Fix** (`deploy/web/nginx/app.mcci.aderalabs.tech.conf`, app `location /` only — no other location, site or server
setting): `proxy_buffer_size 16k; proxy_buffers 8 16k; proxy_busy_buffers_size 32k;`. Guarded by
`tests/unit/deploy-web.test.ts` and `tests/e2e/login-headers.spec.ts` (fails while the config leaves the 4 KiB default).

**Plan (needs the owner's approval: nginx change):**
```bash
cp -a /etc/nginx/conf.d/app.mcci.aderalabs.tech.conf /root/nginx-app.mcci.before-headerfix-$(date -u +%Y%m%dT%H%M%SZ).conf
diff /etc/nginx/conf.d/app.mcci.aderalabs.tech.conf /opt/mcci-deploy-<fix>/deploy/web/nginx/app.mcci.aderalabs.tech.conf
#   expect only the comment and the three proxy_buffer lines in the app location
install -m 0644 /opt/mcci-deploy-<fix>/deploy/web/nginx/app.mcci.aderalabs.tech.conf /etc/nginx/conf.d/
nginx -t && systemctl reload nginx        # reload only when the test passes (graceful, no restart)
```
Verify: `nginx -t` OK; app health 200; aderalabs.tech, iqpigeon.com and the other sites unchanged; the Secretary General
signs in (staff tab) and completes the 2-step set-up; `grep -c "too big header" /var/log/nginx/error.log` does not grow.
No app release and no migration: production stays on `784d9b1` (`057713d` kept). Rollback: copy the saved file back,
`nginx -t && systemctl reload nginx`.

### Gate 10 — Release 5: payments and temporary membership (migration 0340 + release; awaiting the owner's approval)

Review of `supabase/migrations/20261026000340_payments_temporary.sql` (sha256 `c94ad94cfcdb318e`) against production
(read-only, 25 Oct 2026: 0 vouchers, 0 receipts, 0 documents, 0 temporary memberships, 0 print items, 0 members,
2 draft applications; `settings.bank.confirmed = false`; none of the new names exist):

| Change | Effect on what exists |
|---|---|
| `payment_receipts.path` nullable + `method` (upload / counter) + check that uploads have a path | table is empty |
| `private.voucher_accepts_receipt` replaced: also requires `settings.bank.confirmed`; PUBLIC/anon execute revoked (left by 0230; anon has no usage on `private`, so it was unreachable) | the storage policy for receipts now refuses uploads until MCCI confirms the bank account (matches the "do not pay yet" notice) |
| new `api` functions: `pay_upload`, `pay_verify`, `pay_counter`, `pay_reject`, `voucher_cancel`, `voucher_reissue`, `temp_issue`, `temp_extend`, `temp_revoke`, `qr_revoke`, `cert_view`, `settings_bank_save`, `settings_bank`, `temp_policy` (definer, `search_path=""`, `authenticated` only); `doc_verify`, `temp_jobs`, `voucher_jobs` (service role only) | none exist |
| new `private` helpers: `bank_confirmed`, `membership_year_end`, `company_notify_t`, `company_email`, `temp_issue`, `voucher_paid`, `pay_settle` (no API role) | none exist |
| no drop / delete / truncate; no settings changed | — |

Rules enforced in the database: receipts only for an Unpaid / Rejected voucher of the uploader's company (area pay ≥ 2),
only after the bank account is confirmed, with the file stored under that voucher; verify / reject / counter payment /
cancel / reissue pay ≥ 2 with a 2-step session; a Paid membership voucher issues the temporary membership in the same
transaction (settings.temp.autoIssue): member with the committee's number (Temporary, valid to 31 March), temporary
certificate with an unguessable QR code, 60-day temporary membership, print-queue item, company particulars from the
approved form; extend / revoke temp ≥ 3 with a reason (max extensions from settings); QR revoke docs ≥ 3; the bank
account (settings.save) plat ≥ 2, Pakistani IBAN format, the placeholder can never be saved. Public verification
(`/verify`, `/verify/<code>`, `/api/verify/<code>`) goes through the server with a per-address rate limit (30/min) and
shows only title, holder, number, status, validity; every lookup is counted.

New screens: admin Payments, Vouchers & Receipts, Temporary Memberships, Documents & QR, the staff Dashboard (queues
and figures per designation); member Payments (receipt upload once the bank is confirmed), My Documents (certificate
with QR, print, share), My Membership certificates; public Verify. Jobs: `POST /api/cron/daily` (temporary alerts /
expiry, past-due vouchers) — not scheduled; the timer stays a separate approval.

Tests: pgTAP `170_payments_temporary` 56 checks, all files 566/566 locally; isolated dry run 0 failures, no rows or containers left; unit 231/231; e2e `payments.spec.ts`
(counter payment → temporary membership → certificate → public verify → extend → revoke; bank confirm → upload →
reject → upload → verify, emails sent) 4/4; full suite (all projects, 713): 478 passed, 1 failed, 234 skipped
(project-specific), 0 timed out. The failure is the Release 2 review test (not changed by this release); see below.

**Open issue (pre-existing, under investigation): officer actions cancelled by the browser under heavy load.** The
review test failed once in 713. Investigated with evidence: run one at a time, 11/11 repeats pass; with 4 copies in
parallel on the development laptop, about a quarter of the officer's server-action requests end in net::ERR_ABORTED in
the browser — no page reload (document loads counted), no console error, no server error, no database lock or error,
no Auth error; the decision is then not shown (or, if the server had committed it, shown only after a reload). Ruled
out: test wait times (15 s), stale build, token refresh, realtime, app navigation code, a second refresh after the
action, a second click during the update (both experiments changed nothing and were reverted). The review screen is
unchanged since Release 2 (live). Next step: reproduce outside the test runner with network/CPU throttling and, if it
is Next.js's client action handling, report a fix upstream or retry the action safely (decisions are idempotent).

Plan: as gates 6–9 (backup + restore drill → isolated dry run → production dry run exactly 1 pending → `--apply-next`
→ verify → `release.sh <commit>` → smoke). Rollback: `release.sh --rollback` (the Release 4 app does not call the new
functions; the receipt storage rule only adds a condition); full undo = restore the backup taken first.

**Gate 10 done 25 Oct 2026 (approved by the owner with conditions), evidence:** pre-check of the Release 2 review issue
in production: no application ever submitted, no document reviewed, no email sent, history only "created" — no staff
decision can have been lost; the only staff entries are the SG's own draft (as an applicant) and four audited changes of
one designation limit (Services Officer / dash 1→2→3→0→1, matching the table). Tooling `/opt/mcci-deploy-fbdeba0`;
migration sha256 `c94ad94cfcdb318e` = reviewed; backup `mcci-20261025T151058Z` verified, restore drill 13/13 PASS, drill
removed; production dry run exactly 1 pending → `--apply-next` → 0 pending. Grants and receipt storage policies
identical to the tested local database (27 lines); `payment_receipts.path` nullable + `method`; bank still not
confirmed; `public_settings` keys unchanged; row counts in 93 tables identical to the baseline. Release `fbdeba0` live
(`784d9b1`, `057713d` kept); health OK. Smoke: `/`, `/ur`, `/login`, `/verify`, `/ur/verify`, `/verify/<code>` 200
(unknown code → "no document", bad code → "invalid"); `/api/verify` 404 / 400; `/admin`, `/admin/payments|psid|temp|
documents|committee`, `/portal/payments|documents|membership` (and `/ur`) → login; `POST /api/cron/daily|endorsements`
without the secret 401; with the public key, every new `api` function → 42501 permission denied, receipts upload
refused by RLS, receipts listing empty. AI extraction on; no CRON_SECRET, timer or jobs unit; 1 staff with verified
2-step; nginx unchanged (app `7cbb0f72…`, others `9ebe5743…`), `nginx -t` OK; all 10 hosted sites as before (demo 401).

**Found after the switch (open, user-facing): edits lost in an application form left open across a release.** A member
had `/portal/join` open from before 17:21; since the switch its autosave calls the old build's action ids → 404
"Failed to find Server Action" (14 log lines). The wizard clears its pending changes before calling `saveDraft`; when
the call throws, they are dropped and "Saving…" stays — no error is shown. Not caused by Release 5's code: any release
does this to an open form. Fix (next): keep the pending changes when a save throws, show "MCCI Digital was updated —
reload the page" (with the values still on screen), and add Next.js version-skew handling (deploymentId) so stale tabs
reload; until then, announce releases and ask members to reload open forms.

### Phase A — reliability fixes (after Release 5; local, not yet deployed)

Findings (evidence in the session log, 26 Oct 2026):
- **Form edits lost across a release** — confirmed: the wizard cleared its pending changes before `saveDraft`, a call
  from a tab of the older build throws `UnrecognizedActionError`, nothing caught it, "Saving…" stayed.
- **Review actions under load** — the browser cut off action and page-data requests (net::ERR_ABORTED) only when 3–4
  browsers loaded the one laptop server; always at the moment a page-data fetch (router refresh / navigation) started.
  Ruled out with evidence: test timing, stale build, database locks/errors, Auth token refresh, realtime, app navigation
  code, page reloads, Node keep-alive (70 s → no change), `revalidatePath` (removed → no change). In one browser with a
  slow network (400 ms, 60 KB/s) and 4× slower CPU every run passes, with harmless cut-offs of response tails after the
  result arrived. Some cut-off actions never settled on the client (no success, no failure). The exact trigger inside
  Next.js's client under that load is not identified.

Fixes:
- `lib/client/call-action.ts`: every browser call of a server action goes through `callAction` / `guardForm` /
  `ActionForm`; the server's own answer is passed through; a thrown call becomes "stale" (older/newer release: reload,
  nothing saved by this click) or "unconfirmed" (cut off: reload to check), and an action with no answer in 45 s is
  "unconfirmed" — never silent, never shown as done. Next.js redirects are re-thrown (`unstable_rethrow`).
- Application form: unsaved edits kept in this browser before each save and removed only after the server confirms; on
  failure they are merged back; "Not saved — Retry" or "MCCI Digital was updated — Reload"; after a reload they are
  restored and saved.
- Review screen: decisions the server confirmed are shown at once (not dependent on the refresh); one action at a time,
  buttons locked until the action and its refresh finish; no `revalidatePath` (pages are force-dynamic).
- Sign-in, 2-step and invitation forms, Staff & Roles, company people, committee, payments, temporary membership,
  endorsement and document actions all use the same handling (the nginx 502 at sign-in would now show an error, not a
  crash).

Tests: unit 237/237 (new `call-action.test.ts`: stale vs unconfirmed, server answers passed through, form state kept,
redirects re-thrown, no-answer timeout); e2e `reliability.spec.ts` 3/3 (form across a release: kept, said, restored and
saved after reload; connection cut: Retry saves; staff action cut off: "not confirmed", database unchanged, retry works);
full suite 482 passed, 0 failed, 240 skipped. Under the artificial 4-browser stress on the laptop the review test still
fails 3–4 of 10 runs (slow/cut-off navigations and actions) — now always with an explicit outcome; to be re-measured
against the Linux server build before calling the cause closed.

### Phase B — demo mode for presentations (migration 0350)

Five synthetic, labelled DEMO accounts for the meeting, without fabricating official records: `companies.demo` marks a
demo company; demo members are Permanent with `DEMO-A-01` / `DEMO-C-01` numbers (never from the official sequences),
not publicly listed; demo members endorse demo applicants only and real members real ones (`endorse_why`, candidate
list); demo files are never placed on a committee agenda nor decided (no membership number, no voucher); official
counts and lists (register, dashboard, pipeline counts, Committee Desk) leave demo out (the pipeline table shows demo
files marked DEMO). The SG creates them in **Members Register → Demo members** with a mailbox per person (invitation and
6-digit signing codes go there); each person sets their own password. **Reset after the meeting:** Members Register →
Demo members → **Remove all demo data** (`api.demo_clear` + service-role cleanup of demo sign-in accounts and files);
each demo company also carries `demo_expires_at`. Fallback (SQL, removes rows; accounts then via Auth admin):
`select * from api.demo_clear();` as a reg ≥ 3 staff session.

Migration 0350 replaces four functions with exact copies plus the marked demo checks (generated from 0320 / 0330 by a
script that asserts each insertion point); adds `companies.demo`, `demo_expires_at`, `private.company_is_demo`,
`api.demo_add`, `api.demo_clear` (reg ≥ 3, 2-step, `authenticated` only). Tests: pgTAP 590/590 (new `180_demo_mode`,
24 checks: who may add, DEMO labels and numbers, official sequence untouched, demo/real separation both ways and
server-side, never on agenda nor decided, one-step removal, official counts unchanged, grants); e2e `demo.spec.ts`
(SG adds 2 demo members + 1 applicant → invitations → own passwords → requests → both sign with emailed codes →
removal deletes rows and sign-in accounts).

Production (26 Oct 2026, release 5f1a812): backup `mcci-20261025T180402Z` + restore drill PASS before 0350; 0350 applied
in one transaction, 0 pending; row counts identical before and after; grants checked (`api.demo_add` / `demo_clear`
`authenticated` only, private helpers without client access, the four replaced functions keep their grants);
anonymous RPC to the demo functions → 401; health OK. No demo accounts were created by the deployment (the SG creates
them in the app).

### Phase C — existing-member directory import (migration 0360; deployed 26 Oct 2026, release f6beb75)

Admin → **Data Import** (`/admin/import`, staff reg ≥ 2; roll back reg ≥ 3). CSV, Excel `.xlsx` / `.xls` (SheetJS
0.20.3, pinned from the SheetJS CDN with its integrity hash — the npm `xlsx` package is outdated) and PDF (typed or
scanned). The file type comes from its bytes; 10 MB, 5,000 rows, 500 characters per cell; password-protected files are
refused; formulas are not evaluated. A PDF is read by AI only when AI reading is on **and** the admin ticks, for that
file, that it may be sent to OpenAI (`store: false`); about 40 members per PDF, because nginx gives an app request 60 s
(raising that needs an nginx change and the owner's approval). The file goes to the private `imports` bucket (now also
`.xls` and PDF); the representative's CNIC is not kept.

1. **Upload** → every row normalised and checked (`lib/import/normalize.ts`) and checked again in the database
   (`private.import_row_errors`); stored as a preview (`import_rows`); **nothing in the register changes**.
2. **Preview** → per row: the checks (errors block the row; warnings are shown, e.g. class taken from the number,
   status worked out from the date, no email, AI unsure), what it matches (same membership number = already in the
   register, with the differences shown; same NTN or company name = possible duplicate) and the decision. Preselected
   is only a clean, clearly new row; existing members and possible duplicates are skipped unless the admin decides
   otherwise; a member the platform issued or manages is never updated by a file; low-certainty AI rows are skipped.
3. **Import** → the admin types IMPORT; one transaction; members keep the file's numbers and statuses (never allocated,
   digits never changed), are marked `imported`, are not applicants and are **not listed publicly** (TODO(MCCI):
   listing imported members in the directory is MCCI's decision); the official number sequences move past the highest
   imported number. Each created / updated row and each decision is in the audit log with the reason.
4. **Roll back** (reg ≥ 3) → members this import created are removed unless something refers to them (sign-in,
   application, payment, endorsement, document, temporary membership); updates stay (old values in the audit log); the
   sequences do not go back.

Not done here: owner invitations for imported members (docs/13 "sent later in a controlled batch"); editing a row in
the preview (fix the file and upload it again). **No real directory data is imported until an authorised admin reviews
and confirms the preview on production.**

Tests (local, not production): unit 272/272 (`import.test.ts` 35: numbers kept digit for digit, day-first dates,
checks, header spellings, CNIC dropped, CSV / xlsx / xls from bytes, refusals); pgTAP `190_member_import` 34 checks;
isolated dry run 624 ok, 0 not ok, 20/20 files leave no rows; e2e `import.spec.ts` 3/3 (CSV preview → IMPORT →
register → roll back; non-spreadsheet refused; PDF via the fake AI with consent → low-certainty row not selected →
discarded). Full suite: 499 passed, 3 failed, 254 skipped. Two failures were on the new page (red badge contrast, a
38 px-wide history link in Urdu) and are fixed (the red badge was also below AA on the Members Register); the third
(`application.spec`, member sign-in redirect) passed on rerun. Page checks rerun 56/56.

**Production (26 Oct 2026), evidence:** tooling `/opt/mcci-deploy-f6beb75`; migration sha256 `f74a44e01bd11049` =
tested file; backup `mcci-20261025T195623Z` verified, restore drill PASS (89 policies, 130 functions, 103 tables /
2065 rows identical; Vault check), drill directory removed; production dry run exactly 1 pending → `--apply-next` → 0
pending. Exact row counts identical in all 93 existing tables (plus the new, empty `import_rows`); `api.import_*`
execute for `authenticated` only (no anon, no service role); `private.import_*` no client access; `import_rows` RLS on,
policy reg ≥ 2, decision audit trigger; `imports_by_user_fkey` on delete set null; bucket `imports` xlsx / csv / xls /
pdf, still private; sequences unchanged (C 1134, A 2205); 0 imports, 0 members. Release `f6beb75` live (`5f1a812`,
`895c111` kept), health OK. Smoke: `/`, `/ur`, `/login`, `/verify` 200; `/admin/import` (and `/ur`), `/admin`,
`/admin/members`, `/portal` → login; with the public key `import_stage` → 42501, `import_rows` → 42501, `imports`
storage listing empty. AI extraction on; no CRON_SECRET, timer or jobs unit; 1 staff with verified 2-step; nginx
unchanged (app `7cbb0f72…`), `nginx -t` OK. **No directory data was imported**: the first real import waits for an
authorised admin to upload MCCI's file and review the preview.

### Release 6a — M2 public website (migration 0370; local, then the usual gate)

All 13 public screens of the prototype (`site/*`): home (hero, live activity, counters, journey, proposer & seconder,
services, temporary → permanent, verify, news, Urdu launch countdown, call to action), about, membership (fees from
settings, documents by business type, FAQ), services, service detail, directory, verify, track, live board, news &
events (calendar), resources (blank official form, printable), contact & complaint desk, login. EN + UR, right-to-left
for Urdu; motion off under reduced motion and inside the app.

Migration 0370 (service-role functions only; visitors never call them): `api.site_stats` (official counts, demo left
out), `api.site_feed` (token, kind, stage, time — no names), `api.site_track` (one token: stage and dates),
`api.site_contact` (ticket from the contact form / complaint desk); `public_directory` no longer lists demo companies;
`settings.site.launchAt` (TODO(MCCI): confirm the launch date; hidden once passed) is now in `public_settings`.
App: track 30 lookups / min per address, contact 5 tickets / hour per address (nginx sets X-Real-IP;
`TRUST_PROXY_CLIENT_IP=1` in production), a hidden field for bots, the emailed confirmation carries only the ticket
number. Not yet: online service requests (M7 — "Apply now" disabled with the reason), news / events content (written in
the admin Content screen, M8; until then the empty states show), Ask MCCI AI (M8), office-bearers' names other than
the President (TODO(MCCI)).

Tests (local, not production): unit 272/272; pgTAP `200_public_site` 15 checks, isolated dry run 639 ok, 0 not ok,
21/21 files leave no rows (the settings count in `080` is now 14: 0370 adds `site`); e2e `site.spec.ts` (every page EN
+ UR/RTL, home figures without names, fees, pub.biz, faq.toggle, service detail, blank form, directory search and
dir.view with public fields only, track found / none / invalid without names, contact message + complaint → tickets
and the emailed number, live board) and the orphan / axe / overflow / tap-target audits on every public page: all pass.
Full suite: 691 passed, 2 failed, 332 skipped. The failures were `shells.spec` (language switch back to English),
which passed on rerun, and `demo.spec` (invitation sign-in took over 5 s while the laptop ran the whole suite; 3/3
alone, no Auth errors; the wait is now 20 s). Found and fixed on the way: the contact email's subject was not a message
key (the email was never sent), a hidden bot field widened Urdu pages, 39 px breadcrumb links and tabs, the header
unreadable on invitation pages.

**Production (26 Oct 2026), evidence:** tooling `/opt/mcci-deploy-56e2331`; migration sha256 `16c308bdb9ea42e9` =
tested file; backup `mcci-20261026T020348Z` + restore drill PASS, drill directory removed; production dry run exactly 1
pending → `--apply-next` → 0 pending; row counts identical in all 94 tables except the expected `private.settings`
13 → 14 (`site`) and its `audit_log` row; `api.site_*` execute for `service_role` only (anon and authenticated: no);
`public_settings` now lists `site`; `public_directory` 0 rows (no listed members yet). Release `56e2331` live
(`f6beb75`, `5f1a812` kept), health OK. Smoke: all 13 public pages 200 in English and Urdu (`dir="rtl"`), live home and
membership content checked in the browser, `/track?t=<unknown>` → "No token found", `/portal`, `/admin`,
`/admin/import` → login; no app errors in the log; nginx unchanged (`7cbb0f72…`), AI extraction on, no jobs unit. Not
exercised on production: the contact form (it would create a real ticket and email; verified locally).

### Release 6b — M7 services (migration 0380; local, then the usual gate)

The seven chamber services, end to end. Member (`/portal/apply`, `/portal/applications`, `/portal/application`):
choose a service (locked until the membership is active: Permanent, or Temporary while `settings.temp.servicesAllowed`;
never demo companies) → upload documents (private `service-docs`, under the request) → "Read with AI" (only with AI
reading on; the member checks every value) → details → submit: token, the SLA clock (`service_types.sla_hours`), and a
fee voucher when the fee is above 0 (pay at the bank once MCCI confirms its account, or at the counter) → follow it;
correct and send back after a return (the clock restarts); message MCCI; download the issued letter. Staff
(`/admin/applications` board + table, `/admin/review`, `/admin/sla`, `/admin/approvals`, `/admin/services`): start →
approve / return (note) / not approve (reason) with svc ≥ 2; sign & issue, one or all, with svc ≥ 3 (President,
Secretary General) and only when the fee is paid; the letter is a QR document in the registry (public `/verify`);
SLA monitor with real average response; service setup (fee, hours, documents, details, offered) for plat ≥ 2.
Emails: received, returned, not approved, issued (each recorded in `email_log`). The public "Apply now" now opens the
portal.

Migration 0380: `service_requests` + `draft`, step times, signer, reason; `service_history` (RLS as the request);
staff never see drafts; members may remove a file from a draft or a returned request (`service_documents` DELETE
under that policy — listed in `001_platform_security`); `api.svc_*` (`svc_can`, `svc_new`, `svc_save`, `svc_submit`,
`svc_cancel`, `svc_resubmit`, `svc_start`, `svc_return`, `svc_approve`, `svc_reject`, `svc_sign`, `svc_sign_all`,
`svcset_save`) for `authenticated` only, each checking role, 2-step login and state; `private.voucher_paid` gains the
service branch (history "fee paid"); the 0370 site functions leave drafts out. TODO(MCCI): service fees (placeholders),
the wording of each letter.

Tests (local, not production): unit 272/272; pgTAP `210_services` 33 checks (eligibility, drafts private, details
limited to the service's own, documents required, voucher for the fee, who may start / return / approve / sign, 2-step,
member cannot cancel once started, no letter before the fee, sign-all skips unpaid, counter payment → "fee paid",
issued QR letter verifies, setup for platform staff only, grants); isolated dry run 672 ok, 0 not ok, 22/22 files leave
no rows; e2e `services.spec.ts` (full flow with AI reading, return, correction, counter fee, signature, letter, public
verification; each of the 7 services requested → approved → issued; another company's request not visible; a
Membership Officer refused) 8/8 in two sequential repeats; page audits (orphans, axe, overflow, tap targets) on every
service screen 185/185. Full suite: 838 passed, 1 failed, 386 skipped. The failure: the 7-services test submitted in
more than 5 s under full load. That wait is now 15 s, as for the other steps, and the test passes. Found and fixed on
the way: the signed request left the queue with its success message (the queue now keeps the outcome), the wizard
counted documents from page data instead of what the server confirmed, the upload drop zone was squashed, and the
"Reload" button in red banners was white on white (all screens).

**Open, reproduced again (the "actions cut off" issue):** an upload started within milliseconds of a page
navigation was cut off. The app says "the server did not confirm this — reload" and nothing is shown as saved. A person
would not normally do this, and the test now waits for the page to settle. The cause inside Next.js is still not
identified; it stays on the list before Release 6 (printing).

**Production (26 Oct 2026), evidence:** tooling `/opt/mcci-deploy-f308287`; migration sha256 `da219d32cc6a5481` =
tested file; backup `mcci-20261026T040543Z` + restore drill PASS, drill directory removed; production dry run exactly 1
pending → `--apply-next` → 0 pending; exact row counts identical in all 94 existing tables (plus the new, empty
`service_history`); the 13 `api.svc_*` / `svcset_save` functions execute for `authenticated` only (anonymous calls with
real arguments → 42501), `service_history` RLS on, 7 services offered (fees still MCCI's placeholders: 2,000 / 1,500 /
3,000 / 1,500 / 1,000 / 1,000 / 500). Release `f308287` live (`56e2331`, `f6beb75` kept), health OK. Smoke: public pages
200, the service page's "Apply now" links to the portal; every new portal and admin page (EN and UR) → login; no app
errors; nginx unchanged (`7cbb0f72…`), AI extraction on, no jobs unit. Not exercised on production: a real request
(it needs a member with an active membership — none yet — and would email them); verified locally end to end.

### Owner's priority items (26 Oct 2026; migration 0400) — ahead of the remaining M8 pages

1. **Members without an online application are treated as members.** Existing members (added in the Members
   Register, imported, or labelled DEMO) used to see "Start my application" on their portal home. Now the home page and
   My Membership show "You are an MCCI member" with the number, class and validity, the proposer / seconder requests
   waiting for them ("Open requests (n)" → Endorsement Requests) and services — no application needed. Demo members
   approve requests exactly as real members do.
2. **Designation limits are saved per designation, with the person's password.** Clicking a cell changes it on screen
   only (marked unsaved); each designation has Save and Undo; Save shows the changes and asks for the password; "Reset to
   defaults" asks too. The server checks the password with Supabase Auth (a throw-away sign-in, 5 attempts per 15
   minutes) and records the confirmation (`api.reauth_mark`, service role only); the database function
   `api.role_permissions_save` requires and uses up a confirmation at most 5 minutes old, so a stolen session or a direct
   database call cannot change limits. The old one-cell function (0290) is no longer callable by signed-in users.
3. **Sign-out after 15 minutes without activity, for every signed-in session.** Server: the middleware records each page
   load and saved action of a signed-in person (httpOnly cookie `mcci_seen`; link prefetches do not count); after 15
   minutes it signs the session out — the refresh token is revoked — and the sign-in page says why. Browser: typing,
   clicking and scrolling in any MCCI Digital tab count; a warning with "Stay signed in" in the last minute; at the limit
   the session is signed out. `SESSION_IDLE_MINUTES` (1–120) changes the limit without a code change. Known limit: a
   person who deletes that cookie on their own device escapes the server check (the browser timer still applies);
   Supabase Auth's own inactivity timeout would close this, but it is an Auth container setting (needs the owner's
   approval for a stack reload).

**Found in the full suite before release (fixed):** when a page's 15-minute timer and the server's limit expired
together, the page's sign-out call (a server action, POST) was answered by the middleware with a 307 to `/login`; the
browser re-sent the action there, Next.js forwarded it back to a portal page (the login page does not contain it), the
middleware redirected again — a loop that held connections until they timed out (≈ 4,900 "failed to forward action
response" in one run, and two tests failed from the load). The middleware now redirects page loads (GET) only; an
action from a signed-out session reaches the action, whose own checks refuse it. Regression: `session.spec` (an action
from a revoked session is not redirected); real-time check with `SESSION_IDLE_MINUTES=1` on a second server: signed
out after 60 s, the reason shown, the session revoked, 0 forwarding errors.

Tests (local, not production): full suite on `ddcbd24` 835 passed, 7 failed, 389 skipped, **0** action-forwarding
errors (the loop is gone). The machine was at 100 % CPU and ~1.2 GB free memory during the run; the 7 failures were
waits that ran out (a click or page not finished in time). Rerun one at a time: 6 of 7 pass; the seventh (the browser
warning test) passes 3/3 on its own. It moved the test clock before the page had finished loading, so the page's timer
had not started yet; the test now waits for the page to load first (test only, no app change).

**Production (26 Oct 2026), evidence:** tooling `/opt/mcci-deploy-ddcbd24`; migration sha256 `15b7ec40543767d8` =
tested file; backup `mcci-20261026T073302Z` + restore drill PASS (105 tables, 2,220 rows identical; Vault secrets
decrypt; negative control holds), drill directory removed; production dry run exactly 1 pending → `--apply-next` →
0 pending; exact row counts identical in every existing table (plus the new, empty `private.staff_reauth`). Grants:
`api.role_permissions_save` and `api.role_permissions_reset` execute for `authenticated` only; `api.reauth_mark` for
`service_role` only; `api.role_permission_set` (the old one-cell function) executable by nobody; RLS on
`staff_reauth`. Release `ddcbd24` live (`f308287` kept, `f6beb75` removed by the release script). Smoke: public pages
200 (EN, UR); `/portal`, `/portal/membership`, `/admin/staff`, `/ur/admin/staff` → sign-in; a server action POST from
a signed-out browser is answered (404 for an unknown action), not redirected; `/login?expired=1` shows "signed out
after 15 minutes without activity"; idle limit at its default 15 minutes (`SESSION_IDLE_MINUTES` not set); nginx
unchanged (`7cbb0f72…`), AI extraction on, no jobs unit. Not exercised on production (no sign-in by Claude on
production): saving a designation with the Secretary General's password, the member view of a demo member, the
15-minute sign-out of a real session — all verified locally end to end; the owner can check them with their accounts.

### Mark a self-registered applicant as demo (26 Oct 2026; migration 0405)

Found by the owner on production: Amir khan signed up on his own and his proposer list said "No members found" — the
only members on production are the two demo members, and demo members endorse demo applications only (0350). Owner's
choice (of three offered): the Secretary General marks such an applicant as demo. Members Register → Demo card →
"Mark an applicant as demo" → choose the applicant → the company gets the DEMO label and a removal date (7 days); its
application then finds the demo members, never goes to the committee, never gets an official number, and "Remove all
demo data" removes it, sign-in included. `api.demo_mark` / `api.demo_markable` (reg ≥ 3, 2-step) refuse a member
company, an application past the proposer step, and a company with proposer requests, fees or service requests.

Tests (local, not production): unit 272/272; pgTAP `182_demo_mark` 17 checks (who may, the list, refusals, marked,
not twice, the demo member found afterwards, removal, grants) with `180_demo_mode` and `001_platform_security`;
isolated dry run on a clean checkout of `f766054`: 718 ok, 0 not ok, 23/23 files leave no rows; e2e `demo.spec.ts`
4/4 (before: no demo member in the proposer list; marked by the SG; after: the demo member is there; removed with the
demo data); page audits on the Members Register (orphans, axe, overflow, tap targets) pass.

**Production (26 Oct 2026), evidence:** tooling `/opt/mcci-deploy-f766054`; migration sha256 `fd47b7cbe585a91c` =
tested file; backup `mcci-20261026T083231Z` + restore drill PASS (106 tables, 2,233 rows identical), drill directory
removed; exactly 1 pending → applied → 0 pending; exact row counts identical in every table (the migration adds
functions only). Grants: `api.demo_mark`, `api.demo_markable` for `authenticated` only (anonymous call → 42501);
`private.demo_mark_why` executable by none of anon / authenticated / service_role. Release `f766054` live (`ddcbd24`
kept, `56e2331` removed by the release script); public pages 200, Members Register and the portal form → sign-in;
nginx unchanged (`7cbb0f72…`), AI extraction on, no jobs unit, no app errors. Both self-registered applicants on
production can be marked (checked read-only). Not done by Claude: the marking itself (it needs the Secretary
General's signed-in session, and is the owner's decision per applicant).

### Owner's decisions of 27–28 Oct 2026: R0–R5 and the mobile pass (migrations 0406–0465, release 662da8b)

What changed: docs/21 (decisions), docs/22 (requirement matrix), docs/23 (release checklist), docs/24 (staff roles
and onboarding). Commits `e319a86` … `662da8b`; parked M8 (0410 and its pages) and `deploy/web/mcci-jobs.*` excluded.

**Backup and restore (28–29 Oct 2026):** tooling `/opt/mcci-deploy-662da8b` at `662da8b`, clean; the eight migration
sha256 values equal the tested files (docs/23 §2); 0410 not in the release. Backup `mcci-20261028T211204Z`: verify OK
(7 ciphertext checksums, every archive decrypts).

Restore drills of that backup, in order:
1. First drill (about 21:12 UTC): **result `drill: FAIL`**. Its output was shown only through `| tail -5`, which
   kept the last five lines — `functions identical (166)`, `row counts identical in all 106 tables (2768 rows)`, the
   Vault check and the negative control, all PASS — and was not written anywhere; the script removes its container,
   volumes and folder on exit, and Docker keeps no event history from that time. So the failing check is **not
   known**: it was one of the nine printed before "functions identical" (cluster start, WAL consistency, no ports,
   server version, roles, databases, schemas, extensions, policies). The data-integrity checks of that same run
   (functions, row counts, Vault decryption, negative control) passed. Classification: **unexplained; not
   reproduced** — not called harmless.
2. Second drill `mcci-restore-drill-20261028T211253Z` (log kept, `/tmp/drill-662da8b.log`): PASS, 13 PASS lines.
3. Three further drills with full logs and exit codes (`/root/drill-repro-{1,2,3}.log`): exit 0, 13 PASS lines each,
   `drill: PASS`, 106 tables / 2,768 rows identical, Vault secret decrypts, negative control holds.
After every run: no drill container, volume or folder left.
Follow-up: the drill should keep its full output with the backup set, so a failure is always readable.

**Deployed 29 Oct 2026, release `662da8b`.** Migrations 0406 → 0465 applied one at a time (0 pending); grants,
storage policies, settings and sequences checked; row-count change exactly as expected; `release.sh` switched
`f766054` → `662da8b` (`f766054` kept for rollback); smoke tests passed; nginx, DNS and other sites untouched; AI
extraction and MFA on; jobs timer absent. Full evidence: docs/23 §6.

Rollback: `scripts/deploy/release.sh f766054` brings back the old app, but the 0406–0465 schema stays, and with it
the closed paths (`cmt_decide`, `cmt_approve_all`, `end_sign`, staff reading storage directly) — so those old screens
would refuse. The full rollback is restoring `mcci-20261028T211204Z`, which loses everything written after it.
