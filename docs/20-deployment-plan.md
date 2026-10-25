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
