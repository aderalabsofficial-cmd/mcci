# 20 · Application deployment plan for `mcci.aderalabs.tech` (proposed — needs approval, nothing applied)

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

## 3. Proposed topology

```
browser ─ https ─> nginx :443 mcci.aderalabs.tech (or app.mcci.aderalabs.tech, see §5)
                    ├─ /rest|auth|storage|realtime/v1/  → 127.0.0.1:18000  Supabase gateway (docs/18 §5 proposal)
                    └─ /                               → 127.0.0.1:3200   Next.js (systemd mcci-web)
```

- Release directories `/opt/mcci-web/releases/<git-sha>/` (built on the server from the pushed commit with
  `pnpm install --frozen-lockfile && pnpm build`), `current` symlink switched atomically; previous release kept for
  rollback. Port 3200 is free (3000/3001/3100/8080 are taken by other apps).
- `systemd` unit `mcci-web.service`: `User=mcci-web` (no shell, no sudo), `WorkingDirectory=/opt/mcci-web/current`,
  `ExecStart=node_modules/.bin/next start -H 127.0.0.1 -p 3200`, `EnvironmentFile=/etc/mcci-web/env` (0600, root),
  `Restart=on-failure`, `NoNewPrivileges`, `ProtectSystem=strict`, `ReadWritePaths` only for `.next/cache`.
- `/etc/mcci-web/env` (created by the owner, never in git): `NEXT_PUBLIC_SUPABASE_URL=https://<host>`,
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_INTERNAL_URL=http://127.0.0.1:18000`,
  `APP_URL=https://<host>`, `EMAIL_TRANSPORT=smtp`, `EMAIL_FROM=mcci@aderalabs.tech`, `SMTP_*`, later `OPENAI_API_KEY`
  and `OPENAI_MODEL`.
- nginx: the app location sets `X-Real-IP`/`X-Forwarded-For` to `$remote_addr` (overwrite, as for the API), HSTS
  only after cut-over is accepted.

## 4. Steps (each needs the owner's go-ahead; backup first)

| # | Step | Impact | Rollback |
|---|---|---|---|
| 1 | Encrypted backup set (`deploy/selfhost` backup script) + verify | none | — |
| 2 | Apply 0270, 0280, 0290 with `supabase db push` through the SSH tunnel (dry run first) | none (new functions/table) | functions are additive; restore set from step 1 if ever needed |
| 3 | Owner writes SMTP values into the stack `.env`; set Auth URLs to the public host, load MCCI templates; recreate `auth`, `storage`, `studio` | Auth down a few seconds (no users yet) | previous `.env` copy, recreate again |
| 4 | Build release on the server, install `mcci-web.service`, start on `127.0.0.1:3200`, smoke test with `curl` locally | none (not public yet) | stop and disable the unit |
| 5 | nginx: new server block for the chosen host (§5), `nginx -t`, reload | other sites unaffected if `nginx -t` passes | restore the previous file, `nginx -t`, reload |
| 6 | Live smoke tests: public pages, `/login`, register + email, staff TOTP, invitation round trip, `/admin/staff`, `/portal/profile`; Auth rate limits via the proxy | — | step 5 rollback |
| 7 | Create the first Secretary General (one-off: account by invitation-less admin script, TOTP enrolled by that person) | — | — |

## 5. Decision needed: where the real app goes first

- **A (recommended) — `app.mcci.aderalabs.tech` beside the demo.** Needs one DNS `A` record (Cloudflare, DNS-only,
  169.58.124.24) and a certificate (`certbot certonly --webroot … -d app.mcci.aderalabs.tech`). The demo stays exactly
  as it is; MCCI tests the real app; at acceptance the domain is switched and the demo retired (`docs/11` M10).
- **B — real app on `mcci.aderalabs.tech`, demo moved to `demo.mcci.aderalabs.tech`.** Same DNS/cert work, and the
  current demo link changes.
- **C — wait** until more milestones are built, then cut over once.
