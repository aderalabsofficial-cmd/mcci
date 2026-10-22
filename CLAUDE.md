# MCCI Digital Platform — project memory for Claude Code

You are building the production version of the **Multan Chamber of Commerce & Industry (MCCI) Digital Platform**:
a bilingual (English / Urdu) public website, a member portal, an admin panel and an Android app (a Capacitor shell
around the same web app — `docs/15-mobile-app.md`). A complete clickable prototype
(v10) is in `reference/prototype/`. **The prototype is the specification for screens, wording and behaviour.**
These docs are the specification for architecture, data, rules and quality.

Read this file fully at the start of every session. Then read the doc for the milestone you are working on.

---

## 1. Golden rules

1. **This phase only.** Build what `docs/00-scope.md` lists. Never build or expose:
   WhatsApp messaging, bank payment APIs (1Bill PSID / card gateway), courier APIs, or anything labelled "phase 2".
   Payment = voucher + receipt upload + Accounts verification. Courier = staff type the tracking number.
   The Android app is in scope (`docs/15-mobile-app.md`); iOS is not.
2. **Match the prototype** (content, wording, order — on phones use the compact layout in `docs/15-mobile-app.md` §5,
   because the prototype overflows at 375 px). Before building a screen, open `reference/prototype/<role>/<page>/index.html` in a
   browser (`npx serve reference/prototype`), and read its entry in `docs/catalogue/screens.md` and the actions it
   uses in `docs/catalogue/actions.md`. Same sections, same labels (EN + UR), same order, same empty states.
3. **No orphan controls.** Every button, tab and link must do something real or be removed. The e2e suite runs an
   orphan audit on every page (see `docs/10-testing.md`). A PR that adds an unwired control fails CI.
4. **Security first.** Row-level security on every table (`docs/sql/0002_rls.sql`). Members only ever see their own
   company's data. Staff see what their designation allows (`docs/06-roles-permissions.md`). Authorisation is
   checked **on the server** in every server action, never only in the UI.
5. **Every change is audited.** Any insert/update/delete done by a person writes `audit_log` (who, what, old → new, why).
6. **Simple for non-technical owners.** Big buttons with icons, one task per screen, bilingual labels, plain words,
   "what to do now" card on every member page. Do not add jargon or extra options the prototype does not have.
7. **Urdu is first-class.** All member-facing text exists in both languages (`messages/en.json`, `messages/ur.json`).
   Urdu renders in Jameel Noori Nastaleeq (self-hosted woff2, `unicode-range` limited to Arabic script).
8. **Small, verified steps.** Work milestone by milestone (`docs/11-milestones.md`). After each task: typecheck,
   lint, unit tests, the relevant Playwright test. Commit with a clear message. Do not start the next milestone
   until the current one's acceptance checklist passes.
9. **Ask, don't guess, on business rules.** Open decisions are listed in `docs/14-mcci-dependencies.md`. Use the
   default stated there, keep it in `settings` so MCCI can change it without a deploy, and add a `TODO(MCCI)` note.
10. **Never put secrets in the repo.** Use `.env.local` (git-ignored) and the hosting provider's secret store.

## 2. Stack (fixed — do not swap without asking)

| Layer | Choice |
|---|---|
| App | Next.js 15 (App Router, Server Components, Server Actions), TypeScript strict |
| UI | Tailwind CSS 4 + shadcn/ui (Radix), lucide-react icons, design tokens copied from the prototype CSS |
| i18n | next-intl, locales `en` and `ur` (`dir="rtl"` for ur) |
| Database / Auth / Files / Live | Supabase: Postgres 15, Auth, Storage, Realtime, RLS; `@supabase/ssr` |
| Validation | Zod schemas shared by forms and server actions |
| Forms | react-hook-form + zod resolver, autosave for the application wizard |
| AI | OpenAI API with Structured Outputs (JSON schema) for document extraction; MCCI knowledge base for "Ask MCCI AI" |
| PDF / QR | `@react-pdf/renderer` (or Playwright print-to-PDF of an HTML template) + `qrcode` |
| Email | React Email templates + SMTP / transactional provider (Resend or the provider MCCI prefers) |
| Jobs | Supabase `pg_cron` calling Edge Functions / Next.js route handlers protected by a cron secret |
| Tests | Vitest (unit), Playwright (e2e + orphan audit + accessibility via axe), pgTAP or SQL tests for RLS |
| Hosting | Vercel (app) + Supabase (managed) — or MCCI's preferred cloud; see `docs/01-architecture.md` |
| Android | Capacitor 7 shell loading `APP_URL` + native plugins (push/FCM, ML Kit scanner & QR, biometric, share); AAB built in GitHub Actions |

## 3. Repository layout (target)

