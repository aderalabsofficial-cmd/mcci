# 16 · Gap review (public, member, staff) — 21 Oct 2026

A review of docs 00–14, `sql/*`, `catalogue/*` and the v10 prototype, made before any code exists. Part A lists
defects in the specs to fix **before M1**. Parts B–E list missing features. Each is marked:

- **Add** — small, low risk, needed for a real launch; build it in the milestone shown.
- **Decide** — needs an MCCI business decision; the default is used until then (store it in `settings`, add `TODO(MCCI)`).
- **Later** — worth doing, not this phase; keep it off the screens (no "coming soon" badges).

Each "not in prototype" claim was checked by searching the prototype source.

---

## A. Defects in the current specs (fix before M1)

| # | Where | Problem | Fix |
|---|---|---|---|
| A1 | `sql/0002_rls.sql` · `app insert` | `with check (created_by = auth.uid())` does not check `company_id`. Any signed-in user can create an application under **another company**. | `with check (created_by = auth.uid() and company_id in (select my_company_ids()) and my_company_role(company_id) in ('Owner','Manager'))` + RLS test |
| A2 | `sql/0002_rls.sql` · `members: signed-in read` | Anyone can register, so "authenticated" means "anyone". Every member row (incl. `public_listing = false`, Suspended, Expired) is readable by a new account. | Restrict `members` select to own company + staff. Serve the endorser picker from a `security definer` RPC `search_endorsers(app_id, q)` that returns only eligible-member fields and greyed reasons (`04-endorsement.md`). |
| A3 | `sql/0002_rls.sql` · `meetings`, `committee_items` | `for all using (staff_level('cmt') >= 1)`: **view-only** staff (President, Deputy Secretary, Auditor) can write committee decisions at the database level. | Split: `select` at ≥ 1; insert/update at ≥ 2; decision columns at ≥ 3 (or only through the flow function). |
| A4 | `sql/0002_rls.sql` · `print_batches` | `for all … >= 1`: view-only staff can edit batches. | `select` ≥ 1, write ≥ 2 |
| A5 | `sql/0002_rls.sql` · all `for all` policies | No `with check`, so the `using` clause doubles as the write check. That is correct today, but easy to break. | Write explicit `with check` on every write policy; RLS test per table × role (already planned in `10-testing.md`). |
| A6 | `catalogue/actions.md` vs `sql/0001_init.sql` | Actions refer to tables that do not exist. **Missing:** `opportunities`, `opportunity_replies` (Trade opportunities screen), `member_cards` (`card.request`), `ai_extractions` (AI Insights + 15/day cost guard), `ai_conversations` (Ask AI history), `reminders` (`renew.remind`), user preferences. **Other names for existing tables:** `psids`/`payments` → `payment_vouchers`, `memberships` → `members`, `ticket_replies` → `ticket_messages`, `application_events` → `application_history`, `application_reviews` → `applications.review`, `committee_decisions` → `committee_items`, `proposals` → `endorsements`. | Add the missing tables in a migration `0003_additions.sql` (with RLS). Fix the Tables column in `actions.md` so it uses real names. |
| A7 | Repo | `mcci-digital-prototypes/` is an exact copy of `reference/prototype/`. Two copies will drift. | Delete `mcci-digital-prototypes/` (keep `reference/prototype/` as CLAUDE.md says). |
| A8 | Git | The git repository was your whole Windows home folder (`C:\Users\DELL`, with `.ssh`, `.aws`, `.claude.json` untracked). One `git add -A` from the wrong folder would commit secrets. | Done 21 Oct: `git init` in the project folder. Also remove the stray home-folder repo (`C:\Users\DELL\.git`) after checking it holds nothing you need. |
| A9 | `00-scope.md` | Says "Mobile apps — not in this phase". The Android app is now in scope. | Updated; see `15-mobile-app.md`. `TODO(MCCI)` MoU amendment. |
| A10 | `07-notifications-jobs.md` | `24-hour SLA` is wall-clock. Requests made Thursday evening or before Eid will breach with no one at fault. | **Decide** (default: business hours Mon–Sat 09:00–17:00 PKT, holiday calendar in settings). See D9. |

## B. Public visitor

| # | Missing | Type | Milestone |
|---|---|---|---|
| B1 | **Privacy policy, Terms of use** pages (EN + UR). Needed for registration consent (`09-security.md`) and Google Play. | Add | M2 |
| B2 | 404, 500 and maintenance pages (bilingual, with search + home + contact) | Add | M2 |
| B3 | SEO basics: `sitemap.xml`, `robots.txt`, Open Graph images, `hreflang` en/ur, Organization structured data | Add | M2 |
| B4 | **Circulars & notifications** category in News (FBR/SRO/TDAP/State Bank circulars). For many members this is the main reason to visit a chamber site. Uses `posts.category` + attachment. | Add | M10 |
| B5 | "Which class am I?" + fee calculator on Membership (same class rule as the wizard, 3 questions) | Add | M2 |
| B6 | Track a **complaint** by reference (Track today covers applications and service requests only) | Add | M10 |
| B7 | Office map, hours, holiday notices on Contact | Add | M2 |
| B8 | Privacy-friendly analytics (page views, funnel: membership page → register → submit), no third-party ad trackers | Add | M9 |
| B9 | "Get the Android app" banner + Play badge | Add | M-App |

## C. Member

