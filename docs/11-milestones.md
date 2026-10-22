# 11 · 30-day milestone plan (with ready-to-paste Claude Code prompts)

Rhythm per milestone: **plan → build → test → demo to MCCI → fix**. Use plan mode (Shift+Tab) for the first
prompt of each milestone, approve the plan, then let Claude Code implement. Commit after each green task.

| Milestone | Days | Outcome |
|---|---|---|
| M0 Setup | 1–2 | Repo, tooling, Supabase local, CI, design tokens, i18n, layout shells |
| M1 Data & auth | 3–5 | Migrations, RLS + tests, seed, sign-in, invitations, permissions |
| M2 Public website | 5–7 | All 13 public pages with hero, motion, verify, directory, contact |
| M3 Application wizard | 8–12 | 6 steps, uploads, AI fill, photo, signature, stamp, official form PDF, submit |
| M4 Endorsements | 11–13 | Eligible search, requests, inbox, sign with OTP, decline, jobs, admin card |
| M5 Review & committee | 14–16 | Pipeline, review desk, committee, member numbers, vouchers |
| M6 Payments, temp, printing | 17–20 | Receipt flow, temp issue/alerts/extend/revoke, batches, serials, convert, QR |
| M7 Services | 21–23 | 7 services end to end with SLA and signing |
| M8 Register, import, engagement | 23–25 | Members register, Excel import, notifications, events, complaints, CMS, templates |
| M9 Reports, audit, settings, hardening | 26–28 | Reports, audit, settings, security checklist, axe, performance |
| MA Android app | +5 (after M8) | Capacitor shell, push, scanner, QR, downloads, digital card, staff queue, Play internal track |
| M10 UAT & go-live | 29–30 (+5) | MCCI UAT, data import, staff onboarding, production deploy, Play production release |

The Android app adds about 5 working days (35 in total) unless M9 and MA run in parallel with two developers.
Compact mobile UI is **not** a separate milestone: every screen is built mobile-first from M0 (`15-mobile-app.md` §5),
and the Play developer account is requested on day 1 (`16-gap-review.md` §F).

---

### M0 · Setup — prompt
```
Read CLAUDE.md and docs/00-scope.md, docs/01-architecture.md, docs/12-design-i18n.md.
Create the Next.js 15 + TypeScript project per CLAUDE.md §2–3 with pnpm: Tailwind 4, shadcn/ui, next-intl (en, ur
with RTL), Supabase SSR clients (server, browser, admin), Vitest, Playwright, ESLint/Prettier, GitHub Actions CI.
Port the design tokens and fonts from reference/prototype/assets (style.css, v7.css, site.css, fonts/jameel-noori.woff2).
Build three empty layout shells that match the prototype: public (transparent header + footer), member (sidebar +
top bar + tabs), admin (sidebar + top bar). Also read docs/15-mobile-app.md §4–5: add the compact mobile tokens (≤ 640 px),
the bottom tab bar for portal and staff, `data-shell="app"` detection from the `MCCIApp/` user agent, and the
Playwright projects `mobile-360` and `app-shell` with the no-horizontal-overflow test. Add `pnpm db:reset`, `db:types`.
Stop when CI is green and show me the shells at 1440 px and 360 px.
```

### M1 · Data & auth — prompt
```
Apply docs/sql/0001_init.sql and 0002_rls.sql as Supabase migrations, then fix defects A1–A6 from docs/16-gap-review.md
in a third migration (with RLS tests that fail before the fix). Write RLS tests for every table and the
roles in docs/06-roles-permissions.md (member Owner/Viewer, endorser, each staff designation, anonymous).
Seed reference data from docs/catalogue/reference-data.json and demo data per docs/13-seed-import.md.
Implement sign-up/sign-in (password + email OTP), staff TOTP, staff and company-user invitations, and
lib/permissions (requirePermission + role matrix). Add the audit helper. Also C1, C2, E5 from docs/16-gap-review.md
(password reset, change email/password, sign out everywhere, delete-account request, terms consent version).
All tests green before you stop.
```

### M2 · Public website — prompt
```
Build all public pages listed in docs/catalogue/screens.md (Public website) to match reference/prototype/site/*.
Hero: full-width hero-bg.jpg under a transparent header that becomes solid on scroll, brand colour layer at 80%
(CSS variable --ov), motion from site-fx.js re-implemented as small client components, all off under
prefers-reduced-motion. Directory uses the public_directory view; verify uses /api/verify/[code]. EN/UR complete.
Add Playwright tests incl. orphan audit and axe for every public page.
```