```
app/
  [locale]/(site)/...            public website  (home, about, membership, services, service/[key], directory,
                                 verify, track, live, news, resources, contact, login)
  [locale]/portal/...            member portal   (dashboard, membership, join, track, form, endorse, apply,
                                 requests, requests/[token], documents, payments, support, assistant,
                                 notifications, events, opportunities, profile)
  [locale]/admin/...             admin panel     (see docs/catalogue/screens.md)
  api/                           route handlers: cron/*, verify/[code], webhooks (none in this phase), pdf/*
components/                      ui/ (shadcn), shared/, site/, portal/, admin/
lib/                             supabase/ (server, client, admin), auth/, permissions/, flow/ (state machines),
                                 endorse/, ai/, pdf/, qr/, email/, audit/, i18n/, validation/
messages/                        en.json, ur.json
supabase/migrations/             SQL migrations (start from docs/sql/*.sql)
supabase/seed.sql                demo + reference data
tests/unit, tests/e2e, tests/rls
mobile/                          Capacitor Android shell, offline screen, store assets (docs/15-mobile-app.md)
reference/prototype/             v10 prototype (read-only)
docs/                            these specs
```

## 4. Commands

```bash
pnpm dev                  # app on http://localhost:3000
pnpm typecheck && pnpm lint
pnpm test                 # vitest
pnpm test:e2e             # playwright (starts the app)
pnpm db:reset             # supabase db reset (migrations + seed)
pnpm db:types             # supabase gen types typescript --local > lib/supabase/types.ts
npx serve reference/prototype   # view the prototype at http://localhost:3000 (use another port if needed)
```

## 5. Where the rules live

| Topic | Doc |
|---|---|
| Scope, out of scope, dependencies | `docs/00-scope.md` |
| Architecture, env vars, deployment | `docs/01-architecture.md` |
| Tables, enums, indexes | `docs/02-data-model.md` + `docs/sql/0001_init.sql` |
| Row-level security | `docs/sql/0002_rls.sql` |
| Membership / temp / print / voucher / service state machines | `docs/03-state-machines.md` |
| Proposer & seconder (endorsement) | `docs/04-endorsement.md` |
| Module specs + acceptance criteria | `docs/05-modules.md` |
| Staff designations, member company roles | `docs/06-roles-permissions.md` |
| Notifications, emails, scheduled jobs | `docs/07-notifications-jobs.md` |
| AI extraction, official form PDF, photo, signature, QR | `docs/08-documents-ai.md` |
| Security & privacy | `docs/09-security.md` |
| Testing & orphan audit | `docs/10-testing.md` |
| 30-day milestone plan with ready prompts | `docs/11-milestones.md` |
| Design system, Urdu, RTL, motion | `docs/12-design-i18n.md` |
| Seed data and member Excel import | `docs/13-seed-import.md` |
| What MCCI must provide / decide | `docs/14-mcci-dependencies.md` |
| Android app, compact mobile UI, Play release | `docs/15-mobile-app.md` |
| Spec defects and missing features (fix A1–A6 before M1) | `docs/16-gap-review.md` |
| Every screen / every action / reference data | `docs/catalogue/*` |

## 6. Conventions

- Server actions live next to their feature in `lib/<feature>/actions.ts`, each starts with
  `const actor = await requirePermission('<module>', '<level>')` and ends with `await audit(...)`.
- State changes go through `lib/flow/*` transition functions only (never `update ... set stage =` from a page).
  Each transition validates the current state, writes history, sends notifications and returns the new row.
- Money is stored as integer PKR. Dates are `timestamptz`; display in Asia/Karachi.
- Tokens: membership application `MCCI-2026-M-0231`, service request `MCCI-2026-10482`, voucher `PV-2026-0001`,
  membership number `MCCI-C-1134` (Corporate) / `MCCI-A-2205` (Associate). Generate with sequences, never in JS.
- File uploads go to private Storage buckets; read through signed URLs that expire in 10 minutes.
- Names in code are English; user-facing strings come from `messages/*.json` only.
- Accessibility: every control has an accessible name; colour contrast AA; keyboard reachable; focus visible.

## 7. Definition of done (per task)

- [ ] Matches the prototype screen and wording (EN + UR) on desktop; at 360–412 px uses the compact mobile layout
      (`docs/15-mobile-app.md` §5) with no horizontal scroll, and works inside the app shell
- [ ] Server-side permission check + RLS covers it; audit log written for changes
- [ ] Zod validation with friendly bilingual errors
- [ ] Loading, empty and error states
- [ ] Unit tests for logic; Playwright test clicks every new control; orphan audit passes
- [ ] `pnpm typecheck && pnpm lint && pnpm test` green
