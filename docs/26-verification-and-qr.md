# 26 · Public verification and signed QR (owner, 30 Oct 2026)

Anyone — a bank, an embassy, a customer — can check that a business is a current MCCI member, by scanning the QR on
its membership certificate, typing the certificate's reference, or typing its membership number. The answer comes
from the MCCI register at that moment, never from the paper.

## 1. What a visitor sees

`/verify` (EN + UR) has two forms: **certificate reference** (`MCCI-QR-XXXXX-XXXXX`, the text under the QR) and
**membership number** (`MCCI-C-1134`). A QR opens `/verify/<reference>?s=<signature>` directly.

The result shows only: business name, membership number, category (Manufacturing / Non-manufacturing), class
(Corporate / Associate), membership status and period, certificate status and reference, "replaced by" for a replaced
certificate, the date of the check, and the certificate's security pattern with its fingerprint. **Never** the
certificate scan, documents, addresses, phone numbers, emails, CNIC, storage paths, internal ids or file links.

| Membership status | When |
|---|---|
| Active | Permanent and within its period |
| Temporary (valid) | a temporary membership that is active and not past its expiry |
| Expired | past its period, or a temporary membership that has run out |
| Suspended / Revoked | as set by MCCI |

| Certificate status | When |
|---|---|
| Valid / Temporary | issued and within its date |
| Expired | past its date |
| Superseded | replaced — the result names the new reference |
| Revoked | withdrawn by MCCI |

The banner is green ("Genuine — current MCCI member") only when both the membership and the certificate are current.
Demo records (`companies.demo`) never verify — they are not official.

## 2. How it works

| Piece | Where |
|---|---|
| Database: `verify_attempts` log; `api.public_verify_code`, `api.public_verify_member`, `api.public_verify_log` (service role only); minimal projection; demo excluded; `api.doc_verify` excludes demo | migration `20261108000520_public_verification.sql`; pgTAP `320_public_verification` |
| Server: signature check before the database; per-address limits (references 30 / min; membership numbers 10 / min and 60 / hour); the address is stored only as a hash | `lib/verify/admin/index.ts` |
| Signed links: Ed25519 over `MCCI-VERIFY:v1:<reference>`; `?s=` = base64url signature | `lib/qr/sign.ts`, `lib/qr/svg.ts` (`verifyUrl`, `verifyBase`) |
| Security engraving v2: microtext ring with the fingerprint, interlaced guilloche rope band, two trochoid rosettes, eight-point star centre (generic geometry — the MCCI logo is not used); deterministic per reference; line weight scaled for print | `lib/qr/rosette.ts` |
| Stamped certificate: the QR (unchanged size and white quiet zone) with the rosette in a band around it | `lib/certificates/stamp.ts` |
| Pages and API | `app/[locale]/(site)/verify/*`, `app/api/public/verify`, `app/api/verify/[code]`, `components/site/verify-view.tsx` |

The signature proves a link was made by MCCI; whether the certificate is valid **always** comes from the database, so
a copied QR can never make a replaced, revoked or expired certificate look valid. The rosette is a visual
anti-counterfeiting and comparison aid only; authenticity comes from the signature and the database.

A typed reference (no signature) is still looked up, behind the same limit. An altered or foreign signature is refused
without a lookup ("This QR code has been altered").

**Issuance needs the key:** confirming a certificate scan (Printing & Receiving) refuses with a clear message while
`QR_SIGNING_KEY` is not set, before any QR document is created — so no unsigned certificate can be issued.
Known limit: the stamp's renderer (sharp / librsvg) does not draw the microtext ring; browsers draw it on the
verification page.

## 3. API for the future website (mcci.org.pk landing page)

```
GET /api/public/verify?ref=MCCI-QR-XXXXX-XXXXX[&s=<signature>]
GET /api/public/verify?member=MCCI-C-1134
200 { found: true, result: { business_name, member_no, category, class, member_status, member_since, valid_to,
                             certificate_status, certificate_ref, replaced_by, checked_on },
      signature: 'valid' | 'absent' | 'unconfigured' }
404 { found: false } · 400 { error: 'invalid' | 'tampered' } · 429 { error: 'too_many' }
```
Never cached (`Cache-Control: no-store`). Browsers on another site may read it only from the origins listed in
`PUBLIC_API_ORIGINS` (comma-separated).

## 4. What MCCI / the operator must set on the server (needs the owner's approval at deploy time)

1. **Signing key** — generate once, on the server, never in chat or git:
   ```bash
   openssl genpkey -algorithm ed25519 -out /root/mcci-qr-signing-key.pem && chmod 600 /root/mcci-qr-signing-key.pem
   ```
   Put it in `/etc/mcci-web/env` as `QR_SIGNING_KEY=` followed by the PEM base64-encoded on one line
   (`base64 -w0 /root/mcci-qr-signing-key.pem`), then `systemctl restart mcci-web`. Keep an encrypted copy with the
   backups. Without a key, verification still works by reference, but **no certificate can be issued**.
2. **`PUBLIC_API_ORIGINS`** — only when the new website calls the API from the browser, e.g. `https://mcci.org.pk`.
3. `VERIFY_BASE_URL` may be the site (`https://app.mcci.aderalabs.tech`) or the page (`…/verify`); a bare site gets
   `/verify` added. Production had the bare site, which made QR links `https://host/<reference>` (404) — fixed in
   `lib/qr/svg.ts` before any certificate was issued (production had no documents on 30 Oct).

**Key rotation:** a new key makes every older QR "altered". So rotate only if the key leaks: generate a new key, then
the stamped copies must be made again from the kept original scans (`scans/<id>/original.*`). There is **no screen
for re-stamping yet** — it would be a one-off server task, to be built if a rotation is ever needed. There is no key id
in v1; a rotation scheme (`v2` with a key id) is a later change. Set the key **before** the first certificate is
stamped, so no unsigned QR is ever printed.

## 5. Tests

- pgTAP `320_public_verification` (30): server-only functions, minimal projection, Active / Temporary / Expired /
  Suspended / Revoked / Superseded / certificate expired, demo never verifies (also through `doc_verify`), attempts
  logged without addresses, log readable by Reports staff only.
- Unit `qr-verify.test.ts`: signature valid / altered / other reference / other key / malformed / no key; verify links
  (bare site → `/verify`, signature appended); rosette determinism; the stamped QR is pixel-identical to a plain QR on
  a white quiet zone, the band carries the pattern, the rest of the scan is unchanged.
- e2e `verify.spec.ts`: signed link genuine; altered signature refused; random / malformed reference; membership
  number via the form; replaced certificate names the new one; demo member not verified; API fields, `no-store`, 404,
  429 after 10 membership checks from one address; no email, path, id or file link in the page.
