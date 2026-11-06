# MCCI Phase 1 — test inventory

Generated 2026-11-06 08:31 UTC by `scripts/acceptance/report.mjs` from the crawl in `tests/e2e/acceptance.spec.ts`. Every page under `app/[locale]` was opened by every persona that should (or should not) reach it. Each row is one test with its own ID. Statuses: PASS = verified with evidence; PARTIAL = reached as expected but with a problem listed; FAIL = wrong access result or a server error. Element-level tests are in `MCCI-INTERACTIVE-ELEMENT-TEST-REPORT.md`; workflow, role and security tests in the handover report.

## Counts

| | Total | PASS | PARTIAL | FAIL |
|---|---|---|---|---|
| Page tests (local, all personas) | 1145 | 1112 | 33 | 0 |
| Page tests (production, visitor) | 111 | 110 | 1 | 0 |
| Element tests (local) | 5162 | 3981 | 1181 | 0 |

Routes discovered: **88** (each in English and Urdu). Personas (local): 17. Production: visitor only (no demo passwords were available to the tester; see the handover report).

## Page tests

| Test ID | Target | Module | Route | Persona | Expected | Actual | Status | Notes | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| PROD-SITE-001 | production | SITE | `/` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-home.jpg) |
| PROD-SITE-002 | production | SITE | `/about` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-about.jpg) |
| PROD-ADMIN-001 | production | ADMIN | `/admin` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-PROBLEM.jpg) |
| PROD-REP-001 | production | REP | `/admin/ai` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-ai-PROBLEM.jpg) |
| PROD-SVC-001 | production | SVC | `/admin/applications` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-applications-PROBLEM.jpg) |
| PROD-SVC-002 | production | SVC | `/admin/approvals` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-approvals-PROBLEM.jpg) |
| PROD-STAFF-001 | production | STAFF | `/admin/audit` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-audit-PROBLEM.jpg) |
| PROD-BIZ-001 | production | BIZ | `/admin/business-directory` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-business-directory-PROBLEM.jpg) |
| PROD-BIZ-002 | production | BIZ | `/admin/business-directory/exports` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-business-directory-exports-PROBLEM.jpg) |
| PROD-BIZ-003 | production | BIZ | `/admin/business-directory/profile` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-business-directory-profile-PROBLEM.jpg) |
| PROD-BIZ-004 | production | BIZ | `/admin/business-directory/segments` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-business-directory-segments-PROBLEM.jpg) |
| PROD-REG-001 | production | REG | `/admin/changes` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-changes-PROBLEM.jpg) |
| PROD-CMT-001 | production | CMT | `/admin/committee` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-committee-PROBLEM.jpg) |
| PROD-ENG-001 | production | ENG | `/admin/complaints` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-complaints-PROBLEM.jpg) |
| PROD-CMS-001 | production | CMS | `/admin/content` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-content-PROBLEM.jpg) |
| PROD-DOC-001 | production | DOC | `/admin/documents` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-documents-PROBLEM.jpg) |
| PROD-ENG-002 | production | ENG | `/admin/events` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-events-PROBLEM.jpg) |
| PROD-FIN-001 | production | FIN | `/admin/finance` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-finance-PROBLEM.jpg) |
| PROD-ADMIN-002 | production | ADMIN | `/admin/help` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-help-PROBLEM.jpg) |
| PROD-REG-002 | production | REG | `/admin/import` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-import-PROBLEM.jpg) |
| PROD-PLAT-001 | production | PLAT | `/admin/integrations` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-integrations-PROBLEM.jpg) |
| PROD-CMT-002 | production | CMT | `/admin/meetings` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-meetings-PROBLEM.jpg) |
| PROD-REG-003 | production | REG | `/admin/member` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-member-PROBLEM.jpg) |
| PROD-REG-004 | production | REG | `/admin/members` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-members-PROBLEM.jpg) |
| PROD-MEM-001 | production | MEM | `/admin/mreview` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-mreview-PROBLEM.jpg) |
| PROD-CMS-002 | production | CMS | `/admin/notify` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-notify-PROBLEM.jpg) |
| PROD-FIN-002 | production | FIN | `/admin/payments` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-payments-PROBLEM.jpg) |
| PROD-FIN-003 | production | FIN | `/admin/psid` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-psid-PROBLEM.jpg) |
| PROD-ADMIN-003 | production | ADMIN | `/admin/queue` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-queue-PROBLEM.jpg) |
| PROD-REP-002 | production | REP | `/admin/reports` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-reports-PROBLEM.jpg) |
| PROD-MEM-002 | production | MEM | `/admin/requests` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-requests-PROBLEM.jpg) |
| PROD-SVC-003 | production | SVC | `/admin/review` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-review-PROBLEM.jpg) |
| PROD-SVC-004 | production | SVC | `/admin/review/letter` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-review-letter-PROBLEM.jpg) |
| PROD-ADMIN-004 | production | ADMIN | `/admin/search` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-search-PROBLEM.jpg) |
| PROD-PLAT-002 | production | PLAT | `/admin/services` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-services-PROBLEM.jpg) |
| PROD-PLAT-003 | production | PLAT | `/admin/settings` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-settings-PROBLEM.jpg) |
| PROD-SVC-005 | production | SVC | `/admin/sla` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-sla-PROBLEM.jpg) |
| PROD-STAFF-002 | production | STAFF | `/admin/staff` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-staff-PROBLEM.jpg) |
| PROD-CERT-001 | production | CERT | `/admin/temp` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-temp-PROBLEM.jpg) |
| PROD-WHATSAPP-001 | production | WHATSAPP | `/admin/whatsapp` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-whatsapp-PROBLEM.jpg) |
| PROD-WHATSAPP-002 | production | WHATSAPP | `/admin/whatsapp/campaigns` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-whatsapp-campaigns-PROBLEM.jpg) |
| PROD-WHATSAPP-003 | production | WHATSAPP | `/admin/whatsapp/campaigns/history` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-whatsapp-campaigns-history-PROBLEM.jpg) |
| PROD-WHATSAPP-004 | production | WHATSAPP | `/admin/whatsapp/campaigns/new` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-whatsapp-campaigns-new-PROBLEM.jpg) |
| PROD-WHATSAPP-005 | production | WHATSAPP | `/admin/whatsapp/campaigns/view` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-whatsapp-campaigns-view-PROBLEM.jpg) |
| PROD-WHATSAPP-006 | production | WHATSAPP | `/admin/whatsapp/consent` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-whatsapp-consent-PROBLEM.jpg) |
| PROD-WHATSAPP-007 | production | WHATSAPP | `/admin/whatsapp/inbox` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-whatsapp-inbox-PROBLEM.jpg) |
| PROD-WHATSAPP-008 | production | WHATSAPP | `/admin/whatsapp/readiness` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-whatsapp-readiness-PROBLEM.jpg) |
| PROD-WHATSAPP-009 | production | WHATSAPP | `/admin/whatsapp/settings` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-whatsapp-settings-PROBLEM.jpg) |
| PROD-WHATSAPP-010 | production | WHATSAPP | `/admin/whatsapp/templates` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-admin-whatsapp-templates-PROBLEM.jpg) |
| PROD-SITE-003 | production | SITE | `/contact` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-contact.jpg) |
| PROD-SITE-004 | production | SITE | `/directory` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-directory.jpg) |
| PROD-AUTH-001 | production | AUTH | `/invite/acceptance-token-does-not-exist` | Visitor (not signed in) | not-found or shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-invite-acceptance-token-does-not-exist.jpg) |
| PROD-SITE-005 | production | SITE | `/live` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-live.jpg) |
| PROD-AUTH-002 | production | AUTH | `/login` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-login.jpg) |
| PROD-AUTH-003 | production | AUTH | `/login/forgot` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-login-forgot.jpg) |
| PROD-AUTH-004 | production | AUTH | `/login/reset` | Visitor (not signed in) | shown or redirected | redirected (HTTP 200) | **PASS** |  |  |
| PROD-AUTH-005 | production | AUTH | `/login/verify` | Visitor (not signed in) | shown or redirected | redirected (HTTP 200) | **PASS** |  |  |
| PROD-SITE-006 | production | SITE | `/membership` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-membership.jpg) |
| PROD-SITE-007 | production | SITE | `/news` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-news.jpg) |
| PROD-PORTAL-001 | production | PORTAL | `/portal` | Visitor (not signed in) | redirected | redirected (HTTP 200) | **PASS** |  |  |
| PROD-SVC-006 | production | SVC | `/portal/application` | Visitor (not signed in) | redirected | redirected (HTTP 200) | **PASS** |  |  |
| PROD-SVC-007 | production | SVC | `/portal/application/letter` | Visitor (not signed in) | redirected | redirected (HTTP 200) | **PASS** |  |  |
| PROD-SVC-008 | production | SVC | `/portal/applications` | Visitor (not signed in) | redirected | redirected (HTTP 200) | **PASS** |  |  |
| PROD-SVC-009 | production | SVC | `/portal/apply` | Visitor (not signed in) | redirected | redirected (HTTP 200) | **PASS** |  |  |
| PROD-AI-001 | production | AI | `/portal/assistant` | Visitor (not signed in) | redirected | redirected (HTTP 200) | **PASS** |  |  |
| PROD-DOC-002 | production | DOC | `/portal/documents` | Visitor (not signed in) | redirected | redirected (HTTP 200) | **PASS** |  |  |
| PROD-END-001 | production | END | `/portal/endorse` | Visitor (not signed in) | redirected | redirected (HTTP 200) | **PASS** |  |  |
| PROD-ENG-003 | production | ENG | `/portal/events` | Visitor (not signed in) | redirected | redirected (HTTP 200) | **PASS** |  |  |
| PROD-MEM-003 | production | MEM | `/portal/form` | Visitor (not signed in) | redirected | redirected (HTTP 200) | **PASS** |  |  |
| PROD-MEM-004 | production | MEM | `/portal/join` | Visitor (not signed in) | redirected | redirected (HTTP 200) | **PASS** |  |  |
| PROD-MEM-005 | production | MEM | `/portal/membership` | Visitor (not signed in) | redirected | redirected (HTTP 200) | **PASS** |  |  |
| PROD-MEM-006 | production | MEM | `/portal/mtrack` | Visitor (not signed in) | redirected | redirected (HTTP 200) | **PASS** |  |  |
| PROD-ENG-004 | production | ENG | `/portal/notifications` | Visitor (not signed in) | redirected | redirected (HTTP 200) | **PASS** |  |  |
| PROD-OPP-001 | production | OPP | `/portal/opportunities` | Visitor (not signed in) | redirected | redirected (HTTP 200) | **PASS** |  |  |
| PROD-FIN-004 | production | FIN | `/portal/payments` | Visitor (not signed in) | redirected | redirected (HTTP 200) | **PASS** |  |  |
| PROD-PROF-001 | production | PROF | `/portal/profile` | Visitor (not signed in) | redirected | redirected (HTTP 200) | **PASS** |  |  |
| PROD-ENG-005 | production | ENG | `/portal/support` | Visitor (not signed in) | redirected | redirected (HTTP 200) | **PASS** |  |  |
| PROD-AUTH-006 | production | AUTH | `/register` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-register.jpg) |
| PROD-AUTH-007 | production | AUTH | `/register/details` | Visitor (not signed in) | shown or redirected | redirected (HTTP 200) | **PASS** |  |  |
| PROD-AUTH-008 | production | AUTH | `/register/pending` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-register-pending.jpg) |
| PROD-SITE-008 | production | SITE | `/resources` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-resources.jpg) |
| PROD-SITE-009 | production | SITE | `/resources/form` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-resources-form.jpg) |
| PROD-SITE-010 | production | SITE | `/service` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-service.jpg) |
| PROD-SITE-011 | production | SITE | `/services` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-services.jpg) |
| PROD-AUTH-009 | production | AUTH | `/staff/login` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-staff-login.jpg) |
| PROD-SITE-012 | production | SITE | `/track` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-track.jpg) |
| PROD-SITE-013 | production | SITE | `/verify` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-verify.jpg) |
| PROD-SITE-014 | production | SITE | `/verify/acceptance-code-does-not-exist` | Visitor (not signed in) | not-found or shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl-production/visitor/en-verify-acceptance-code-does-not-exist.jpg) |
| PROD-SITE-015 | production | SITE | `/ur` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl-production/visitor/ur-home.jpg) |
| PROD-SITE-016 | production | SITE | `/ur/about` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl-production/visitor/ur-about.jpg) |
| PROD-SITE-017 | production | SITE | `/ur/contact` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl-production/visitor/ur-contact.jpg) |
| PROD-SITE-018 | production | SITE | `/ur/directory` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PARTIAL** | browser errors: pageerror: Minified React error #418; visit https://react.dev/errors/418?args[]=HTML&args[]= for the full message or use the non-minified dev environment for full errors and additional helpful warnings. | [shot](evidence/crawl-production/visitor/ur-directory-PROBLEM.jpg) |
| PROD-AUTH-010 | production | AUTH | `/ur/invite/acceptance-token-does-not-exist` | Visitor (not signed in) | not-found or shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl-production/visitor/ur-invite-acceptance-token-does-not-exist.jpg) |
| PROD-SITE-019 | production | SITE | `/ur/live` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl-production/visitor/ur-live.jpg) |
| PROD-AUTH-011 | production | AUTH | `/ur/login` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl-production/visitor/ur-login.jpg) |
| PROD-AUTH-012 | production | AUTH | `/ur/login/forgot` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl-production/visitor/ur-login-forgot.jpg) |
| PROD-AUTH-013 | production | AUTH | `/ur/login/reset` | Visitor (not signed in) | shown or redirected | redirected (HTTP 200) | **PASS** |  |  |
| PROD-AUTH-014 | production | AUTH | `/ur/login/verify` | Visitor (not signed in) | shown or redirected | redirected (HTTP 200) | **PASS** |  |  |
| PROD-SITE-020 | production | SITE | `/ur/membership` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl-production/visitor/ur-membership.jpg) |
| PROD-SITE-021 | production | SITE | `/ur/news` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl-production/visitor/ur-news.jpg) |
| PROD-AUTH-015 | production | AUTH | `/ur/register` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl-production/visitor/ur-register.jpg) |
| PROD-AUTH-016 | production | AUTH | `/ur/register/details` | Visitor (not signed in) | shown or redirected | redirected (HTTP 200) | **PASS** |  |  |
| PROD-AUTH-017 | production | AUTH | `/ur/register/pending` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl-production/visitor/ur-register-pending.jpg) |
| PROD-SITE-022 | production | SITE | `/ur/resources` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl-production/visitor/ur-resources.jpg) |
| PROD-SITE-023 | production | SITE | `/ur/resources/form` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl-production/visitor/ur-resources-form.jpg) |
| PROD-SITE-024 | production | SITE | `/ur/service` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl-production/visitor/ur-service.jpg) |
| PROD-SITE-025 | production | SITE | `/ur/services` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl-production/visitor/ur-services.jpg) |
| PROD-AUTH-018 | production | AUTH | `/ur/staff/login` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl-production/visitor/ur-staff-login.jpg) |
| PROD-SITE-026 | production | SITE | `/ur/track` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl-production/visitor/ur-track.jpg) |
| PROD-SITE-027 | production | SITE | `/ur/verify` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl-production/visitor/ur-verify.jpg) |
| PROD-SITE-028 | production | SITE | `/ur/verify/acceptance-code-does-not-exist` | Visitor (not signed in) | not-found or shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl-production/visitor/ur-verify-acceptance-code-does-not-exist.jpg) |
| ADMIN-001 | local | ADMIN | `/admin` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| REP-001 | local | REP | `/admin/ai` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| SVC-001 | local | SVC | `/admin/applications` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| SVC-002 | local | SVC | `/admin/approvals` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| STAFF-001 | local | STAFF | `/admin/audit` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| BIZ-001 | local | BIZ | `/admin/business-directory` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| BIZ-002 | local | BIZ | `/admin/business-directory/exports` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| BIZ-003 | local | BIZ | `/admin/business-directory/profile` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| BIZ-004 | local | BIZ | `/admin/business-directory/segments` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| REG-001 | local | REG | `/admin/changes` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| CMT-001 | local | CMT | `/admin/committee` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| ENG-001 | local | ENG | `/admin/complaints` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| CMS-001 | local | CMS | `/admin/content` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| DOC-001 | local | DOC | `/admin/documents` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| ENG-002 | local | ENG | `/admin/events` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| FIN-001 | local | FIN | `/admin/finance` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| ADMIN-002 | local | ADMIN | `/admin/help` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| REG-002 | local | REG | `/admin/import` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| PLAT-001 | local | PLAT | `/admin/integrations` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| CMT-002 | local | CMT | `/admin/meetings` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| REG-003 | local | REG | `/admin/member` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| REG-004 | local | REG | `/admin/members` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| MEM-001 | local | MEM | `/admin/mreview` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| CMS-002 | local | CMS | `/admin/notify` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| FIN-002 | local | FIN | `/admin/payments` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| FIN-003 | local | FIN | `/admin/psid` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| ADMIN-003 | local | ADMIN | `/admin/queue` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| REP-002 | local | REP | `/admin/reports` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| MEM-002 | local | MEM | `/admin/requests` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| SVC-003 | local | SVC | `/admin/review` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| SVC-004 | local | SVC | `/admin/review/letter` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| ADMIN-004 | local | ADMIN | `/admin/search` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| PLAT-002 | local | PLAT | `/admin/services` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| PLAT-003 | local | PLAT | `/admin/settings` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| SVC-005 | local | SVC | `/admin/sla` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| STAFF-002 | local | STAFF | `/admin/staff` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| CERT-001 | local | CERT | `/admin/temp` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| WHATSAPP-001 | local | WHATSAPP | `/admin/whatsapp` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| WHATSAPP-002 | local | WHATSAPP | `/admin/whatsapp/campaigns` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| WHATSAPP-003 | local | WHATSAPP | `/admin/whatsapp/campaigns/history` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| WHATSAPP-004 | local | WHATSAPP | `/admin/whatsapp/campaigns/new` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| WHATSAPP-005 | local | WHATSAPP | `/admin/whatsapp/campaigns/view` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| WHATSAPP-006 | local | WHATSAPP | `/admin/whatsapp/consent` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| WHATSAPP-007 | local | WHATSAPP | `/admin/whatsapp/inbox` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| WHATSAPP-008 | local | WHATSAPP | `/admin/whatsapp/readiness` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| WHATSAPP-009 | local | WHATSAPP | `/admin/whatsapp/settings` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| WHATSAPP-010 | local | WHATSAPP | `/admin/whatsapp/templates` | Applicant (registered, no membership) | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| PORTAL-001 | local | PORTAL | `/portal` | Applicant (registered, no membership) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/applicant/en-portal.jpg) |
| SVC-006 | local | SVC | `/portal/application` | Applicant (registered, no membership) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/applicant/en-portal-application.jpg) |
| SVC-007 | local | SVC | `/portal/application/letter` | Applicant (registered, no membership) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/applicant/en-portal-application-letter.jpg) |
| SVC-008 | local | SVC | `/portal/applications` | Applicant (registered, no membership) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/applicant/en-portal-applications.jpg) |
| SVC-009 | local | SVC | `/portal/apply` | Applicant (registered, no membership) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/applicant/en-portal-apply.jpg) |
| AI-001 | local | AI | `/portal/assistant` | Applicant (registered, no membership) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/applicant/en-portal-assistant.jpg) |
| DOC-002 | local | DOC | `/portal/documents` | Applicant (registered, no membership) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/applicant/en-portal-documents.jpg) |
| END-001 | local | END | `/portal/endorse` | Applicant (registered, no membership) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/applicant/en-portal-endorse.jpg) |
| ENG-003 | local | ENG | `/portal/events` | Applicant (registered, no membership) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/applicant/en-portal-events.jpg) |
| MEM-003 | local | MEM | `/portal/form` | Applicant (registered, no membership) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/applicant/en-portal-form.jpg) |
| MEM-004 | local | MEM | `/portal/join` | Applicant (registered, no membership) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/applicant/en-portal-join.jpg) |
| MEM-005 | local | MEM | `/portal/membership` | Applicant (registered, no membership) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/applicant/en-portal-membership.jpg) |
| MEM-006 | local | MEM | `/portal/mtrack` | Applicant (registered, no membership) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/applicant/en-portal-mtrack.jpg) |
| ENG-004 | local | ENG | `/portal/notifications` | Applicant (registered, no membership) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/applicant/en-portal-notifications.jpg) |
| OPP-001 | local | OPP | `/portal/opportunities` | Applicant (registered, no membership) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/applicant/en-portal-opportunities.jpg) |
| FIN-004 | local | FIN | `/portal/payments` | Applicant (registered, no membership) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/applicant/en-portal-payments.jpg) |
| PROF-001 | local | PROF | `/portal/profile` | Applicant (registered, no membership) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/applicant/en-portal-profile.jpg) |
| ENG-005 | local | ENG | `/portal/support` | Applicant (registered, no membership) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/applicant/en-portal-support.jpg) |
| PORTAL-002 | local | PORTAL | `/portal` | Associate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-associate-owner/en-portal.jpg) |
| SVC-010 | local | SVC | `/portal/application` | Associate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-associate-owner/en-portal-application.jpg) |
| SVC-011 | local | SVC | `/portal/application/letter` | Associate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-associate-owner/en-portal-application-letter.jpg) |
| SVC-012 | local | SVC | `/portal/applications` | Associate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-associate-owner/en-portal-applications.jpg) |
| SVC-013 | local | SVC | `/portal/apply` | Associate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-associate-owner/en-portal-apply.jpg) |
| AI-002 | local | AI | `/portal/assistant` | Associate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-associate-owner/en-portal-assistant.jpg) |
| DOC-003 | local | DOC | `/portal/documents` | Associate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-associate-owner/en-portal-documents.jpg) |
| END-002 | local | END | `/portal/endorse` | Associate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-associate-owner/en-portal-endorse.jpg) |
| ENG-006 | local | ENG | `/portal/events` | Associate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-associate-owner/en-portal-events.jpg) |
| MEM-007 | local | MEM | `/portal/form` | Associate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-associate-owner/en-portal-form.jpg) |
| MEM-008 | local | MEM | `/portal/join` | Associate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-associate-owner/en-portal-join.jpg) |
| MEM-009 | local | MEM | `/portal/membership` | Associate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-associate-owner/en-portal-membership.jpg) |
| MEM-010 | local | MEM | `/portal/mtrack` | Associate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-associate-owner/en-portal-mtrack.jpg) |
| ENG-007 | local | ENG | `/portal/notifications` | Associate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-associate-owner/en-portal-notifications.jpg) |
| OPP-002 | local | OPP | `/portal/opportunities` | Associate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-associate-owner/en-portal-opportunities.jpg) |
| FIN-005 | local | FIN | `/portal/payments` | Associate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-associate-owner/en-portal-payments.jpg) |
| PROF-002 | local | PROF | `/portal/profile` | Associate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-associate-owner/en-portal-profile.jpg) |
| ENG-008 | local | ENG | `/portal/support` | Associate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-associate-owner/en-portal-support.jpg) |
| SITE-001 | local | SITE | `/` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/en-home.jpg) |
| SITE-002 | local | SITE | `/about` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/en-about.jpg) |
| ADMIN-005 | local | ADMIN | `/admin` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| REP-003 | local | REP | `/admin/ai` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| SVC-014 | local | SVC | `/admin/applications` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| SVC-015 | local | SVC | `/admin/approvals` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| STAFF-003 | local | STAFF | `/admin/audit` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| BIZ-005 | local | BIZ | `/admin/business-directory` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| BIZ-006 | local | BIZ | `/admin/business-directory/exports` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| BIZ-007 | local | BIZ | `/admin/business-directory/profile` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| BIZ-008 | local | BIZ | `/admin/business-directory/segments` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| REG-005 | local | REG | `/admin/changes` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| CMT-003 | local | CMT | `/admin/committee` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| ENG-009 | local | ENG | `/admin/complaints` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| CMS-003 | local | CMS | `/admin/content` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| DOC-004 | local | DOC | `/admin/documents` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| ENG-010 | local | ENG | `/admin/events` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| FIN-006 | local | FIN | `/admin/finance` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| ADMIN-006 | local | ADMIN | `/admin/help` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| REG-006 | local | REG | `/admin/import` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| PLAT-004 | local | PLAT | `/admin/integrations` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| CMT-004 | local | CMT | `/admin/meetings` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| REG-007 | local | REG | `/admin/member` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| REG-008 | local | REG | `/admin/members` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| MEM-011 | local | MEM | `/admin/mreview` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| CMS-004 | local | CMS | `/admin/notify` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| FIN-007 | local | FIN | `/admin/payments` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| FIN-008 | local | FIN | `/admin/psid` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| ADMIN-007 | local | ADMIN | `/admin/queue` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| REP-004 | local | REP | `/admin/reports` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| MEM-012 | local | MEM | `/admin/requests` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| SVC-016 | local | SVC | `/admin/review` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| SVC-017 | local | SVC | `/admin/review/letter` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| ADMIN-008 | local | ADMIN | `/admin/search` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| PLAT-005 | local | PLAT | `/admin/services` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| PLAT-006 | local | PLAT | `/admin/settings` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| SVC-018 | local | SVC | `/admin/sla` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| STAFF-004 | local | STAFF | `/admin/staff` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| CERT-002 | local | CERT | `/admin/temp` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| WHATSAPP-011 | local | WHATSAPP | `/admin/whatsapp` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| WHATSAPP-012 | local | WHATSAPP | `/admin/whatsapp/campaigns` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| WHATSAPP-013 | local | WHATSAPP | `/admin/whatsapp/campaigns/history` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| WHATSAPP-014 | local | WHATSAPP | `/admin/whatsapp/campaigns/new` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| WHATSAPP-015 | local | WHATSAPP | `/admin/whatsapp/campaigns/view` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| WHATSAPP-016 | local | WHATSAPP | `/admin/whatsapp/consent` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| WHATSAPP-017 | local | WHATSAPP | `/admin/whatsapp/inbox` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| WHATSAPP-018 | local | WHATSAPP | `/admin/whatsapp/readiness` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| WHATSAPP-019 | local | WHATSAPP | `/admin/whatsapp/settings` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| WHATSAPP-020 | local | WHATSAPP | `/admin/whatsapp/templates` | Corporate member — Owner | not-found or redirected | redirected (HTTP 200) | **PASS** |  |  |
| SITE-003 | local | SITE | `/contact` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/en-contact.jpg) |
| SITE-004 | local | SITE | `/directory` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/en-directory.jpg) |
| AUTH-001 | local | AUTH | `/invite/acceptance-token-does-not-exist` | Corporate member — Owner | not-found or shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/en-invite-acceptance-token-does-not-exist.jpg) |
| SITE-005 | local | SITE | `/live` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/en-live.jpg) |
| AUTH-002 | local | AUTH | `/login` | Corporate member — Owner | shown or redirected | redirected (HTTP 200) | **PASS** |  |  |
| AUTH-003 | local | AUTH | `/login/forgot` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/en-login-forgot.jpg) |
| AUTH-004 | local | AUTH | `/login/reset` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/en-login-reset.jpg) |
| AUTH-005 | local | AUTH | `/login/verify` | Corporate member — Owner | shown or redirected | redirected (HTTP 200) | **PASS** |  |  |
| SITE-006 | local | SITE | `/membership` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/en-membership.jpg) |
| SITE-007 | local | SITE | `/news` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/en-news.jpg) |
| PORTAL-003 | local | PORTAL | `/portal` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/en-portal.jpg) |
| SVC-019 | local | SVC | `/portal/application` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/en-portal-application.jpg) |
| SVC-020 | local | SVC | `/portal/application/letter` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/en-portal-application-letter.jpg) |
| SVC-021 | local | SVC | `/portal/applications` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PARTIAL** | browser errors: pageerror: Minified React error #418; visit https://react.dev/errors/418?args[]=HTML&args[]= for the full message or use the non-minified dev environment for full errors and additional helpful warnings. | [shot](evidence/crawl/member-corporate-owner/en-portal-applications-PROBLEM.jpg) |
| SVC-022 | local | SVC | `/portal/apply` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/en-portal-apply.jpg) |
| AI-003 | local | AI | `/portal/assistant` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/en-portal-assistant.jpg) |
| DOC-005 | local | DOC | `/portal/documents` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/en-portal-documents.jpg) |
| END-003 | local | END | `/portal/endorse` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/en-portal-endorse.jpg) |
| ENG-011 | local | ENG | `/portal/events` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/en-portal-events.jpg) |
| MEM-013 | local | MEM | `/portal/form` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/en-portal-form.jpg) |
| MEM-014 | local | MEM | `/portal/join` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/en-portal-join.jpg) |
| MEM-015 | local | MEM | `/portal/membership` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/en-portal-membership.jpg) |
| MEM-016 | local | MEM | `/portal/mtrack` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/en-portal-mtrack.jpg) |
| ENG-012 | local | ENG | `/portal/notifications` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/en-portal-notifications.jpg) |
| OPP-003 | local | OPP | `/portal/opportunities` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/en-portal-opportunities.jpg) |
| FIN-009 | local | FIN | `/portal/payments` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/en-portal-payments.jpg) |
| PROF-003 | local | PROF | `/portal/profile` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/en-portal-profile.jpg) |
| ENG-013 | local | ENG | `/portal/support` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/en-portal-support.jpg) |
| AUTH-006 | local | AUTH | `/register` | Corporate member — Owner | shown or redirected | redirected (HTTP 200) | **PASS** |  |  |
| AUTH-007 | local | AUTH | `/register/details` | Corporate member — Owner | shown or redirected | redirected (HTTP 200) | **PASS** |  |  |
| AUTH-008 | local | AUTH | `/register/pending` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/en-register-pending.jpg) |
| SITE-008 | local | SITE | `/resources` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/en-resources.jpg) |
| SITE-009 | local | SITE | `/resources/form` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/en-resources-form.jpg) |
| SITE-010 | local | SITE | `/service` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/en-service.jpg) |
| SITE-011 | local | SITE | `/services` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/en-services.jpg) |
| AUTH-009 | local | AUTH | `/staff/login` | Corporate member — Owner | shown or redirected | redirected (HTTP 200) | **PASS** |  |  |
| SITE-012 | local | SITE | `/track` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/en-track.jpg) |
| SITE-013 | local | SITE | `/verify` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/en-verify.jpg) |
| SITE-014 | local | SITE | `/verify/acceptance-code-does-not-exist` | Corporate member — Owner | not-found or shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/en-verify-acceptance-code-does-not-exist.jpg) |
| PORTAL-004 | local | PORTAL | `/ur/portal` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/ur-portal.jpg) |
| SVC-023 | local | SVC | `/ur/portal/application` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/ur-portal-application.jpg) |
| SVC-024 | local | SVC | `/ur/portal/application/letter` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/ur-portal-application-letter.jpg) |
| SVC-025 | local | SVC | `/ur/portal/applications` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/ur-portal-applications.jpg) |
| SVC-026 | local | SVC | `/ur/portal/apply` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/ur-portal-apply.jpg) |
| AI-004 | local | AI | `/ur/portal/assistant` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/ur-portal-assistant.jpg) |
| DOC-006 | local | DOC | `/ur/portal/documents` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/ur-portal-documents.jpg) |
| END-004 | local | END | `/ur/portal/endorse` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/ur-portal-endorse.jpg) |
| ENG-014 | local | ENG | `/ur/portal/events` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/ur-portal-events.jpg) |
| MEM-017 | local | MEM | `/ur/portal/form` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/ur-portal-form.jpg) |
| MEM-018 | local | MEM | `/ur/portal/join` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/ur-portal-join.jpg) |
| MEM-019 | local | MEM | `/ur/portal/membership` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/ur-portal-membership.jpg) |
| MEM-020 | local | MEM | `/ur/portal/mtrack` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/ur-portal-mtrack.jpg) |
| ENG-015 | local | ENG | `/ur/portal/notifications` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/ur-portal-notifications.jpg) |
| OPP-004 | local | OPP | `/ur/portal/opportunities` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/ur-portal-opportunities.jpg) |
| FIN-010 | local | FIN | `/ur/portal/payments` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/ur-portal-payments.jpg) |
| PROF-004 | local | PROF | `/ur/portal/profile` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/ur-portal-profile.jpg) |
| ENG-016 | local | ENG | `/ur/portal/support` | Corporate member — Owner | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-corporate-owner/ur-portal-support.jpg) |
| PORTAL-005 | local | PORTAL | `/portal` | Corporate member — Viewer (company user) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-viewer/en-portal.jpg) |
| SVC-027 | local | SVC | `/portal/application` | Corporate member — Viewer (company user) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-viewer/en-portal-application.jpg) |
| SVC-028 | local | SVC | `/portal/application/letter` | Corporate member — Viewer (company user) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-viewer/en-portal-application-letter.jpg) |
| SVC-029 | local | SVC | `/portal/applications` | Corporate member — Viewer (company user) | shown or redirected | shown (HTTP 200) | **PARTIAL** | browser errors: pageerror: Minified React error #418; visit https://react.dev/errors/418?args[]=HTML&args[]= for the full message or use the non-minified dev environment for full errors and additional helpful warnings. | [shot](evidence/crawl/member-viewer/en-portal-applications-PROBLEM.jpg) |
| SVC-030 | local | SVC | `/portal/apply` | Corporate member — Viewer (company user) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-viewer/en-portal-apply.jpg) |
| AI-005 | local | AI | `/portal/assistant` | Corporate member — Viewer (company user) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-viewer/en-portal-assistant.jpg) |
| DOC-007 | local | DOC | `/portal/documents` | Corporate member — Viewer (company user) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-viewer/en-portal-documents.jpg) |
| END-005 | local | END | `/portal/endorse` | Corporate member — Viewer (company user) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-viewer/en-portal-endorse.jpg) |
| ENG-017 | local | ENG | `/portal/events` | Corporate member — Viewer (company user) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-viewer/en-portal-events.jpg) |
| MEM-021 | local | MEM | `/portal/form` | Corporate member — Viewer (company user) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-viewer/en-portal-form.jpg) |
| MEM-022 | local | MEM | `/portal/join` | Corporate member — Viewer (company user) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-viewer/en-portal-join.jpg) |
| MEM-023 | local | MEM | `/portal/membership` | Corporate member — Viewer (company user) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-viewer/en-portal-membership.jpg) |
| MEM-024 | local | MEM | `/portal/mtrack` | Corporate member — Viewer (company user) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-viewer/en-portal-mtrack.jpg) |
| ENG-018 | local | ENG | `/portal/notifications` | Corporate member — Viewer (company user) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-viewer/en-portal-notifications.jpg) |
| OPP-005 | local | OPP | `/portal/opportunities` | Corporate member — Viewer (company user) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-viewer/en-portal-opportunities.jpg) |
| FIN-011 | local | FIN | `/portal/payments` | Corporate member — Viewer (company user) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-viewer/en-portal-payments.jpg) |
| PROF-005 | local | PROF | `/portal/profile` | Corporate member — Viewer (company user) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-viewer/en-portal-profile.jpg) |
| ENG-019 | local | ENG | `/portal/support` | Corporate member — Viewer (company user) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/member-viewer/en-portal-support.jpg) |
| ADMIN-009 | local | ADMIN | `/admin` | Staff — Accounts Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-accounts-officer/en-admin.jpg) |
| REP-005 | local | REP | `/admin/ai` | Staff — Accounts Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-accounts-officer/en-admin-ai.jpg) |
| SVC-031 | local | SVC | `/admin/applications` | Staff — Accounts Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-accounts-officer/en-admin-applications.jpg) |
| SVC-032 | local | SVC | `/admin/approvals` | Staff — Accounts Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-accounts-officer/en-admin-approvals.jpg) |
| STAFF-005 | local | STAFF | `/admin/audit` | Staff — Accounts Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| BIZ-009 | local | BIZ | `/admin/business-directory` | Staff — Accounts Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| BIZ-010 | local | BIZ | `/admin/business-directory/exports` | Staff — Accounts Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| BIZ-011 | local | BIZ | `/admin/business-directory/profile` | Staff — Accounts Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| BIZ-012 | local | BIZ | `/admin/business-directory/segments` | Staff — Accounts Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| REG-009 | local | REG | `/admin/changes` | Staff — Accounts Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| CMT-005 | local | CMT | `/admin/committee` | Staff — Accounts Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| ENG-020 | local | ENG | `/admin/complaints` | Staff — Accounts Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| CMS-005 | local | CMS | `/admin/content` | Staff — Accounts Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| DOC-008 | local | DOC | `/admin/documents` | Staff — Accounts Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-accounts-officer/en-admin-documents.jpg) |
| ENG-021 | local | ENG | `/admin/events` | Staff — Accounts Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| FIN-012 | local | FIN | `/admin/finance` | Staff — Accounts Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-accounts-officer/en-admin-finance.jpg) |
| ADMIN-010 | local | ADMIN | `/admin/help` | Staff — Accounts Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-accounts-officer/en-admin-help.jpg) |
| REG-010 | local | REG | `/admin/import` | Staff — Accounts Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| PLAT-007 | local | PLAT | `/admin/integrations` | Staff — Accounts Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-accounts-officer/en-admin-integrations.jpg) |
| CMT-006 | local | CMT | `/admin/meetings` | Staff — Accounts Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| REG-011 | local | REG | `/admin/member` | Staff — Accounts Officer | redirected | redirected (HTTP 200) | **PASS** |  |  |
| REG-012 | local | REG | `/admin/members` | Staff — Accounts Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-accounts-officer/en-admin-members.jpg) |
| MEM-025 | local | MEM | `/admin/mreview` | Staff — Accounts Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-accounts-officer/en-admin-mreview.jpg) |
| CMS-006 | local | CMS | `/admin/notify` | Staff — Accounts Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| FIN-013 | local | FIN | `/admin/payments` | Staff — Accounts Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-accounts-officer/en-admin-payments.jpg) |
| FIN-014 | local | FIN | `/admin/psid` | Staff — Accounts Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-accounts-officer/en-admin-psid.jpg) |
| ADMIN-011 | local | ADMIN | `/admin/queue` | Staff — Accounts Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-accounts-officer/en-admin-queue.jpg) |
| REP-006 | local | REP | `/admin/reports` | Staff — Accounts Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-accounts-officer/en-admin-reports.jpg) |
| MEM-026 | local | MEM | `/admin/requests` | Staff — Accounts Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-accounts-officer/en-admin-requests.jpg) |
| SVC-033 | local | SVC | `/admin/review` | Staff — Accounts Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-accounts-officer/en-admin-review.jpg) |
| SVC-034 | local | SVC | `/admin/review/letter` | Staff — Accounts Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-accounts-officer/en-admin-review-letter.jpg) |
| ADMIN-012 | local | ADMIN | `/admin/search` | Staff — Accounts Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-accounts-officer/en-admin-search.jpg) |
| PLAT-008 | local | PLAT | `/admin/services` | Staff — Accounts Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-accounts-officer/en-admin-services.jpg) |
| PLAT-009 | local | PLAT | `/admin/settings` | Staff — Accounts Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| SVC-035 | local | SVC | `/admin/sla` | Staff — Accounts Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-accounts-officer/en-admin-sla.jpg) |
| STAFF-006 | local | STAFF | `/admin/staff` | Staff — Accounts Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| CERT-003 | local | CERT | `/admin/temp` | Staff — Accounts Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-accounts-officer/en-admin-temp.jpg) |
| WHATSAPP-021 | local | WHATSAPP | `/admin/whatsapp` | Staff — Accounts Officer | denied | denied (HTTP 200) | **PARTIAL** | browser errors: pageerror: Minified React error #418; visit https://react.dev/errors/418?args[]=HTML&args[]= for the full message or use the non-minified dev environment for full errors and additional helpful warnings. | [shot](evidence/crawl/staff-accounts-officer/en-admin-whatsapp-PROBLEM.jpg) |
| WHATSAPP-022 | local | WHATSAPP | `/admin/whatsapp/campaigns` | Staff — Accounts Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-023 | local | WHATSAPP | `/admin/whatsapp/campaigns/history` | Staff — Accounts Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-024 | local | WHATSAPP | `/admin/whatsapp/campaigns/new` | Staff — Accounts Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-025 | local | WHATSAPP | `/admin/whatsapp/campaigns/view` | Staff — Accounts Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-026 | local | WHATSAPP | `/admin/whatsapp/consent` | Staff — Accounts Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-027 | local | WHATSAPP | `/admin/whatsapp/inbox` | Staff — Accounts Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-028 | local | WHATSAPP | `/admin/whatsapp/readiness` | Staff — Accounts Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-029 | local | WHATSAPP | `/admin/whatsapp/settings` | Staff — Accounts Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-030 | local | WHATSAPP | `/admin/whatsapp/templates` | Staff — Accounts Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| PORTAL-006 | local | PORTAL | `/portal` | Staff — Accounts Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-036 | local | SVC | `/portal/application` | Staff — Accounts Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-037 | local | SVC | `/portal/application/letter` | Staff — Accounts Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-038 | local | SVC | `/portal/applications` | Staff — Accounts Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-039 | local | SVC | `/portal/apply` | Staff — Accounts Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| AI-006 | local | AI | `/portal/assistant` | Staff — Accounts Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| DOC-009 | local | DOC | `/portal/documents` | Staff — Accounts Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| END-006 | local | END | `/portal/endorse` | Staff — Accounts Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ENG-022 | local | ENG | `/portal/events` | Staff — Accounts Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-027 | local | MEM | `/portal/form` | Staff — Accounts Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-028 | local | MEM | `/portal/join` | Staff — Accounts Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-029 | local | MEM | `/portal/membership` | Staff — Accounts Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-030 | local | MEM | `/portal/mtrack` | Staff — Accounts Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ENG-023 | local | ENG | `/portal/notifications` | Staff — Accounts Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| OPP-006 | local | OPP | `/portal/opportunities` | Staff — Accounts Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| FIN-015 | local | FIN | `/portal/payments` | Staff — Accounts Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| PROF-006 | local | PROF | `/portal/profile` | Staff — Accounts Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ENG-024 | local | ENG | `/portal/support` | Staff — Accounts Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ADMIN-013 | local | ADMIN | `/admin` | Staff — Auditor (read-only) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-auditor-read-only/en-admin.jpg) |
| REP-007 | local | REP | `/admin/ai` | Staff — Auditor (read-only) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-auditor-read-only/en-admin-ai.jpg) |
| SVC-040 | local | SVC | `/admin/applications` | Staff — Auditor (read-only) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-auditor-read-only/en-admin-applications.jpg) |
| SVC-041 | local | SVC | `/admin/approvals` | Staff — Auditor (read-only) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-auditor-read-only/en-admin-approvals.jpg) |
| STAFF-007 | local | STAFF | `/admin/audit` | Staff — Auditor (read-only) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-auditor-read-only/en-admin-audit.jpg) |
| BIZ-013 | local | BIZ | `/admin/business-directory` | Staff — Auditor (read-only) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-auditor-read-only/en-admin-business-directory.jpg) |
| BIZ-014 | local | BIZ | `/admin/business-directory/exports` | Staff — Auditor (read-only) | denied | denied (HTTP 200) | **PASS** |  |  |
| BIZ-015 | local | BIZ | `/admin/business-directory/profile` | Staff — Auditor (read-only) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-auditor-read-only/en-admin-business-directory-profile.jpg) |
| BIZ-016 | local | BIZ | `/admin/business-directory/segments` | Staff — Auditor (read-only) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-auditor-read-only/en-admin-business-directory-segments.jpg) |
| REG-013 | local | REG | `/admin/changes` | Staff — Auditor (read-only) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-auditor-read-only/en-admin-changes.jpg) |
| CMT-007 | local | CMT | `/admin/committee` | Staff — Auditor (read-only) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-auditor-read-only/en-admin-committee.jpg) |
| ENG-025 | local | ENG | `/admin/complaints` | Staff — Auditor (read-only) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-auditor-read-only/en-admin-complaints.jpg) |
| CMS-007 | local | CMS | `/admin/content` | Staff — Auditor (read-only) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-auditor-read-only/en-admin-content.jpg) |
| DOC-010 | local | DOC | `/admin/documents` | Staff — Auditor (read-only) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-auditor-read-only/en-admin-documents.jpg) |
| ENG-026 | local | ENG | `/admin/events` | Staff — Auditor (read-only) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-auditor-read-only/en-admin-events.jpg) |
| FIN-016 | local | FIN | `/admin/finance` | Staff — Auditor (read-only) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-auditor-read-only/en-admin-finance.jpg) |
| ADMIN-014 | local | ADMIN | `/admin/help` | Staff — Auditor (read-only) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-auditor-read-only/en-admin-help.jpg) |
| REG-014 | local | REG | `/admin/import` | Staff — Auditor (read-only) | denied | denied (HTTP 200) | **PASS** |  |  |
| PLAT-010 | local | PLAT | `/admin/integrations` | Staff — Auditor (read-only) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-auditor-read-only/en-admin-integrations.jpg) |
| CMT-008 | local | CMT | `/admin/meetings` | Staff — Auditor (read-only) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-auditor-read-only/en-admin-meetings.jpg) |
| REG-015 | local | REG | `/admin/member` | Staff — Auditor (read-only) | redirected | redirected (HTTP 200) | **PASS** |  |  |
| REG-016 | local | REG | `/admin/members` | Staff — Auditor (read-only) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-auditor-read-only/en-admin-members.jpg) |
| MEM-031 | local | MEM | `/admin/mreview` | Staff — Auditor (read-only) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-auditor-read-only/en-admin-mreview.jpg) |
| CMS-008 | local | CMS | `/admin/notify` | Staff — Auditor (read-only) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-auditor-read-only/en-admin-notify.jpg) |
| FIN-017 | local | FIN | `/admin/payments` | Staff — Auditor (read-only) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-auditor-read-only/en-admin-payments.jpg) |
| FIN-018 | local | FIN | `/admin/psid` | Staff — Auditor (read-only) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-auditor-read-only/en-admin-psid.jpg) |
| ADMIN-015 | local | ADMIN | `/admin/queue` | Staff — Auditor (read-only) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-auditor-read-only/en-admin-queue.jpg) |
| REP-008 | local | REP | `/admin/reports` | Staff — Auditor (read-only) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-auditor-read-only/en-admin-reports.jpg) |
| MEM-032 | local | MEM | `/admin/requests` | Staff — Auditor (read-only) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-auditor-read-only/en-admin-requests.jpg) |
| SVC-042 | local | SVC | `/admin/review` | Staff — Auditor (read-only) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-auditor-read-only/en-admin-review.jpg) |
| SVC-043 | local | SVC | `/admin/review/letter` | Staff — Auditor (read-only) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-auditor-read-only/en-admin-review-letter.jpg) |
| ADMIN-016 | local | ADMIN | `/admin/search` | Staff — Auditor (read-only) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-auditor-read-only/en-admin-search.jpg) |
| PLAT-011 | local | PLAT | `/admin/services` | Staff — Auditor (read-only) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-auditor-read-only/en-admin-services.jpg) |
| PLAT-012 | local | PLAT | `/admin/settings` | Staff — Auditor (read-only) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-auditor-read-only/en-admin-settings.jpg) |
| SVC-044 | local | SVC | `/admin/sla` | Staff — Auditor (read-only) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-auditor-read-only/en-admin-sla.jpg) |
| STAFF-008 | local | STAFF | `/admin/staff` | Staff — Auditor (read-only) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-auditor-read-only/en-admin-staff.jpg) |
| CERT-004 | local | CERT | `/admin/temp` | Staff — Auditor (read-only) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-auditor-read-only/en-admin-temp.jpg) |
| WHATSAPP-031 | local | WHATSAPP | `/admin/whatsapp` | Staff — Auditor (read-only) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-auditor-read-only/en-admin-whatsapp.jpg) |
| WHATSAPP-032 | local | WHATSAPP | `/admin/whatsapp/campaigns` | Staff — Auditor (read-only) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-auditor-read-only/en-admin-whatsapp-campaigns.jpg) |
| WHATSAPP-033 | local | WHATSAPP | `/admin/whatsapp/campaigns/history` | Staff — Auditor (read-only) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-auditor-read-only/en-admin-whatsapp-campaigns-history.jpg) |
| WHATSAPP-034 | local | WHATSAPP | `/admin/whatsapp/campaigns/new` | Staff — Auditor (read-only) | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-035 | local | WHATSAPP | `/admin/whatsapp/campaigns/view` | Staff — Auditor (read-only) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-auditor-read-only/en-admin-whatsapp-campaigns-view.jpg) |
| WHATSAPP-036 | local | WHATSAPP | `/admin/whatsapp/consent` | Staff — Auditor (read-only) | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-037 | local | WHATSAPP | `/admin/whatsapp/inbox` | Staff — Auditor (read-only) | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-038 | local | WHATSAPP | `/admin/whatsapp/readiness` | Staff — Auditor (read-only) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-auditor-read-only/en-admin-whatsapp-readiness.jpg) |
| WHATSAPP-039 | local | WHATSAPP | `/admin/whatsapp/settings` | Staff — Auditor (read-only) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-auditor-read-only/en-admin-whatsapp-settings.jpg) |
| WHATSAPP-040 | local | WHATSAPP | `/admin/whatsapp/templates` | Staff — Auditor (read-only) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-auditor-read-only/en-admin-whatsapp-templates.jpg) |
| PORTAL-007 | local | PORTAL | `/portal` | Staff — Auditor (read-only) | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-045 | local | SVC | `/portal/application` | Staff — Auditor (read-only) | shown or redirected or denied or not-found | redirected (HTTP 200) | **PARTIAL** | browser errors: pageerror: Minified React error #418; visit https://react.dev/errors/418?args[]=HTML&args[]= for the full message or use the non-minified dev environment for full errors and additional helpful warnings. | [shot](evidence/crawl/staff-auditor-read-only/en-portal-application-PROBLEM.jpg) |
| SVC-046 | local | SVC | `/portal/application/letter` | Staff — Auditor (read-only) | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-047 | local | SVC | `/portal/applications` | Staff — Auditor (read-only) | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-048 | local | SVC | `/portal/apply` | Staff — Auditor (read-only) | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| AI-007 | local | AI | `/portal/assistant` | Staff — Auditor (read-only) | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| DOC-011 | local | DOC | `/portal/documents` | Staff — Auditor (read-only) | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| END-007 | local | END | `/portal/endorse` | Staff — Auditor (read-only) | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ENG-027 | local | ENG | `/portal/events` | Staff — Auditor (read-only) | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-033 | local | MEM | `/portal/form` | Staff — Auditor (read-only) | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-034 | local | MEM | `/portal/join` | Staff — Auditor (read-only) | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-035 | local | MEM | `/portal/membership` | Staff — Auditor (read-only) | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-036 | local | MEM | `/portal/mtrack` | Staff — Auditor (read-only) | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ENG-028 | local | ENG | `/portal/notifications` | Staff — Auditor (read-only) | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| OPP-007 | local | OPP | `/portal/opportunities` | Staff — Auditor (read-only) | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| FIN-019 | local | FIN | `/portal/payments` | Staff — Auditor (read-only) | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| PROF-007 | local | PROF | `/portal/profile` | Staff — Auditor (read-only) | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ENG-029 | local | ENG | `/portal/support` | Staff — Auditor (read-only) | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ADMIN-017 | local | ADMIN | `/admin` | Staff — Committee Secretary | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-committee-secretary/en-admin.jpg) |
| REP-009 | local | REP | `/admin/ai` | Staff — Committee Secretary | denied | denied (HTTP 200) | **PASS** |  |  |
| SVC-049 | local | SVC | `/admin/applications` | Staff — Committee Secretary | denied | denied (HTTP 200) | **PASS** |  |  |
| SVC-050 | local | SVC | `/admin/approvals` | Staff — Committee Secretary | denied | denied (HTTP 200) | **PASS** |  |  |
| STAFF-009 | local | STAFF | `/admin/audit` | Staff — Committee Secretary | denied | denied (HTTP 200) | **PASS** |  |  |
| BIZ-017 | local | BIZ | `/admin/business-directory` | Staff — Committee Secretary | denied | denied (HTTP 200) | **PASS** |  |  |
| BIZ-018 | local | BIZ | `/admin/business-directory/exports` | Staff — Committee Secretary | denied | denied (HTTP 200) | **PASS** |  |  |
| BIZ-019 | local | BIZ | `/admin/business-directory/profile` | Staff — Committee Secretary | denied | denied (HTTP 200) | **PASS** |  |  |
| BIZ-020 | local | BIZ | `/admin/business-directory/segments` | Staff — Committee Secretary | denied | denied (HTTP 200) | **PASS** |  |  |
| REG-017 | local | REG | `/admin/changes` | Staff — Committee Secretary | denied | denied (HTTP 200) | **PASS** |  |  |
| CMT-009 | local | CMT | `/admin/committee` | Staff — Committee Secretary | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-committee-secretary/en-admin-committee.jpg) |
| ENG-030 | local | ENG | `/admin/complaints` | Staff — Committee Secretary | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-committee-secretary/en-admin-complaints.jpg) |
| CMS-009 | local | CMS | `/admin/content` | Staff — Committee Secretary | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-committee-secretary/en-admin-content.jpg) |
| DOC-012 | local | DOC | `/admin/documents` | Staff — Committee Secretary | denied | denied (HTTP 200) | **PASS** |  |  |
| ENG-031 | local | ENG | `/admin/events` | Staff — Committee Secretary | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-committee-secretary/en-admin-events.jpg) |
| FIN-020 | local | FIN | `/admin/finance` | Staff — Committee Secretary | denied | denied (HTTP 200) | **PASS** |  |  |
| ADMIN-018 | local | ADMIN | `/admin/help` | Staff — Committee Secretary | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-committee-secretary/en-admin-help.jpg) |
| REG-018 | local | REG | `/admin/import` | Staff — Committee Secretary | denied | denied (HTTP 200) | **PASS** |  |  |
| PLAT-013 | local | PLAT | `/admin/integrations` | Staff — Committee Secretary | denied | denied (HTTP 200) | **PASS** |  |  |
| CMT-010 | local | CMT | `/admin/meetings` | Staff — Committee Secretary | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-committee-secretary/en-admin-meetings.jpg) |
| REG-019 | local | REG | `/admin/member` | Staff — Committee Secretary | redirected | redirected (HTTP 200) | **PASS** |  |  |
| REG-020 | local | REG | `/admin/members` | Staff — Committee Secretary | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-committee-secretary/en-admin-members.jpg) |
| MEM-037 | local | MEM | `/admin/mreview` | Staff — Committee Secretary | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-committee-secretary/en-admin-mreview.jpg) |
| CMS-010 | local | CMS | `/admin/notify` | Staff — Committee Secretary | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-committee-secretary/en-admin-notify.jpg) |
| FIN-021 | local | FIN | `/admin/payments` | Staff — Committee Secretary | denied | denied (HTTP 200) | **PASS** |  |  |
| FIN-022 | local | FIN | `/admin/psid` | Staff — Committee Secretary | denied | denied (HTTP 200) | **PASS** |  |  |
| ADMIN-019 | local | ADMIN | `/admin/queue` | Staff — Committee Secretary | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-committee-secretary/en-admin-queue.jpg) |
| REP-010 | local | REP | `/admin/reports` | Staff — Committee Secretary | denied | denied (HTTP 200) | **PASS** |  |  |
| MEM-038 | local | MEM | `/admin/requests` | Staff — Committee Secretary | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-committee-secretary/en-admin-requests.jpg) |
| SVC-051 | local | SVC | `/admin/review` | Staff — Committee Secretary | denied | denied (HTTP 200) | **PASS** |  |  |
| SVC-052 | local | SVC | `/admin/review/letter` | Staff — Committee Secretary | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-committee-secretary/en-admin-review-letter.jpg) |
| ADMIN-020 | local | ADMIN | `/admin/search` | Staff — Committee Secretary | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-committee-secretary/en-admin-search.jpg) |
| PLAT-014 | local | PLAT | `/admin/services` | Staff — Committee Secretary | denied | denied (HTTP 200) | **PASS** |  |  |
| PLAT-015 | local | PLAT | `/admin/settings` | Staff — Committee Secretary | denied | denied (HTTP 200) | **PASS** |  |  |
| SVC-053 | local | SVC | `/admin/sla` | Staff — Committee Secretary | denied | denied (HTTP 200) | **PASS** |  |  |
| STAFF-010 | local | STAFF | `/admin/staff` | Staff — Committee Secretary | denied | denied (HTTP 200) | **PASS** |  |  |
| CERT-005 | local | CERT | `/admin/temp` | Staff — Committee Secretary | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-041 | local | WHATSAPP | `/admin/whatsapp` | Staff — Committee Secretary | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-042 | local | WHATSAPP | `/admin/whatsapp/campaigns` | Staff — Committee Secretary | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-043 | local | WHATSAPP | `/admin/whatsapp/campaigns/history` | Staff — Committee Secretary | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-044 | local | WHATSAPP | `/admin/whatsapp/campaigns/new` | Staff — Committee Secretary | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-045 | local | WHATSAPP | `/admin/whatsapp/campaigns/view` | Staff — Committee Secretary | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-046 | local | WHATSAPP | `/admin/whatsapp/consent` | Staff — Committee Secretary | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-047 | local | WHATSAPP | `/admin/whatsapp/inbox` | Staff — Committee Secretary | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-048 | local | WHATSAPP | `/admin/whatsapp/readiness` | Staff — Committee Secretary | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-049 | local | WHATSAPP | `/admin/whatsapp/settings` | Staff — Committee Secretary | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-050 | local | WHATSAPP | `/admin/whatsapp/templates` | Staff — Committee Secretary | denied | denied (HTTP 200) | **PASS** |  |  |
| PORTAL-008 | local | PORTAL | `/portal` | Staff — Committee Secretary | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-054 | local | SVC | `/portal/application` | Staff — Committee Secretary | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-055 | local | SVC | `/portal/application/letter` | Staff — Committee Secretary | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-056 | local | SVC | `/portal/applications` | Staff — Committee Secretary | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-057 | local | SVC | `/portal/apply` | Staff — Committee Secretary | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| AI-008 | local | AI | `/portal/assistant` | Staff — Committee Secretary | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| DOC-013 | local | DOC | `/portal/documents` | Staff — Committee Secretary | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| END-008 | local | END | `/portal/endorse` | Staff — Committee Secretary | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ENG-032 | local | ENG | `/portal/events` | Staff — Committee Secretary | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-039 | local | MEM | `/portal/form` | Staff — Committee Secretary | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-040 | local | MEM | `/portal/join` | Staff — Committee Secretary | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-041 | local | MEM | `/portal/membership` | Staff — Committee Secretary | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-042 | local | MEM | `/portal/mtrack` | Staff — Committee Secretary | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ENG-033 | local | ENG | `/portal/notifications` | Staff — Committee Secretary | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| OPP-008 | local | OPP | `/portal/opportunities` | Staff — Committee Secretary | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| FIN-023 | local | FIN | `/portal/payments` | Staff — Committee Secretary | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| PROF-008 | local | PROF | `/portal/profile` | Staff — Committee Secretary | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ENG-034 | local | ENG | `/portal/support` | Staff — Committee Secretary | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ADMIN-021 | local | ADMIN | `/admin` | Staff — Deputy Secretary — Membership | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-deputy-secretary-membership/en-admin.jpg) |
| REP-011 | local | REP | `/admin/ai` | Staff — Deputy Secretary — Membership | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-deputy-secretary-membership/en-admin-ai.jpg) |
| SVC-058 | local | SVC | `/admin/applications` | Staff — Deputy Secretary — Membership | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-deputy-secretary-membership/en-admin-applications.jpg) |
| SVC-059 | local | SVC | `/admin/approvals` | Staff — Deputy Secretary — Membership | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-deputy-secretary-membership/en-admin-approvals.jpg) |
| STAFF-011 | local | STAFF | `/admin/audit` | Staff — Deputy Secretary — Membership | shown | shown (HTTP 200) | **PARTIAL** | browser errors: pageerror: Minified React error #418; visit https://react.dev/errors/418?args[]=HTML&args[]= for the full message or use the non-minified dev environment for full errors and additional helpful warnings. | [shot](evidence/crawl/staff-deputy-secretary-membership/en-admin-audit-PROBLEM.jpg) |
| BIZ-021 | local | BIZ | `/admin/business-directory` | Staff — Deputy Secretary — Membership | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-deputy-secretary-membership/en-admin-business-directory.jpg) |
| BIZ-022 | local | BIZ | `/admin/business-directory/exports` | Staff — Deputy Secretary — Membership | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-deputy-secretary-membership/en-admin-business-directory-exports.jpg) |
| BIZ-023 | local | BIZ | `/admin/business-directory/profile` | Staff — Deputy Secretary — Membership | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-deputy-secretary-membership/en-admin-business-directory-profile.jpg) |
| BIZ-024 | local | BIZ | `/admin/business-directory/segments` | Staff — Deputy Secretary — Membership | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-deputy-secretary-membership/en-admin-business-directory-segments.jpg) |
| REG-021 | local | REG | `/admin/changes` | Staff — Deputy Secretary — Membership | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-deputy-secretary-membership/en-admin-changes.jpg) |
| CMT-011 | local | CMT | `/admin/committee` | Staff — Deputy Secretary — Membership | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-deputy-secretary-membership/en-admin-committee.jpg) |
| ENG-035 | local | ENG | `/admin/complaints` | Staff — Deputy Secretary — Membership | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-deputy-secretary-membership/en-admin-complaints.jpg) |
| CMS-011 | local | CMS | `/admin/content` | Staff — Deputy Secretary — Membership | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-deputy-secretary-membership/en-admin-content.jpg) |
| DOC-014 | local | DOC | `/admin/documents` | Staff — Deputy Secretary — Membership | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-deputy-secretary-membership/en-admin-documents.jpg) |
| ENG-036 | local | ENG | `/admin/events` | Staff — Deputy Secretary — Membership | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-deputy-secretary-membership/en-admin-events.jpg) |
| FIN-024 | local | FIN | `/admin/finance` | Staff — Deputy Secretary — Membership | denied | denied (HTTP 200) | **PASS** |  |  |
| ADMIN-022 | local | ADMIN | `/admin/help` | Staff — Deputy Secretary — Membership | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-deputy-secretary-membership/en-admin-help.jpg) |
| REG-022 | local | REG | `/admin/import` | Staff — Deputy Secretary — Membership | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-deputy-secretary-membership/en-admin-import.jpg) |
| PLAT-016 | local | PLAT | `/admin/integrations` | Staff — Deputy Secretary — Membership | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-deputy-secretary-membership/en-admin-integrations.jpg) |
| CMT-012 | local | CMT | `/admin/meetings` | Staff — Deputy Secretary — Membership | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-deputy-secretary-membership/en-admin-meetings.jpg) |
| REG-023 | local | REG | `/admin/member` | Staff — Deputy Secretary — Membership | redirected | redirected (HTTP 200) | **PASS** |  |  |
| REG-024 | local | REG | `/admin/members` | Staff — Deputy Secretary — Membership | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-deputy-secretary-membership/en-admin-members.jpg) |
| MEM-043 | local | MEM | `/admin/mreview` | Staff — Deputy Secretary — Membership | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-deputy-secretary-membership/en-admin-mreview.jpg) |
| CMS-012 | local | CMS | `/admin/notify` | Staff — Deputy Secretary — Membership | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-deputy-secretary-membership/en-admin-notify.jpg) |
| FIN-025 | local | FIN | `/admin/payments` | Staff — Deputy Secretary — Membership | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-deputy-secretary-membership/en-admin-payments.jpg) |
| FIN-026 | local | FIN | `/admin/psid` | Staff — Deputy Secretary — Membership | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-deputy-secretary-membership/en-admin-psid.jpg) |
| ADMIN-023 | local | ADMIN | `/admin/queue` | Staff — Deputy Secretary — Membership | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-deputy-secretary-membership/en-admin-queue.jpg) |
| REP-012 | local | REP | `/admin/reports` | Staff — Deputy Secretary — Membership | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-deputy-secretary-membership/en-admin-reports.jpg) |
| MEM-044 | local | MEM | `/admin/requests` | Staff — Deputy Secretary — Membership | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-deputy-secretary-membership/en-admin-requests.jpg) |
| SVC-060 | local | SVC | `/admin/review` | Staff — Deputy Secretary — Membership | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-deputy-secretary-membership/en-admin-review.jpg) |
| SVC-061 | local | SVC | `/admin/review/letter` | Staff — Deputy Secretary — Membership | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-deputy-secretary-membership/en-admin-review-letter.jpg) |
| ADMIN-024 | local | ADMIN | `/admin/search` | Staff — Deputy Secretary — Membership | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-deputy-secretary-membership/en-admin-search.jpg) |
| PLAT-017 | local | PLAT | `/admin/services` | Staff — Deputy Secretary — Membership | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-deputy-secretary-membership/en-admin-services.jpg) |
| PLAT-018 | local | PLAT | `/admin/settings` | Staff — Deputy Secretary — Membership | denied | denied (HTTP 200) | **PASS** |  |  |
| SVC-062 | local | SVC | `/admin/sla` | Staff — Deputy Secretary — Membership | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-deputy-secretary-membership/en-admin-sla.jpg) |
| STAFF-012 | local | STAFF | `/admin/staff` | Staff — Deputy Secretary — Membership | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-deputy-secretary-membership/en-admin-staff.jpg) |
| CERT-006 | local | CERT | `/admin/temp` | Staff — Deputy Secretary — Membership | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-deputy-secretary-membership/en-admin-temp.jpg) |
| WHATSAPP-051 | local | WHATSAPP | `/admin/whatsapp` | Staff — Deputy Secretary — Membership | shown | shown (HTTP 200) | **PARTIAL** | browser errors: pageerror: Minified React error #418; visit https://react.dev/errors/418?args[]=HTML&args[]= for the full message or use the non-minified dev environment for full errors and additional helpful warnings. | [shot](evidence/crawl/staff-deputy-secretary-membership/en-admin-whatsapp-PROBLEM.jpg) |
| WHATSAPP-052 | local | WHATSAPP | `/admin/whatsapp/campaigns` | Staff — Deputy Secretary — Membership | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-deputy-secretary-membership/en-admin-whatsapp-campaigns.jpg) |
| WHATSAPP-053 | local | WHATSAPP | `/admin/whatsapp/campaigns/history` | Staff — Deputy Secretary — Membership | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-deputy-secretary-membership/en-admin-whatsapp-campaigns-history.jpg) |
| WHATSAPP-054 | local | WHATSAPP | `/admin/whatsapp/campaigns/new` | Staff — Deputy Secretary — Membership | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-deputy-secretary-membership/en-admin-whatsapp-campaigns-new.jpg) |
| WHATSAPP-055 | local | WHATSAPP | `/admin/whatsapp/campaigns/view` | Staff — Deputy Secretary — Membership | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-deputy-secretary-membership/en-admin-whatsapp-campaigns-view.jpg) |
| WHATSAPP-056 | local | WHATSAPP | `/admin/whatsapp/consent` | Staff — Deputy Secretary — Membership | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-deputy-secretary-membership/en-admin-whatsapp-consent.jpg) |
| WHATSAPP-057 | local | WHATSAPP | `/admin/whatsapp/inbox` | Staff — Deputy Secretary — Membership | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-deputy-secretary-membership/en-admin-whatsapp-inbox.jpg) |
| WHATSAPP-058 | local | WHATSAPP | `/admin/whatsapp/readiness` | Staff — Deputy Secretary — Membership | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-deputy-secretary-membership/en-admin-whatsapp-readiness.jpg) |
| WHATSAPP-059 | local | WHATSAPP | `/admin/whatsapp/settings` | Staff — Deputy Secretary — Membership | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-060 | local | WHATSAPP | `/admin/whatsapp/templates` | Staff — Deputy Secretary — Membership | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-deputy-secretary-membership/en-admin-whatsapp-templates.jpg) |
| PORTAL-009 | local | PORTAL | `/portal` | Staff — Deputy Secretary — Membership | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-063 | local | SVC | `/portal/application` | Staff — Deputy Secretary — Membership | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-064 | local | SVC | `/portal/application/letter` | Staff — Deputy Secretary — Membership | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-065 | local | SVC | `/portal/applications` | Staff — Deputy Secretary — Membership | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-066 | local | SVC | `/portal/apply` | Staff — Deputy Secretary — Membership | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| AI-009 | local | AI | `/portal/assistant` | Staff — Deputy Secretary — Membership | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| DOC-015 | local | DOC | `/portal/documents` | Staff — Deputy Secretary — Membership | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| END-009 | local | END | `/portal/endorse` | Staff — Deputy Secretary — Membership | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ENG-037 | local | ENG | `/portal/events` | Staff — Deputy Secretary — Membership | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-045 | local | MEM | `/portal/form` | Staff — Deputy Secretary — Membership | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-046 | local | MEM | `/portal/join` | Staff — Deputy Secretary — Membership | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-047 | local | MEM | `/portal/membership` | Staff — Deputy Secretary — Membership | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-048 | local | MEM | `/portal/mtrack` | Staff — Deputy Secretary — Membership | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ENG-038 | local | ENG | `/portal/notifications` | Staff — Deputy Secretary — Membership | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| OPP-009 | local | OPP | `/portal/opportunities` | Staff — Deputy Secretary — Membership | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| FIN-027 | local | FIN | `/portal/payments` | Staff — Deputy Secretary — Membership | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| PROF-009 | local | PROF | `/portal/profile` | Staff — Deputy Secretary — Membership | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ENG-039 | local | ENG | `/portal/support` | Staff — Deputy Secretary — Membership | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ADMIN-025 | local | ADMIN | `/admin` | Staff — Front Desk / Data Entry | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-front-desk-data-entry/en-admin.jpg) |
| REP-013 | local | REP | `/admin/ai` | Staff — Front Desk / Data Entry | denied | denied (HTTP 200) | **PASS** |  |  |
| SVC-067 | local | SVC | `/admin/applications` | Staff — Front Desk / Data Entry | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-front-desk-data-entry/en-admin-applications.jpg) |
| SVC-068 | local | SVC | `/admin/approvals` | Staff — Front Desk / Data Entry | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-front-desk-data-entry/en-admin-approvals.jpg) |
| STAFF-013 | local | STAFF | `/admin/audit` | Staff — Front Desk / Data Entry | denied | denied (HTTP 200) | **PASS** |  |  |
| BIZ-025 | local | BIZ | `/admin/business-directory` | Staff — Front Desk / Data Entry | denied | denied (HTTP 200) | **PARTIAL** | browser errors: pageerror: Minified React error #418; visit https://react.dev/errors/418?args[]=HTML&args[]= for the full message or use the non-minified dev environment for full errors and additional helpful warnings. | [shot](evidence/crawl/staff-front-desk-data-entry/en-admin-business-directory-PROBLEM.jpg) |
| BIZ-026 | local | BIZ | `/admin/business-directory/exports` | Staff — Front Desk / Data Entry | denied | denied (HTTP 200) | **PASS** |  |  |
| BIZ-027 | local | BIZ | `/admin/business-directory/profile` | Staff — Front Desk / Data Entry | denied | denied (HTTP 200) | **PASS** |  |  |
| BIZ-028 | local | BIZ | `/admin/business-directory/segments` | Staff — Front Desk / Data Entry | denied | denied (HTTP 200) | **PASS** |  |  |
| REG-025 | local | REG | `/admin/changes` | Staff — Front Desk / Data Entry | denied | denied (HTTP 200) | **PASS** |  |  |
| CMT-013 | local | CMT | `/admin/committee` | Staff — Front Desk / Data Entry | denied | denied (HTTP 200) | **PASS** |  |  |
| ENG-040 | local | ENG | `/admin/complaints` | Staff — Front Desk / Data Entry | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-front-desk-data-entry/en-admin-complaints.jpg) |
| CMS-013 | local | CMS | `/admin/content` | Staff — Front Desk / Data Entry | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-front-desk-data-entry/en-admin-content.jpg) |
| DOC-016 | local | DOC | `/admin/documents` | Staff — Front Desk / Data Entry | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-front-desk-data-entry/en-admin-documents.jpg) |
| ENG-041 | local | ENG | `/admin/events` | Staff — Front Desk / Data Entry | shown | shown (HTTP 200) | **PARTIAL** | browser errors: pageerror: Minified React error #418; visit https://react.dev/errors/418?args[]=HTML&args[]= for the full message or use the non-minified dev environment for full errors and additional helpful warnings. | [shot](evidence/crawl/staff-front-desk-data-entry/en-admin-events-PROBLEM.jpg) |
| FIN-028 | local | FIN | `/admin/finance` | Staff — Front Desk / Data Entry | denied | denied (HTTP 200) | **PASS** |  |  |
| ADMIN-026 | local | ADMIN | `/admin/help` | Staff — Front Desk / Data Entry | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-front-desk-data-entry/en-admin-help.jpg) |
| REG-026 | local | REG | `/admin/import` | Staff — Front Desk / Data Entry | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-front-desk-data-entry/en-admin-import.jpg) |
| PLAT-019 | local | PLAT | `/admin/integrations` | Staff — Front Desk / Data Entry | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-front-desk-data-entry/en-admin-integrations.jpg) |
| CMT-014 | local | CMT | `/admin/meetings` | Staff — Front Desk / Data Entry | denied | denied (HTTP 200) | **PASS** |  |  |
| REG-027 | local | REG | `/admin/member` | Staff — Front Desk / Data Entry | redirected | redirected (HTTP 200) | **PASS** |  |  |
| REG-028 | local | REG | `/admin/members` | Staff — Front Desk / Data Entry | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-front-desk-data-entry/en-admin-members.jpg) |
| MEM-049 | local | MEM | `/admin/mreview` | Staff — Front Desk / Data Entry | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-front-desk-data-entry/en-admin-mreview.jpg) |
| CMS-014 | local | CMS | `/admin/notify` | Staff — Front Desk / Data Entry | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-front-desk-data-entry/en-admin-notify.jpg) |
| FIN-029 | local | FIN | `/admin/payments` | Staff — Front Desk / Data Entry | denied | denied (HTTP 200) | **PASS** |  |  |
| FIN-030 | local | FIN | `/admin/psid` | Staff — Front Desk / Data Entry | denied | denied (HTTP 200) | **PASS** |  |  |
| ADMIN-027 | local | ADMIN | `/admin/queue` | Staff — Front Desk / Data Entry | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-front-desk-data-entry/en-admin-queue.jpg) |
| REP-014 | local | REP | `/admin/reports` | Staff — Front Desk / Data Entry | denied | denied (HTTP 200) | **PASS** |  |  |
| MEM-050 | local | MEM | `/admin/requests` | Staff — Front Desk / Data Entry | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-front-desk-data-entry/en-admin-requests.jpg) |
| SVC-069 | local | SVC | `/admin/review` | Staff — Front Desk / Data Entry | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-front-desk-data-entry/en-admin-review.jpg) |
| SVC-070 | local | SVC | `/admin/review/letter` | Staff — Front Desk / Data Entry | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-front-desk-data-entry/en-admin-review-letter.jpg) |
| ADMIN-028 | local | ADMIN | `/admin/search` | Staff — Front Desk / Data Entry | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-front-desk-data-entry/en-admin-search.jpg) |
| PLAT-020 | local | PLAT | `/admin/services` | Staff — Front Desk / Data Entry | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-front-desk-data-entry/en-admin-services.jpg) |
| PLAT-021 | local | PLAT | `/admin/settings` | Staff — Front Desk / Data Entry | denied | denied (HTTP 200) | **PARTIAL** | browser errors: pageerror: Minified React error #418; visit https://react.dev/errors/418?args[]=HTML&args[]= for the full message or use the non-minified dev environment for full errors and additional helpful warnings. | [shot](evidence/crawl/staff-front-desk-data-entry/en-admin-settings-PROBLEM.jpg) |
| SVC-071 | local | SVC | `/admin/sla` | Staff — Front Desk / Data Entry | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-front-desk-data-entry/en-admin-sla.jpg) |
| STAFF-014 | local | STAFF | `/admin/staff` | Staff — Front Desk / Data Entry | denied | denied (HTTP 200) | **PASS** |  |  |
| CERT-007 | local | CERT | `/admin/temp` | Staff — Front Desk / Data Entry | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-front-desk-data-entry/en-admin-temp.jpg) |
| WHATSAPP-061 | local | WHATSAPP | `/admin/whatsapp` | Staff — Front Desk / Data Entry | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-062 | local | WHATSAPP | `/admin/whatsapp/campaigns` | Staff — Front Desk / Data Entry | denied | denied (HTTP 200) | **PARTIAL** | browser errors: pageerror: Minified React error #418; visit https://react.dev/errors/418?args[]=HTML&args[]= for the full message or use the non-minified dev environment for full errors and additional helpful warnings. | [shot](evidence/crawl/staff-front-desk-data-entry/en-admin-whatsapp-campaigns-PROBLEM.jpg) |
| WHATSAPP-063 | local | WHATSAPP | `/admin/whatsapp/campaigns/history` | Staff — Front Desk / Data Entry | denied | denied (HTTP 200) | **PARTIAL** | browser errors: pageerror: Minified React error #418; visit https://react.dev/errors/418?args[]=HTML&args[]= for the full message or use the non-minified dev environment for full errors and additional helpful warnings. | [shot](evidence/crawl/staff-front-desk-data-entry/en-admin-whatsapp-campaigns-history-PROBLEM.jpg) |
| WHATSAPP-064 | local | WHATSAPP | `/admin/whatsapp/campaigns/new` | Staff — Front Desk / Data Entry | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-065 | local | WHATSAPP | `/admin/whatsapp/campaigns/view` | Staff — Front Desk / Data Entry | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-066 | local | WHATSAPP | `/admin/whatsapp/consent` | Staff — Front Desk / Data Entry | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-067 | local | WHATSAPP | `/admin/whatsapp/inbox` | Staff — Front Desk / Data Entry | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-068 | local | WHATSAPP | `/admin/whatsapp/readiness` | Staff — Front Desk / Data Entry | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-069 | local | WHATSAPP | `/admin/whatsapp/settings` | Staff — Front Desk / Data Entry | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-070 | local | WHATSAPP | `/admin/whatsapp/templates` | Staff — Front Desk / Data Entry | denied | denied (HTTP 200) | **PASS** |  |  |
| PORTAL-010 | local | PORTAL | `/portal` | Staff — Front Desk / Data Entry | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-072 | local | SVC | `/portal/application` | Staff — Front Desk / Data Entry | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-073 | local | SVC | `/portal/application/letter` | Staff — Front Desk / Data Entry | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-074 | local | SVC | `/portal/applications` | Staff — Front Desk / Data Entry | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-075 | local | SVC | `/portal/apply` | Staff — Front Desk / Data Entry | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| AI-010 | local | AI | `/portal/assistant` | Staff — Front Desk / Data Entry | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| DOC-017 | local | DOC | `/portal/documents` | Staff — Front Desk / Data Entry | shown or redirected or denied or not-found | redirected (HTTP 200) | **PARTIAL** | browser errors: pageerror: Minified React error #418; visit https://react.dev/errors/418?args[]=HTML&args[]= for the full message or use the non-minified dev environment for full errors and additional helpful warnings. | [shot](evidence/crawl/staff-front-desk-data-entry/en-portal-documents-PROBLEM.jpg) |
| END-010 | local | END | `/portal/endorse` | Staff — Front Desk / Data Entry | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ENG-042 | local | ENG | `/portal/events` | Staff — Front Desk / Data Entry | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-051 | local | MEM | `/portal/form` | Staff — Front Desk / Data Entry | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-052 | local | MEM | `/portal/join` | Staff — Front Desk / Data Entry | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-053 | local | MEM | `/portal/membership` | Staff — Front Desk / Data Entry | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-054 | local | MEM | `/portal/mtrack` | Staff — Front Desk / Data Entry | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ENG-043 | local | ENG | `/portal/notifications` | Staff — Front Desk / Data Entry | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| OPP-010 | local | OPP | `/portal/opportunities` | Staff — Front Desk / Data Entry | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| FIN-031 | local | FIN | `/portal/payments` | Staff — Front Desk / Data Entry | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| PROF-010 | local | PROF | `/portal/profile` | Staff — Front Desk / Data Entry | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ENG-044 | local | ENG | `/portal/support` | Staff — Front Desk / Data Entry | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ADMIN-029 | local | ADMIN | `/admin` | Staff — IT Convener | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-it-convener/en-admin.jpg) |
| REP-015 | local | REP | `/admin/ai` | Staff — IT Convener | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-it-convener/en-admin-ai.jpg) |
| SVC-076 | local | SVC | `/admin/applications` | Staff — IT Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| SVC-077 | local | SVC | `/admin/approvals` | Staff — IT Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| STAFF-015 | local | STAFF | `/admin/audit` | Staff — IT Convener | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-it-convener/en-admin-audit.jpg) |
| BIZ-029 | local | BIZ | `/admin/business-directory` | Staff — IT Convener | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-it-convener/en-admin-business-directory.jpg) |
| BIZ-030 | local | BIZ | `/admin/business-directory/exports` | Staff — IT Convener | denied | denied (HTTP 200) | **PARTIAL** | browser errors: pageerror: Minified React error #418; visit https://react.dev/errors/418?args[]=HTML&args[]= for the full message or use the non-minified dev environment for full errors and additional helpful warnings. | [shot](evidence/crawl/staff-it-convener/en-admin-business-directory-exports-PROBLEM.jpg) |
| BIZ-031 | local | BIZ | `/admin/business-directory/profile` | Staff — IT Convener | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-it-convener/en-admin-business-directory-profile.jpg) |
| BIZ-032 | local | BIZ | `/admin/business-directory/segments` | Staff — IT Convener | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-it-convener/en-admin-business-directory-segments.jpg) |
| REG-029 | local | REG | `/admin/changes` | Staff — IT Convener | denied | denied (HTTP 200) | **PARTIAL** | browser errors: pageerror: Minified React error #418; visit https://react.dev/errors/418?args[]=HTML&args[]= for the full message or use the non-minified dev environment for full errors and additional helpful warnings. | [shot](evidence/crawl/staff-it-convener/en-admin-changes-PROBLEM.jpg) |
| CMT-015 | local | CMT | `/admin/committee` | Staff — IT Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| ENG-045 | local | ENG | `/admin/complaints` | Staff — IT Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| CMS-015 | local | CMS | `/admin/content` | Staff — IT Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| DOC-018 | local | DOC | `/admin/documents` | Staff — IT Convener | shown | shown (HTTP 200) | **PARTIAL** | browser errors: pageerror: Minified React error #418; visit https://react.dev/errors/418?args[]=HTML&args[]= for the full message or use the non-minified dev environment for full errors and additional helpful warnings. | [shot](evidence/crawl/staff-it-convener/en-admin-documents-PROBLEM.jpg) |
| ENG-046 | local | ENG | `/admin/events` | Staff — IT Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| FIN-032 | local | FIN | `/admin/finance` | Staff — IT Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| ADMIN-030 | local | ADMIN | `/admin/help` | Staff — IT Convener | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-it-convener/en-admin-help.jpg) |
| REG-030 | local | REG | `/admin/import` | Staff — IT Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| PLAT-022 | local | PLAT | `/admin/integrations` | Staff — IT Convener | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-it-convener/en-admin-integrations.jpg) |
| CMT-016 | local | CMT | `/admin/meetings` | Staff — IT Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| REG-031 | local | REG | `/admin/member` | Staff — IT Convener | redirected | redirected (HTTP 200) | **PASS** |  |  |
| REG-032 | local | REG | `/admin/members` | Staff — IT Convener | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-it-convener/en-admin-members.jpg) |
| MEM-055 | local | MEM | `/admin/mreview` | Staff — IT Convener | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-it-convener/en-admin-mreview.jpg) |
| CMS-016 | local | CMS | `/admin/notify` | Staff — IT Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| FIN-033 | local | FIN | `/admin/payments` | Staff — IT Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| FIN-034 | local | FIN | `/admin/psid` | Staff — IT Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| ADMIN-031 | local | ADMIN | `/admin/queue` | Staff — IT Convener | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-it-convener/en-admin-queue.jpg) |
| REP-016 | local | REP | `/admin/reports` | Staff — IT Convener | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-it-convener/en-admin-reports.jpg) |
| MEM-056 | local | MEM | `/admin/requests` | Staff — IT Convener | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-it-convener/en-admin-requests.jpg) |
| SVC-078 | local | SVC | `/admin/review` | Staff — IT Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| SVC-079 | local | SVC | `/admin/review/letter` | Staff — IT Convener | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-it-convener/en-admin-review-letter.jpg) |
| ADMIN-032 | local | ADMIN | `/admin/search` | Staff — IT Convener | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-it-convener/en-admin-search.jpg) |
| PLAT-023 | local | PLAT | `/admin/services` | Staff — IT Convener | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-it-convener/en-admin-services.jpg) |
| PLAT-024 | local | PLAT | `/admin/settings` | Staff — IT Convener | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-it-convener/en-admin-settings.jpg) |
| SVC-080 | local | SVC | `/admin/sla` | Staff — IT Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| STAFF-016 | local | STAFF | `/admin/staff` | Staff — IT Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| CERT-008 | local | CERT | `/admin/temp` | Staff — IT Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-071 | local | WHATSAPP | `/admin/whatsapp` | Staff — IT Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-072 | local | WHATSAPP | `/admin/whatsapp/campaigns` | Staff — IT Convener | denied | denied (HTTP 200) | **PARTIAL** | browser errors: pageerror: Minified React error #418; visit https://react.dev/errors/418?args[]=HTML&args[]= for the full message or use the non-minified dev environment for full errors and additional helpful warnings. | [shot](evidence/crawl/staff-it-convener/en-admin-whatsapp-campaigns-PROBLEM.jpg) |
| WHATSAPP-073 | local | WHATSAPP | `/admin/whatsapp/campaigns/history` | Staff — IT Convener | denied | denied (HTTP 200) | **PARTIAL** | browser errors: pageerror: Minified React error #418; visit https://react.dev/errors/418?args[]=HTML&args[]= for the full message or use the non-minified dev environment for full errors and additional helpful warnings. | [shot](evidence/crawl/staff-it-convener/en-admin-whatsapp-campaigns-history-PROBLEM.jpg) |
| WHATSAPP-074 | local | WHATSAPP | `/admin/whatsapp/campaigns/new` | Staff — IT Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-075 | local | WHATSAPP | `/admin/whatsapp/campaigns/view` | Staff — IT Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-076 | local | WHATSAPP | `/admin/whatsapp/consent` | Staff — IT Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-077 | local | WHATSAPP | `/admin/whatsapp/inbox` | Staff — IT Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-078 | local | WHATSAPP | `/admin/whatsapp/readiness` | Staff — IT Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-079 | local | WHATSAPP | `/admin/whatsapp/settings` | Staff — IT Convener | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-it-convener/en-admin-whatsapp-settings.jpg) |
| WHATSAPP-080 | local | WHATSAPP | `/admin/whatsapp/templates` | Staff — IT Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| PORTAL-011 | local | PORTAL | `/portal` | Staff — IT Convener | shown or redirected or denied or not-found | redirected (HTTP 200) | **PARTIAL** | browser errors: pageerror: Minified React error #418; visit https://react.dev/errors/418?args[]=HTML&args[]= for the full message or use the non-minified dev environment for full errors and additional helpful warnings. | [shot](evidence/crawl/staff-it-convener/en-portal-PROBLEM.jpg) |
| SVC-081 | local | SVC | `/portal/application` | Staff — IT Convener | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-082 | local | SVC | `/portal/application/letter` | Staff — IT Convener | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-083 | local | SVC | `/portal/applications` | Staff — IT Convener | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-084 | local | SVC | `/portal/apply` | Staff — IT Convener | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| AI-011 | local | AI | `/portal/assistant` | Staff — IT Convener | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| DOC-019 | local | DOC | `/portal/documents` | Staff — IT Convener | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| END-011 | local | END | `/portal/endorse` | Staff — IT Convener | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ENG-047 | local | ENG | `/portal/events` | Staff — IT Convener | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-057 | local | MEM | `/portal/form` | Staff — IT Convener | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-058 | local | MEM | `/portal/join` | Staff — IT Convener | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-059 | local | MEM | `/portal/membership` | Staff — IT Convener | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-060 | local | MEM | `/portal/mtrack` | Staff — IT Convener | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ENG-048 | local | ENG | `/portal/notifications` | Staff — IT Convener | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| OPP-011 | local | OPP | `/portal/opportunities` | Staff — IT Convener | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| FIN-035 | local | FIN | `/portal/payments` | Staff — IT Convener | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| PROF-011 | local | PROF | `/portal/profile` | Staff — IT Convener | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ENG-049 | local | ENG | `/portal/support` | Staff — IT Convener | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ADMIN-033 | local | ADMIN | `/admin` | Staff — Membership Committee Convener | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-committee-convener/en-admin.jpg) |
| REP-017 | local | REP | `/admin/ai` | Staff — Membership Committee Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| SVC-085 | local | SVC | `/admin/applications` | Staff — Membership Committee Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| SVC-086 | local | SVC | `/admin/approvals` | Staff — Membership Committee Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| STAFF-017 | local | STAFF | `/admin/audit` | Staff — Membership Committee Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| BIZ-033 | local | BIZ | `/admin/business-directory` | Staff — Membership Committee Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| BIZ-034 | local | BIZ | `/admin/business-directory/exports` | Staff — Membership Committee Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| BIZ-035 | local | BIZ | `/admin/business-directory/profile` | Staff — Membership Committee Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| BIZ-036 | local | BIZ | `/admin/business-directory/segments` | Staff — Membership Committee Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| REG-033 | local | REG | `/admin/changes` | Staff — Membership Committee Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| CMT-017 | local | CMT | `/admin/committee` | Staff — Membership Committee Convener | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-committee-convener/en-admin-committee.jpg) |
| ENG-050 | local | ENG | `/admin/complaints` | Staff — Membership Committee Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| CMS-017 | local | CMS | `/admin/content` | Staff — Membership Committee Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| DOC-020 | local | DOC | `/admin/documents` | Staff — Membership Committee Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| ENG-051 | local | ENG | `/admin/events` | Staff — Membership Committee Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| FIN-036 | local | FIN | `/admin/finance` | Staff — Membership Committee Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| ADMIN-034 | local | ADMIN | `/admin/help` | Staff — Membership Committee Convener | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-committee-convener/en-admin-help.jpg) |
| REG-034 | local | REG | `/admin/import` | Staff — Membership Committee Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| PLAT-025 | local | PLAT | `/admin/integrations` | Staff — Membership Committee Convener | denied | denied (HTTP 200) | **PARTIAL** | browser errors: pageerror: Minified React error #418; visit https://react.dev/errors/418?args[]=HTML&args[]= for the full message or use the non-minified dev environment for full errors and additional helpful warnings. | [shot](evidence/crawl/staff-membership-committee-convener/en-admin-integrations-PROBLEM.jpg) |
| CMT-018 | local | CMT | `/admin/meetings` | Staff — Membership Committee Convener | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-committee-convener/en-admin-meetings.jpg) |
| REG-035 | local | REG | `/admin/member` | Staff — Membership Committee Convener | redirected | redirected (HTTP 200) | **PASS** |  |  |
| REG-036 | local | REG | `/admin/members` | Staff — Membership Committee Convener | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-committee-convener/en-admin-members.jpg) |
| MEM-061 | local | MEM | `/admin/mreview` | Staff — Membership Committee Convener | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-committee-convener/en-admin-mreview.jpg) |
| CMS-018 | local | CMS | `/admin/notify` | Staff — Membership Committee Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| FIN-037 | local | FIN | `/admin/payments` | Staff — Membership Committee Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| FIN-038 | local | FIN | `/admin/psid` | Staff — Membership Committee Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| ADMIN-035 | local | ADMIN | `/admin/queue` | Staff — Membership Committee Convener | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-committee-convener/en-admin-queue.jpg) |
| REP-018 | local | REP | `/admin/reports` | Staff — Membership Committee Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| MEM-062 | local | MEM | `/admin/requests` | Staff — Membership Committee Convener | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-committee-convener/en-admin-requests.jpg) |
| SVC-087 | local | SVC | `/admin/review` | Staff — Membership Committee Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| SVC-088 | local | SVC | `/admin/review/letter` | Staff — Membership Committee Convener | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-committee-convener/en-admin-review-letter.jpg) |
| ADMIN-036 | local | ADMIN | `/admin/search` | Staff — Membership Committee Convener | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-committee-convener/en-admin-search.jpg) |
| PLAT-026 | local | PLAT | `/admin/services` | Staff — Membership Committee Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| PLAT-027 | local | PLAT | `/admin/settings` | Staff — Membership Committee Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| SVC-089 | local | SVC | `/admin/sla` | Staff — Membership Committee Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| STAFF-018 | local | STAFF | `/admin/staff` | Staff — Membership Committee Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| CERT-009 | local | CERT | `/admin/temp` | Staff — Membership Committee Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-081 | local | WHATSAPP | `/admin/whatsapp` | Staff — Membership Committee Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-082 | local | WHATSAPP | `/admin/whatsapp/campaigns` | Staff — Membership Committee Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-083 | local | WHATSAPP | `/admin/whatsapp/campaigns/history` | Staff — Membership Committee Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-084 | local | WHATSAPP | `/admin/whatsapp/campaigns/new` | Staff — Membership Committee Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-085 | local | WHATSAPP | `/admin/whatsapp/campaigns/view` | Staff — Membership Committee Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-086 | local | WHATSAPP | `/admin/whatsapp/consent` | Staff — Membership Committee Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-087 | local | WHATSAPP | `/admin/whatsapp/inbox` | Staff — Membership Committee Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-088 | local | WHATSAPP | `/admin/whatsapp/readiness` | Staff — Membership Committee Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-089 | local | WHATSAPP | `/admin/whatsapp/settings` | Staff — Membership Committee Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-090 | local | WHATSAPP | `/admin/whatsapp/templates` | Staff — Membership Committee Convener | denied | denied (HTTP 200) | **PASS** |  |  |
| PORTAL-012 | local | PORTAL | `/portal` | Staff — Membership Committee Convener | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-090 | local | SVC | `/portal/application` | Staff — Membership Committee Convener | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-091 | local | SVC | `/portal/application/letter` | Staff — Membership Committee Convener | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-092 | local | SVC | `/portal/applications` | Staff — Membership Committee Convener | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-093 | local | SVC | `/portal/apply` | Staff — Membership Committee Convener | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| AI-012 | local | AI | `/portal/assistant` | Staff — Membership Committee Convener | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| DOC-021 | local | DOC | `/portal/documents` | Staff — Membership Committee Convener | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| END-012 | local | END | `/portal/endorse` | Staff — Membership Committee Convener | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ENG-052 | local | ENG | `/portal/events` | Staff — Membership Committee Convener | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-063 | local | MEM | `/portal/form` | Staff — Membership Committee Convener | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-064 | local | MEM | `/portal/join` | Staff — Membership Committee Convener | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-065 | local | MEM | `/portal/membership` | Staff — Membership Committee Convener | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-066 | local | MEM | `/portal/mtrack` | Staff — Membership Committee Convener | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ENG-053 | local | ENG | `/portal/notifications` | Staff — Membership Committee Convener | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| OPP-012 | local | OPP | `/portal/opportunities` | Staff — Membership Committee Convener | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| FIN-039 | local | FIN | `/portal/payments` | Staff — Membership Committee Convener | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| PROF-012 | local | PROF | `/portal/profile` | Staff — Membership Committee Convener | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ENG-054 | local | ENG | `/portal/support` | Staff — Membership Committee Convener | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ADMIN-037 | local | ADMIN | `/admin` | Staff — Membership Committee Member | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-committee-member/en-admin.jpg) |
| REP-019 | local | REP | `/admin/ai` | Staff — Membership Committee Member | denied | denied (HTTP 200) | **PARTIAL** | browser errors: pageerror: Minified React error #418; visit https://react.dev/errors/418?args[]=HTML&args[]= for the full message or use the non-minified dev environment for full errors and additional helpful warnings. | [shot](evidence/crawl/staff-membership-committee-member/en-admin-ai-PROBLEM.jpg) |
| SVC-094 | local | SVC | `/admin/applications` | Staff — Membership Committee Member | denied | denied (HTTP 200) | **PASS** |  |  |
| SVC-095 | local | SVC | `/admin/approvals` | Staff — Membership Committee Member | denied | denied (HTTP 200) | **PASS** |  |  |
| STAFF-019 | local | STAFF | `/admin/audit` | Staff — Membership Committee Member | denied | denied (HTTP 200) | **PASS** |  |  |
| BIZ-037 | local | BIZ | `/admin/business-directory` | Staff — Membership Committee Member | denied | denied (HTTP 200) | **PASS** |  |  |
| BIZ-038 | local | BIZ | `/admin/business-directory/exports` | Staff — Membership Committee Member | denied | denied (HTTP 200) | **PASS** |  |  |
| BIZ-039 | local | BIZ | `/admin/business-directory/profile` | Staff — Membership Committee Member | denied | denied (HTTP 200) | **PARTIAL** | browser errors: pageerror: Minified React error #418; visit https://react.dev/errors/418?args[]=HTML&args[]= for the full message or use the non-minified dev environment for full errors and additional helpful warnings. | [shot](evidence/crawl/staff-membership-committee-member/en-admin-business-directory-profile-PROBLEM.jpg) |
| BIZ-040 | local | BIZ | `/admin/business-directory/segments` | Staff — Membership Committee Member | denied | denied (HTTP 200) | **PASS** |  |  |
| REG-037 | local | REG | `/admin/changes` | Staff — Membership Committee Member | denied | denied (HTTP 200) | **PASS** |  |  |
| CMT-019 | local | CMT | `/admin/committee` | Staff — Membership Committee Member | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-committee-member/en-admin-committee.jpg) |
| ENG-055 | local | ENG | `/admin/complaints` | Staff — Membership Committee Member | denied | denied (HTTP 200) | **PASS** |  |  |
| CMS-019 | local | CMS | `/admin/content` | Staff — Membership Committee Member | denied | denied (HTTP 200) | **PASS** |  |  |
| DOC-022 | local | DOC | `/admin/documents` | Staff — Membership Committee Member | denied | denied (HTTP 200) | **PASS** |  |  |
| ENG-056 | local | ENG | `/admin/events` | Staff — Membership Committee Member | denied | denied (HTTP 200) | **PASS** |  |  |
| FIN-040 | local | FIN | `/admin/finance` | Staff — Membership Committee Member | denied | denied (HTTP 200) | **PASS** |  |  |
| ADMIN-038 | local | ADMIN | `/admin/help` | Staff — Membership Committee Member | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-committee-member/en-admin-help.jpg) |
| REG-038 | local | REG | `/admin/import` | Staff — Membership Committee Member | denied | denied (HTTP 200) | **PASS** |  |  |
| PLAT-028 | local | PLAT | `/admin/integrations` | Staff — Membership Committee Member | denied | denied (HTTP 200) | **PASS** |  |  |
| CMT-020 | local | CMT | `/admin/meetings` | Staff — Membership Committee Member | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-committee-member/en-admin-meetings.jpg) |
| REG-039 | local | REG | `/admin/member` | Staff — Membership Committee Member | denied | denied (HTTP 200) | **PASS** |  |  |
| REG-040 | local | REG | `/admin/members` | Staff — Membership Committee Member | denied | denied (HTTP 200) | **PASS** |  |  |
| MEM-067 | local | MEM | `/admin/mreview` | Staff — Membership Committee Member | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-committee-member/en-admin-mreview.jpg) |
| CMS-020 | local | CMS | `/admin/notify` | Staff — Membership Committee Member | denied | denied (HTTP 200) | **PASS** |  |  |
| FIN-041 | local | FIN | `/admin/payments` | Staff — Membership Committee Member | denied | denied (HTTP 200) | **PASS** |  |  |
| FIN-042 | local | FIN | `/admin/psid` | Staff — Membership Committee Member | denied | denied (HTTP 200) | **PARTIAL** | browser errors: pageerror: Minified React error #418; visit https://react.dev/errors/418?args[]=HTML&args[]= for the full message or use the non-minified dev environment for full errors and additional helpful warnings. | [shot](evidence/crawl/staff-membership-committee-member/en-admin-psid-PROBLEM.jpg) |
| ADMIN-039 | local | ADMIN | `/admin/queue` | Staff — Membership Committee Member | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-committee-member/en-admin-queue.jpg) |
| REP-020 | local | REP | `/admin/reports` | Staff — Membership Committee Member | denied | denied (HTTP 200) | **PARTIAL** | browser errors: pageerror: Minified React error #418; visit https://react.dev/errors/418?args[]=HTML&args[]= for the full message or use the non-minified dev environment for full errors and additional helpful warnings. | [shot](evidence/crawl/staff-membership-committee-member/en-admin-reports-PROBLEM.jpg) |
| MEM-068 | local | MEM | `/admin/requests` | Staff — Membership Committee Member | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-committee-member/en-admin-requests.jpg) |
| SVC-096 | local | SVC | `/admin/review` | Staff — Membership Committee Member | denied | denied (HTTP 200) | **PASS** |  |  |
| SVC-097 | local | SVC | `/admin/review/letter` | Staff — Membership Committee Member | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-committee-member/en-admin-review-letter.jpg) |
| ADMIN-040 | local | ADMIN | `/admin/search` | Staff — Membership Committee Member | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-committee-member/en-admin-search.jpg) |
| PLAT-029 | local | PLAT | `/admin/services` | Staff — Membership Committee Member | denied | denied (HTTP 200) | **PASS** |  |  |
| PLAT-030 | local | PLAT | `/admin/settings` | Staff — Membership Committee Member | denied | denied (HTTP 200) | **PASS** |  |  |
| SVC-098 | local | SVC | `/admin/sla` | Staff — Membership Committee Member | denied | denied (HTTP 200) | **PASS** |  |  |
| STAFF-020 | local | STAFF | `/admin/staff` | Staff — Membership Committee Member | denied | denied (HTTP 200) | **PASS** |  |  |
| CERT-010 | local | CERT | `/admin/temp` | Staff — Membership Committee Member | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-091 | local | WHATSAPP | `/admin/whatsapp` | Staff — Membership Committee Member | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-092 | local | WHATSAPP | `/admin/whatsapp/campaigns` | Staff — Membership Committee Member | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-093 | local | WHATSAPP | `/admin/whatsapp/campaigns/history` | Staff — Membership Committee Member | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-094 | local | WHATSAPP | `/admin/whatsapp/campaigns/new` | Staff — Membership Committee Member | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-095 | local | WHATSAPP | `/admin/whatsapp/campaigns/view` | Staff — Membership Committee Member | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-096 | local | WHATSAPP | `/admin/whatsapp/consent` | Staff — Membership Committee Member | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-097 | local | WHATSAPP | `/admin/whatsapp/inbox` | Staff — Membership Committee Member | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-098 | local | WHATSAPP | `/admin/whatsapp/readiness` | Staff — Membership Committee Member | denied | denied (HTTP 200) | **PARTIAL** | browser errors: pageerror: Minified React error #418; visit https://react.dev/errors/418?args[]=HTML&args[]= for the full message or use the non-minified dev environment for full errors and additional helpful warnings. | [shot](evidence/crawl/staff-membership-committee-member/en-admin-whatsapp-readiness-PROBLEM.jpg) |
| WHATSAPP-099 | local | WHATSAPP | `/admin/whatsapp/settings` | Staff — Membership Committee Member | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-100 | local | WHATSAPP | `/admin/whatsapp/templates` | Staff — Membership Committee Member | denied | denied (HTTP 200) | **PASS** |  |  |
| PORTAL-013 | local | PORTAL | `/portal` | Staff — Membership Committee Member | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-099 | local | SVC | `/portal/application` | Staff — Membership Committee Member | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-100 | local | SVC | `/portal/application/letter` | Staff — Membership Committee Member | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-101 | local | SVC | `/portal/applications` | Staff — Membership Committee Member | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-102 | local | SVC | `/portal/apply` | Staff — Membership Committee Member | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| AI-013 | local | AI | `/portal/assistant` | Staff — Membership Committee Member | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| DOC-023 | local | DOC | `/portal/documents` | Staff — Membership Committee Member | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| END-013 | local | END | `/portal/endorse` | Staff — Membership Committee Member | shown or redirected or denied or not-found | redirected (HTTP 200) | **PARTIAL** | browser errors: pageerror: Minified React error #418; visit https://react.dev/errors/418?args[]=HTML&args[]= for the full message or use the non-minified dev environment for full errors and additional helpful warnings. | [shot](evidence/crawl/staff-membership-committee-member/en-portal-endorse-PROBLEM.jpg) |
| ENG-057 | local | ENG | `/portal/events` | Staff — Membership Committee Member | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-069 | local | MEM | `/portal/form` | Staff — Membership Committee Member | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-070 | local | MEM | `/portal/join` | Staff — Membership Committee Member | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-071 | local | MEM | `/portal/membership` | Staff — Membership Committee Member | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-072 | local | MEM | `/portal/mtrack` | Staff — Membership Committee Member | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ENG-058 | local | ENG | `/portal/notifications` | Staff — Membership Committee Member | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| OPP-013 | local | OPP | `/portal/opportunities` | Staff — Membership Committee Member | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| FIN-043 | local | FIN | `/portal/payments` | Staff — Membership Committee Member | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| PROF-013 | local | PROF | `/portal/profile` | Staff — Membership Committee Member | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ENG-059 | local | ENG | `/portal/support` | Staff — Membership Committee Member | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ADMIN-041 | local | ADMIN | `/admin` | Staff — Membership Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-officer/en-admin.jpg) |
| REP-021 | local | REP | `/admin/ai` | Staff — Membership Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-officer/en-admin-ai.jpg) |
| SVC-103 | local | SVC | `/admin/applications` | Staff — Membership Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| SVC-104 | local | SVC | `/admin/approvals` | Staff — Membership Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| STAFF-021 | local | STAFF | `/admin/audit` | Staff — Membership Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| BIZ-041 | local | BIZ | `/admin/business-directory` | Staff — Membership Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-officer/en-admin-business-directory.jpg) |
| BIZ-042 | local | BIZ | `/admin/business-directory/exports` | Staff — Membership Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-officer/en-admin-business-directory-exports.jpg) |
| BIZ-043 | local | BIZ | `/admin/business-directory/profile` | Staff — Membership Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-officer/en-admin-business-directory-profile.jpg) |
| BIZ-044 | local | BIZ | `/admin/business-directory/segments` | Staff — Membership Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-officer/en-admin-business-directory-segments.jpg) |
| REG-041 | local | REG | `/admin/changes` | Staff — Membership Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-officer/en-admin-changes.jpg) |
| CMT-021 | local | CMT | `/admin/committee` | Staff — Membership Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| ENG-060 | local | ENG | `/admin/complaints` | Staff — Membership Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-officer/en-admin-complaints.jpg) |
| CMS-021 | local | CMS | `/admin/content` | Staff — Membership Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-officer/en-admin-content.jpg) |
| DOC-024 | local | DOC | `/admin/documents` | Staff — Membership Officer | shown | shown (HTTP 200) | **PARTIAL** | browser errors: pageerror: Minified React error #418; visit https://react.dev/errors/418?args[]=HTML&args[]= for the full message or use the non-minified dev environment for full errors and additional helpful warnings. | [shot](evidence/crawl/staff-membership-officer/en-admin-documents-PROBLEM.jpg) |
| ENG-061 | local | ENG | `/admin/events` | Staff — Membership Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-officer/en-admin-events.jpg) |
| FIN-044 | local | FIN | `/admin/finance` | Staff — Membership Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| ADMIN-042 | local | ADMIN | `/admin/help` | Staff — Membership Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-officer/en-admin-help.jpg) |
| REG-042 | local | REG | `/admin/import` | Staff — Membership Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-officer/en-admin-import.jpg) |
| PLAT-031 | local | PLAT | `/admin/integrations` | Staff — Membership Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| CMT-022 | local | CMT | `/admin/meetings` | Staff — Membership Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| REG-043 | local | REG | `/admin/member` | Staff — Membership Officer | redirected | redirected (HTTP 200) | **PASS** |  |  |
| REG-044 | local | REG | `/admin/members` | Staff — Membership Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-officer/en-admin-members.jpg) |
| MEM-073 | local | MEM | `/admin/mreview` | Staff — Membership Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-officer/en-admin-mreview.jpg) |
| CMS-022 | local | CMS | `/admin/notify` | Staff — Membership Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-officer/en-admin-notify.jpg) |
| FIN-045 | local | FIN | `/admin/payments` | Staff — Membership Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-officer/en-admin-payments.jpg) |
| FIN-046 | local | FIN | `/admin/psid` | Staff — Membership Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-officer/en-admin-psid.jpg) |
| ADMIN-043 | local | ADMIN | `/admin/queue` | Staff — Membership Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-officer/en-admin-queue.jpg) |
| REP-022 | local | REP | `/admin/reports` | Staff — Membership Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-officer/en-admin-reports.jpg) |
| MEM-074 | local | MEM | `/admin/requests` | Staff — Membership Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-officer/en-admin-requests.jpg) |
| SVC-105 | local | SVC | `/admin/review` | Staff — Membership Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| SVC-106 | local | SVC | `/admin/review/letter` | Staff — Membership Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-officer/en-admin-review-letter.jpg) |
| ADMIN-044 | local | ADMIN | `/admin/search` | Staff — Membership Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-officer/en-admin-search.jpg) |
| PLAT-032 | local | PLAT | `/admin/services` | Staff — Membership Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| PLAT-033 | local | PLAT | `/admin/settings` | Staff — Membership Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| SVC-107 | local | SVC | `/admin/sla` | Staff — Membership Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| STAFF-022 | local | STAFF | `/admin/staff` | Staff — Membership Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| CERT-011 | local | CERT | `/admin/temp` | Staff — Membership Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-officer/en-admin-temp.jpg) |
| WHATSAPP-101 | local | WHATSAPP | `/admin/whatsapp` | Staff — Membership Officer | shown | shown (HTTP 200) | **PARTIAL** | browser errors: pageerror: Minified React error #418; visit https://react.dev/errors/418?args[]=HTML&args[]= for the full message or use the non-minified dev environment for full errors and additional helpful warnings. | [shot](evidence/crawl/staff-membership-officer/en-admin-whatsapp-PROBLEM.jpg) |
| WHATSAPP-102 | local | WHATSAPP | `/admin/whatsapp/campaigns` | Staff — Membership Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-officer/en-admin-whatsapp-campaigns.jpg) |
| WHATSAPP-103 | local | WHATSAPP | `/admin/whatsapp/campaigns/history` | Staff — Membership Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-officer/en-admin-whatsapp-campaigns-history.jpg) |
| WHATSAPP-104 | local | WHATSAPP | `/admin/whatsapp/campaigns/new` | Staff — Membership Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-officer/en-admin-whatsapp-campaigns-new.jpg) |
| WHATSAPP-105 | local | WHATSAPP | `/admin/whatsapp/campaigns/view` | Staff — Membership Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-officer/en-admin-whatsapp-campaigns-view.jpg) |
| WHATSAPP-106 | local | WHATSAPP | `/admin/whatsapp/consent` | Staff — Membership Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-officer/en-admin-whatsapp-consent.jpg) |
| WHATSAPP-107 | local | WHATSAPP | `/admin/whatsapp/inbox` | Staff — Membership Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-officer/en-admin-whatsapp-inbox.jpg) |
| WHATSAPP-108 | local | WHATSAPP | `/admin/whatsapp/readiness` | Staff — Membership Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-officer/en-admin-whatsapp-readiness.jpg) |
| WHATSAPP-109 | local | WHATSAPP | `/admin/whatsapp/settings` | Staff — Membership Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-110 | local | WHATSAPP | `/admin/whatsapp/templates` | Staff — Membership Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-membership-officer/en-admin-whatsapp-templates.jpg) |
| PORTAL-014 | local | PORTAL | `/portal` | Staff — Membership Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-108 | local | SVC | `/portal/application` | Staff — Membership Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-109 | local | SVC | `/portal/application/letter` | Staff — Membership Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-110 | local | SVC | `/portal/applications` | Staff — Membership Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-111 | local | SVC | `/portal/apply` | Staff — Membership Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| AI-014 | local | AI | `/portal/assistant` | Staff — Membership Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| DOC-025 | local | DOC | `/portal/documents` | Staff — Membership Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| END-014 | local | END | `/portal/endorse` | Staff — Membership Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ENG-062 | local | ENG | `/portal/events` | Staff — Membership Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-075 | local | MEM | `/portal/form` | Staff — Membership Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-076 | local | MEM | `/portal/join` | Staff — Membership Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-077 | local | MEM | `/portal/membership` | Staff — Membership Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-078 | local | MEM | `/portal/mtrack` | Staff — Membership Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ENG-063 | local | ENG | `/portal/notifications` | Staff — Membership Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| OPP-014 | local | OPP | `/portal/opportunities` | Staff — Membership Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| FIN-047 | local | FIN | `/portal/payments` | Staff — Membership Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| PROF-014 | local | PROF | `/portal/profile` | Staff — Membership Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ENG-064 | local | ENG | `/portal/support` | Staff — Membership Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ADMIN-045 | local | ADMIN | `/admin` | Staff — President (Signatory) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-president-signatory/en-admin.jpg) |
| REP-023 | local | REP | `/admin/ai` | Staff — President (Signatory) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-president-signatory/en-admin-ai.jpg) |
| SVC-112 | local | SVC | `/admin/applications` | Staff — President (Signatory) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-president-signatory/en-admin-applications.jpg) |
| SVC-113 | local | SVC | `/admin/approvals` | Staff — President (Signatory) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-president-signatory/en-admin-approvals.jpg) |
| STAFF-023 | local | STAFF | `/admin/audit` | Staff — President (Signatory) | denied | denied (HTTP 200) | **PASS** |  |  |
| BIZ-045 | local | BIZ | `/admin/business-directory` | Staff — President (Signatory) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-president-signatory/en-admin-business-directory.jpg) |
| BIZ-046 | local | BIZ | `/admin/business-directory/exports` | Staff — President (Signatory) | denied | denied (HTTP 200) | **PASS** |  |  |
| BIZ-047 | local | BIZ | `/admin/business-directory/profile` | Staff — President (Signatory) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-president-signatory/en-admin-business-directory-profile.jpg) |
| BIZ-048 | local | BIZ | `/admin/business-directory/segments` | Staff — President (Signatory) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-president-signatory/en-admin-business-directory-segments.jpg) |
| REG-045 | local | REG | `/admin/changes` | Staff — President (Signatory) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-president-signatory/en-admin-changes.jpg) |
| CMT-023 | local | CMT | `/admin/committee` | Staff — President (Signatory) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-president-signatory/en-admin-committee.jpg) |
| ENG-065 | local | ENG | `/admin/complaints` | Staff — President (Signatory) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-president-signatory/en-admin-complaints.jpg) |
| CMS-023 | local | CMS | `/admin/content` | Staff — President (Signatory) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-president-signatory/en-admin-content.jpg) |
| DOC-026 | local | DOC | `/admin/documents` | Staff — President (Signatory) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-president-signatory/en-admin-documents.jpg) |
| ENG-066 | local | ENG | `/admin/events` | Staff — President (Signatory) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-president-signatory/en-admin-events.jpg) |
| FIN-048 | local | FIN | `/admin/finance` | Staff — President (Signatory) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-president-signatory/en-admin-finance.jpg) |
| ADMIN-046 | local | ADMIN | `/admin/help` | Staff — President (Signatory) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-president-signatory/en-admin-help.jpg) |
| REG-046 | local | REG | `/admin/import` | Staff — President (Signatory) | denied | denied (HTTP 200) | **PASS** |  |  |
| PLAT-034 | local | PLAT | `/admin/integrations` | Staff — President (Signatory) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-president-signatory/en-admin-integrations.jpg) |
| CMT-024 | local | CMT | `/admin/meetings` | Staff — President (Signatory) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-president-signatory/en-admin-meetings.jpg) |
| REG-047 | local | REG | `/admin/member` | Staff — President (Signatory) | redirected | redirected (HTTP 200) | **PASS** |  |  |
| REG-048 | local | REG | `/admin/members` | Staff — President (Signatory) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-president-signatory/en-admin-members.jpg) |
| MEM-079 | local | MEM | `/admin/mreview` | Staff — President (Signatory) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-president-signatory/en-admin-mreview.jpg) |
| CMS-024 | local | CMS | `/admin/notify` | Staff — President (Signatory) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-president-signatory/en-admin-notify.jpg) |
| FIN-049 | local | FIN | `/admin/payments` | Staff — President (Signatory) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-president-signatory/en-admin-payments.jpg) |
| FIN-050 | local | FIN | `/admin/psid` | Staff — President (Signatory) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-president-signatory/en-admin-psid.jpg) |
| ADMIN-047 | local | ADMIN | `/admin/queue` | Staff — President (Signatory) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-president-signatory/en-admin-queue.jpg) |
| REP-024 | local | REP | `/admin/reports` | Staff — President (Signatory) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-president-signatory/en-admin-reports.jpg) |
| MEM-080 | local | MEM | `/admin/requests` | Staff — President (Signatory) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-president-signatory/en-admin-requests.jpg) |
| SVC-114 | local | SVC | `/admin/review` | Staff — President (Signatory) | shown | shown (HTTP 200) | **PARTIAL** | browser errors: pageerror: Minified React error #418; visit https://react.dev/errors/418?args[]=HTML&args[]= for the full message or use the non-minified dev environment for full errors and additional helpful warnings. | [shot](evidence/crawl/staff-president-signatory/en-admin-review-PROBLEM.jpg) |
| SVC-115 | local | SVC | `/admin/review/letter` | Staff — President (Signatory) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-president-signatory/en-admin-review-letter.jpg) |
| ADMIN-048 | local | ADMIN | `/admin/search` | Staff — President (Signatory) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-president-signatory/en-admin-search.jpg) |
| PLAT-035 | local | PLAT | `/admin/services` | Staff — President (Signatory) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-president-signatory/en-admin-services.jpg) |
| PLAT-036 | local | PLAT | `/admin/settings` | Staff — President (Signatory) | denied | denied (HTTP 200) | **PASS** |  |  |
| SVC-116 | local | SVC | `/admin/sla` | Staff — President (Signatory) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-president-signatory/en-admin-sla.jpg) |
| STAFF-024 | local | STAFF | `/admin/staff` | Staff — President (Signatory) | denied | denied (HTTP 200) | **PASS** |  |  |
| CERT-012 | local | CERT | `/admin/temp` | Staff — President (Signatory) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-president-signatory/en-admin-temp.jpg) |
| WHATSAPP-111 | local | WHATSAPP | `/admin/whatsapp` | Staff — President (Signatory) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-president-signatory/en-admin-whatsapp.jpg) |
| WHATSAPP-112 | local | WHATSAPP | `/admin/whatsapp/campaigns` | Staff — President (Signatory) | shown | shown (HTTP 200) | **PARTIAL** | browser errors: pageerror: Minified React error #418; visit https://react.dev/errors/418?args[]=HTML&args[]= for the full message or use the non-minified dev environment for full errors and additional helpful warnings. | [shot](evidence/crawl/staff-president-signatory/en-admin-whatsapp-campaigns-PROBLEM.jpg) |
| WHATSAPP-113 | local | WHATSAPP | `/admin/whatsapp/campaigns/history` | Staff — President (Signatory) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-president-signatory/en-admin-whatsapp-campaigns-history.jpg) |
| WHATSAPP-114 | local | WHATSAPP | `/admin/whatsapp/campaigns/new` | Staff — President (Signatory) | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-115 | local | WHATSAPP | `/admin/whatsapp/campaigns/view` | Staff — President (Signatory) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-president-signatory/en-admin-whatsapp-campaigns-view.jpg) |
| WHATSAPP-116 | local | WHATSAPP | `/admin/whatsapp/consent` | Staff — President (Signatory) | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-117 | local | WHATSAPP | `/admin/whatsapp/inbox` | Staff — President (Signatory) | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-118 | local | WHATSAPP | `/admin/whatsapp/readiness` | Staff — President (Signatory) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-president-signatory/en-admin-whatsapp-readiness.jpg) |
| WHATSAPP-119 | local | WHATSAPP | `/admin/whatsapp/settings` | Staff — President (Signatory) | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-120 | local | WHATSAPP | `/admin/whatsapp/templates` | Staff — President (Signatory) | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-president-signatory/en-admin-whatsapp-templates.jpg) |
| PORTAL-015 | local | PORTAL | `/portal` | Staff — President (Signatory) | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-117 | local | SVC | `/portal/application` | Staff — President (Signatory) | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-118 | local | SVC | `/portal/application/letter` | Staff — President (Signatory) | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-119 | local | SVC | `/portal/applications` | Staff — President (Signatory) | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-120 | local | SVC | `/portal/apply` | Staff — President (Signatory) | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| AI-015 | local | AI | `/portal/assistant` | Staff — President (Signatory) | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| DOC-027 | local | DOC | `/portal/documents` | Staff — President (Signatory) | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| END-015 | local | END | `/portal/endorse` | Staff — President (Signatory) | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ENG-067 | local | ENG | `/portal/events` | Staff — President (Signatory) | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-081 | local | MEM | `/portal/form` | Staff — President (Signatory) | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-082 | local | MEM | `/portal/join` | Staff — President (Signatory) | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-083 | local | MEM | `/portal/membership` | Staff — President (Signatory) | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-084 | local | MEM | `/portal/mtrack` | Staff — President (Signatory) | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ENG-068 | local | ENG | `/portal/notifications` | Staff — President (Signatory) | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| OPP-015 | local | OPP | `/portal/opportunities` | Staff — President (Signatory) | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| FIN-051 | local | FIN | `/portal/payments` | Staff — President (Signatory) | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| PROF-015 | local | PROF | `/portal/profile` | Staff — President (Signatory) | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ENG-069 | local | ENG | `/portal/support` | Staff — President (Signatory) | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ADMIN-049 | local | ADMIN | `/admin` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin.jpg) |
| REP-025 | local | REP | `/admin/ai` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-ai.jpg) |
| SVC-121 | local | SVC | `/admin/applications` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-applications.jpg) |
| SVC-122 | local | SVC | `/admin/approvals` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-approvals.jpg) |
| STAFF-025 | local | STAFF | `/admin/audit` | Staff — Secretary General | shown | shown (HTTP 200) | **PARTIAL** | browser errors: pageerror: Minified React error #418; visit https://react.dev/errors/418?args[]=HTML&args[]= for the full message or use the non-minified dev environment for full errors and additional helpful warnings. | [shot](evidence/crawl/staff-secretary-general/en-admin-audit-PROBLEM.jpg) |
| BIZ-049 | local | BIZ | `/admin/business-directory` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-business-directory.jpg) |
| BIZ-050 | local | BIZ | `/admin/business-directory/exports` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-business-directory-exports.jpg) |
| BIZ-051 | local | BIZ | `/admin/business-directory/profile` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-business-directory-profile.jpg) |
| BIZ-052 | local | BIZ | `/admin/business-directory/segments` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-business-directory-segments.jpg) |
| REG-049 | local | REG | `/admin/changes` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-changes.jpg) |
| CMT-025 | local | CMT | `/admin/committee` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-committee.jpg) |
| ENG-070 | local | ENG | `/admin/complaints` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-complaints.jpg) |
| CMS-025 | local | CMS | `/admin/content` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-content.jpg) |
| DOC-028 | local | DOC | `/admin/documents` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-documents.jpg) |
| ENG-071 | local | ENG | `/admin/events` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-events.jpg) |
| FIN-052 | local | FIN | `/admin/finance` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-finance.jpg) |
| ADMIN-050 | local | ADMIN | `/admin/help` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-help.jpg) |
| REG-050 | local | REG | `/admin/import` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-import.jpg) |
| PLAT-037 | local | PLAT | `/admin/integrations` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-integrations.jpg) |
| CMT-026 | local | CMT | `/admin/meetings` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-meetings.jpg) |
| REG-051 | local | REG | `/admin/member` | Staff — Secretary General | redirected | redirected (HTTP 200) | **PASS** |  |  |
| REG-052 | local | REG | `/admin/members` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-members.jpg) |
| MEM-085 | local | MEM | `/admin/mreview` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-mreview.jpg) |
| CMS-026 | local | CMS | `/admin/notify` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-notify.jpg) |
| FIN-053 | local | FIN | `/admin/payments` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-payments.jpg) |
| FIN-054 | local | FIN | `/admin/psid` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-psid.jpg) |
| ADMIN-051 | local | ADMIN | `/admin/queue` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-queue.jpg) |
| REP-026 | local | REP | `/admin/reports` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-reports.jpg) |
| MEM-086 | local | MEM | `/admin/requests` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-requests.jpg) |
| SVC-123 | local | SVC | `/admin/review` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-review.jpg) |
| SVC-124 | local | SVC | `/admin/review/letter` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-review-letter.jpg) |
| ADMIN-052 | local | ADMIN | `/admin/search` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-search.jpg) |
| PLAT-038 | local | PLAT | `/admin/services` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-services.jpg) |
| PLAT-039 | local | PLAT | `/admin/settings` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-settings.jpg) |
| SVC-125 | local | SVC | `/admin/sla` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-sla.jpg) |
| STAFF-026 | local | STAFF | `/admin/staff` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-staff.jpg) |
| CERT-013 | local | CERT | `/admin/temp` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-temp.jpg) |
| WHATSAPP-121 | local | WHATSAPP | `/admin/whatsapp` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-whatsapp.jpg) |
| WHATSAPP-122 | local | WHATSAPP | `/admin/whatsapp/campaigns` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-whatsapp-campaigns.jpg) |
| WHATSAPP-123 | local | WHATSAPP | `/admin/whatsapp/campaigns/history` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-whatsapp-campaigns-history.jpg) |
| WHATSAPP-124 | local | WHATSAPP | `/admin/whatsapp/campaigns/new` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-whatsapp-campaigns-new.jpg) |
| WHATSAPP-125 | local | WHATSAPP | `/admin/whatsapp/campaigns/view` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-whatsapp-campaigns-view.jpg) |
| WHATSAPP-126 | local | WHATSAPP | `/admin/whatsapp/consent` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-whatsapp-consent.jpg) |
| WHATSAPP-127 | local | WHATSAPP | `/admin/whatsapp/inbox` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-whatsapp-inbox.jpg) |
| WHATSAPP-128 | local | WHATSAPP | `/admin/whatsapp/readiness` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-whatsapp-readiness.jpg) |
| WHATSAPP-129 | local | WHATSAPP | `/admin/whatsapp/settings` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-whatsapp-settings.jpg) |
| WHATSAPP-130 | local | WHATSAPP | `/admin/whatsapp/templates` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/en-admin-whatsapp-templates.jpg) |
| PORTAL-016 | local | PORTAL | `/portal` | Staff — Secretary General | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-126 | local | SVC | `/portal/application` | Staff — Secretary General | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-127 | local | SVC | `/portal/application/letter` | Staff — Secretary General | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-128 | local | SVC | `/portal/applications` | Staff — Secretary General | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-129 | local | SVC | `/portal/apply` | Staff — Secretary General | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| AI-016 | local | AI | `/portal/assistant` | Staff — Secretary General | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| DOC-029 | local | DOC | `/portal/documents` | Staff — Secretary General | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| END-016 | local | END | `/portal/endorse` | Staff — Secretary General | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ENG-072 | local | ENG | `/portal/events` | Staff — Secretary General | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-087 | local | MEM | `/portal/form` | Staff — Secretary General | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-088 | local | MEM | `/portal/join` | Staff — Secretary General | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-089 | local | MEM | `/portal/membership` | Staff — Secretary General | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-090 | local | MEM | `/portal/mtrack` | Staff — Secretary General | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ENG-073 | local | ENG | `/portal/notifications` | Staff — Secretary General | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| OPP-016 | local | OPP | `/portal/opportunities` | Staff — Secretary General | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| FIN-055 | local | FIN | `/portal/payments` | Staff — Secretary General | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| PROF-016 | local | PROF | `/portal/profile` | Staff — Secretary General | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ENG-074 | local | ENG | `/portal/support` | Staff — Secretary General | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ADMIN-053 | local | ADMIN | `/ur/admin` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin.jpg) |
| REP-027 | local | REP | `/ur/admin/ai` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin-ai.jpg) |
| SVC-130 | local | SVC | `/ur/admin/applications` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin-applications.jpg) |
| SVC-131 | local | SVC | `/ur/admin/approvals` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin-approvals.jpg) |
| STAFF-027 | local | STAFF | `/ur/admin/audit` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin-audit.jpg) |
| BIZ-053 | local | BIZ | `/ur/admin/business-directory` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin-business-directory.jpg) |
| BIZ-054 | local | BIZ | `/ur/admin/business-directory/exports` | Staff — Secretary General | shown | shown (HTTP 200) | **PARTIAL** | browser errors: pageerror: Minified React error #418; visit https://react.dev/errors/418?args[]=HTML&args[]= for the full message or use the non-minified dev environment for full errors and additional helpful warnings. | [shot](evidence/crawl/staff-secretary-general/ur-admin-business-directory-exports-PROBLEM.jpg) |
| BIZ-055 | local | BIZ | `/ur/admin/business-directory/profile` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin-business-directory-profile.jpg) |
| BIZ-056 | local | BIZ | `/ur/admin/business-directory/segments` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin-business-directory-segments.jpg) |
| REG-053 | local | REG | `/ur/admin/changes` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin-changes.jpg) |
| CMT-027 | local | CMT | `/ur/admin/committee` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin-committee.jpg) |
| ENG-075 | local | ENG | `/ur/admin/complaints` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin-complaints.jpg) |
| CMS-027 | local | CMS | `/ur/admin/content` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin-content.jpg) |
| DOC-030 | local | DOC | `/ur/admin/documents` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin-documents.jpg) |
| ENG-076 | local | ENG | `/ur/admin/events` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin-events.jpg) |
| FIN-056 | local | FIN | `/ur/admin/finance` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin-finance.jpg) |
| ADMIN-054 | local | ADMIN | `/ur/admin/help` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin-help.jpg) |
| REG-054 | local | REG | `/ur/admin/import` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin-import.jpg) |
| PLAT-040 | local | PLAT | `/ur/admin/integrations` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin-integrations.jpg) |
| CMT-028 | local | CMT | `/ur/admin/meetings` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin-meetings.jpg) |
| REG-055 | local | REG | `/ur/admin/member` | Staff — Secretary General | redirected | redirected (HTTP 200) | **PASS** |  |  |
| REG-056 | local | REG | `/ur/admin/members` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin-members.jpg) |
| MEM-091 | local | MEM | `/ur/admin/mreview` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin-mreview.jpg) |
| CMS-028 | local | CMS | `/ur/admin/notify` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin-notify.jpg) |
| FIN-057 | local | FIN | `/ur/admin/payments` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin-payments.jpg) |
| FIN-058 | local | FIN | `/ur/admin/psid` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin-psid.jpg) |
| ADMIN-055 | local | ADMIN | `/ur/admin/queue` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin-queue.jpg) |
| REP-028 | local | REP | `/ur/admin/reports` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin-reports.jpg) |
| MEM-092 | local | MEM | `/ur/admin/requests` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin-requests.jpg) |
| SVC-132 | local | SVC | `/ur/admin/review` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin-review.jpg) |
| SVC-133 | local | SVC | `/ur/admin/review/letter` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin-review-letter.jpg) |
| ADMIN-056 | local | ADMIN | `/ur/admin/search` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin-search.jpg) |
| PLAT-041 | local | PLAT | `/ur/admin/services` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin-services.jpg) |
| PLAT-042 | local | PLAT | `/ur/admin/settings` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin-settings.jpg) |
| SVC-134 | local | SVC | `/ur/admin/sla` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin-sla.jpg) |
| STAFF-028 | local | STAFF | `/ur/admin/staff` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin-staff.jpg) |
| CERT-014 | local | CERT | `/ur/admin/temp` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin-temp.jpg) |
| WHATSAPP-131 | local | WHATSAPP | `/ur/admin/whatsapp` | Staff — Secretary General | shown | shown (HTTP 200) | **PARTIAL** | browser errors: pageerror: Minified React error #418; visit https://react.dev/errors/418?args[]=HTML&args[]= for the full message or use the non-minified dev environment for full errors and additional helpful warnings. | [shot](evidence/crawl/staff-secretary-general/ur-admin-whatsapp-PROBLEM.jpg) |
| WHATSAPP-132 | local | WHATSAPP | `/ur/admin/whatsapp/campaigns` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin-whatsapp-campaigns.jpg) |
| WHATSAPP-133 | local | WHATSAPP | `/ur/admin/whatsapp/campaigns/history` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin-whatsapp-campaigns-history.jpg) |
| WHATSAPP-134 | local | WHATSAPP | `/ur/admin/whatsapp/campaigns/new` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin-whatsapp-campaigns-new.jpg) |
| WHATSAPP-135 | local | WHATSAPP | `/ur/admin/whatsapp/campaigns/view` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin-whatsapp-campaigns-view.jpg) |
| WHATSAPP-136 | local | WHATSAPP | `/ur/admin/whatsapp/consent` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin-whatsapp-consent.jpg) |
| WHATSAPP-137 | local | WHATSAPP | `/ur/admin/whatsapp/inbox` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin-whatsapp-inbox.jpg) |
| WHATSAPP-138 | local | WHATSAPP | `/ur/admin/whatsapp/readiness` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin-whatsapp-readiness.jpg) |
| WHATSAPP-139 | local | WHATSAPP | `/ur/admin/whatsapp/settings` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin-whatsapp-settings.jpg) |
| WHATSAPP-140 | local | WHATSAPP | `/ur/admin/whatsapp/templates` | Staff — Secretary General | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-secretary-general/ur-admin-whatsapp-templates.jpg) |
| ADMIN-057 | local | ADMIN | `/admin` | Staff — Services Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-services-officer/en-admin.jpg) |
| REP-029 | local | REP | `/admin/ai` | Staff — Services Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-services-officer/en-admin-ai.jpg) |
| SVC-135 | local | SVC | `/admin/applications` | Staff — Services Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-services-officer/en-admin-applications.jpg) |
| SVC-136 | local | SVC | `/admin/approvals` | Staff — Services Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-services-officer/en-admin-approvals.jpg) |
| STAFF-029 | local | STAFF | `/admin/audit` | Staff — Services Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| BIZ-057 | local | BIZ | `/admin/business-directory` | Staff — Services Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| BIZ-058 | local | BIZ | `/admin/business-directory/exports` | Staff — Services Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| BIZ-059 | local | BIZ | `/admin/business-directory/profile` | Staff — Services Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| BIZ-060 | local | BIZ | `/admin/business-directory/segments` | Staff — Services Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| REG-057 | local | REG | `/admin/changes` | Staff — Services Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| CMT-029 | local | CMT | `/admin/committee` | Staff — Services Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| ENG-077 | local | ENG | `/admin/complaints` | Staff — Services Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-services-officer/en-admin-complaints.jpg) |
| CMS-029 | local | CMS | `/admin/content` | Staff — Services Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-services-officer/en-admin-content.jpg) |
| DOC-031 | local | DOC | `/admin/documents` | Staff — Services Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-services-officer/en-admin-documents.jpg) |
| ENG-078 | local | ENG | `/admin/events` | Staff — Services Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-services-officer/en-admin-events.jpg) |
| FIN-059 | local | FIN | `/admin/finance` | Staff — Services Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| ADMIN-058 | local | ADMIN | `/admin/help` | Staff — Services Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-services-officer/en-admin-help.jpg) |
| REG-058 | local | REG | `/admin/import` | Staff — Services Officer | denied | denied (HTTP 200) | **PARTIAL** | browser errors: pageerror: Minified React error #418; visit https://react.dev/errors/418?args[]=HTML&args[]= for the full message or use the non-minified dev environment for full errors and additional helpful warnings. | [shot](evidence/crawl/staff-services-officer/en-admin-import-PROBLEM.jpg) |
| PLAT-043 | local | PLAT | `/admin/integrations` | Staff — Services Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-services-officer/en-admin-integrations.jpg) |
| CMT-030 | local | CMT | `/admin/meetings` | Staff — Services Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| REG-059 | local | REG | `/admin/member` | Staff — Services Officer | redirected | redirected (HTTP 200) | **PASS** |  |  |
| REG-060 | local | REG | `/admin/members` | Staff — Services Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-services-officer/en-admin-members.jpg) |
| MEM-093 | local | MEM | `/admin/mreview` | Staff — Services Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| CMS-030 | local | CMS | `/admin/notify` | Staff — Services Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-services-officer/en-admin-notify.jpg) |
| FIN-060 | local | FIN | `/admin/payments` | Staff — Services Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-services-officer/en-admin-payments.jpg) |
| FIN-061 | local | FIN | `/admin/psid` | Staff — Services Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-services-officer/en-admin-psid.jpg) |
| ADMIN-059 | local | ADMIN | `/admin/queue` | Staff — Services Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-services-officer/en-admin-queue.jpg) |
| REP-030 | local | REP | `/admin/reports` | Staff — Services Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-services-officer/en-admin-reports.jpg) |
| MEM-094 | local | MEM | `/admin/requests` | Staff — Services Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| SVC-137 | local | SVC | `/admin/review` | Staff — Services Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-services-officer/en-admin-review.jpg) |
| SVC-138 | local | SVC | `/admin/review/letter` | Staff — Services Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-services-officer/en-admin-review-letter.jpg) |
| ADMIN-060 | local | ADMIN | `/admin/search` | Staff — Services Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-services-officer/en-admin-search.jpg) |
| PLAT-044 | local | PLAT | `/admin/services` | Staff — Services Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-services-officer/en-admin-services.jpg) |
| PLAT-045 | local | PLAT | `/admin/settings` | Staff — Services Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| SVC-139 | local | SVC | `/admin/sla` | Staff — Services Officer | shown | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/staff-services-officer/en-admin-sla.jpg) |
| STAFF-030 | local | STAFF | `/admin/staff` | Staff — Services Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| CERT-015 | local | CERT | `/admin/temp` | Staff — Services Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-141 | local | WHATSAPP | `/admin/whatsapp` | Staff — Services Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-142 | local | WHATSAPP | `/admin/whatsapp/campaigns` | Staff — Services Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-143 | local | WHATSAPP | `/admin/whatsapp/campaigns/history` | Staff — Services Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-144 | local | WHATSAPP | `/admin/whatsapp/campaigns/new` | Staff — Services Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-145 | local | WHATSAPP | `/admin/whatsapp/campaigns/view` | Staff — Services Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-146 | local | WHATSAPP | `/admin/whatsapp/consent` | Staff — Services Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-147 | local | WHATSAPP | `/admin/whatsapp/inbox` | Staff — Services Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-148 | local | WHATSAPP | `/admin/whatsapp/readiness` | Staff — Services Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-149 | local | WHATSAPP | `/admin/whatsapp/settings` | Staff — Services Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| WHATSAPP-150 | local | WHATSAPP | `/admin/whatsapp/templates` | Staff — Services Officer | denied | denied (HTTP 200) | **PASS** |  |  |
| PORTAL-017 | local | PORTAL | `/portal` | Staff — Services Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-140 | local | SVC | `/portal/application` | Staff — Services Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-141 | local | SVC | `/portal/application/letter` | Staff — Services Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-142 | local | SVC | `/portal/applications` | Staff — Services Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SVC-143 | local | SVC | `/portal/apply` | Staff — Services Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| AI-017 | local | AI | `/portal/assistant` | Staff — Services Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| DOC-032 | local | DOC | `/portal/documents` | Staff — Services Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| END-017 | local | END | `/portal/endorse` | Staff — Services Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ENG-079 | local | ENG | `/portal/events` | Staff — Services Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-095 | local | MEM | `/portal/form` | Staff — Services Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-096 | local | MEM | `/portal/join` | Staff — Services Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-097 | local | MEM | `/portal/membership` | Staff — Services Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| MEM-098 | local | MEM | `/portal/mtrack` | Staff — Services Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ENG-080 | local | ENG | `/portal/notifications` | Staff — Services Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| OPP-017 | local | OPP | `/portal/opportunities` | Staff — Services Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| FIN-062 | local | FIN | `/portal/payments` | Staff — Services Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| PROF-017 | local | PROF | `/portal/profile` | Staff — Services Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| ENG-081 | local | ENG | `/portal/support` | Staff — Services Officer | shown or redirected or denied or not-found | redirected (HTTP 200) | **PASS** |  |  |
| SITE-015 | local | SITE | `/` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/visitor/en-home.jpg) |
| SITE-016 | local | SITE | `/about` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/visitor/en-about.jpg) |
| ADMIN-061 | local | ADMIN | `/admin` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-PROBLEM.jpg) |
| REP-031 | local | REP | `/admin/ai` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-ai-PROBLEM.jpg) |
| SVC-144 | local | SVC | `/admin/applications` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-applications-PROBLEM.jpg) |
| SVC-145 | local | SVC | `/admin/approvals` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-approvals-PROBLEM.jpg) |
| STAFF-031 | local | STAFF | `/admin/audit` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-audit-PROBLEM.jpg) |
| BIZ-061 | local | BIZ | `/admin/business-directory` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-business-directory-PROBLEM.jpg) |
| BIZ-062 | local | BIZ | `/admin/business-directory/exports` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-business-directory-exports-PROBLEM.jpg) |
| BIZ-063 | local | BIZ | `/admin/business-directory/profile` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-business-directory-profile-PROBLEM.jpg) |
| BIZ-064 | local | BIZ | `/admin/business-directory/segments` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-business-directory-segments-PROBLEM.jpg) |
| REG-061 | local | REG | `/admin/changes` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-changes-PROBLEM.jpg) |
| CMT-031 | local | CMT | `/admin/committee` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-committee-PROBLEM.jpg) |
| ENG-082 | local | ENG | `/admin/complaints` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-complaints-PROBLEM.jpg) |
| CMS-031 | local | CMS | `/admin/content` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-content-PROBLEM.jpg) |
| DOC-033 | local | DOC | `/admin/documents` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-documents-PROBLEM.jpg) |
| ENG-083 | local | ENG | `/admin/events` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-events-PROBLEM.jpg) |
| FIN-063 | local | FIN | `/admin/finance` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-finance-PROBLEM.jpg) |
| ADMIN-062 | local | ADMIN | `/admin/help` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-help-PROBLEM.jpg) |
| REG-062 | local | REG | `/admin/import` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-import-PROBLEM.jpg) |
| PLAT-046 | local | PLAT | `/admin/integrations` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-integrations-PROBLEM.jpg) |
| CMT-032 | local | CMT | `/admin/meetings` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-meetings-PROBLEM.jpg) |
| REG-063 | local | REG | `/admin/member` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-member-PROBLEM.jpg) |
| REG-064 | local | REG | `/admin/members` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-members-PROBLEM.jpg) |
| MEM-099 | local | MEM | `/admin/mreview` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-mreview-PROBLEM.jpg) |
| CMS-032 | local | CMS | `/admin/notify` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-notify-PROBLEM.jpg) |
| FIN-064 | local | FIN | `/admin/payments` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-payments-PROBLEM.jpg) |
| FIN-065 | local | FIN | `/admin/psid` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-psid-PROBLEM.jpg) |
| ADMIN-063 | local | ADMIN | `/admin/queue` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-queue-PROBLEM.jpg) |
| REP-032 | local | REP | `/admin/reports` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-reports-PROBLEM.jpg) |
| MEM-100 | local | MEM | `/admin/requests` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-requests-PROBLEM.jpg) |
| SVC-146 | local | SVC | `/admin/review` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-review-PROBLEM.jpg) |
| SVC-147 | local | SVC | `/admin/review/letter` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-review-letter-PROBLEM.jpg) |
| ADMIN-064 | local | ADMIN | `/admin/search` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-search-PROBLEM.jpg) |
| PLAT-047 | local | PLAT | `/admin/services` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-services-PROBLEM.jpg) |
| PLAT-048 | local | PLAT | `/admin/settings` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-settings-PROBLEM.jpg) |
| SVC-148 | local | SVC | `/admin/sla` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-sla-PROBLEM.jpg) |
| STAFF-032 | local | STAFF | `/admin/staff` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-staff-PROBLEM.jpg) |
| CERT-016 | local | CERT | `/admin/temp` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-temp-PROBLEM.jpg) |
| WHATSAPP-151 | local | WHATSAPP | `/admin/whatsapp` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-whatsapp-PROBLEM.jpg) |
| WHATSAPP-152 | local | WHATSAPP | `/admin/whatsapp/campaigns` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-whatsapp-campaigns-PROBLEM.jpg) |
| WHATSAPP-153 | local | WHATSAPP | `/admin/whatsapp/campaigns/history` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-whatsapp-campaigns-history-PROBLEM.jpg) |
| WHATSAPP-154 | local | WHATSAPP | `/admin/whatsapp/campaigns/new` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-whatsapp-campaigns-new-PROBLEM.jpg) |
| WHATSAPP-155 | local | WHATSAPP | `/admin/whatsapp/campaigns/view` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-whatsapp-campaigns-view-PROBLEM.jpg) |
| WHATSAPP-156 | local | WHATSAPP | `/admin/whatsapp/consent` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-whatsapp-consent-PROBLEM.jpg) |
| WHATSAPP-157 | local | WHATSAPP | `/admin/whatsapp/inbox` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-whatsapp-inbox-PROBLEM.jpg) |
| WHATSAPP-158 | local | WHATSAPP | `/admin/whatsapp/readiness` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-whatsapp-readiness-PROBLEM.jpg) |
| WHATSAPP-159 | local | WHATSAPP | `/admin/whatsapp/settings` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-whatsapp-settings-PROBLEM.jpg) |
| WHATSAPP-160 | local | WHATSAPP | `/admin/whatsapp/templates` | Visitor (not signed in) | not-found | not-found (HTTP 404) | **PASS** |  | [shot](evidence/crawl/visitor/en-admin-whatsapp-templates-PROBLEM.jpg) |
| SITE-017 | local | SITE | `/contact` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/visitor/en-contact.jpg) |
| SITE-018 | local | SITE | `/directory` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/visitor/en-directory.jpg) |
| AUTH-010 | local | AUTH | `/invite/acceptance-token-does-not-exist` | Visitor (not signed in) | not-found or shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/visitor/en-invite-acceptance-token-does-not-exist.jpg) |
| SITE-019 | local | SITE | `/live` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/visitor/en-live.jpg) |
| AUTH-011 | local | AUTH | `/login` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/visitor/en-login.jpg) |
| AUTH-012 | local | AUTH | `/login/forgot` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/visitor/en-login-forgot.jpg) |
| AUTH-013 | local | AUTH | `/login/reset` | Visitor (not signed in) | shown or redirected | redirected (HTTP 200) | **PASS** |  |  |
| AUTH-014 | local | AUTH | `/login/verify` | Visitor (not signed in) | shown or redirected | redirected (HTTP 200) | **PASS** |  |  |
| SITE-020 | local | SITE | `/membership` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/visitor/en-membership.jpg) |
| SITE-021 | local | SITE | `/news` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/visitor/en-news.jpg) |
| PORTAL-018 | local | PORTAL | `/portal` | Visitor (not signed in) | redirected | redirected (HTTP 200) | **PASS** |  |  |
| SVC-149 | local | SVC | `/portal/application` | Visitor (not signed in) | redirected | redirected (HTTP 200) | **PASS** |  |  |
| SVC-150 | local | SVC | `/portal/application/letter` | Visitor (not signed in) | redirected | redirected (HTTP 200) | **PASS** |  |  |
| SVC-151 | local | SVC | `/portal/applications` | Visitor (not signed in) | redirected | redirected (HTTP 200) | **PASS** |  |  |
| SVC-152 | local | SVC | `/portal/apply` | Visitor (not signed in) | redirected | redirected (HTTP 200) | **PASS** |  |  |
| AI-018 | local | AI | `/portal/assistant` | Visitor (not signed in) | redirected | redirected (HTTP 200) | **PASS** |  |  |
| DOC-034 | local | DOC | `/portal/documents` | Visitor (not signed in) | redirected | redirected (HTTP 200) | **PASS** |  |  |
| END-018 | local | END | `/portal/endorse` | Visitor (not signed in) | redirected | redirected (HTTP 200) | **PASS** |  |  |
| ENG-084 | local | ENG | `/portal/events` | Visitor (not signed in) | redirected | redirected (HTTP 200) | **PASS** |  |  |
| MEM-101 | local | MEM | `/portal/form` | Visitor (not signed in) | redirected | redirected (HTTP 200) | **PASS** |  |  |
| MEM-102 | local | MEM | `/portal/join` | Visitor (not signed in) | redirected | redirected (HTTP 200) | **PASS** |  |  |
| MEM-103 | local | MEM | `/portal/membership` | Visitor (not signed in) | redirected | redirected (HTTP 200) | **PASS** |  |  |
| MEM-104 | local | MEM | `/portal/mtrack` | Visitor (not signed in) | redirected | redirected (HTTP 200) | **PASS** |  |  |
| ENG-085 | local | ENG | `/portal/notifications` | Visitor (not signed in) | redirected | redirected (HTTP 200) | **PASS** |  |  |
| OPP-018 | local | OPP | `/portal/opportunities` | Visitor (not signed in) | redirected | redirected (HTTP 200) | **PASS** |  |  |
| FIN-066 | local | FIN | `/portal/payments` | Visitor (not signed in) | redirected | redirected (HTTP 200) | **PASS** |  |  |
| PROF-018 | local | PROF | `/portal/profile` | Visitor (not signed in) | redirected | redirected (HTTP 200) | **PASS** |  |  |
| ENG-086 | local | ENG | `/portal/support` | Visitor (not signed in) | redirected | redirected (HTTP 200) | **PASS** |  |  |
| AUTH-015 | local | AUTH | `/register` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/visitor/en-register.jpg) |
| AUTH-016 | local | AUTH | `/register/details` | Visitor (not signed in) | shown or redirected | redirected (HTTP 200) | **PASS** |  |  |
| AUTH-017 | local | AUTH | `/register/pending` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/visitor/en-register-pending.jpg) |
| SITE-022 | local | SITE | `/resources` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/visitor/en-resources.jpg) |
| SITE-023 | local | SITE | `/resources/form` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/visitor/en-resources-form.jpg) |
| SITE-024 | local | SITE | `/service` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/visitor/en-service.jpg) |
| SITE-025 | local | SITE | `/services` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/visitor/en-services.jpg) |
| AUTH-018 | local | AUTH | `/staff/login` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/visitor/en-staff-login.jpg) |
| SITE-026 | local | SITE | `/track` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/visitor/en-track.jpg) |
| SITE-027 | local | SITE | `/verify` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/visitor/en-verify.jpg) |
| SITE-028 | local | SITE | `/verify/acceptance-code-does-not-exist` | Visitor (not signed in) | not-found or shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/visitor/en-verify-acceptance-code-does-not-exist.jpg) |
| SITE-029 | local | SITE | `/ur` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/visitor/ur-home.jpg) |
| SITE-030 | local | SITE | `/ur/about` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/visitor/ur-about.jpg) |
| SITE-031 | local | SITE | `/ur/contact` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/visitor/ur-contact.jpg) |
| SITE-032 | local | SITE | `/ur/directory` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/visitor/ur-directory.jpg) |
| AUTH-019 | local | AUTH | `/ur/invite/acceptance-token-does-not-exist` | Visitor (not signed in) | not-found or shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/visitor/ur-invite-acceptance-token-does-not-exist.jpg) |
| SITE-033 | local | SITE | `/ur/live` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/visitor/ur-live.jpg) |
| AUTH-020 | local | AUTH | `/ur/login` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/visitor/ur-login.jpg) |
| AUTH-021 | local | AUTH | `/ur/login/forgot` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/visitor/ur-login-forgot.jpg) |
| AUTH-022 | local | AUTH | `/ur/login/reset` | Visitor (not signed in) | shown or redirected | redirected (HTTP 200) | **PASS** |  |  |
| AUTH-023 | local | AUTH | `/ur/login/verify` | Visitor (not signed in) | shown or redirected | redirected (HTTP 200) | **PASS** |  |  |
| SITE-034 | local | SITE | `/ur/membership` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/visitor/ur-membership.jpg) |
| SITE-035 | local | SITE | `/ur/news` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/visitor/ur-news.jpg) |
| AUTH-024 | local | AUTH | `/ur/register` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/visitor/ur-register.jpg) |
| AUTH-025 | local | AUTH | `/ur/register/details` | Visitor (not signed in) | shown or redirected | redirected (HTTP 200) | **PASS** |  |  |
| AUTH-026 | local | AUTH | `/ur/register/pending` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/visitor/ur-register-pending.jpg) |
| SITE-036 | local | SITE | `/ur/resources` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/visitor/ur-resources.jpg) |
| SITE-037 | local | SITE | `/ur/resources/form` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/visitor/ur-resources-form.jpg) |
| SITE-038 | local | SITE | `/ur/service` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/visitor/ur-service.jpg) |
| SITE-039 | local | SITE | `/ur/services` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/visitor/ur-services.jpg) |
| AUTH-027 | local | AUTH | `/ur/staff/login` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/visitor/ur-staff-login.jpg) |
| SITE-040 | local | SITE | `/ur/track` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/visitor/ur-track.jpg) |
| SITE-041 | local | SITE | `/ur/verify` | Visitor (not signed in) | shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/visitor/ur-verify.jpg) |
| SITE-042 | local | SITE | `/ur/verify/acceptance-code-does-not-exist` | Visitor (not signed in) | not-found or shown or redirected | shown (HTTP 200) | **PASS** |  | [shot](evidence/crawl/visitor/ur-verify-acceptance-code-does-not-exist.jpg) |
