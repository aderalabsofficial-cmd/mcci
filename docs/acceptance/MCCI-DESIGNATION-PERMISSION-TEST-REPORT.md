# MCCI Phase 1 — designation-wise permission test report

Generated 2026-11-06 08:31 UTC by `scripts/acceptance/report.mjs` from the crawl in `tests/e2e/acceptance.spec.ts`. Each designation signed in with its own synthetic account (password + authenticator code, through the real staff sign-in page) on the local stack, which runs the same 61 migrations as production. Cell = what the page did / what the configured limits say it should do. ✓ = shown as expected, 🔒 = "outside your limits" as expected, ✗ = mismatch.

## Configured limits (role_permissions)

Levels: 0 none · 1 view · 2 edit · 3 approve.

| Designation | biz | chg | cmt | dash | docs | eng | fin | mem | out | pay | plat | reg | rep | staff | svc | temp | vot |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Accounts Officer | 0 | 0 | 0 | 1 | 0 | 0 | 2 | 1 | 0 | 3 | 0 | 1 | 1 | 0 | 1 | 1 | 0 |
| Auditor (read-only) | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| Committee Secretary | 0 | 0 | 3 | 1 | 0 | 2 | 0 | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| Deputy Secretary — Membership | 3 | 1 | 1 | 1 | 2 | 2 | 0 | 3 | 3 | 1 | 0 | 3 | 1 | 1 | 1 | 3 | 2 |
| Front Desk / Data Entry | 0 | 0 | 0 | 1 | 0 | 2 | 0 | 1 | 0 | 0 | 0 | 2 | 0 | 0 | 1 | 1 | 0 |
| IT Convener | 1 | 0 | 0 | 1 | 1 | 0 | 0 | 1 | 0 | 0 | 3 | 1 | 1 | 0 | 0 | 0 | 0 |
| Membership Committee Convener | 0 | 0 | 3 | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| Membership Committee Member | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Membership Officer | 2 | 1 | 0 | 1 | 1 | 1 | 0 | 2 | 2 | 1 | 0 | 2 | 1 | 0 | 0 | 2 | 1 |
| President (Signatory) | 1 | 3 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 0 | 1 | 1 | 0 | 3 | 1 | 1 |
| Secretary General | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 |
| Services Officer | 0 | 0 | 0 | 1 | 2 | 1 | 0 | 0 | 0 | 1 | 0 | 1 | 1 | 0 | 2 | 0 | 0 |

## Page access by designation (English)

