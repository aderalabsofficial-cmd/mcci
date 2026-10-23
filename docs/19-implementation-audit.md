# 19 · Implementation audit — prototype vs. application vs. database (23 Oct 2026)

Branch `db/schema-proposal` at `7121eff`. Method: inspection of the code, not of rendered screens. Every statement below
points at evidence that can be re-checked (file paths, counts). Screen and action lists come from
`docs/catalogue/screens.md` (59 screens) and `docs/catalogue/actions.md` (211 actions).

## 1. Summary

| Layer | What exists | Status |
|---|---|---|
| **Prototype** `reference/prototype` (v10) | All 59 screens, 211 actions, EN/UR, complete design | **UI only / mock data.** One JSON document in the visitor's browser (`localStorage`, `assets/js/core.js` `M.load`/`M.save`, seeded by `M.seed`); "live updates" are a `BroadcastChannel` between tabs of the same browser. No request ever leaves the browser (no `fetch`, XHR, WebSocket or form post anywhere). Permissions (`assets/js/access.js`) are client-side only. |
| **Application** (Next.js 15, `app/`) | Milestone **M0** only: layouts, design tokens, EN/UR + RTL, theme, compact mobile shells, nav registry (`lib/nav/registry.ts`: `BUILT = {'M0'}`) | 3 routes exist (`/`, `/portal`, `/admin`), each a shell page of 31–45 lines with an empty body. **0 of 156 `Build` actions implemented**: no server action, no route handler, no login, no session use (Supabase clients exist in `lib/supabase/*` but are unused by any page). |
| **Database** (`supabase/migrations`, 17 files) | 55 tables, 2 views (`public_directory`, `public_settings`), RLS on every table, column grants, 32 private helper functions, storage buckets + object policies, audit triggers, Realtime publication; pgTAP 276/276 | **Implemented and tested, but connected to no UI.** Only 5 server functions exist: `api.app_create`, `api.doc_review`, `api.ai_extraction_begin`, `api.rate_limit_take`, `api.settings_for_server`. Every other state change (submit, endorse, committee decision, voucher, temp membership, printing, services, tickets, …) has its tables and policies but **no transition function yet** (`docs/17` §7: "everything else changes through `api.*` functions or trusted handlers" — to be written per milestone). |
| **Self-hosted Supabase** (staging VPS) | 9 services, Auth/Storage/Realtime/gateway verified (`docs/18`) | Working; no application uses it yet. Production SMTP missing (sign-up/email flows return 500). |
| **AI / OpenAI** | Tables `ai_extractions`, `ai_conversations`, rate limits, `api.ai_extraction_begin` (daily limit per application) | **Not implemented**: no OpenAI client, no route, no prompt/schema, no UI. `OPENAI_API_KEY` is only a name in `.env.example`. Policy: AI filling off in production until MCCI approves consent terms (D-M13). |

**Consequence:** no member or admin feature is live today. Making the portals work end to end is the remaining
milestone plan M1–M9 (`docs/11-milestones.md`), not a matter of connecting existing screens.

## 2. Route matrix (59 screens)

App status uses the requested scale: **W** implemented and working · **B** implemented but disconnected/broken ·
**P** partially implemented · **U** UI only / mock data · **N** not implemented. Prototype status is **U** for every
screen (mock data in the browser) — or static content where noted. "DB" = what the database already provides.

### Public website (13)

| Screen | Route | App | Prototype | DB support | Milestone |
|---|---|---|---|---|---|
| Home | `/` | **P** — header, footer, empty hero frame; none of the prototype sections | U | `public_settings`, `posts`, `events`, `public_directory` (counters) | M2 |
| About | `/about` | N | U (static content) | — (content) | M2 |
| Membership | `/membership` | N | U | `document_requirements`, settings (fees) | M2 |
| Services | `/services` | N | U | `service_types` | M2 |
| Service detail | `/service` | N | U | `service_types`, `document_requirements` | M2 |
| Directory | `/directory` | N | U | `public_directory` view | M2 |
| Verify | `/verify` | N | U | `documents` (QR); needs a trusted handler | M2/M6 |
| Track | `/track` | N | U | `applications`, `service_requests`; needs a trusted handler | M2 |
| Live board | `/live` | N | U | anonymised view not built | M2 |
| News & Events | `/news` | N | U | `posts`, `events` | M2/M8 |
| Resources | `/resources` | N | U (static files) | Storage `cms` bucket | M2 |
| Contact | `/contact` | N | U | `tickets` (+ rate limit) | M2/M8 |
| Login | `/login` | N | U (no real auth) | Supabase Auth verified on staging (A1–A12) | **M1** |

