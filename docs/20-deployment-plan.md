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

### Gate 2 — DNS (owner) and certificate

Owner: Cloudflare `A app.mcci → 169.58.124.24`, **DNS only** (grey cloud). Then:
```bash
cp deploy/web/nginx/app.mcci.aderalabs.tech.http-only.conf /etc/nginx/conf.d/app.mcci.aderalabs.tech.conf
nginx -t && systemctl reload nginx
certbot certonly --webroot -w /var/www/letsencrypt -d app.mcci.aderalabs.tech   # renewed by certbot-renew.timer
```
Impact: a new name on port 80 that answers only the ACME challenge. Rollback: remove the file, `nginx -t`, reload.

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

### Gate 5 — go public on the new name

```bash
cp deploy/web/nginx/app.mcci.aderalabs.tech.conf /etc/nginx/conf.d/app.mcci.aderalabs.tech.conf
nginx -t && systemctl reload nginx
```
Impact: `https://app.mcci.aderalabs.tech` serves the app and the four client APIs. Rollback: stage-1 file back,
`nginx -t`, reload.

### Then — first Secretary General and smoke tests (no infra change)

1. The Secretary General registers at `https://app.mcci.aderalabs.tech/register` and opens the confirmation email.
2. `scripts/selfhost/first-secretary-general.sh <their email>` (refuses if any active staff already exists).
3. They sign in on the Staff tab and set up 2-step login; from `/admin/staff` they invite everyone else.
4. Smoke tests against the live name: `/`, `/login`, `/api/health`, register + email, email code, password reset,
   staff TOTP, invitation round trip, `/admin/staff`, `/portal/profile`, Auth rate limit (30 bad sign-ins → 429),
   `/pg/` and `/realtime/v1/api/` → 404, TLS and HSTS headers.

Updating later: `scripts/deploy/release.sh <new commit>` (gate 1 first when the commit adds migrations).
Rolling back the app: `scripts/deploy/release.sh --rollback`.
