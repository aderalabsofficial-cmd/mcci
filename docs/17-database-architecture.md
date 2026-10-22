# 17 · Database architecture (self-hosted Supabase, PostgreSQL 17)

**Status: proposed for review — 23 Oct 2026. Nothing has been applied to any real database.**
Migrations: `supabase/migrations/20261023000100…000260_*.sql`. Tests: `supabase/tests/database/*.test.sql` (pgTAP).
This document and the migrations replace `docs/sql/0001_init.sql` and `0002_rls.sql`, which are kept only as history.

---

## 1. Engineering decisions applied (approved 22 Oct 2026, provisional)

| # | Decision | How it is applied |
|---|---|---|
| 1 | PostgreSQL 17 everywhere | `supabase/config.toml` `major_version = 17`. Verified on the exact images (§2). |
| 2 | Publishable / secret API keys, secret never in a client | Compatibility verified statically (§2). The env-var rename in `lib/supabase/*` and `.env.example` is a separate app change, not in this batch. |
| 3 | Hybrid rate limiting | Redis for short-lived, high-volume limits when available (app layer, later). PostgreSQL: `private.rate_limits` + `api.rate_limit_take()` (service role only) as the durable store and the fallback; OTP attempts and the AI quota are enforced inside the database. |
| 4 | Sensitive state changes through narrow database functions | `api.*` functions: `SECURITY DEFINER`, `search_path = ''`, permission checked inside, row lock + state check, `private.set_reason()` for the audit, `EXECUTE` granted to `authenticated` only. Clients have **no** UPDATE on stage / status / money / review / number columns. First two: `api.app_create`, `api.doc_review`; the rest arrive with their milestones. |
| 5 | pgTAP for RLS and database security | 10 test files, 276 assertions, one or more negative tests for every finding (§6). Each file owns its transaction (`begin; … rollback;`) and installs `pgtap` in `extensions`, as `supabase test db` requires. |
| 6 | No annual reset of identifiers | The counters are defined by CLAUDE.md §6: application `MCCI-2026-M-0231` (`app_seq`), service request `MCCI-2026-10482` (`svc_seq`), voucher `PV-2026-0001` (`pv_seq`), membership number `MCCI-C-1134` / `MCCI-A-2205` (`member_no_c/_a`), plus `ticket_seq`. No spec asks for a yearly reset, so none resets. The year segment is the Asia/Karachi year of creation and is informational; the counter alone is unique, so the full reference is unique. `lpad` never truncates (the draft's `lpad(…, 4)` turned 10000 into 1000). |

## 2. Verification against the selected stack

| Check | Result | Evidence |
|---|---|---|
| Self-hosted image | `supabase/postgres:17.6.1.136` (upstream `docker/docker-compose.yml`, read 22 Oct 2026; self-hosted default moved to Postgres 17 in release `v1.26.07`, 9 Jul 2026) | `select version()` → PostgreSQL 17.6 |
| CLI local image | Supabase CLI 2.121 uses `supabase/postgres:17.11.0.004` for `major_version = 17` | image string in the CLI binary; `select version()` → PostgreSQL 17.11 |
| Extensions | `pgcrypto 1.3`, `citext 1.6`, `pg_trgm 1.6`, `pg_cron 1.6.4`, `pg_net 0.20.3`, `pgtap 1.3.3`, `supabase_vault 0.3.1`; `pg_cron` and `pg_net` preloaded | `pg_available_extensions`, `shared_preload_libraries` |
| Roles / schemas | `anon`, `authenticated`, `service_role`, `authenticator`, `supabase_*`; schemas `auth`, `storage`, `extensions`, `vault` | catalog queries |
| Default privileges | Upstream grants **ALL** on new `public` tables and **EXECUTE** on new functions to `anon`/`authenticated`. Migration 0100 revokes these; every grant is explicit. | `pg_default_acl` |
| Migration compatibility | All 17 migrations (0100–0260) + seed apply cleanly on **both** images; all 276 assertions in 10 files pass on both; every test file leaves no rows behind after its own rollback | `scripts/db/dry-run.sh <image>` (each run inside one outer transaction that is rolled back, in a throwaway container; the file's own transaction runs as a savepoint, followed by a row-count leak check) |
| API keys | `@supabase/supabase-js` 2.118 recognises `sb_publishable_…` / `sb_secret_…` (`isNewApiKey`), sends them as `apikey`, never as a Bearer token. Self-hosted `.env` has `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `JWT_KEYS`/`JWT_JWKS` (ES256). CLI 2.121 issues both formats. | SDK source, upstream `.env.example`, CLI binary |
| Local CLI stack | `supabase test db` on the running local stack (Postgres 17.11.0.004, real Auth schema, `storage-api` v1.82.1 tables and `storage.protect_delete` trigger): Files = 9, Tests = 259, PASS; afterwards the database held only the seed rows (counters advanced, gaps only). This run predates 0260 / 090: **0260 is not applied to the local stack yet** (needs approval; `supabase migration up`, no reset) | `pnpm db:test` log, 23 Oct 2026 |
| Realtime internals | The local Realtime's `realtime.apply_rls` builds change payloads only from columns the subscriber's role may SELECT (`has_column_privilege`), runs the subscriber's RLS check for INSERT/UPDATE, and sends DELETE events to **every** subscriber with `old_record` reduced to the primary key (not RLS-checked). Design in §4a. | function source on the local stack, read-only |
| **Not yet verified** | The self-hosted stack itself (17.6.1.136); Auth sign-up through the Auth API (A1–A12, §11); uploads/deletes through the Storage HTTP API (S1–S12, §11); REST exposure (`private` hidden, `api` reachable); publishable/secret keys at runtime and gateway key enforcement (G1–G8, §3); Realtime subscriptions under RLS (`pnpm test:integration`, §4a, written but not run) — check **T-V3** | — |

Storage: in the bare image the `storage` schema is empty until the Storage service boots, so the dry run uses a clearly
marked stub of `storage.buckets` / `storage.objects` / `storage.foldername()`. `auth.jwt()` likewise arrives with the
Auth service; the SQL relies only on `auth.uid()` (present in both).

## 3. Deployment boundary

```
Browser / Android WebView ─HTTPS─▶ TLS proxy ─▶ Next.js server ─▶ gateway (Envoy :8000) ─▶ Auth · REST · Realtime · Storage
   publishable key + own session only            │                                              │
                                                 │ Server Components / Actions: user's RLS client → api.* functions
                                                 │ Trusted handlers only (secret key): /api/cron/*, /api/pdf/*, /api/verify/*,
                                                 │   import commit, email/push dispatch
                                                 ▼
                                        PostgreSQL 17 (Docker network only) ── pg_cron → pg_net → /api/cron/* (Vault secret)
Studio, Postgres port, pooler, MinIO console: admin network / VPN only. Backups: off-site (§10).
```

| # | Rule | Enforced by |
|---|---|---|
| B1 | Clients hold only the publishable key and their own session | ESLint import ban + `server-only` on `lib/supabase/admin.ts` (exist); build grep (T-B1) |
| B2 | Server reads use the user's RLS client; the secret key only in the trusted handlers listed | code review + import allow-list (T-B2) |
| B3 | State changes only through `api.*` or trusted handlers; no client privilege on state columns | column grants + 001 tests (no table-wide INSERT/UPDATE) |
| B4 | REST exposes `public` and `api` only; `private` never; `graphql_public` removed | `config.toml [api] schemas`; self-hosted `PGRST_DB_SCHEMAS=public,api` |
| B5 | Admin services never public | deployment checklist §10 |
| B6 | Cron handlers idempotent, protected by `CRON_SECRET` (Vault on the DB side) | handler tests (later milestone) |
| B7 | Audit by database triggers in the same transaction; "why" via `app.reason` | 0110, 0240; 001/030 tests |

**Gateway key enforcement.** Grants and RLS are the security boundary; the gateway key check is a second layer.

- **Local CLI stack (Kong), verified read-only:** no `key-auth` plugin on any route. The request transformer maps
  the exact local secret key to the `service_role` JWT and the exact publishable key to the anon JWT; any other
  value passes through, and PostgREST then treats the call as **anon**. A missing or wrong key is therefore not
  rejected locally — by design of the CLI, not a production setting. The local ports (gateway 54321, Postgres
  54322, Studio 54323) listen on 0.0.0.0 and `/pg/` (postgres-meta) answers without a key: firewall ports
  54321–54329 or stop the stack on untrusted networks.
- **Self-hosted (Envoy), from the pinned upstream configuration, not yet run:** missing or unknown key → 401 on
  REST, Auth, GraphQL and Realtime; the OpenAPI root `/rest/v1/` and `/pg/` are service-role only; Realtime tenant
  paths are denied. `/storage/v1/` and `/functions/v1/` have no gateway key check (Storage validates the JWT
  itself). There is no Origin rule, so keeping the secret key out of browsers stays an application duty (B1).
- **Decision:** use the pinned upstream Envoy configuration unchanged; block `/pg/`, Studio and `/rest-admin/` at
  the TLS proxy outside the admin network. No gateway configuration is changed in this repository.
- **Runtime tests for T-V3 (self-hosted stack):**

| # | Request | Expected |
|---|---|---|
| G1 | REST call with no key | 401 |
| G2 | REST call with an unknown `sb_publishable_…` key | 401 |
| G3 | publishable key on `public_settings` | 200 |
| G4 | publishable key on the OpenAPI root `/rest/v1/` | denied |
| G5 | `/pg/` with the publishable key; `/pg/` from outside the admin network | denied; unreachable |
| G6 | `/realtime/v1/api/tenants` | denied |
| G7 | secret key | reaches service-role functions only from trusted handlers (T-B2) |
| G8 | Studio | basic auth required |

## 4. Tenancy, roles, states

- **Tenant = company.** `private.my_company_ids()` (active memberships). Company role levels come from the
  `docs/06` matrix in `private.company_role_level()` (areas mship, svc, docs, pay, events, profile).
- **Staff:** `private.staff_level(module)` = override or designation default, **only while `staff.active`**.
- **Endorsers:** read their own endorsement rows; never applications, documents or files directly (an
  `api.endorsement_view` in M4 returns the summary and form — see decision D-M18).
- **Public:** `public_directory`, `public_settings`, published events/posts, reference tables; verification and
  tracking only through trusted handlers.
- **States** are exactly `docs/03` / `docs/04`; enums in 0100. Values that wait for a decision are not added yet
  (service `Draft` D-M10, QR `Replaced` D-M4). Voucher `Refund due` / `Refunded` added from `docs/16` D3.

## 4a. Realtime (postgres_changes)

Migration 0260 adds exactly the five tables behind `docs/01` §Live updates to the `supabase_realtime` publication:

| Table | Live update it serves |
|---|---|
| `notifications` | bell badge and list (`docs/07`; badge within 3 s, `docs/04` acceptance test 1) |
| `applications` | application status on the member dashboard and staff queues |
| `endorsements` | endorsement requests and decisions (`docs/04` steps 2 and 5) |
| `service_requests` | "My requests … live status" (`screens.md`) |
| `payment_vouchers` | payment status (`docs/16` A6) |

**How Realtime applies security (verified, §2):** each change is checked per subscriber with that subscriber's
JWT. INSERT/UPDATE events are delivered only when the row passes the subscriber's RLS SELECT policy, and the
payload holds only the columns the subscriber's role may SELECT. DELETE events are **not** RLS-checked: they reach
every subscriber of the table with the primary key only. A client filter (`company_id=eq.…`) can only narrow,
never widen, what RLS allows.

**Rules that follow (enforced by 0260 and tested in 090):**

1. Publish only tables with RLS enabled, no anon SELECT and **no client DELETE** (deletes would leak row ids to
   every subscriber). Rows on published tables are removed only by trusted handlers, if ever.
2. Columns a client must not see are hidden by **column grants**, never only by the UI. Realtime honours them.
3. `endorsements.ip` and `endorsements.user_agent` (signing evidence) are no longer readable by clients: 0260
   replaces the table-wide SELECT with a column grant of every other column. Neither REST nor Realtime returns
   them; staff and the endorser see evidence only through an `api.*` function (M4). A column added to
   `endorsements` later is unreadable until it is granted on purpose (090 pins the exact list).
4. Sensitive or internal tables are never published (credentials, personal data, logs, `private`, `auth`,
   `storage`). `realtime.messages` keeps RLS with no policy, so private broadcast channels stay closed.
5. Not published now: `temp_memberships`, `documents`, `members` (`docs/05` M7 "updates live"). Those screens can
   refresh from the `notifications` row the same flow writes; publishing them is decided when M7 is built.

**Runtime tests** (`tests/integration/realtime.test.ts`, `pnpm test:integration`): synthetic `@test.local` users
created and removed through the Auth admin API, fresh ids per run, local stack only (loopback URL and
`sb_publishable_` / `sb_secret_` keys required; skipped unless `MCCI_IT_LOCAL=1`; keys never printed). Positive
cases must arrive within 3 s; negative cases must stay silent for 5 s.

| Case | Expected |
|---|---|
| Owner A, application of company A changes | received |
| Owner B and an anonymous client, same change | nothing |
| Membership Officer (mem ≥ 1), same change | received |
| Owner B subscribing with filter `company_id=eq.A` | nothing |
| personal notification for Owner A | Owner A only |
| company `pay` notification for A | Owner received; Services user (pay = 0) nothing |
| endorsement update | endorser and applicant receive it **without** `ip` / `user_agent`; Owner B nothing |
| endorser company, application change | nothing |
| new payment voucher for A | Owner received; Services user nothing |

Still to add before M4: a deactivated staff user receives nothing; unpublished tables produce no events; joining a
private broadcast channel is denied; what a DELETE event carries (expected: primary key only).

Run locally (after 0260 is applied; PowerShell, values read from `supabase status -o env`, never echoed):
`$env:MCCI_IT_LOCAL='1'`, `$env:MCCI_IT_SUPABASE_URL` = API_URL, `$env:MCCI_IT_PUBLISHABLE_KEY` = PUBLISHABLE_KEY,
`$env:MCCI_IT_SECRET_KEY` = SECRET_KEY, then `pnpm test:integration`.

## 5. Tables (canonical inventory)

| Migration | Tables / objects |
|---|---|
| 0100 | schemas `private`, `api`; enums; `private.pad4`, `private.pkt_year`; default privileges revoked |
| 0110 | `audit_log` (append-only), `private.audit_row()`, `private.set_reason()` |
| 0120 | `profiles` (no `is_staff`), `designations`, `role_permissions`, `staff`, `staff_permission_overrides`, `invitations`, `consents`, `device_tokens`, `account_deletion_requests`; auth triggers (profile creation, email sync) |
| 0130 | `companies`, `company_users` (last-Owner guard), `members`, `public_directory`; tenant helpers |
| 0140 | `private.settings`, `public_settings` view, `document_requirements`, `service_types`, `email_templates`; reference data (generated by `scripts/db/gen-reference-seed.mjs`) |
| 0150 | `applications`, `application_partners`, `application_documents`, `application_document_versions`, `application_form_snapshots`, `application_history` |
| 0160 | `endorsements`, `private.endorsement_otps` |
| 0170 | `meetings`, `committee_items` (key: application + meeting), member-number sequences, `private.next_member_no` |
| 0180 | `payment_vouchers` (money immutable), `payment_receipts` |
| 0190 | `documents` (QR), `temp_memberships`, `print_batches`, `print_items` (own id), `serial_spoilage`, `member_cards` |
| 0200 | `service_requests`, `service_documents`, `service_messages` |
| 0210 | `notifications` (area), `tickets` (`public_ref`), `ticket_messages`, `events`, `event_registrations` (ticket code, check-in), `posts` (Urdu columns), `opportunities`, `opportunity_replies`, `change_requests`, `reminders` |
| 0220 | `imports`, `email_log`, `push_log`, `job_runs`, `ai_extractions`, `ai_conversations`, `private.rate_limits`; `api.rate_limit_take`, `api.ai_extraction_begin` |
| 0230 | 7 storage buckets + `storage.objects` policies |
| 0240 | audit triggers on every business table (token hashes stripped; QR scan counter not audited) |
| 0250 | `api.app_create`, `api.doc_review` (reference pattern) |
| 0260 | `supabase_realtime` publication (5 tables, §4a); `endorsements` SELECT narrowed to column grants (no `ip`, `user_agent`) |

Storage paths: `{company_id}/{entity}/{entity_id}/{file}`; buckets `application-docs`, `form-snapshots`, `receipts`,
`certificates`, `service-docs`, `imports` (private) and `cms` (public). Clients never update or delete objects.

## 6. Security findings → control → negative tests

| ID | Affected object | Threat | Control (migration) | Negative tests (file · assertion) |
|---|---|---|---|---|
| F-01 (A1) | `applications` insert | create an application for another company | no INSERT grant; `api.app_create` checks company role ≥ 2 (0150, 0250) | 030 · NT-01 ×2, NT-02 ×3 |
| F-02 | `payment_vouchers` update | member lowers amount/lines, pays less | no client UPDATE; trigger makes amount, lines, reference immutable for everyone (0180) | 040 · NT-20 ×3, NT-21, F-02 ×3, staff direct update |
| F-03 (A2) | `members` select | any account lists all members | company/staff policy only; endorser search via api (0130) | 020 · NT-10, NT-11, anonymous denied |
| F-04 | `application_documents` | applicant approves own documents | status columns not granted; trigger forces `pending` and resets review on replacement; versions kept; decisions only `api.doc_review` (0150, 0250) | 030 · NT-05, NT-06 ×2, replacement reset, versions kept, version forging |
| F-05 | `applications` update | applicant edits class (fee), checklist, member_id, stage, company | column grants limited to form/photo/signature/stamp/declarations; draft/returned + mship ≥ 2 (0150) | 030 · NT-03 ×5, NT-04, Viewer, other company |
| F-06 (A6) | missing tables | features write to tables without RLS | all A6 tables created with RLS + grants (0120–0220) | 001 · NT-60 |
| F-07 | partners, service files | edits after submission/issue; view-only staff write | per-command policies tied to draft/returned or Submitted/Returned (0150, 0200) | 030 · NT-07 ×3, staff 0 rows; 060 · NT-30, NT-31 ×2, spoofing |
| F-08 | `private.staff_level` | deactivated staff keep override access | override applies only while `staff.active` (0120) | 010 · NT-50 ×2; 030 · deactivated cannot review |
| F-09 (A3, A4) | committee, meetings, print batches | view-only staff record decisions / edit batches | read-only grants; writes only via api (0170, 0190) | 050 · NT-40a ×3, NT-41a ×2 |
| F-10 (A5) | `FOR ALL` policies | write checks silently follow read checks | per-command policies with explicit WITH CHECK | 001 · NT-61 |
| F-11 | numbering | anyone burns member numbers; tokens truncate; UTC year | `next_member_no` private + revoked; sequences revoked; `pad4`; `pkt_year` (0100, 0170) | 001 · NT-45 ×3, T-F1, Karachi year |
| F-12 | `audit_log` | rows changed/deleted; audit skipped | triggers block UPDATE/DELETE/TRUNCATE; no API write grant; row triggers on every table (0110, 0240) | 001 · NT-42 ×5; 030 · who + why; 050 · scan noise |
| F-13 | `documents.code` | enumerable QR codes | 10 random chars, format check (0190) | 001 · T-Q1 ×2; 050 · legacy format rejected |
| F-14 | SECURITY DEFINER | search_path hijack | every definer function `set search_path = ''`, schema-qualified (all) | 001 · T-S1, private helpers closed |
| F-15 | `profiles` | self-promotion, email drift | `is_staff` removed; column grants; email synced from Auth (0120) | 010 · column removed, NT-08 ×2, NT-09, email sync |
| F-16 | `settings` | anonymous reads internal settings | `private.settings` + 4-key `public_settings`; server function for service role (0140) | 080 · NT-48 ×2, private closed, function restricted |
| F-17 | `invitations` | token hashes readable | column grants exclude `token_hash`; stripped from audit (0120, 0240) | 010 · NT-49 ×2 |
| F-18 | storage | cross-company file access, overwrites | 7 buckets, company-prefix policies, no client update/delete (0230) | 070 · NT-70…NT-76 (26 assertions) |
| F-19 | `notifications` | Viewer/Services read notices for other areas | company rows need area level ≥ 1 (0210) | 080 · NT-46 |
| F-20 | `company_users` | last Owner removed; users added directly | no client writes; last-Owner trigger (0130) | 020 · NT-51 ×2, NT-52 ×2 |
| F-21 | `endorsement_otps` | read hashes; brute force | private table, no grants; salt, resend time, attempts ≤ 5 (0160) | 001 · NT-26 ×2, attempt cap. Expiry/resend logic: test with `api.end_sign` (M4) |
| F-22 | AI | cost abuse; cross-tenant leakage | `api.ai_extraction_begin` 15/application/day; company RLS on results; private conversations (0220) | 080 · NT-36 ×3, NT-35, conversations private |
| F-23 | receipts | rejected receipts overwritten; one slip for two vouchers | receipt rows insert-only (via api in M6); `bank_ref` captured (0180) | 040 · F-23 ×3. Uniqueness waits for D-M9 |
| F-24 | Realtime publication, `endorsements` | live payloads leak rows or columns (endorser IP / user agent to the applicant); delete events reveal ids; anonymous subscriptions | 5 tables only, RLS on, no anon SELECT, no client DELETE; evidence columns not granted (0260) | 090 · exact table list, RLS, anon, DELETE, excluded tables, `ip`/`user_agent` ×4, column list, RLS unchanged ×3, `apply_rls` uses column privileges, `realtime.messages` closed; runtime: §4a |

Test totals per file (`plan(n)`): 001 = 26, 010 = 37, 020 = 24, 030 = 47, 040 = 22, 050 = 21, 060 = 20, 070 = 26, 080 = 36, 090 = 17 (total 276). Storage deletes: the real Storage service refuses every direct DELETE (`storage.protect_delete`); 070 asserts nothing changes and that no client DELETE/UPDATE policy exists, without bypassing the trigger.
Sequences are not transactional: tests never call `setval`, but inserts still advance counters (gaps only, local stack).

## 7. Authorization matrix

Clients have **SELECT** where their policy allows, and **column-scoped** writes only on: own profile (name, mobile,
language, preferences), application content while draft/returned, partners and document uploads while
draft/returned, service files and messages while Submitted/Returned, tickets, ticket messages, event registration,
trade posts/replies, change requests (Owner), notification read flag, consents, device tokens, deletion requests,
AI conversations. Everything else changes through `api.*` functions or trusted handlers. Per-table detail is in the
policies of each migration and is exercised by the tests in §6.

## 8. Migrations, seed, rollback, commands

- **Order:** 0100 → 0260 as in §5. Every table gets RLS and grants in the same migration that creates it.
- **Reference data** is inside 0140 (all environments). `supabase/seed.sql` is **local + CI only** (test personas,
  `tests` helper schema). The prototype demo world (`docs/13`) will be a separate staging-only file.
- **Rollback:** the CLI has no down-migrations → forward fixes only; destructive changes as expand → backfill →
  contract; verified backup + restore rehearsal before every production migration; enum values cannot be removed, so
  undecided values are not added.
- **Legacy members:** after the Excel import, move `member_no_c/_a` past the highest imported number (import step).

```bash
bash scripts/db/dry-run.sh
bash scripts/db/dry-run.sh supabase/postgres:17.11.0.004
```
After approval only (applies to the local stack): `pnpm db:start`, `pnpm db:reset`, `pnpm db:test`, `pnpm db:types`.
CI job `db-security` runs the dry run on both images.
Runtime integration tests (local stack only, env-gated, §4a): `pnpm test:integration` — never part of `pnpm test` or CI.

## 9. Settings

| Safe now (done) | Needs MCCI |
|---|---|
| password ≥ 10, email confirmation, secure password change, TOTP enabled, 10 MiB uploads, REST schemas `public, api`, Postgres 17 | fees, service fees, temporary-membership policy, endorsement limits, SLA basis, bank account, chamber details confirmation, app version keys (all seeded as defaults, editable in Settings) |

## 10. Self-hosting checklist (before staging)

Generate all secrets with the upstream scripts (the sample `.env` values are unsafe); store them in a secrets
manager; TLS proxy in front of the gateway; publish only 443; Studio/DB/pooler/MinIO on the admin network; production
SMTP + SPF/DKIM/DMARC; nightly dump + WAL archiving + storage-volume backup to a second location, encrypted, restore
tested quarterly; logs/analytics override or external log shipping; uptime check on `/api/health`; pin the
self-hosted release and upgrade staging first.

## 11. Engineering follow-ups (no MCCI input needed)

| Item | When |
|---|---|
| T-V3: run the migrations and `supabase test db` on the full self-hosted stack (real Storage, Auth new keys, Realtime), plus gateway tests G1–G8 (§3) | after approval |
| Apply 0260 to the local stack (`supabase migration up`, no reset) and run `pnpm test:integration` (§4a) | after approval |
| Remaining Realtime cases (deactivated staff, unpublished tables, private broadcast denied, DELETE payload) | before M4 |
| Auth API tests `tests/integration/auth.test.ts` (synthetic users): A1 sign-up creates the profile (language from metadata, no staff rights); A2 sign-in fails before email confirmation, works after (Mailpit); A3 password < 10 rejected; A4 email change needs secure double confirmation, `profiles.email` syncs after; A5 password change needs re-authentication; A6 TOTP enroll/challenge/verify reaches AAL2; A7 email one-time code incl. expiry; A8 anonymous sign-in rejected; A9 sign-out everywhere revokes refresh tokens; A10 sign-in and code requests rate-limited; A11 a user's JWT on REST returns only their own profile; A12 deleting an Auth user cascades to the profile | M1 |
| Storage API tests `tests/integration/storage.test.ts` (synthetic files): S1 upload to own draft path sets the owner; S2 another company's prefix denied; S3 upload after submission denied; S4 > 10 MiB or disallowed type rejected; S5 signed URL 600 s for the owner, fails after expiry, other company cannot create one; S6 private object without auth denied, `cms` public; S7 delete through the API denied, object stays; S8 overwrite (`x-upsert`) denied; S9 endorser cannot download applicant files; S10 receipt upload only for an Unpaid voucher; S11 anonymous cannot list private buckets; S12 trusted service-role handler writes form snapshots | M1–M2 |
| T-B1 client-bundle scan for `sb_secret_` and secret env names; CSP `connect-src` | with M1 auth |
| Rename env vars to publishable/secret keys in `lib/supabase/*`, `.env.example` | with M1 auth |
| Per-user read state for company-wide notifications (today only user rows can be marked read) | M8 |
| `api.*` functions per milestone (end_*, cmt_*, pay_*, temp_*, svc_*, invite_*) with their tests | M1–M7 |
| pg_cron schedules + Vault secret | M4 / M6 |
| Remove the dry-run storage stub need by running CI against the CLI stack once approved | after approval |

## 12. Decisions required from MCCI (unresolved — defaults in brackets, nothing decided by engineering)

| ID | Decision | Default until decided |
|---|---|---|
| D-M1 | Hosting and backup location (Pakistan preferred), provider, server administrator | none for production |
| D-M2 | Must membership numbers be gapless? | sequences (a failed transaction can skip a number) |
| D-M3 | Backup RPO/RTO, backup retention, who holds restore keys | nightly + WAL, 30 days (proposal) |
| D-M4 | Duplicate certificate: old QR `Replaced` or `Revoked`; fee | not built |
| D-M5 | Certificate serial format and security printer | `docs/14` default pattern |
| D-M6 | Signing delegation when the President is away | `docs/14` default |
| D-M7 | CNIC protection at rest; retention of documents, audit log (contains CNIC changes) and deleted accounts | plaintext + disk encryption; documents active + 7 years |
| D-M8 | One company per NTN? | NTN indexed, not unique |
| D-M9 | Reject reuse of a bank transaction reference? | captured, not unique |
| D-M10 | Service requests: Draft state? Does the 24-hour SLA start at submit or after the fee is verified? Business hours + holidays? | no Draft; from submit; business hours per `docs/14` |
| D-M11 | Who in a member company sees company-wide notifications | by area level in the `docs/06` matrix |
| D-M12 | Event registration per company or per person | per company |
| D-M13 | Consent and data-processing terms for sending applicant documents to OpenAI | AI filling off in production until approved |
| D-M14 | Refund approval level and evidence | not built |
| D-M15 | Urdu font licence | original font, unmodified |
| D-M16 | Legal acceptance of digitally attested C.O. / documents with QR; handling of paper originals | not decided |
| D-M17 | Are members' trade posts moderated before publishing? | yes: new posts are `Pending` |
| D-M18 | Endorsers see the official form, which contains the representative's CNIC and mobile (`docs/04`), but `docs/09` says endorsers never see CNICs or mobiles. Which wins? | endorsers get no direct access; a redacted view is proposed |
| D-M19 | QR verification codes change from `MCCI-QR-T7K2-0231` to `MCCI-QR-XXXXX-XXXXX` (security). Acceptable on printed certificates? | new format |
| D-M20 | Real starting numbers for applications, vouchers, service requests and memberships (spec values are samples) | spec samples (231, 1, 10482, 1134/2205) |
| D-M21 | Urdu labels for document requirements; email template wording (EN/UR) | English labels only; templates not seeded |