### Member portal (17)

| Screen | Route | App | Prototype | DB support | Milestone |
|---|---|---|---|---|---|
| Home | `/portal` | **P** — shell + empty "What to do now" frame | U | all member tables via RLS | M1+ |
| My Membership | `/portal/membership` | N | U | `members`, `temp_memberships`, `print_items`, `documents` | M6 |
| Application form (6-step wizard) | `/portal/join` | N | U | `applications`, partners, documents, versions, snapshots, `api.app_create`; uploads `application-docs` | M3 |
| Track | `/portal/mtrack` | N | U | `application_history`, `notifications` | M3/M5 |
| Official form (PDF) | `/portal/form` | N | U | `application_form_snapshots`, `form-snapshots` bucket; PDF renderer not built | M3 |
| Request a Service | `/portal/apply` | N | U | `service_requests`, `service_documents`, `service-docs` bucket | M7 |
| My requests | `/portal/applications` | N | U | `service_requests` (Realtime published) | M7 |
| Request detail | `/portal/application` | N | U | `service_requests`, `service_messages`, `service_documents` | M7 |
| My Documents | `/portal/documents` | N | U | `documents`, `certificates` bucket | M6 |
| Payments | `/portal/payments` | N | U | `payment_vouchers`, `payment_receipts`, `receipts` bucket | M6 |
| Help & Support | `/portal/support` | N | U | `tickets`, `ticket_messages` | M8 |
| Ask AI | `/portal/assistant` | N | U (scripted answers) | `ai_conversations`; no AI backend | M8 (after D-M13) |
| Messages | `/portal/notifications` | N | U | `notifications` (Realtime published), `profiles.prefs` | M8 |
| Events & Trade | `/portal/events` | N | U | `events`, `event_registrations` | M8 |
| Trade opportunities | `/portal/opportunities` | N | U | `opportunities`, `opportunity_replies` | M8 |
| Company Profile | `/portal/profile` | N | U | `companies`, `company_users`, `change_requests`, `invitations` | M1/M8 |
| Endorsement requests | `/portal/endorse` | N | U | `endorsements`, `private.endorsement_otps` (Realtime published) | M4 |

### Admin panel (29)

| Screen | Route | App | Prototype | DB support | Milestone |
|---|---|---|---|---|---|
| Dashboard | `/admin` | **P** — shell + empty frame | U | read access via staff levels | M5+ |
| Membership Pipeline | `/admin/requests` | N | U | `applications` | M5 |
| Application Review | `/admin/mreview` | N | U | `applications`, documents, `api.doc_review` (accept/reject a document) | M5 |
| Committee Desk | `/admin/committee` | N | U | `meetings`, `committee_items`; member-number sequences | M5 |
| Temporary Memberships | `/admin/temp` | N | U | `temp_memberships` | M6 |
| Printing & Receiving | `/admin/certs` | N | U | `print_batches`, `print_items`, `certificates` bucket | M6 |
| Serial Register | `/admin/serials` | N | U | `print_items`, `serial_spoilage` | M6 |
| Members Register | `/admin/members` | N | U | `members`, `change_requests` | M8 |
| Member Record | `/admin/member` | N | U | `members`, `companies`, related tables | M8 |
| Data Import | `/admin/import` | N | U | `imports`, `imports` bucket | M8 |
| Service Requests | `/admin/applications` | N | U | `service_requests` | M7 |
| Review Desk | `/admin/review` | N | U | `service_requests`, `ai_extractions` | M7 |
| SLA Monitor | `/admin/sla` | N | U | `service_requests.sla_due_at`, settings | M7 |
| Signing | `/admin/approvals` | N | U | `documents` (QR), signing handler not built | M7 |
| Documents & QR | `/admin/documents` | N | U | `documents` | M6 |
| Payments | `/admin/payments` | N | U | `payment_vouchers`, `payment_receipts` | M6 |
| Vouchers & Receipts | `/admin/psid` | N | U | same (voucher + receipt only; bank API is phase 2) | M6 |
| Events | `/admin/events` | N | U | `events` | M8 |
| Meetings & Minutes | `/admin/meetings` | N | U | `meetings`, `committee_items` | M5/M8 |
| Complaint Desk | `/admin/complaints` | N | U | `tickets`, `ticket_messages` | M8 |
| Website Content | `/admin/content` | N | U | `posts`, `cms` bucket | M8 |
| Notification Center | `/admin/notify` | N | U | `email_templates`, `email_log`, `push_log` | M8 |
| Reports | `/admin/reports` | N | U | read access; report builder not built | M9 |
| AI Insights | `/admin/ai` | N | U | `ai_extractions` | M9 |
| Staff & Roles | `/admin/staff` | N | U | `staff`, `designations`, `role_permissions`, overrides, `invitations` | M1 |
| Audit Trail | `/admin/audit` | N | U | `audit_log` (append-only, triggers on every table) | M9 |
| Services Setup | `/admin/services` | N | U | `service_types`, `document_requirements` | M7 |
| Integrations | `/admin/integrations` | N | U | — (phase 2 items are shown as dependencies only) | M9 |
| Settings | `/admin/settings` | N | U | `private.settings`, `api.settings_for_server` | M9 |

