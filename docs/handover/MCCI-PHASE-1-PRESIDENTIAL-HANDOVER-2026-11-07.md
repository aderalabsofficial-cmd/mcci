# MCCI Digital — Phase 1 presidential handover (review: 7 November 2026)

Prepared 6 November 2026 from the automated acceptance run of that day. Companion reports in `docs/acceptance/`:
[test inventory](../acceptance/MCCI-PHASE-1-TEST-INVENTORY.md) ·
[interactive elements](../acceptance/MCCI-INTERACTIVE-ELEMENT-TEST-REPORT.md) ·
[designations & permissions](../acceptance/MCCI-DESIGNATION-PERMISSION-TEST-REPORT.md) ·
[defects & repairs](../acceptance/MCCI-DEFECT-AND-REPAIR-REGISTER.md) ·
[domain migration](../acceptance/MCCI-DOMAIN-MIGRATION-READINESS.md).

## 1. Executive summary

**Overall status: READY WITH DOCUMENTED LIMITATIONS**

- The live platform (`https://app.mcci.aderalabs.tech`) runs release **`8668c7c`**, released on 6 Nov at about 13:25
  PKT with the owner's authorisation, after a fresh verified backup. All 61 database migrations are applied. Every
  public page works in English and Urdu (111 visitor page tests: 110 PASS, 1 PARTIAL; 43/43 links answer). A visitor
  cannot reach any staff screen or protected API.
- **Security rules hold where it matters most.** A fresh database build passes **1,235 / 1,235** database-security
  assertions (47 files). Each of the 12 configured designations signed in with its own account (password +
  authenticator) and opened all 47 staff pages by address (1,145 local page tests: 1,112 PASS, 33 PARTIAL, 0 FAIL). What each designation saw matched its configured limits:
  **0 mismatches**. All 173 server actions check the user on the server, except 10 that are public by design.
- **8 application findings today: 5 defects fixed, retested and released; 1 working as designed; 2 open.** DEF-004 (an
  intermittent hydration warning, low) and DEF-008 (WhatsApp preview placeholders, reported by the owner, medium) are
  open; §9 has the details. The owner's committee report (M-0272) was **not** a document defect: it is a demo file,
  and demo files are never approved (owner's rule, confirmed 6 Nov). The real display glitch behind it ("9 / 10",
  red ✗ for the optional tax return) is fixed.
