# 17 · Database architecture (self-hosted Supabase, PostgreSQL 17)

**Status: proposed for review — 23 Oct 2026. Nothing has been applied to any real database.**
_Date note (added 22 Oct 2026): entries dated "23 Oct 2026" (this status line and the first §2 "Local CLI stack"
row) were written on 22 Oct 2026 — the commits that added them (`52ccad6`, `d30fa93`) and the logs they cite are
timestamped 22 Oct 2026, +05:00. They are left as written; newer entries carry the actual date. The `20261023…`
migration prefix is an identifier, not an execution date._
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
| Self-hosted release pin | `supabase/supabase` **`self-hosted/v0.8.3`** (annotated tag `2a678bd9…` → commit `bc27d2661edd09a5d0b8d76ce33da6d4071a756e`, 16 Oct 2026). Its `docker/` folder is vendored verbatim in `deploy/selfhost/upstream/` (62 files without `dev/`, plus the Apache-2.0 `LICENSE`; every file's git blob hash checked by `scripts/selfhost/sync-upstream.mjs`). Every service is pinned by registry digest in `deploy/selfhost/mcci/docker-compose.mcci.yml`; the Postgres digest `sha256:f371b5f3…7c00` is the image the dry runs used. The merged Compose configuration validates statically (`docker compose config --quiet`). **No self-hosted container has been started.** | `deploy/selfhost/UPSTREAM.md` / `UPSTREAM.json`, 23 Oct 2026 |
| CLI local image | Supabase CLI 2.121 uses `supabase/postgres:17.11.0.004` for `major_version = 17` | image string in the CLI binary; `select version()` → PostgreSQL 17.11 |
| Extensions | `pgcrypto 1.3`, `citext 1.6`, `pg_trgm 1.6`, `pg_cron 1.6.4`, `pg_net 0.20.3`, `pgtap 1.3.3`, `supabase_vault 0.3.1`; `pg_cron` and `pg_net` preloaded | `pg_available_extensions`, `shared_preload_libraries` |
| Roles / schemas | `anon`, `authenticated`, `service_role`, `authenticator`, `supabase_*`; schemas `auth`, `storage`, `extensions`, `vault` | catalog queries |
| Default privileges | Upstream grants **ALL** on new `public` tables and **EXECUTE** on new functions to `anon`/`authenticated`. Migration 0100 revokes these; every grant is explicit. | `pg_default_acl` |
| Migration compatibility | All 17 migrations (0100–0260) + seed apply cleanly on **both** images; all 276 assertions in 10 files pass on both; every test file leaves no rows behind after its own rollback | `scripts/db/dry-run.sh <image>` (each run inside one outer transaction that is rolled back, in a throwaway container; the file's own transaction runs as a savepoint, followed by a row-count leak check) |
| API keys | `@supabase/supabase-js` 2.118 recognises `sb_publishable_…` / `sb_secret_…` (`isNewApiKey`), sends them as `apikey`, never as a Bearer token. Self-hosted `.env` has `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `JWT_KEYS`/`JWT_JWKS` (ES256). CLI 2.121 issues both formats. | SDK source, upstream `.env.example`, CLI binary |
| Local CLI stack | `supabase test db` on the running local stack (Postgres 17.11.0.004, real Auth schema, `storage-api` v1.82.1 tables and `storage.protect_delete` trigger): Files = 9, Tests = 259, PASS; afterwards the database held only the seed rows (counters advanced, gaps only). This run predates 0260 / 090: **0260 is not applied to the local stack yet** (needs approval; `supabase migration up`, no reset) | `pnpm db:test` log, 23 Oct 2026 |
| Local CLI stack, after 0260 | 0260 applied with `supabase migration up --local` (no reset; history 0100–0260 = 17 versions). `supabase test db`: Files = 10, Tests = 276, PASS | `pnpm db:test` logs, 22 Oct 2026 |
| Realtime internals | The local Realtime's `realtime.apply_rls` builds change payloads only from columns the subscriber's role may SELECT (`has_column_privilege`), runs the subscriber's RLS check for INSERT/UPDATE, sends a metadata-only 401 notice to subscribers who cannot read the primary key (anon; residual risk R-RT1), and sends DELETE events to **every** subscriber with `old_record` reduced to the primary key (not RLS-checked; residual risk R-RT2). Design in §4a. | function source on the local stack, read-only |
| Realtime runtime (local) | `pnpm test:integration` against the local stack (Realtime v2.143.4), hardened suite (confirmed subscriptions, checked writes, positive controls, checked teardown): 12 / 12 passed in every run (final code: two consecutive runs); teardown verified no synthetic rows remain | integration logs, 22 Oct 2026 |
| **Not yet verified** | The self-hosted stack itself (17.6.1.136); Auth sign-up through the Auth API (A1–A12, §11); uploads/deletes through the Storage HTTP API (S1–S12, §11); REST exposure (`private` hidden, `api` reachable); publishable/secret keys at runtime and gateway key enforcement (G1–G8, §3); Realtime subscriptions on the self-hosted stack (`pnpm test:integration`, §4a; local stack verified) — check **T-V3** | — |

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
- **Self-hosted (Envoy `v1.39.1`), read from the pinned `deploy/selfhost/upstream/volumes/api/envoy/lds.template.yaml`,
  not yet run:** a missing or unknown key gets 401 on REST, Auth, GraphQL, Realtime and `/pg/`; an `sb_…` value
  that is not one of the two configured keys gets "Invalid API key". The OpenAPI root `/rest/v1/` and `/pg/`
  (postgres-meta) admit only the service-role keys (the secret key is translated to one); Realtime
  `api/tenants` and `api/openapi`, `/mcp` and `/api/mcp` are denied to everyone. `/storage/v1/` and `/functions/v1/`
  have no gateway key check (Storage validates the JWT itself). The legacy HS256 `ANON_KEY` / `SERVICE_ROLE_KEY`
  are still accepted alongside the `sb_` keys: never hand them out. There is no Origin rule, so keeping the secret
  key out of browsers stays an application duty (B1).
- **Studio shares the gateway port:** every path not matched above (`/`) goes to Studio behind HTTP basic auth
  (`DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD`, SHA-1 hashed — TLS required). Upstream binds the gateway (8000) and
  the pooler (5432, 6543) to **all interfaces** by default.
- **Decision:** use the pinned upstream Envoy configuration unchanged. MCCI differences live only in
  `deploy/selfhost/mcci/docker-compose.mcci.yml`: gateway on `127.0.0.1:18000` for the isolated test stack, no
  database or pooler ports, digest pins. On staging the TLS proxy admits Studio (`/`), `/pg/`, `/mcp` and `/api/mcp`
  from the admin network only (D-M23); the gateway port itself is never public.
- **Runtime tests for T-V3 (self-hosted stack):**

| # | Request | Expected |
|---|---|---|
| G1 | no `apikey` on `/rest/v1/public_settings` and `/auth/v1/settings` | 401 |
| G2 | an unknown `sb_publishable_…` key; `invalid-key` | 401 |
| G3 | publishable key on `/rest/v1/public_settings` | 200, 4 rows |
| G4 | OpenAPI root `/rest/v1/`: publishable key / secret key (control) | 403 / 200 |
| G5 | (a) `/pg/config/version`: no key / publishable / secret (control); (b) the gateway port on every non-loopback IPv4 of the host — fails if there is none, so it cannot pass without probing; on staging, `/pg/` through the TLS proxy from outside the admin network | 401 / 403 / 200; not open; denied |
| G6 | `/realtime/v1/api/tenants`, `/realtime/v1/api/openapi` with either key | 403 |
| G7 | `rpc/settings_for_server` (service-role only): publishable / secret (control); `Accept-Profile: private`; `/mcp`, `/api/mcp`; client-bundle scan for `sb_secret_` (T-B1) | 401–403 / 200; 406; 403; no match |
| G8 | (a) Studio `/`: no credentials / wrong credentials / correct credentials (control, required); (b) **unverified expectation, not a security check:** the 401 carries `WWW-Authenticate: Basic` (upstream's tests assert only the status) | 401 / 401 / 2xx–3xx; header present |

Automated in `tests/integration/gateway.test.ts` (run by `scripts/selfhost/gateway-checks.sh`, loopback only,
`MCCI_IT_SELFHOST=1`). **Not run yet:** no self-hosted stack has been started. The staging-only parts (G5 through the
proxy and firewall) and the T-B1 build scan are not covered by that test.

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

**How Realtime applies security (verified on the local stack, §2):** each change is checked per subscriber with
that subscriber's JWT, inside `realtime.apply_rls`.

- **INSERT / UPDATE, role can read the primary key** (every published table for `authenticated`): delivered only
  when the row passes the subscriber's RLS SELECT policy; the payload holds only the columns the role may SELECT.
  Otherwise nothing is sent. A client filter (`company_id=eq.…`) can only narrow, never widen, what RLS allows.
- **INSERT / UPDATE, role cannot read the primary key** (`anon` on every published table): a **notice** is still
  sent to the subscriber: table, event type (`INSERT` / `UPDATE`), `errors: ["Error 401: Unauthorized"]`, empty
  `new` and `old`, no commit timestamp. No row content, no identifiers.
- **DELETE:** not RLS-checked. Every subscriber of the table receives the event: `old` is the primary key only
  (`{ id }`) for roles that may read the key — the owner, other companies and staff alike (R-RT2). For `anon` the
  event has no row data and no id, but it does carry the `commit_timestamp` (R-RT1; the 401 path above excludes
  DELETE, so the normal output, which always includes the timestamp, is used — local `apply_rls` source).
- **Unpublished table:** Realtime refuses the subscription (`system` status `error`, "Unable to subscribe to
  changes with given parameters …"); no events.
- **Private broadcast channel** (`config.private: true`): join refused with `CHANNEL_ERROR` "Unauthorized: You do
  not have permissions to read from this Channel topic" for `anon`, members and staff alike.

**Rules that follow (enforced by 0260 and tested in 090):**

1. Publish only tables with RLS enabled, no anon SELECT and **no client DELETE**. This does not prevent deletes:
   the database and server-side jobs still delete rows of published tables (cascades, account deletion, retention;
   see R-RT2), and each such delete sends the row id to every authenticated subscriber of that table. That
   exposure is an open residual risk (R-RT2), not something this rule makes safe.
2. Columns a client must not see are hidden by **column grants**, never only by the UI. Realtime honours them.
3. `endorsements.ip` and `endorsements.user_agent` (signing evidence) are no longer readable by clients: 0260
   replaces the table-wide SELECT with a column grant of every other column. Neither REST nor Realtime returns
   them; staff and the endorser see evidence only through an `api.*` function (M4). A column added to
   `endorsements` later is unreadable until it is granted on purpose (090 pins the exact list). Consequence for
   app code: a client `select('*')` on `endorsements` fails with "permission denied" (verified); list the columns
   (ESLint flags the literal forms; it cannot see every form, see the coverage tables below).
4. Sensitive or internal tables are never published (credentials, personal data, logs, `private`, `auth`,
   `storage`). `realtime.messages` keeps RLS with no policy, so private broadcast channels stay closed.
5. Not published now: `temp_memberships`, `documents`, `members` (`docs/05` M7 "updates live"). Those screens can
   refresh from the `notifications` row the same flow writes; publishing them is decided when M7 is built.

**Residual risk R-RT1 — anonymous metadata notices. Status: accepted temporarily for local development only;
production acceptance PENDING security review. Not approved for production.**

| Aspect | Detail |
|---|---|
| Observed | Anyone holding only the publishable key (no sign-in) can subscribe to any of the five published tables and receives (a) one notice per INSERT/UPDATE with metadata only — table, event type, `Error 401: Unauthorized` — and no row data and no commit timestamp; and (b) one event per DELETE with no row data and no id, but **with the `commit_timestamp`** of the delete. Verified in `apply_rls` and by the integration suite (local stack, Realtime v2.143.4); the DELETE timestamp is confirmed from the local `apply_rls` source only — the suite does not assert timestamps. |
| Not exposed | Row contents, `record` / `old_record`, ids, company ids, user ids; commit timestamps of INSERT/UPDATE (DELETE events do carry one, see above). |
| Impact | Activity patterns: the time and volume of changes to applications, endorsements, service requests, notifications and payment vouchers are observable in real time by an unauthenticated party (e.g. how many applications or payments move per day, bursts after a committee meeting, quiet periods). No individual record can be identified. |
| Why not fixed now | Stopping anon subscriptions would need either granting anon SELECT on the key columns (widens grants; rejected) or private-only channels (Realtime tenant setting plus `realtime.messages` policies; a design change). The publishable key is a valid key, so the self-hosted gateway does not stop it either (§3). |
| Not claimed | That private channels or a private-only tenant setting stop these notices for `postgres_changes`: **not tested**. |
| Decision required before production | MCCI security review: accept R-RT1, or adopt a tested alternative (e.g. private-only channels with per-company topics, or updates relayed by the Next.js server). Tracked in §11. |

**Residual risk R-RT2 — DELETE ids reach every subscriber. Status: open; production acceptance PENDING security
review. Not approved for production.**

| Aspect | Detail |
|---|---|
| Observed | A delete on a published table is sent to every subscriber of that table without an RLS check: `old` = `{ id }` for every authenticated subscriber, and for `anon` an event with no row data and no id but with the commit timestamp (R-RT1). Asserted by the integration suite: when Owner A's notification is deleted, Owner A, Owner B (another company) and a Membership Officer each receive exactly `{ id }`. Local stack, Realtime v2.143.4. |
| Not exposed | Any column other than the primary key (asserted: no title, body or user id in any delete event). |
| Correlation (evidence) | Ids are not always opaque to other tenants. `endorsements.application_id` is client-readable, and the endorser company can read it for the applicant's application while it cannot read the application row (verified on the local seed: `owner_e` reads 1 `application_id` belonging to company A and 0 application rows). If that application is deleted, the endorser's `applications` subscription receives exactly that id, so the endorser learns that this application was deleted, and when. Other client-readable columns that reference published rows: `application_documents`, `application_document_versions`, `application_partners`, `application_form_snapshots`, `application_history`, `committee_items`, `ai_extractions` (→ `applications`); `service_documents`, `service_messages`, `ai_extractions` (→ `service_requests`); `payment_receipts` (→ `payment_vouchers`). Which of those are readable across companies has **not** been analysed, nor have ids that leave the database (URLs, exports, support screenshots). |
| When deletes happen | Clients have no DELETE on these tables, but the design deletes rows server-side: `notifications` cascade from `profiles` and `companies` (`ON DELETE CASCADE`); `endorsements` cascade from `applications`; account deletion (`acc.delete`, `docs/15` "Account deletion", `docs/16` D8) removes the profile; the retention job hard-deletes (`docs/02`: "Hard delete only by retention job"). None of these is built yet. |
| Impact | Every signed-in subscriber of a published table learns the ids, timing and volume of deletions on it — e.g. a burst of `notifications` deletes can reveal an account deletion; `applications` deletes reveal retention purges or removed applications. With the correlation above, a party to an endorsement can learn the fate of a specific application. Row contents do not leak. |
| Not claimed | That random UUIDs make this harmless: some ids are correlatable (above) and the analysis is incomplete. |
| Options (to evaluate; none tested) | Soft-delete (status) rows of published tables instead of hard deletes; have account deletion and the retention job anonymise rather than delete them; change the `notifications` cascades; or accept R-RT2. |
| Decision required | MCCI security review before production, and in any case before account deletion (M9) or the retention job is built. Tracked in §11. |

**Pinned self-hosted Realtime (`v2.143.3`, release 0.8.3).** It contains the fix for GHSA-9vjf-j9f7-j42c (forged
Postgres Changes events injected by anonymous clients through binary broadcasts), relevant to R-RT1. Known issue
supabase/realtime#2289: every 10 minutes Realtime restarts its database connection and Postgres Changes made during
the few seconds of reconnection are **not delivered** — app requirement: screens must not rely on a live event
alone and must re-read their data on focus / navigation. Upstream's workaround `REGION: us-east-1` is applied in `deploy/selfhost/mcci/docker-compose.mcci.yml`;
remove it when a pinned release contains the fix. The local CLI stack runs Realtime `v2.143.4` and Storage `v1.82.1`,
the pinned release `v2.143.3` and `v1.81.0`: local results do not carry over (T-V3).

**Runtime tests** (`tests/integration/realtime.test.ts`, `pnpm test:integration`): synthetic `@test.local` users
created and removed through the Auth admin API, fresh ids per run, local stack only (loopback URL and
`sb_publishable_` / `sb_secret_` keys required; skipped unless `MCCI_IT_LOCAL=1`; keys never printed; a failed
setup removes what it created and reports cleanup failures with the setup error). Each subscription must be
confirmed by Realtime ("Subscribed to PostgreSQL", status `ok`) before changes are written; every write must change
a row; every negative case has a positive control in the same test; teardown checks every step and verifies that
no synthetic row remains. Positive cases must arrive within 3 s; negative cases must stay silent for 5 s.

| Case | Expected (asserted by the suite on the local stack) |
|---|---|
| Owner A, application of company A changes | received |
| Owner B, same change | nothing |
| anonymous client, same change | metadata-only notices (R-RT1): no `record` / `old_record`, no ids or content, 401 error |
| Membership Officer (mem ≥ 1), same change | received |
| deactivated Membership Officer, same change | nothing (the active officer, as control, receives it) |
| Owner B subscribing with filter `company_id=eq.A` | nothing (Owner A with the same filter, as control, receives it) |
| Owner A subscribing to `companies` (unpublished; Owner A can read the row via REST) | subscription refused (status `error`), no events (Owner A's `applications` subscription, as control, receives a change) |
| personal notification for Owner A | Owner A only |
| company `pay` notification for A | Owner received; Services user (pay = 0) nothing |
| Owner A's notification deleted | Owner A, Owner B (other company) and a Membership Officer each receive `old` = `{ id }` exactly (R-RT2, pinned as observed); anon receives a delete event with no row data and no id (R-RT1; its commit timestamp is not asserted); no title, body or user id in any event |
| endorsement update | endorser and applicant receive it **without** `ip` / `user_agent`; Owner B nothing |
| endorser company, application change | nothing (the applicant, as control, receives it) |
| new payment voucher for A | Owner received; Services user nothing |
| private broadcast channel `company:<id>` | anon, Owner A, staff: `CHANNEL_ERROR` Unauthorized (join only; says nothing about `postgres_changes` notices) |

Run locally (after 0260 is applied; PowerShell, values read from `supabase status -o env`, never echoed):
`$env:MCCI_IT_LOCAL='1'`, `$env:MCCI_IT_SUPABASE_URL` = API_URL, `$env:MCCI_IT_PUBLISHABLE_KEY` = PUBLISHABLE_KEY,
`$env:MCCI_IT_SECRET_KEY` = SECRET_KEY, then `pnpm test:integration`.

**Generated types and restricted columns.** `supabase gen types` describes table columns, not grants, so the
generated `lib/supabase/types.ts` (never hand-edited) still lists `endorsements.ip` / `user_agent`. That is correct
for the service-role client (`lib/supabase/admin.ts`), which keeps the full `Database` type and may read them. The
two user-session clients run with the user's column privileges and are typed with `ClientDatabase`
(`lib/supabase/client-types.ts`): the generated type minus `RESTRICTED_CLIENT_COLUMNS` (`endorsements`: `ip`,
`user_agent`). That covers the browser client (`client.ts`) and the cookie-session server client (`server.ts`).

**Caught** (types, and the `no-restricted-syntax` guard in `eslint.config.mjs`; examples pinned in
`tests/unit/eslint-endorsements.test.ts`). The lint guard inspects the first argument of `.select()` when it is a
string literal, or the static text of a template literal. It applies to `*.ts` / `*.tsx` everywhere except
`tests/**`. In the service-role paths (`app/api/**`, `lib/pdf/**`, `lib/supabase/admin.ts`) the evidence columns may
be named, but `*` must still be avoided.

| Pattern on a user-session client | Enforcement |
|---|---|
| `select('ip')`, `select('id, ip')`, `addr:ip`, `ip::text`, `` select(`id, ip`) `` | type: the result is a `SelectQueryError`, so any use of the data fails to compile (postgrest-js does not reject the `.select()` call itself); lint: rejected outside service-role paths |
| embedded `endorsements(ip)`, `endorsements(members(id), ip)`, the same in a template literal | type (as above) and lint, outside service-role paths |
| `.from('endorsements')` with `select('*')`, `select()`, `select('id, *')`, `select('*', { count })`, `` select(`*`) ``, and a `*` in the static part of a template with substitutions (`` `id, ${x}, *` ``) | lint only (type-checks, typed without the evidence columns, but fails at runtime) |
| embedded `endorsements(*)` and `endorsements(id, *)`, also aliased (`e:endorsements!inner(…)`), spread (`...endorsements(…)`), nested inside another embed, multi-line in a string with `\n` escapes or in a template literal | lint only |

**Not reliably caught** — the database grants (090) remain the guarantee; the query fails with "permission denied":

| Pattern | Why |
|---|---|
| split builders: `const q = db.from('endorsements'); q.select('*')` | the guard needs `.from('endorsements')` in the same call chain as `.select()` |
| table or column strings held in variables or constants: `db.from(t)`, `select(COLS)` | only literal arguments are inspected |
| computed method calls: `db['from']('endorsements')['select']('*')` | the guard matches `.from` / `.select` property access only |
| `${…}` substitutions in a template: `` select(`${cols}`) ``, `` endorsements(${cols}) `` | substituted values are not known statically; postgrest-js types such a select as an error ("Received a generic string"), so code must cast its result, and the cast hides which columns are read |
| `*` or an evidence column after more than two levels of nested embeds inside `endorsements(…)` | the pattern skips at most two nested levels |
| filters and ordering on restricted columns: `.eq('ip', …)`, `.order('user_agent')` | neither types nor lint inspect filter columns |
| `.js` / `.jsx` / `.mjs` files | the guard is scoped to `*.ts` / `*.tsx` (the project is TypeScript; `allowJs` is off, but Next.js would still compile `.jsx`) |
| a client created outside `lib/supabase/*` with the full `Database` type | outside the typed factories |

Drift guard: test 090 pins the exact client-readable `endorsements` columns in the database;
`tests/unit/client-types.test.ts` checks that `RESTRICTED_CLIENT_COLUMNS` equals the generated columns minus that
pinned list, and (via `pnpm typecheck`) that the client types lack exactly those columns while `Database` keeps them.
A grant change therefore fails 090 first and then this unit test until the list is updated.
`tests/unit/eslint-endorsements.test.ts` runs the real ESLint config against flagged and allowed queries, and pins
the `${…}` limitation as not flagged. ESLint therefore narrows, but does not close, the `select('*')` gap.

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
| F-24 | Realtime publication, `endorsements` | live payloads leak rows or columns (endorser IP / user agent to the applicant); delete events reveal ids; anonymous subscriptions | 5 tables only, RLS on, no anon SELECT, no client DELETE; evidence columns not granted (0260). **Partial:** anonymous subscribers still receive metadata-only notices (R-RT1) and every subscriber receives the ids of deleted rows (R-RT2) — both open, pending security review, not approved for production (§4a) | 090 · exact table list, RLS, anon, DELETE, excluded tables, `ip`/`user_agent` ×4, column list, RLS unchanged ×3, `apply_rls` uses column privileges, `realtime.messages` closed; runtime (`pnpm test:integration`, §4a): row and column isolation, R-RT1 and R-RT2 behaviour pinned |

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

Prepared in the repository (configuration only, nothing started): pinned release and digests
(`deploy/selfhost/UPSTREAM.md`), MCCI override with Auth / Storage / API settings equal to `supabase/config.toml`
except the email limits, which are left at Auth's defaults pending D-M22 (`deploy/selfhost/mcci/`), silent secret
generation into a runtime directory outside the repository, isolated migration / test commands and backups
(`deploy/selfhost/README.md`). Edge Functions, imgproxy and the
logs/analytics add-on are not run. Still open: the staging VM and TLS proxy (D-M1, D-M23), production SMTP, the
backup target, and the email rate limit (D-M22).

## 11. Engineering follow-ups (no MCCI input needed)

| Item | When |
|---|---|
| T-V3: run the migrations and the pgTAP suite with `scripts/selfhost/db-tests.sh` (psql inside the database container) on the full self-hosted stack (real Storage, Auth new keys, Realtime), plus gateway tests G1–G8 (§3). Configuration, runbook and test scaffolding ready in `deploy/selfhost/` and `scripts/selfhost/`; **blocked** until a host is chosen (staging VM, or this machine with ≥ 8 GiB Docker memory) | after approval |
| Run `pnpm test:integration` on the self-hosted stack (§4a; local stack verified) | with T-V3 |
| Staging: VM, TLS proxy, firewall (only 443/80 public; admin-network rules for Studio, `/pg/`, `/mcp`, `/api/mcp`), G5 through the proxy | with D-M1 / D-M23 |
| Drop the Realtime `REGION` workaround and re-pin when upstream ships the realtime#2289 fix (`node scripts/selfhost/sync-upstream.mjs --ref …`) | next self-hosted release |
| R-RT1 security review: accept anonymous metadata notices for production or adopt a tested alternative (§4a) — not approved for production | before staging |
| R-RT2 security review: deleted-row ids reach every subscriber; decide soft-delete / anonymise / cascade changes / accept, and analyse which other client-readable references are visible across companies (§4a) — not approved for production | before staging; before M9 account deletion or the retention job |
| Client-side type for restricted columns: `ClientDatabase` + ESLint guard, done (§4a). Remaining: add each new column-restricted table to `RESTRICTED_CLIENT_COLUMNS` with its pgTAP pin | with each grant change |
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
| D-M22 | Auth email limits: `GOTRUE_RATE_LIMIT_EMAIL_SENT` (emails per hour for the whole instance: sign-up, invite, magic link, recovery, OTP) and `GOTRUE_SMTP_MAX_FREQUENCY` (minimum interval between emails to one address). `config.toml`'s 2/hour and 1s are CLI local values (1s is 60× weaker than Auth's default) | both left unset in the override, so Auth's defaults apply: 30/hour and 1m (upstream `CONFIG.md`) — not an approved production value |
| D-M23 | Admin network (VPN or IP ranges) allowed to reach Studio, `/pg/` and `/mcp` on staging/production; TLS proxy choice (upstream nginx-certbot / Caddy overlay or MCCI's own) | not reachable at all until decided |
| D-M24 | Storage S3 protocol endpoint (`/storage/v1/s3`, SigV4 with `S3_PROTOCOL_ACCESS_KEY_*`, bypasses RLS): turn it off with `S3_PROTOCOL_ENABLED=false` (documented in upstream `CONFIG.md`, Storage, default `true`) unless MCCI needs S3 clients | on (upstream default), not changed until decided |