| Page | Accounts Officer | Auditor (read-only) | Committee Secretary | Deputy Secretary — Membership | Front Desk / Data Entry | IT Convener | Membership Committee Convener | Membership Committee Member | Membership Officer | President (Signatory) | Secretary General | Services Officer |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `/admin` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/admin/ai` | ✓ | ✓ | 🔒 | ✓ | 🔒 | ✓ | 🔒 | 🔒 | ✓ | ✓ | ✓ | ✓ |
| `/admin/applications` | ✓ | ✓ | 🔒 | ✓ | ✓ | 🔒 | 🔒 | 🔒 | 🔒 | ✓ | ✓ | ✓ |
| `/admin/approvals` | ✓ | ✓ | 🔒 | ✓ | ✓ | 🔒 | 🔒 | 🔒 | 🔒 | ✓ | ✓ | ✓ |
| `/admin/audit` | 🔒 | ✓ | 🔒 | ✓ | 🔒 | ✓ | 🔒 | 🔒 | 🔒 | 🔒 | ✓ | 🔒 |
| `/admin/business-directory` | 🔒 | ✓ | 🔒 | ✓ | 🔒 | ✓ | 🔒 | 🔒 | ✓ | ✓ | ✓ | 🔒 |
| `/admin/business-directory/exports` | 🔒 | 🔒 | 🔒 | ✓ | 🔒 | 🔒 | 🔒 | 🔒 | ✓ | 🔒 | ✓ | 🔒 |
| `/admin/business-directory/profile` | 🔒 | ✓ | 🔒 | ✓ | 🔒 | ✓ | 🔒 | 🔒 | ✓ | ✓ | ✓ | 🔒 |
| `/admin/business-directory/segments` | 🔒 | ✓ | 🔒 | ✓ | 🔒 | ✓ | 🔒 | 🔒 | ✓ | ✓ | ✓ | 🔒 |
| `/admin/changes` | 🔒 | ✓ | 🔒 | ✓ | 🔒 | 🔒 | 🔒 | 🔒 | ✓ | ✓ | ✓ | 🔒 |
| `/admin/committee` | 🔒 | ✓ | ✓ | ✓ | 🔒 | 🔒 | ✓ | ✓ | 🔒 | ✓ | ✓ | 🔒 |
| `/admin/complaints` | 🔒 | ✓ | ✓ | ✓ | ✓ | 🔒 | 🔒 | 🔒 | ✓ | ✓ | ✓ | ✓ |
| `/admin/content` | 🔒 | ✓ | ✓ | ✓ | ✓ | 🔒 | 🔒 | 🔒 | ✓ | ✓ | ✓ | ✓ |
| `/admin/documents` | ✓ | ✓ | 🔒 | ✓ | ✓ | ✓ | 🔒 | 🔒 | ✓ | ✓ | ✓ | ✓ |
| `/admin/events` | 🔒 | ✓ | ✓ | ✓ | ✓ | 🔒 | 🔒 | 🔒 | ✓ | ✓ | ✓ | ✓ |
| `/admin/finance` | ✓ | ✓ | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | ✓ | ✓ | 🔒 |
| `/admin/help` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/admin/import` | 🔒 | 🔒 | 🔒 | ✓ | ✓ | 🔒 | 🔒 | 🔒 | ✓ | 🔒 | ✓ | 🔒 |
| `/admin/integrations` | ✓ | ✓ | 🔒 | ✓ | ✓ | ✓ | 🔒 | 🔒 | 🔒 | ✓ | ✓ | ✓ |
| `/admin/meetings` | 🔒 | ✓ | ✓ | ✓ | 🔒 | 🔒 | ✓ | ✓ | 🔒 | ✓ | ✓ | 🔒 |
| `/admin/member` | redirected | redirected | redirected | redirected | redirected | redirected | redirected | 🔒 | redirected | redirected | redirected | redirected |
| `/admin/members` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 🔒 | ✓ | ✓ | ✓ | ✓ |
| `/admin/mreview` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 🔒 |
| `/admin/notify` | 🔒 | ✓ | ✓ | ✓ | ✓ | 🔒 | 🔒 | 🔒 | ✓ | ✓ | ✓ | ✓ |
| `/admin/payments` | ✓ | ✓ | 🔒 | ✓ | 🔒 | 🔒 | 🔒 | 🔒 | ✓ | ✓ | ✓ | ✓ |
| `/admin/psid` | ✓ | ✓ | 🔒 | ✓ | 🔒 | 🔒 | 🔒 | 🔒 | ✓ | ✓ | ✓ | ✓ |
| `/admin/queue` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/admin/reports` | ✓ | ✓ | 🔒 | ✓ | 🔒 | ✓ | 🔒 | 🔒 | ✓ | ✓ | ✓ | ✓ |
| `/admin/requests` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 🔒 |
| `/admin/review` | ✓ | ✓ | 🔒 | ✓ | ✓ | 🔒 | 🔒 | 🔒 | 🔒 | ✓ | ✓ | ✓ |
| `/admin/review/letter` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/admin/search` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/admin/services` | ✓ | ✓ | 🔒 | ✓ | ✓ | ✓ | 🔒 | 🔒 | 🔒 | ✓ | ✓ | ✓ |
| `/admin/settings` | 🔒 | ✓ | 🔒 | 🔒 | 🔒 | ✓ | 🔒 | 🔒 | 🔒 | 🔒 | ✓ | 🔒 |
| `/admin/sla` | ✓ | ✓ | 🔒 | ✓ | ✓ | 🔒 | 🔒 | 🔒 | 🔒 | ✓ | ✓ | ✓ |
| `/admin/staff` | 🔒 | ✓ | 🔒 | ✓ | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | ✓ | 🔒 |
| `/admin/temp` | ✓ | ✓ | 🔒 | ✓ | ✓ | 🔒 | 🔒 | 🔒 | ✓ | ✓ | ✓ | 🔒 |
| `/admin/whatsapp` | 🔒 | ✓ | 🔒 | ✓ | 🔒 | 🔒 | 🔒 | 🔒 | ✓ | ✓ | ✓ | 🔒 |
| `/admin/whatsapp/campaigns` | 🔒 | ✓ | 🔒 | ✓ | 🔒 | 🔒 | 🔒 | 🔒 | ✓ | ✓ | ✓ | 🔒 |
| `/admin/whatsapp/campaigns/history` | 🔒 | ✓ | 🔒 | ✓ | 🔒 | 🔒 | 🔒 | 🔒 | ✓ | ✓ | ✓ | 🔒 |
| `/admin/whatsapp/campaigns/new` | 🔒 | 🔒 | 🔒 | ✓ | 🔒 | 🔒 | 🔒 | 🔒 | ✓ | 🔒 | ✓ | 🔒 |
| `/admin/whatsapp/campaigns/view` | 🔒 | ✓ | 🔒 | ✓ | 🔒 | 🔒 | 🔒 | 🔒 | ✓ | ✓ | ✓ | 🔒 |
| `/admin/whatsapp/consent` | 🔒 | 🔒 | 🔒 | ✓ | 🔒 | 🔒 | 🔒 | 🔒 | ✓ | 🔒 | ✓ | 🔒 |
| `/admin/whatsapp/inbox` | 🔒 | 🔒 | 🔒 | ✓ | 🔒 | 🔒 | 🔒 | 🔒 | ✓ | 🔒 | ✓ | 🔒 |
| `/admin/whatsapp/readiness` | 🔒 | ✓ | 🔒 | ✓ | 🔒 | 🔒 | 🔒 | 🔒 | ✓ | ✓ | ✓ | 🔒 |
| `/admin/whatsapp/settings` | 🔒 | ✓ | 🔒 | 🔒 | 🔒 | ✓ | 🔒 | 🔒 | 🔒 | 🔒 | ✓ | 🔒 |
| `/admin/whatsapp/templates` | 🔒 | ✓ | 🔒 | ✓ | 🔒 | 🔒 | 🔒 | 🔒 | ✓ | ✓ | ✓ | 🔒 |

## Mismatches

None.

## Members, applicant and visitor

| Persona | Pages opened | Shown | Redirected | Not found | Denied | Errors |
|---|---|---|---|---|---|---|
| Applicant (registered, no membership) | 65 | 18 | 47 | 0 | 0 | 0 |
| Associate member — Owner | 18 | 18 | 0 | 0 | 0 | 0 |
| Corporate member — Owner | 106 | 54 | 52 | 0 | 0 | 0 |
| Corporate member — Viewer (company user) | 18 | 18 | 0 | 0 | 0 | 0 |
| Visitor (not signed in) | 111 | 40 | 24 | 47 | 0 | 0 |

## Designations named in the brief that do not exist

| Designation | Status | Administrator action |
|---|---|---|
| Vice President | NOT CONFIGURED (not in `role_permissions`, local or production) | MCCI decides the limits; the SG creates it in Staff & Audit; run `scripts/ops/demo-accounts.mjs --apply` again |
| Assistant Secretary | NOT CONFIGURED | as above |
| Super Administrator / Administrator | NOT CONFIGURED: by design there is none. The Secretary General holds level 3 on every module; only the IT Convener exports and downloads originals | none, unless MCCI wants such a role |

## Server-side and database evidence (a hidden button is not proof)

- **Database (pgTAP, fresh build of all 61 migrations, 6 Nov):** 47 files, **1,235 / 1,235** assertions pass. Each
  designation is impersonated inside the database (`tests.exec_as`) and checked against what it may read and change:
  010 identity & staff, 040 payments, 050 committee/print/documents, 060 & 210 services, 110 invitations & roles,
  120 staff ↔ company people, 160 committee, 220 engagement, 240 hierarchy approval, 270 confidential files,
  310 settings, 398 demo clean-up; members and company roles in 020, 030, 130, 150, 250, 280; public access in 200, 320.
- **Server actions:** all 173 checked statically. Every action that changes data starts with `requirePermission` /
  `requireCompanyPermission` / `requireUser`, or calls a database function that checks the caller (`.rpc`). The 8
  application-wizard actions check through `editable()` → `requireCompanyPermission(company, 'mship', 'edit')`. Ten
  are public by design: password reset, e-mail code, TOTP, sign-out, sign-up, invitation activation, session
  keep-alive / idle end, contact form.
- **Production, as a visitor:** every `/admin` page answered 404; every `/portal` page redirected to sign-in; protected
  APIs answered 401/403 (`/api/queue`, `/api/reports`, exports, files, certificate scans, uploads); cron endpoints
  401 without the secret; the WhatsApp webhook 401 with a bad signature.
- **Browser, per designation (this report):** each persona signed in through the real staff sign-in page with
  password + 6-digit authenticator code, then opened every admin page by its address (not via menus), so pages that
  are hidden from the menu were tried as well.