- **Not software, but must be settled before real members' data goes in** (§12): the shared server's firewall
  (MariaDB 3306 and another site's port 3001 are open to the internet), no scheduled or off-site backup, Vice
  President / Assistant Secretary designations not created, demo staff not yet enrolled in 2-step sign-in.

## 2. Scope of this acceptance

Everything implemented in Phase 1: public website, sign-in/sign-up, member portal, membership pipeline, proposer &
seconder, committee, payments & Accounts, certificates & QR verification, the seven services, documents, events,
complaints, content/news/circulars, business directory, trade opportunities, WhatsApp (against a stand-in provider:
**no real message was sent**), reports & AI, staff & audit, services setup, integrations, settings. Bank payment APIs
and courier APIs are outside Phase 1 (manual vouchers and tracking numbers).

| Environment | What was done | Writes |
|---|---|---|
| **A. Live production** | Read-only: health, release, migrations, backups, headers, open ports, DNS; visitor crawl of every page (EN + UR) and every link, before and after the release; refusal checks on every protected API | **None by the tests.** Audit-log rows of the morning came from a manual test from one outside address, not from this run |
| **B. Local (same 61 migrations)** | All browser, role and workflow tests with synthetic accounts that the tests create and remove; all repairs | Local database only |
| **C. Production release** | Owner authorised ("do what you are doing and release it", 6 Nov). Backup `mcci-20261106T082205Z` (7 files verified), then `release.sh 8668c7c` (health OK), then smoke tests and the visitor recrawl | App code only; no database change |

## 3. Production release baseline

| Item | Before (6 Nov morning) | After (6 Nov, 13:25 PKT) |
|---|---|---|
| Live release | `cc3e5c9` (the brief's checkpoint `babd95f` was two releases older) | **`8668c7c`** · `/api/health` → `{"ok":true,"release":"8668c7c"}` |
| Rollback releases | `1c9a29f`, `babd95f` | `cc3e5c9`, `1c9a29f` (`release.sh --rollback`) |
| Migrations | 61 recorded (last `20261116000680_signup_claims`: 0650, 0660, 0670 **and** 0680 applied). A fresh database applies all 61 cleanly | unchanged |
| Backups | 39 encrypted sets; newest 4 Nov 09:46 UTC (`cc3e5c9`) | **40**: + `mcci-20261106T082205Z` (verified). Still **no schedule, no off-site copy** (INF-002) |
| Services | `mcci-web` active; 9 Supabase containers healthy; jobs timer not installed (by decision) | unchanged |
| Data | 23 sign-in accounts, 16 companies (5 demo), 11 members (7 real, 4 demo unlisted), 5 applications, 0 vouchers, 2 QR documents (both revoked) | unchanged by this work |
| HTTPS / headers | Let's Encrypt to 22 Jan 2027; HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy; **no CSP** (INF-003) | unchanged |
| Exposure | 3306 (MariaDB) and 3001 (another site) open to the internet; firewall off (INF-001) | unchanged: needs approval |

## 4. Inventory (discovered from the code and the running app)

| | Count |
|---|---|
| Modules (test-ID prefixes) | **22**: SITE, AUTH, PORTAL, MEM, END, CMT, CERT, DOC, REG, SVC, FIN, ENG, CMS, OPP, BIZ, WHATSAPP, REP, AI, STAFF, PLAT, PROF, ADMIN |
| Pages / routes (`app/[locale]/**/page.tsx`) | **88** (each in English and Urdu) |
| API route handlers | **25** |
| Server actions | **173** |
| Database security tests | **47 files / 1,235 assertions** |
| Interactive elements (distinct control × page × language, signed-in and visitor) | **5,162**: 3,369 links, 1,318 buttons, 42 tabs, 40 submit buttons, 27 disclosures, 32 selects, 22 text areas, 112 checkboxes, 22 radios, 178 other inputs (text, number, date, search, email, password, tel) |
| Personas | 17 local (visitor, applicant, Corporate member, Associate member, company Viewer, 12 designations) + visitor on production |

## 5. Interactive element results (local, after the fixes)

| Status | Elements | Meaning |
|---|---|---|
| PASS | **3,981** | Link opened with the person's session and answered; or control exercised by an automated functional test |
| PARTIAL | **1,181** | Present, named, wired and reachable, but no automated test exercises its outcome. Not proven wrong |
| FAIL | **0** | (15 before the fixes: DEF-002 × 7, DEF-003 × 2, 6 crawler false positives, TEST-002) |

## 6. Admin-side and user-side results

| Side | Page tests | PASS | PARTIAL | FAIL | Notes |
|---|---|---|---|---|---|
| Visitor, local (EN all areas + UR public) | 111 | 111 | 0 | 0 | admin 47 × "not found", portal 18 × sign-in redirect (expected) |
| Visitor, **production** after the release | 111 | 110 | 1 | 0 | PARTIAL = DEF-004 once (`/ur/directory`) |
| Members & applicant (4 personas) | 207 | 205 | 2 | 0 | Viewer: actions refused with a reason (DEF-002 fixed); members never reach admin (47 redirects each) |
| Staff (12 designations) | 827 | 796 | 31 | 0 | 0 access mismatches |
| **All local page tests** | **1,145** | **1,112** | **33** | **0** | Every PARTIAL is the intermittent hydration warning (DEF-004) |

## 7. Designation-wise permission matrix

Full matrix (limits × pages, per designation): `MCCI-DESIGNATION-PERMISSION-TEST-REPORT.md`.

| Designation | Signed in (password + authenticator) | Staff pages shown / refused (of 47) | Mismatch | Server/DB evidence |
|---|---|---|---|---|
| Secretary General | ✓ | 46 / 0 | 0 | pgTAP 010, 110, 240, 310 |
| President (Signatory) | ✓ | 37 / 9 | 0 | 060, 210, 240 |
| Deputy Secretary — Membership | ✓ | 43 / 3 | 0 | 050, 120 |
| Auditor (read-only) | ✓ | 41 / 5 | 0 | 010 |
| Membership Officer | ✓ | 33 / 13 | 0 | 030, 140, 270 |
| Accounts Officer | ✓ | 21 / 25 | 0 | 040, 390 |
| Front Desk / Data Entry | ✓ | 21 / 25 | 0 | 120 |
| Services Officer | ✓ | 21 / 25 | 0 | 060, 210 |
| IT Convener | ✓ | 19 / 27 (audit trail by design, migration 0500) | 0 | 270, 300 |
| Committee Secretary | ✓ | 14 / 32 | 0 | 050 |
| Membership Committee Convener | ✓ | 10 / 36 | 0 | 160, 240 |
| Membership Committee Member | ✓ | 9 / 38 | 0 | 160 |
| Vice President | — | — | — | **NOT CONFIGURED** (CFG-001) |
| Assistant Secretary | — | — | — | **NOT CONFIGURED** (CFG-001) |
| Super Administrator | — | — | — | **NOT CONFIGURED** by design: the SG has level 3 everywhere; exports and original files are the IT Convener's |

Counts are of the 47 staff pages in English from the crawl after the fixes. `/admin/member` without a member id goes to
the register (by design) and is counted in neither column. The baseline crawl of 10:06–10:25 gave the same access
results.

**Server-side, not just hidden buttons:** pgTAP impersonates each designation inside the database; every server
action checks the caller (`requirePermission` / `requireCompanyPermission`, or a database function that does). On
production, every protected API refused a visitor (401/403), cron endpoints refused calls without the secret, and the
WhatsApp webhook refused a bad signature. Member side: a company Viewer sees the company's records, but its actions
are refused with a reason; a Viewer cannot choose endorsers (pgTAP 150); endorsement signing follows docs/04 (Owner or
Manager of the endorser company).

## 8. End-to-end workflow results (local; synthetic data)

| Workflow | Specs | Result | Notes |
|---|---|---|---|
| A. Membership (register → application with AI reading → proposer & seconder → submit → officer review → return/correct → verify → number → committee → voucher → payment → activation) | `application`, `endorse`, `review`, `committee`, `payments` | **PASS** (`endorse` passed on rerun: flaky under the sign-in rate limit) | Demo files stop at the committee by design |
| B. Certificates (scan → read → conflicts → confirm → QR stamp → verify → withdraw/delete) and service letters (request → review → fee → signature → QR → download) | `certificates`, `services`, `verify` | **PASS** (`services` "each of the seven" passed on rerun: timing under load) | No member "certificate request": the security press prints (FEAT-002) |
| C. Accounts (receipt / counter payment → verify → statement, Trial Balance, second-person verification) | `payments`, `admin-updates` | **PASS** | No real money |
| D. Service desk (all 7 services: request → start → return → resubmit → approve → sign → issued; refusals) | `services` | **PASS** (rerun) | No Services Officer on production yet (CFG-003) |
| E. Complaint desk (ticket → reply → resolve → member sees; contact and home forms) | `engagement`, `site` | **PASS** (home form passed on rerun) | |
| F. Events (publish → member registers once) | `engagement` | **PARTIAL** | **Attendance / check-in NOT IMPLEMENTED** (FEAT-001) |
| G. CMS (draft hidden → publish → public page; post with photo and file; ticker) | `engagement`, `admin-updates`, `site` | **PASS** | |
| H. Staff approvals (committee proposed by SG → approved by President; limits change with the SG's password; signing) | `committee`, `access`, `services` | **PASS** | |
| I. Communications (consent → templates → audience → readiness → campaign) | `whatsapp` (13 tests) | **PASS against a stand-in provider** | Not verified against the live provider; no message sent; DEF-008 open |

## 9. Defects, repairs and retests

| ID | Severity | Summary | Status |
|---|---|---|---|
| DEF-001 | Medium | Public footer "Staff portal" → "not found" for visitors (every page, EN + UR) | **RETESTED PASS** (local + production) |
| DEF-002 | Medium | Service tiles disabled with no reason for a Viewer / applicant | **RETESTED PASS** |
| DEF-003 | Low | "Sign all (0)" disabled with no reason | **RETESTED PASS** |
| DEF-004 | Low | Intermittent hydration warning (React #418); also once on production | OPEN |
| DEF-005 | High (owner) | Optional document not uploaded counted as missing ("9 / 10", red ✗) | **RETESTED PASS**, live |
| DEF-005b | — | Committee could not approve M-0272: **demo file, by design** (owner confirmed) | WORKING AS DESIGNED |
| DEF-006 | Medium (owner) | Partner/director row: photo first; broken on phones | **RETESTED PASS**, live |
| DEF-008 | Medium (owner) | WhatsApp preview shows `[subject]`/`[details]` although filled | OPEN (separate session) |

Commits: `a43cdd5` (fixes + regression tests), `8668c7c` (acceptance tooling), on `db/schema-proposal`; released as
`8668c7c`. Root causes, files and tests: `MCCI-DEFECT-AND-REPAIR-REGISTER.md`.

## 10. Test execution statistics (6 Nov 2026)

| Suite | Executed | Passed | Failed | Flaky (passed on rerun) | Skipped | Notes |
|---|---|---|---|---|---|---|
| Typecheck · lint | 2 | 2 | 0 | — | — | final code |
| Unit (Vitest) | 372 | 372 | 0 | 2–3 | 0 | First run 370 (2 shell-script timeouts, file 79/79 alone); final gate run 1 had 1 unidentified failure, rerun 372/372 (TEST-001) |
| Database (pgTAP, fresh build of 61 migrations) | 1,235 assertions / 47 files | 1,235 | 0 | 0 | 0 | |
| E2E desktop (Playwright) | 456 run (793 listed) | 454 | 0 | **8** (7 timing/rate-limit; 1 test updated for DEF-001) | 337 | Skipped = phone-only audits and the opt-in crawl (run separately); 2 "did not run" ran in the rerun |
| E2E phone 360 px + app shell (orphan, overflow, tap-target, accessibility audits; phone flows) | 1,131 run (1,584 listed) | 1,131 | 0 | **1** (axe colour contrast on `/membership` at 360 px: scanned while sections were still fading in; passed alone) | 453 | Skipped = desktop-only tests |
| Acceptance crawl (17 personas) | 19 tests · 1,145 page tests · 5,162 elements | 19 · 1,112 · 3,981 | 0 · 0 · 0 | — | — | PARTIAL: 33 pages (DEF-004), 1,181 elements (outcome not exercised) |
| Production visitor crawl (after release) | 111 page tests · 43 links | 110 · 43 | 0 | — | — | 1 PARTIAL (DEF-004) |
| Production security probes | 23 API calls · headers · 14 ports | all refused as expected | — | — | — | INF-001, INF-003 recorded |
| Integration (gateway, auth, storage, realtime; local CLI stack) | 44 run (55 listed) | 38 | **6**, none an app defect | — | 11 (soak + self-host-only) | 3 tests predate the 2-step rule of 0310 (TEST-004); 1 fixture predates "bank confirmed" (TEST-003; production confirmed); 2 local-stack differences: S3 endpoint (production: 404, off) and per-address limit header (ENV-004/005). Rerun after a 5-minute pause: same 4, so consistent |

Skipped tests are not counted as passed; a test that passed only on a rerun is counted as **flaky**. WhatsApp and AI
reading ran against local stand-ins (`fake-iqpigeon`, `fake-openai`), **not** the live services. Two regression runs
of the morning (run 1, run 2) are **not counted**: run 1 was corrupted by the tester's own development server
(ENV-002), and run 2 exhausted the PC's memory and crashed Docker (ENV-003).

## 11. President's review instructions (7 November 2026)

**Where:** https://app.mcci.aderalabs.tech (release `8668c7c`). Staff sign in at `/staff/login`, which is not linked
from the public site. Members sign in at `/login`.

**Before the meeting (owner, about 15 minutes):**
1. Sign in once with each demo staff account (`demo.*@demo.mcci.test`, passwords from your terminal of 4 Nov) and set
   up its authenticator code. Without this, the demo staff accounts cannot open the staff screens.
2. Do **not** use a demo file to show an approval: demo files are never approved (your rule R2, confirmed 6 Nov).
   Use M-0272 to show return/decline, and one real test applicant agreed with MCCI to show approval and payment.

**Suggested walkthrough (about 45 minutes):**

| # | As | Do | You should see |
|---|---|---|---|
| 1 | Visitor (phone) | Open the site; switch to اردو; open Membership, Verify, Directory | Bilingual pages, right-to-left in Urdu, no sideways scrolling; demo members not listed; no "Staff portal" link |
| 2 | Visitor | Verify → type a made-up code | "Not found", nothing else revealed |
| 3 | Applicant (`demo.applicant`) | Portal → My Membership → M-0272 → Track | The tracker and full history |
| 4 | Membership Officer (`demo.membership.officer`) | Membership Pipeline → M-0272 | Documents **9 / 9**; the tax return marked "optional, not needed to proceed"; documents open watermarked with the viewer's name, no download |
| 5 | Committee Convener (`demo.committee.convener`) | Committee desk → M-0272 → hover Approve | "A demo (test) file is never approved". Return it to the officer with a note |
| 6 | Proposer / Seconder (`demo.proposer.corporate`, `demo.seconder.corporate`) | Portal → Endorsement requests | The requests they signed, with reference and date |
| 7 | Accounts Officer (`demo.accounts`) | Payments → receipts; Accounts → statement for "This year" | Receipts to verify; P&L and Trial Balance from verified entries only |
| 8 | President (`demo.president`) | Dashboard; Approvals & Signing; Committee → committee assignment | Sees every area; approves the committee, signs service letters and approves change declarations; changes nothing else |
| 9 | IT Convener (`demo.it.convener`) | Audit trail → export; Members register → export | The only designation that exports; each export appears in the audit trail |
| 10 | Any staff | Open a page outside your limits (e.g. Accounts as the Committee Convener) | "This screen is outside your limits"; nothing shown |
| 11 | Secretary General | Staff & Audit → limits table | The matrix of §7; any change asks for the SG's own password |
| 12 | Applicant on a phone | Application → Particulars → Add partner / director | Fields first, then Photo · Card · remove; no sideways scrolling |

**For the President to confirm (§16):** screens and wording (EN + UR); the designation limits in §7; the decisions in
§12.

## 12. Outstanding limitations and decisions

| # | Item | Who | Severity |
|---|---|---|---|
| 1 | Firewall: close 3306 and 3001 to the internet on the shared server (INF-001) | Owner (+ other sites' owners) | **Critical** |
| 2 | Scheduled + off-site backups; restore drill before go-live (INF-002) | Owner / MCCI | High |
| 3 | Create the Vice President and Assistant Secretary designations with their limits (CFG-001) | MCCI / SG | High |
| 4 | Demo staff enrol 2-step sign-in before the review (CFG-002) | Owner | High (for 7 Nov) |
| 5 | Who processes service requests: no Services Officer on production (CFG-003) | MCCI | Medium |
| 6 | Remove test records before real members are invited (CFG-004) | Owner | Medium |
| 7 | Event attendance: build it, or accept it as a limitation (FEAT-001) | MCCI | Medium |
| 8 | WhatsApp preview placeholders (DEF-008), hydration warning (DEF-004), 4 outdated integration tests (TEST-003/004) | Separate session | Medium / Low |
| 9 | Content-Security-Policy header (INF-003) | Next release | Medium |
| 10 | System email from an MCCI domain (INF-004) | MCCI | Medium |
| 11 | Domain `themcci.com.pk`, registrar ownership, `mcci.org.pk` handover | MCCI | Medium |

## 13. External dependencies

MCCI: domain registration and registrar access; DNS of `mcci.org.pk` (third party); sender email domain; real President /
Convener / IT Convener accounts; bank account details for vouchers; the decisions above. Providers: IQPigeon (WhatsApp)
live checks; OpenAI key on the server for document reading.

## 14. Backup and rollback

- Backup before the release: `mcci-20261106T082205Z` (encrypted; base backup + WAL, logical dump, storage, config,
  runtime env; checksums verified). 40 sets in `/var/lib/mcci-selfhost/backups`; all on the same server (INF-002).
- Roll back the app: `scripts/deploy/release.sh --rollback` (to `cc3e5c9`; `1c9a29f` also kept). No database step is
  needed: today's release changed no schema.
- Database restore: `restore-drill.sh` on a set (docs/20); quarterly drill recommended.

## 15. Domain migration readiness

Not ready to switch, because MCCI must act first; the application side is ready. `themcci.com.pk` does not resolve yet.
**Before the first real certificate is printed, set `VERIFY_BASE_URL` to the final domain** (no valid QR exists yet).
Keep MX/SPF/DKIM of `mcci.org.pk` untouched; use a path-preserving 302/307 redirect once control is transferred. Full
report: `MCCI-DOMAIN-MIGRATION-READINESS.md`.

## 16. Acceptance and sign-off

| Gate | Result |
|---|---|
| 1 Discovery: modules, routes, elements, roles inventoried | **PASS**: 22 modules, 88 routes, 25 APIs, 173 actions, 5,162 elements, 12 designations + 3 not configured |
| 2 Browser acceptance: every discoverable feature has a result | **PASS**: 1,145 local + 111 production page tests; 5,162 element results (no FAIL; 1,181 PARTIAL stated) |
| 3 Role acceptance: every configured designation tested on its own | **PASS**: 12 / 12; 0 mismatches. Vice President / Assistant Secretary: NOT CONFIGURED |
| 4 Workflow acceptance | **PASS with limitations**: 8 of 9 workflows pass; F partial (attendance not built); I verified against a stand-in only |
| 5 Repair and regression | **PASS**: 5 defects fixed, retested and released; 2 open (low/medium); 4 outdated integration tests to update |
| 6 Production safety | **PASS**: tests read-only on production; one authorised release after a verified backup; no data, credential, DNS or permission change |
| 7 Presidential handover | **PASS**: reports, limitations, checklist ready; demo staff 2-step enrolment is the owner's step |

| | Name | Signature | Date |
|---|---|---|---|
| Reviewed for MCCI (President) | | | |
| Secretary General | | | |
| Delivered by (project owner) | | | |
