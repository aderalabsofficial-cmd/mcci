# MCCI Digital — domain migration readiness (6 Nov 2026)

**Status: NOT READY TO SWITCH — blocked on MCCI.** The application side is ready: one setting per place, listed below.
Two things are missing: `themcci.com.pk` does not resolve in public DNS yet, and `mcci.org.pk` is still controlled by
the third-party company. **Nothing was changed during this check:** no DNS, nginx, certificate or Supabase changes,
and the ASP.NET site was not touched. Every finding below comes from read-only lookups and from reading the server
configuration.

| | Domain | Today |
|---|---|---|
| Live app | `app.mcci.aderalabs.tech` | DNS at Cloudflare → VPS `169.58.124.24`; Let's Encrypt certificate valid to 22 Jan 2027 (auto-renew via certbot webroot) |
| Proposed | `themcci.com.pk` | **Does not resolve** (public DNS answers "non-existent domain", 6 Nov 2026 via 8.8.8.8). Either not yet registered with PKNIC or registered without name servers. |
| Official, old | `mcci.org.pk` (+ `www`) | A `5.189.188.72` (hostingcare.net shared hosting, ASP.NET site via cPanel); NS `ns53/54/73/74.hostingcare.net`; MX `mail.mcci.org.pk` (pref 10); SPF `v=spf1 +a +mx +a:smtp112.hostingcare.net -all`; **no DMARC record**; DKIM not checked (the selector is unknown) |

## 1. Checklist

| # | Item | Finding | Status |
|---|---|---|---|
| 1 | New domain registration ownership | Cannot be checked: the domain does not resolve. PKNIC (.com.pk) registrations should be in MCCI's legal name, with MCCI's own email as the admin contact. | BLOCKED — MCCI |
| 2 | Registrar account ownership | Unknown. The PKNIC account login must belong to MCCI, not to a vendor (aderalabs or the current web company). | BLOCKED — MCCI |
| 3 | DNS requirements | `A app.themcci.com.pk → 169.58.124.24` (or apex/`www` if MCCI wants the app at the root); keep TTL 300 during the switch. Optional: `CAA 0 issue "letsencrypt.org"`. | READY (records defined) |
| 4 | SSL | `certbot certonly --webroot -w /var/www/letsencrypt -d app.themcci.com.pk` once DNS resolves; new nginx `server` block cloned from `deploy/web/nginx/app.mcci.aderalabs.tech.conf`. Needs the owner's nginx/TLS approval (standing rule). | READY — needs approval |
| 5 | Canonical URL | One value: `APP_URL` in `/etc/mcci-web/env` (today `https://app.mcci.aderalabs.tech`). | READY |
| 6 | Supabase Auth redirect allow-list | Supabase runtime `.env`: `SITE_URL`, `ADDITIONAL_REDIRECT_URLS` (today `https://app.mcci.aderalabs.tech/**`), `API_EXTERNAL_URL`, `SUPABASE_PUBLIC_URL`. **Add** the new domain to `ADDITIONAL_REDIRECT_URLS` first (both work), then move `SITE_URL`. Recreating the Auth container needs the owner's approval. | READY — needs approval |
| 7 | Browser Supabase URL | `NEXT_PUBLIC_SUPABASE_URL` is built into the app bundle → a **rebuild + release** (`release.sh`) after changing it. | READY |
| 8 | CORS | The app and the Supabase gateway share one origin behind nginx, so there is no cross-origin traffic and nothing to change. | PASS |
| 9 | Cookies & sessions | Session cookies are host-only (no `domain` attribute; `sameSite: 'lax'`, `lib/supabase/middleware.ts`). On the new host, everyone signs in once more; staff set up nothing new (the authenticator stays). | PASS (expected re-login) |
| 10 | Password reset / email links | Links are built from `APP_URL` and Auth `SITE_URL`, so they follow those settings. **Production SMTP:** the sender is `…@aderalabs.tech`. Move it to an MCCI domain with SPF + DKIM + DMARC, or members' mail may land in spam. | READY — sender domain decision |
| 11 | Payment callbacks | None: payments are manual (voucher + receipt + Accounts) in Phase 1. | N/A |
| 12 | WhatsApp webhook | Configured at the provider (IQPigeon) to the app's `/api/webhooks/whatsapp`. Re-point it at the provider after the switch. The template link is a **variable**; the current domain appears only as an *example* in the four master templates (migration 0630), so **no re-approval** is needed for links. | READY — provider step |
| 13 | QR / document verification URLs | `VERIFY_BASE_URL` is printed into every QR. **Production has only 2 QR documents, both Revoked:** no valid certificate carries the current domain yet. **Switch `VERIFY_BASE_URL` before the first real certificate is printed**; otherwise the old host must redirect `/verify/*` forever. | READY — **time-critical** |
| 14 | Email links in sent mail | Already-sent emails keep old links → keep the old host redirecting (item 17). | READY |
| 15 | Sitemap & SEO | The app has no `sitemap.xml` / canonical tags tied to a domain to change (gap-review B3 still open). Add them with the final domain. | NOT IMPLEMENTED (low) |
| 16 | Old-domain email records | **Preserve** `MX mail.mcci.org.pk`, the SPF TXT and any DKIM records exactly. Add DMARC (`_dmarc.mcci.org.pk TXT "v=DMARC1; p=none; rua=mailto:…"`) once MCCI controls the zone. Only the `A`/`CNAME` for `www` and the apex may change. | READY — needs zone access |
| 17 | Redirect requirements | See §2. | READY — needs approval + access |
| 18 | Rollback | See §3. | READY |

