# MCCI Digital — main-domain cutover checklist (prepared 7 Nov 2026, for the morning)

**Nothing in this checklist was executed.** No DNS, MX, SPF, DKIM, DMARC, nginx, certificate, Supabase Auth or app
setting was changed while preparing it. Every step needs the owner's go-ahead at the time it is run. Background and the
reasoning behind each item: `docs/acceptance/MCCI-DOMAIN-MIGRATION-READINESS.md` (6 Nov 2026).

## 0. What the public records say now (read-only lookups, 7 Nov 2026 ~04:30 UTC, via 8.8.8.8)

| Name | Today | Note |
|---|---|---|
| `app.mcci.aderalabs.tech` | A → VPS `169.58.124.24`, TLS valid to 22 Jan 2027 | the live app; stays up throughout |
| `themcci.com.pk`, `www.themcci.com.pk` | **now resolves** (new since 6 Nov): NS `anton`/`arya.ns.cloudflare.com`; A → `109.199.96.52` | nothing answers on 80/443 at that address (both time out) |
| `app.themcci.com.pk` | does not exist | |
| `themcci.com.pk` mail | **live:** MX `mail.themcci.com.pk` (pref 10, A `111.221.46.28`); SPF `v=spf1 +mx +a +ip4:111.221.46.41 ~all`; `_dmarc` `v=DMARC1; p=none;` | **must not change** |
| `mcci.org.pk`, `www` | A → `5.189.188.72` (IIS / ASP.NET, Plesk), the existing public website | **must not change** in this cutover |

Because `themcci.com.pk` mail is live, **only the web records change**: add (or change) an `A` record for the
hostname MCCI chooses. Never touch MX, the SPF/DKIM TXT records, `_dmarc`, `mail.`, `autodiscover`, or any other record.

## 1. Go / no-go before starting (all must be YES)

- [ ] MCCI confirms the **final hostname**: `app.themcci.com.pk` (recommended: the apex and `www` stay free for a public
      website and mail stays untouched) or the apex `themcci.com.pk`.
- [ ] MCCI confirms who controls the **Cloudflare account** for `themcci.com.pk`, and that the account belongs to MCCI.
- [ ] MCCI confirms that `109.199.96.52` (current apex A record) is **not** a site they need, if the apex is chosen.
- [ ] Owner approval for: the DNS record, the certificate and nginx block, the Auth restart, the app release, the IQPigeon
      webhook URL change.
- [ ] A fresh verified backup: `scripts/selfhost/backup.sh` (and `touch <set>/KEEP` so retention keeps it).
- [ ] A quiet window (no staff mid-task): every user signs in once more on the new host.

## 2. Steps (H = the chosen hostname, e.g. `app.themcci.com.pk`)

| # | Step | Command / place | Check | Rollback |
|---|---|---|---|---|
| 1 | DNS (MCCI's Cloudflare) | `A H → 169.58.124.24`, TTL 300, **DNS only (grey cloud)** for the certificate step | `nslookup H 8.8.8.8` gives `169.58.124.24` | delete the record |
| 2 | Certificate | `certbot certonly --webroot -w /var/www/letsencrypt -d H` | `/etc/letsencrypt/live/H/` exists | `certbot delete --cert-name H` |
| 3 | nginx | copy `deploy/web/nginx/app.mcci.aderalabs.tech.conf` to `/etc/nginx/conf.d/H.conf`, replace the host name and certificate paths; `nginx -t && systemctl reload nginx` | `curl -I https://H/` → 200 from the app; the old host still 200; every other site on the VPS unchanged | remove `H.conf`, `nginx -t && reload` |
| 4 | Supabase Auth (both hosts accepted) | back up `/var/lib/mcci-selfhost/recovery-new/.env`; **add** `https://H/**` to `ADDITIONAL_REDIRECT_URLS`; recreate the Auth container with `scripts/selfhost/compose.sh` | sign-in works on both hosts | restore the `.env` copy, recreate Auth |
| 5 | App settings + release | back up `/etc/mcci-web/env`; set `APP_URL`, `VERIFY_BASE_URL`, `NEXT_PUBLIC_SUPABASE_URL` to `https://H`; `scripts/deploy/release.sh <same commit>` (the browser URL is built into the bundle) | on H: sign in (member and staff), password-reset email link opens H, `/verify` works, a QR scan opens H | restore the env copy, `release.sh --rollback` |
| 6 | Auth canonical URLs | `SITE_URL`, `API_EXTERNAL_URL`, `SUPABASE_PUBLIC_URL` → `https://H`; recreate Auth | invitation and reset emails carry H | restore the `.env` copy |
| 7 | WhatsApp webhook | IQPigeon `webhook_endpoints` id 4 (partner 7 only): URL → `https://H/api/webhooks/whatsapp`; record the old value first | IQPigeon's signed test reaches H (200); MCCI `whatsapp_webhook_events` gets the row | set the old URL back |
| 8 | Old app host | nginx for `app.mcci.aderalabs.tech`: `return 307 https://H$request_uri;` (keep `/.well-known/acme-challenge/` served) | old links (emails, bookmarks, QR) land on the same page on H | restore the old server block |
| 9 | Android app | the shell loads `APP_URL`; if it is built with the old host, it follows the 307. Rebuild with H at the next app release | the app opens and signs in | — |

After 30 quiet days: make step 8 a 308, and stop serving the old host only when no QR or email in circulation still
uses it (`VERIFY_BASE_URL` was the old host for every certificate printed before step 5).

## 3. Never in this cutover

- No change to `MX`, SPF/DKIM TXT, `_dmarc`, `mail.themcci.com.pk` or anything under `mcci.org.pk`.
- The existing public website (`mcci.org.pk`, IIS) is not moved, redirected or edited.
- No Cloudflare proxying (orange cloud) until certificates and the Auth callbacks have been tested with it.
- No production data change; no campaign or message is sent as a "test" to real members.

## 4. After the switch: verify and record

`curl -I https://H/` (200 and the security headers: HSTS, X-Frame-Options, nosniff, Referrer-Policy); member sign-in,
staff sign-in with the authenticator, password reset email, `/verify?c=` for a test code, `/api/health`, the WhatsApp
webhook test, the old host's 307, the other sites on the VPS (`iqpigeon.com`, `whatsappapi.iqpigeon.com`, taxdesk,
fintax), and `dig MX themcci.com.pk` unchanged. Record the times, the approver and each old value in the release report.