**Totals — application:** W 0 · B 0 · P 3 (shells) · U 0 · N 56. **Prototype:** U 59.

## 3. Workflow matrix

| Workflow | Prototype | App | Database | What is missing |
|---|---|---|---|---|
| Sign-in, sessions, roles | simulated (persona switcher) | none | Auth verified; `staff`, `role_permissions`, `company_users`, `private.staff_level()`/`company_level()` | login UI, session in middleware, `requirePermission` server helper, invitations, staff TOTP |
| Membership application (wizard → submit) | simulated | none | tables, `api.app_create`, upload policies, history | wizard UI, autosave, submit transition, form PDF, snapshots |
| Document upload + officer review | simulated | none | buckets + policies (S1–S12 pass), `api.doc_review` | upload UI, review screens, return/verify/reject transitions |
| Proposer / seconder endorsement | simulated | none | `endorsements`, OTP table | request/sign/decline transitions, OTP email (needs SMTP), jobs |
| Committee decision → member no. → voucher | simulated | none | tables, sequences | `cmt.decide` transition, voucher creation |
| Payment: voucher, receipt upload, verification | simulated | none | tables, `receipts` policy (Unpaid/Rejected only) | transitions, Accounts screens |
| Temporary membership → printing → permanent | simulated | none | tables | issue/extend/revoke/convert transitions, batches, scans |
| Service requests (7 services, SLA, signing, QR) | simulated | none | tables, buckets | all transitions, signing, QR documents, verify handler |
| Notifications (portal + email) | simulated | none | `notifications` (Realtime verified, 35-min soak), templates | writers in each transition; email needs SMTP |
| Tickets, events, trade posts, CMS | simulated | none | tables + policies | UI + transitions |
| Audit | simulated log | none | triggers write `audit_log` for every row change | screen + export |
| AI document reading / Ask MCCI AI | simulated | none | `ai_extractions`, `ai_conversations`, daily limit function | OpenAI client (server-only), schemas, UI; D-M13 consent |

## 4. Reusable as is

- Database: every table, policy, grant, helper and the 5 `api.*` functions (pgTAP-tested); storage buckets/policies
  (S1–S12 verified on staging); Realtime publication (verified incl. soak).
- App: shells, sidebar/top bar/bottom tabs/More sheet, page tabs, `WhatNowCard`, bilingual `Bi`, theme and language
  toggles, design tokens (`app/globals.css`), Urdu font, `lib/nav/registry.ts` (all 59 routes with EN/UR labels),
  Supabase clients (`server.ts`, `client.ts`, `admin.ts`) with `ClientDatabase` types, middleware session refresh.
- Tests: Playwright projects + orphan/axe/overflow/tap-target audits; integration harness (`tests/integration/*`).
- Prototype: the visual and behavioural specification for every screen, plus `assets/js/actions.js` metadata (planned
  endpoint, tables, roles per action) that maps one to one onto `docs/catalogue/actions.md`.