## 2. Recommended sequence (each step needs the owner's go-ahead)

1. **MCCI:** complete `themcci.com.pk` registration in MCCI's name; MCCI owns the registrar login; choose DNS host
   (Cloudflare recommended, free, same as today).
2. **DNS:** `app.themcci.com.pk A 169.58.124.24` (TTL 300). Leave `app.mcci.aderalabs.tech` running.
3. **TLS + nginx (approval):** certificate for the new name; second `server` block proxying to the same app (port 3200).
4. **Auth (approval):** add `https://app.themcci.com.pk/**` to `ADDITIONAL_REDIRECT_URLS`; recreate the Auth container.
   Both hosts now sign in.
5. **App (release):** `APP_URL`, `VERIFY_BASE_URL`, `NEXT_PUBLIC_SUPABASE_URL` → new host; `release.sh <commit>`;
   smoke test on the new host (sign-in, password reset email, verify page, a QR scan).
6. **Auth:** `SITE_URL` / `API_EXTERNAL_URL` / `SUPABASE_PUBLIC_URL` → new host.
7. **Old app host:** nginx `return 307 https://app.themcci.com.pk$request_uri;` for `app.mcci.aderalabs.tech`
   (keeps path and query). Make it permanent (308) only after 30 quiet days.
8. **WhatsApp:** re-point the webhook at IQPigeon; send one test message to a staff phone.
9. **mcci.org.pk (when control is transferred):** keep MX/SPF/DKIM; point `www`/apex at a redirect —
   `302`/`307` to `https://themcci.com.pk$request_uri` (path and query preserved) — or keep the ASP.NET site and
   add a "MCCI Digital" link. Never change MX during the web switch.

## 3. Rollback

Each step is reversible on its own. To roll back DNS, delete the new `A` record (the old host never stopped). To roll
back the app, restore the old `/etc/mcci-web/env` values and run `release.sh --rollback` or re-release the previous
build. To roll back Auth, restore the saved runtime `.env` and recreate the Auth container. Take a backup
(`scripts/selfhost/backup.sh`) before step 4. Keep the old host running, at first serving and later redirecting,
until the new one has run cleanly for 30 days.

## 4. What MCCI must provide

PKNIC registration confirmation for `themcci.com.pk` in MCCI's name; registrar login (MCCI-owned); decision on the
final hostname (`app.themcci.com.pk` vs `themcci.com.pk`); DNS zone access for `mcci.org.pk` once the third party
hands it over; the sender email domain for system mail (SPF/DKIM/DMARC); approval for the nginx, TLS and Auth steps.
