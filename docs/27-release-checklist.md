# 27 · Launch release checklist (30 Oct 2026)

Production runs `d024343` (migrations through 0510). This release adds migrations **0520, 0530, 0540, 0550, 0560** and
the work below. Deployment needs the owner's explicit approval. No production data is deleted in this release.

## 1. What this release adds

| Area | Commit | Evidence |
|---|---|---|
| Show / hide eye on every password field | `630b5ab` | e2e auth (eye: mouse, keyboard, Urdu) |
| Public verification, signed QR, engraving, verify-link fix | `df9296e` | pgTAP 320 (30), unit qr-verify, e2e verify (7) |
| Selective demo purge (0530 + `scripts/ops/demo-purge.mjs`) | `d1d33e0` | pgTAP 330 (12) |
| Issuance requires the QR key; engraving v2; watermark with role | `b48be37` | unit qr-verify (stamped QR pixel-identical) |
| Ask MCCI AI | `2fddefd` | e2e assistant (fake model) |
| Trade opportunities (0540) | `f275d31` | pgTAP 340 (14), e2e opportunities |
| Reports + CSV, global search, My queue + `/api/queue` | `e66cd68` | e2e staff-tools (5) |
| Android shell + AAB workflow | `8b95e39` | `cap add android` generated locally with this config; AAB built in CI only |
| Certificate QR placement: preview, adjust, save; large QR PNG / SVG; member access only after the copy is saved (0550) | `8b1ba19` | pgTAP 350 (15), 260, unit qr-verify, e2e certificates |
| Issued service letters verify publicly (0560; found by the release tests, 0520 had excluded them) | `942e962` | pgTAP 360 (4), e2e services |
| Urdu switch 44 px tap target | `5b75d29` | e2e tap-targets |

## 1a. Release test results (30 Oct, on the commits above)

| Check | Result |
|---|---|
| `pnpm db:dry-run` (fresh database, all migrations + seed) | 39 test files, 963 assertions, 0 not ok, no rows left behind |
| `pnpm test` | 25 files, 291 passed |
| `pnpm typecheck`, `pnpm lint` | clean |
| `pnpm test:e2e` (full suite, once, nothing else running) | 1182 passed, 0 failed, 551 skipped by design (project-specific tests) |

Not tested here: the printed result. MCCI should print and scan one test copy to confirm the 27 mm size and position on
the real security paper before issuing certificates. Live checks happen in step 5 of the deployment.

## 2. Security controls (inspected in code, covered by tests)