| # | Missing | Type | Milestone |
|---|---|---|---|
| C1 | **Forgot password / reset**, change password, change login email, "sign out of all devices", list of active devices | Add | M1 |
| C2 | **Delete my account** (Google Play requirement) — see `15-mobile-app.md` §6 | Add | M1 / M-App |
| C3 | **Digital member card** with live QR (works offline in the app) | Add | M7 |
| C4 | Lost / damaged certificate → **duplicate certificate** request (fee voucher → print queue → new serial; old serial marked Replaced on verify) | Decide (fee) | M7 |
| C5 | **Change of authorised representative** as its own guided request (needs new CNIC, board resolution/authority letter, photo, signature; new card) — today it is a generic profile change | Add | M9 |
| C6 | **Class upgrade** Associate → Corporate (fee difference voucher, new number?) | Decide | M9 |
| C7 | **Renewal edge cases:** grace period after 31 March, late fee, lapsed → reinstatement, renewal of imported members whose details are incomplete | Decide (default: grace to 30 June, no late fee, reinstatement = renewal + review) | M9 |
| C8 | **Resign / cancel membership** request | Add | M9 |
| C9 | Add event to calendar (`.ics`), event ticket QR, cancel registration | Add | M10 |
| C10 | Short **feedback** (1–5 + comment) after a service letter is issued; feeds the SLA report | Add | M7 |
| C11 | Ask MCCI AI: "Talk to a person" turns the chat into a support ticket with the transcript; answers cite the rule/page used | Add | M10 |
| C12 | Official **payment receipt** PDF after Accounts verifies (not just status "Paid") with receipt no. and QR | Add | M6 |
| C13 | Push notifications in the app (members here often don't read email; SMS/WhatsApp are out of scope) | Add | M-App |

## D. Staff / admin

| # | Missing | Type | Milestone |
|---|---|---|---|
| D1 | **Assisted (walk-in) mode:** Front Desk starts an application or service request for a member who comes to the office, scans their papers and captures consent + signature on a tablet. The member can later claim the account by email. Many existing members will not self-serve at first. | Add | M3 / M7 |
| D2 | **Signing delegation:** when the President is away, a Senior Vice President / Vice President signs. These office bearers are not designations in `06-roles-permissions.md`. Add designation "Office Bearer (Signatory)" + dated delegation (from/to, audited); the letter prints the actual signer. | Decide | M7 |
| D3 | **Refunds / overpayments:** duplicate bank payment, payment against a cancelled voucher. No state exists. Add `payment_vouchers.status = 'Refund due' → 'Refunded'` with reason and Accounts approval (manual bank refund recorded). | Add | M6 |
| D4 | **Daily collections & reconciliation export** (voucher no., amount, bank ref, verified by, date) for Accounts to match against the bank statement | Add | M6 |
| D5 | **Staff offboarding:** deactivate a staff user and **reassign** their open items (review queue, tickets) in one step | Add | M1 / M9 |
| D6 | **Job & system health** panel: last run + result of each cron job, failed emails/pushes (`email_log`), storage use, backup status (extends Integrations page) | Add | M9 |
| D7 | Event **check-in** by QR (phone) + attendance report | Add | M10 / M-App |
| D8 | **Data subject requests:** export a member's data (SG), process account-deletion requests, legal hold flag that stops the retention job | Add | M9 |
| D9 | SLA in **business hours** with a holiday calendar (Eid, 14 Aug, etc.) maintained in Settings | Decide | M7 |
| D10 | Staff mobile **My queue** (sign, verify receipts, committee, SLA) — see `15-mobile-app.md` §5.4 | Add | M-App |
| D11 | Bulk **print-ready export** of certificates per batch (one PDF, serial order) for the security printer | Add | M6 |
| D12 | Renewal-season **capacity**: March peak (all members renew); load test 2,000 vouchers + 500 receipt uploads/day | Add | M9 |

## E. Cross-cutting

| # | Item | Type |
|---|---|---|
| E1 | **Compact mobile UI** (`15-mobile-app.md` §5). The prototype overflows at 375 px: portal content is 591 px wide, admin 556 px (top bar); admin tables have 12–14 columns; on admin Application Review 61 of 69 controls are under 40 px tall; the public home is 16 screens long. Build mobile layouts from M0. Do not copy these from the prototype. | Add (M0 onward) |
| E2 | Numbers in Urdu UI: keep Latin digits for tokens, amounts, CNIC, dates (easier to read out at the counter and match against paper) | Decide (default Latin) |
| E3 | Training: 6 short screen videos in Urdu (apply, endorse, pay, request a service, documents, app install) linked from Help; staff training session per role before UAT | Add (M10) |
| E4 | Error monitoring for the app (Sentry for Capacitor / web) and uptime check on `/api/health` | Add (M9) |
| E5 | Terms consent versioning: store which privacy/terms version each user accepted, and when | Add (M1) |

## F. Additions to `14-mcci-dependencies.md`

| Item | Needed by | Why |
|---|---|---|
| D-U-N-S number + Google Play **organisation** developer account in MCCI's name (USD 25) | Day 1 (approval can take up to 30 days) | Publish the Android app as MCCI |
| Firebase project owned by MCCI's Google account | Day 10 | Push notifications |
| App name, Urdu name, icon approval | Day 10 | Store listing |
| Privacy policy & terms wording (legal review) | Day 15 | Registration, Play listing |
| Signing delegation rule (who signs when the President is away) | Day 15 | Service letters |
| SLA basis (wall-clock vs business hours) + holiday list | Day 15 | SLA timers |
| Renewal grace period, late fee, reinstatement rule; duplicate certificate fee; class-upgrade rule | Day 20 | Renewals and member requests |
