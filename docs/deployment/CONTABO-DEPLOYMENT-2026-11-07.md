# Contabo primary production — deployment record (7 Nov 2026)

| | |
|---|---|
| Server | Contabo `109.199.96.52` (`vmi3704618`), Ubuntu 24.04.5, 8 vCPU, 23 GiB, 435 GB; SSH user `deploy` (key) |
| Public URL | `https://themcci.com.pk` (`www` → apex, `http` → `https`, path + query kept) |
| App release | `33d2270` (`/opt/mcci-web/current`, `mcci-web.service`, port 3200 on localhost) |
| Stack | self-hosted Supabase, same pinned images as the first server; gateway `127.0.0.1:18000`; runtime `/var/lib/mcci-selfhost/recovery-new` |
| Tooling checkout | `/opt/mcci-deploy-b0c7582` (at `33d2270`; the folder name stays because the gateway reads its config from it) |
| Database | restored from `mcci-20261107T063814Z` (first server, drill PASS), migration 0690 applied → 62 migrations, 0 pending |
| TLS | Let's Encrypt for `themcci.com.pk` + `www` (webroot `/var/www/letsencrypt`, `certbot.timer`); Cloudflare records are DNS-only |
| Firewall | `ufw`: OpenSSH, 80, 443 only |
| Backups | `mcci-backup.timer` nightly 21:30 UTC (`/opt/mcci-backup-tool`, 30 days, min 7); pre-clean-up set `mcci-20261107T065235Z-PRE-CLEANUP`; both sets copied to InterServer `~deploy/mcci-backups` (encrypted; the passphrase is NOT there) |
| WhatsApp | `consentOpen=false`, `sendingEnabled=false` until MCCI approves the wording |

## What changed from the first server's copy

- `/etc/mcci-web/env`: `APP_URL`, `VERIFY_BASE_URL`, `NEXT_PUBLIC_SUPABASE_URL` → `https://themcci.com.pk` (all else copied).
- Stack `.env` (kept as `.env.before-themcci`): `SITE_URL`, `API_EXTERNAL_URL` (`…/auth/v1`), `SUPABASE_PUBLIC_URL`,
  `MAILER_TEMPLATES_*` → the new domain; `ADDITIONAL_REDIRECT_URLS` = new domain, `www` and the old host.
- Test data removed (owner's choice "test data only"): Nexa Login (test member, 2 revoked test certificates) and the 4
  test applicants (Muhammad Shafique, MCCI Multan, Multan Chamber of Commerce, Amir khan) with their applications,
  files and 4 sign-in accounts, through `demo-purge.mjs` after marking them (audited). Kept: the 6 genuine register
  members, the 4 demo members and 10 demo sign-ins, every staff account, settings, designations, audit log.

## Rollback

DNS-level: the first server (`app.mcci.aderalabs.tech`, `169.58.124.24`) is untouched and still serves its own copy.
App: `scripts/deploy/release.sh --rollback` on Contabo. Data: restore `mcci-20261107T065235Z-PRE-CLEANUP` (README §7).

## Still to do after acceptance

Email (docs/deployment/EMAIL-CONFIGURATION.md), the Secretary invitation, a controlled sign-up test, the old host's
redirect to `https://themcci.com.pk`, and removing the temporary `/etc/sudoers.d/90-deploy-temp` on Contabo.