| Requirement | Where | Test |
|---|---|---|
| QR signature: Ed25519 over `MCCI-VERIFY:v1:<ref>`, key only from `QR_SIGNING_KEY` on the server | `lib/qr/sign.ts` | unit: valid / altered / other ref / other key / malformed / no key |
| Issuing refuses without a key — checked before the QR document exists; preview and save refuse too | `lib/certificates/actions.ts` `confirmScan`, `previewStamp`, `saveStamp` | unit `signingConfigured` |
| Member cannot reach a certificate, its QR or the original scan until the QR copy is saved; enforced in the database | migration 0550 `private.cert_copy_ready`, `documents_select`, `api.cert_file`, `api.cert_view` | pgTAP 350; e2e certificates (404 for certificate and QR) |
| Original scan never changed; saving again replaces the copy under the same record and reference; every save audited | `lib/certificates/actions.ts`, `api.cert_scan_stamped` | e2e byte-identical original, one document; pgTAP 350 audit row |
| Altered QR refused before any lookup | `lib/verify/admin/index.ts` | e2e verify "altered signature" |
| Current status, revocation, replacement from the database at every check | migration 0520 `public_verify_*` | pgTAP 320 (Active / Temporary / Expired / Suspended / Revoked / Superseded / cert expired) |
| Public answer = approved business fields only | 0520 projection; `components/site/verify-view.tsx` | pgTAP 320 projection; e2e: no email, path, id or file link in the page |
| No public access to scans or confidential files | `app/api/files/*` (session + `api.file_access`, denials logged), `app/api/certificates/*` (member's own / certificate staff) | e2e certificates, pgTAP 270 |
| Engraving deterministic per certificate, print weights, fingerprint shown on verify page | `lib/qr/rosette.ts` | unit determinism; rendered check |
| QR and white quiet zone unchanged on the stamp | `lib/certificates/stamp.ts` | unit: pixel-identical QR, white margin, rest of scan untouched |
| AI: other members' data never in context; member text is not an instruction; rate limits | `lib/assistant/*` | e2e assistant; context = approved content + own files (RLS) |
| Reports aggregate only; search and queue through the person's session | `lib/reports`, `lib/search`, `lib/queue` | e2e staff-tools: member refused `/api/queue`, `/api/reports` |

Known limits: the stamp renderer does not draw the engraving's microtext ring (browsers do); the Android app is
built only in CI.

## 3. Production demo records — owner's decision: keep everything

**Owner, 30 Oct: "preserve all four companies for now. Do not execute production deletion."** Nothing is deleted in
this release. Kept: MCCI-2026-M-0265 (AMIR KHAN, No. A-201 stays reserved), MCCI-2026-M-0270 (DEMO — Adera Official),
their documents and history, both demo-tool companies (DEMO — Demo Company 1 and 2), and MCCI-2026-M-0269 until
separately confirmed.

The cleanup tool ships but is not run (`api.demo_purge`, `scripts/ops/demo-purge.mjs`; refuses non-demo companies; the
demo-tool members endorsed the other two applications, so it refuses to purge them alone). Any future purge needs a
new explicit approval, a fresh backup and a dry run first. Inventory: `/root/mcci-part2/inventory-*.txt`.

**Update, found 30 Oct at the WhatsApp release:** these records are no longer in production. The audit log shows one
request at 14:58 UTC, signed in as the Secretary General account, reason "demo data removed": 5 companies (DEMO — Demo
Company 1 and 2, AMIR KHAN, DEMO — Adera Official, DEMO — Adera Labs), 2 members, 3 applications and their linked rows.
The audit rows are kept. It did not come from a release step. **Owner confirmed on 31 Oct that it was intended**, so this
replaces the decision above; no restore is planned. Backup `mcci-20261030T145030Z` predates it.

## 3a. Deployed 30 Oct 2026 (owner approved)

`5fb267a` is live; previous release `d024343` kept for rollback. Backup `mcci-20261030T121931Z` verified, restore drill
13/13 PASS, migrations 0520–0560 applied one at a time (0 pending; companies and audit rows unchanged). Nginx, DNS,
firewall, Supabase stack and other sites not touched; jobs stay off; no data deleted.

Live checks passed, signed out: public pages 200; unknown reference "not found"; portal redirects to login; admin 404
(by design); queue, reports, certificate and file routes refuse; demo 401 (its Basic Auth); no `mcci-web` errors.

Still open: signed-in pages not checked live (needs the owner or staff); `QR_SIGNING_KEY` not set, so certificates
cannot be issued yet and altered QR signatures are not yet refused; print-and-scan test on the real paper.

## 4. Deployment (docs/20, docs/25 §4 — needs the owner's approval)

1. Fresh backup + verify + restore drill.
2. Tooling clone `/opt/mcci-deploy-<sha>`; `migrate.sh --dry-run` → expect 0520, 0530, 0540, 0550, 0560 pending;
   `--apply-next` five times, checking after each.
3. `scripts/deploy/release.sh <sha>` (automatic rollback on a failed health check); previous release `d024343` kept.
4. Server settings (owner, on the server): `QR_SIGNING_KEY` before the first certificate is issued (docs/26 §4);
   optional `AI_ASSISTANT=on` to switch on Ask MCCI AI (uses the existing `OPENAI_API_KEY`). Restart `mcci-web` after.
5. Live smoke: `/api/health` release, `/`, `/login`, `/verify` (random reference → not found), `/api/public/verify`
   (404 / 429), member portal pages (assistant, opportunities), staff pages (reports, search, queue), file routes 403
   without a session, demo still answers on its own host.
6. Rollback: `scripts/deploy/release.sh --rollback` (code); migrations 0520–0560 are additive (no rollback needed). The older
   release ignores the new column and functions; 0550 only narrows member access to certificates, and production has
   no documents yet.