### M3 · Application wizard — prompt
```
Implement docs/05-modules.md M3 and docs/08-documents-ai.md. Reproduce reference/prototype/member/join exactly
(6 steps, bilingual labels, autosave). Document slots come from document_requirements per business type.
AI extraction with OpenAI structured outputs and per-field confidence. Photo crop 35×45 mm, signature pad, stamp
cleaning. Official 4-page form PDF identical in layout to the prototype's official form. Submit runs validateApp()
and the transition in lib/flow/application.ts. Step 4 can be a placeholder card until M4. Tests: proprietorship
(7 docs) and Pvt Ltd (11 docs) full happy path, missing-items list, returned/correction screen.
```

### M4 · Endorsements — prompt
```
Implement docs/04-endorsement.md completely: eligibility (server), picker with search and greyed reasons,
request with note, Realtime notification + email to the endorser company, member/endorse inbox with badge and
dashboard banner, review (summary + read-only form, no documents), approve & sign (declaration, signature, 6-digit
email OTP, evidence + doc hash + ref), decline with reason, withdraw/remind, hourly job (reminder day 3, expiry
day 7), auto-move to committee, admin card with evidence and Remind, settings block. Signatures on the official
form PDF. Write the six acceptance tests with multiple browser contexts.
```

### M5 · Review & committee — prompt
```
Implement docs/05-modules.md M5 matching admin/requests, admin/mreview, admin/committee, admin/meetings.
Use lib/flow transitions only. Verify routes to committee when both endorsements are Approved, else to 'proposer'.
Committee approval allocates next_member_no(class) and creates + emails the payment voucher PDF.
```

### M6 · Payments, temporary, printing — prompt
```
Implement M6 and M7 from docs/05-modules.md and the state machines in docs/03-state-machines.md §3–4.
Manual payment provider only. Temporary certificate + permanent certificate PDFs with QR, alerts and expiry jobs,
extension (SG), revoke, print batches, receiving with scan + serial, spoiled serials, delivery (collect or courier
with manually typed tracking). Live updates on member and admin screens. Verify page shows Superseded correctly.
```

### M7 · Services — prompt
```
Implement M8 (7 services) from service_types: dynamic forms, documents, fee voucher when fee > 0, tokens,
SLA timers and monitor, start/return/approve, signing queue (single + batch) for President/SG, issued letter PDF
with QR. Playwright test for each service.
```

### M8 · Register, import, engagement — prompt
```
Implement M9 and M10: members register and profile, status changes, change requests, Excel import with
template + dry-run report + commit (docs/13-seed-import.md), notifications centre, email templates editor (EN/UR),
campaigns (email + portal), events & registrations, complaints with replies, news/pages CMS, Ask MCCI AI.
```

### M9 · Reports, audit, settings, hardening — prompt
```
Implement M11. Then run the docs/09-security.md checklist and fix findings, add rate limits, CSP, axe fixes,
Lighthouse ≥ 90 on home/join/dashboard (mobile). Run the full e2e suite and the orphan audit across every route
in docs/catalogue/screens.md. Produce a short report of results.
```

### MA · Android app — prompt
```
Read docs/15-mobile-app.md fully. Create mobile/ with Capacitor 7 (Android) loading APP_URL, staging and production
flavours, splash, status bar, edge-to-edge, back-button stack, bundled bilingual offline screen, navigation
allow-list + Custom Tabs, native download/share/print handler, ML Kit document scanner and QR scanner wired to the
upload slots and the Verify tab, biometric lock, push (FCM) with device_tokens + notify() push channel + Android
notification channels, App Links (assetlinks.json route), in-app updates with settings.app.minVersion, staff
"My queue", digital member card. GitHub Actions job builds a signed AAB on tag mobile-v*. Run the §11 acceptance
list on an emulator and one real low-end phone, and report the results.
```

### M10 · UAT & go-live — prompt
```
Prepare staging with the anonymised MCCI member import and staff invitations. Write docs/UAT.md: one checklist per
role (applicant, endorser, Membership Officer, Accounts, Committee Secretary, Services Officer, President, SG).
After MCCI sign-off: production migration, real import, DNS, email DNS records (SPF/DKIM/DMARC), backups verified,
monitoring on. Tag v1.0.0.
```
