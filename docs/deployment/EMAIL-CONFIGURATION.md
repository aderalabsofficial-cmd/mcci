# Email configuration — MCCI Digital Chamber (official domain `themcci.com.pk`)

Owner's policy (7 Nov 2026). Mailboxes stay on the **cPanel host** (`mail.themcci.com.pk`, `111.221.46.28`). Nothing
here moves email hosting, changes MX, the `mail` A record, DKIM, DMARC or nameservers, or puts the mail host behind the
Cloudflare proxy.

| Identity | Address | Used for |
|---|---|---|
| System sender | `no-reply@themcci.com.pk`, display name **MCCI Digital Chamber** | sign-up codes, password reset, invitations, application and certificate notices, every automated email |
| Replies / administration | `secretary@themcci.com.pk` | `Reply-To` of every system email; the Secretary's own sign-in |

## 1. Two places send email

| Sender | What it sends | File on the server | Setting names |
|---|---|---|---|
| Supabase Auth (GoTrue) | sign-up code, sign-in code, password reset, email change | `$MCCI_SELFHOST_RUNTIME/.env` (production: `/var/lib/mcci-selfhost/recovery-new/.env`), root only | `SMTP_ADMIN_EMAIL` (= sender address), `SMTP_SENDER_NAME`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` |
| The app (`lib/email/send.ts`) | invitations, membership / application / certificate notices | `/etc/mcci-web/env`, root only | `EMAIL_TRANSPORT=smtp`, `EMAIL_FROM`, `EMAIL_FROM_NAME`, `EMAIL_REPLY_TO`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` |

Both must carry the same sender. Templates of Auth's emails: `supabase/templates/*.html` (published by every release to
`/var/www/mcci-app-email-templates/`).

## 2. cPanel: create the mailboxes (MCCI / the owner)

cPanel → **Email Accounts** → Create: `no-reply@themcci.com.pk` (strong password, from a password manager) and
`secretary@themcci.com.pk`. cPanel → **Connect Devices** for `no-reply` shows the outgoing server; the usual values are
`mail.themcci.com.pk`, port **465** (SSL/TLS) or **587** (STARTTLS), user = the full address.

## 3. Enter the values (owner, on the server; never in chat, Git or a ticket)

```bash
sudo nano /var/lib/mcci-selfhost/recovery-new/.env
#   SMTP_ADMIN_EMAIL=no-reply@themcci.com.pk
#   SMTP_SENDER_NAME=MCCI Digital Chamber
#   SMTP_HOST=mail.themcci.com.pk
#   SMTP_PORT=465
#   SMTP_USER=no-reply@themcci.com.pk
#   SMTP_PASS=            <- the mailbox password
sudo nano /etc/mcci-web/env
#   EMAIL_TRANSPORT=smtp
#   EMAIL_FROM=no-reply@themcci.com.pk
#   EMAIL_FROM_NAME=MCCI Digital Chamber
#   EMAIL_REPLY_TO=secretary@themcci.com.pk
#   SMTP_HOST=mail.themcci.com.pk
#   SMTP_PORT=465
#   SMTP_SECURE=1          (1 for 465; empty for 587 STARTTLS)
#   SMTP_USER=no-reply@themcci.com.pk
#   SMTP_PASS=             <- the same mailbox password
```

Then apply (each step only after a backup, `scripts/selfhost/backup.sh`):

```bash
cd /opt/mcci-deploy-<release>; export MCCI_SELFHOST_RUNTIME=/var/lib/mcci-selfhost/recovery-new
scripts/selfhost/compose.sh up -d --force-recreate auth    # Auth reads its SMTP settings at start
sudo systemctl restart mcci-web                            # the app reads /etc/mcci-web/env at start
```

## 4. Tests (in this order)

1. **Relay accepts the login** (no message sent): `openssl s_client -connect mail.themcci.com.pk:465 -quiet` answers
   `220`. Some cPanel hosts relay outbound mail through **MailChannels**, which refuses mail from an outside server
   (that is why the first deployment used Resend). If the test send below is refused or never arrives, use the fallback (§6).
2. **Sign-up code:** `/register` with a controlled test mailbox → the code email arrives from
   `MCCI Digital Chamber <no-reply@themcci.com.pk>`.
3. **Password reset:** `/login/forgot` → link arrives, opens the reset page on the official domain.
4. **Invitation:** Staff & Audit → invite a test address → the invitation arrives with `Reply-To: secretary@…`.
5. **Headers of each received message:** `spf=pass`, `dkim=pass` (`d=themcci.com.pk`), `dmarc=pass`.

## 5. SPF / DKIM / DMARC

**Found on 7 Nov 2026:** the cPanel host (`sgvip5.noc401.com`, `111.221.46.41`) hands outbound mail to
**MailChannels** (`relay.mailchannels.net`, seen sending from `23.83.221.25`). Gmail then rejected the sign-up code with
`550 5.7.26 … DKIM = did not pass, SPF [themcci.com.pk] with ip 23.83.221.25 = did not pass`, because the SPF record
(`v=spf1 +mx +a +ip4:111.221.46.41 ~all`) lists only the cPanel server, not MailChannels.

Fix (owner, in Cloudflare DNS; first confirm the exact record in cPanel → **Email Deliverability** → `themcci.com.pk`):

- **SPF:** edit the one existing SPF TXT record (do not add a second) to
  `v=spf1 +mx +a +ip4:111.221.46.41 include:relay.mailchannels.net ~all`.
- **DKIM:** if Email Deliverability says the DKIM record is not valid, replace the TXT value of
  `default._domainkey` with the one that page shows (cPanel signs with that key; a stale copy in Cloudflare fails).
- DMARC (`p=none`), MX and the mail A record stay as they are.

After the change: send a new code, then check Gmail → **Show original**: `SPF: PASS`, `DKIM: PASS`, `DMARC: PASS`.

## 6. Fallback when the cPanel relay refuses outside mail

Use a transactional relay for `themcci.com.pk` (Resend, as today for `aderalabs.tech`): verify the domain in the relay's
dashboard, which asks for **new** DKIM TXT records (and a return-path record) — additions in Cloudflare, nothing
existing changes; add the relay's `include:` to SPF only after checking cPanel's recommendation (one SPF record only).
Settings: `SMTP_HOST=smtp.resend.com`, `SMTP_PORT=465`, `SMTP_SECURE=1`, `SMTP_USER=resend`, `SMTP_PASS=<API key>`.
The sender stays `no-reply@themcci.com.pk`; mailboxes stay on cPanel.

## 7. Troubleshooting

| Symptom | Look at |
|---|---|
| "Sign-in is not available" on Send code | Auth log: `docker logs supabase-auth 2>&1 \| grep -i smtp` (wrong password, port, TLS) |
| Code email never arrives | cPanel → Track Delivery; spam folder; MailChannels refusal (§6) |
| Bounce `550 5.7.26 … sender is unauthenticated` from `relay.mailchannels.net` | SPF lacks `include:relay.mailchannels.net` or the DKIM key is stale (§5) |
| Invitation not sent | `journalctl -u mcci-web \| grep -i email` |
| `dkim=fail` | sender address not on `themcci.com.pk`, or relay not verified for the domain |

## 8. Rotating the mailbox password

Change it in cPanel, then repeat §3 for **both** files and restart both services, then test §4.2. Never write a password
in Git, docs, tickets or chat.
