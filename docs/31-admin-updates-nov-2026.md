# 31. Owner's admin updates of 1 Nov 2026

The owner's list and MCCI's own Profit & Loss statement (September 2026, "Year 2026-2027"). Migrations 0590, 0600, 0610.

No figures from that statement are stored anywhere in this repository: only its layout and account names.

## Rules, and where they can be changed

| Rule | Default | Where it lives |
|---|---|---|
| Years of valid membership to vote | 2, counted from the enrollment date to the day the schedule is announced; exactly 2 years counts, a day less does not | `settings.voter.minYears` |
| After restoration | 1 year before the cutoff | `settings.voter.restoredYears` |
| Blacklisted members on the list | Stay on it, flagged: the owner's criteria do not exclude them | `settings.voter.excludeBlacklisted` |
| Day members can start their own renewal | 1 Jan 2027 | Members Register, Renewal season (`settings.renewal.opensOn`) |
| Renewal period | Day after the last period to the next 31 March; staff can change both dates, with a reason | Renew dialog |
| Financial year | Starts in July | `settings.finance.yearStartMonth` |
| WhatsApp daily limit | 250, Meta's tier for MCCI's number | WhatsApp Settings |

### TODO(MCCI)

- **"Continuous" membership.** Read as: no restoration inside the period, and valid at the cutoff. Renewal history before this release is not in the system, so a past gap in a legacy member's record that was never recorded as a lapse cannot be seen.
- **Fees for past years in a restoration.** The current subscription is used for every unpaid year. Say if old years were charged at old rates.
- **"Timing window" for restored members.** Read as the 1-year rule above. The owner's note mentions a window relative to the announcement; say if it means more.
- **Financial year.** July is assumed from "Year 2026-2027".
- **Trial Balance.** Cash basis, built from receipts, expenses and bank balances. MCCI's accountant should confirm it suits the audit. There are no receivables, payables or fixed assets in it.
- **Default limits for fin, vot and chg.** A proposal; the Secretary General can change them in Staff & Roles.

## Voter terminology

The earlier rule against election and voter terms covered the outreach and WhatsApp modules, and still does. The owner asked for the voter list by name, so it lives in Membership, Reports and AI Insights only. It is not a WhatsApp audience.

## Membership

- **Enrollment dates.** `members.since` may be null for a legacy member. An import with a blank date or "Old" keeps it null, with a warning, rather than using today, which would cost the member their years. Staff enter the SECP and FBR dates on the Member Record and the oldest is used. A date from an approved application is never changed. Correcting one already set needs Approve level and a reason.
- **Renewal.** Staff, or the member from the opening date. A declaration is required: no change, or a change with its document, which goes to the review queue. The voucher pays for the period on the request.
- **Restoration.** Tax returns plus every unpaid year's subscription through a `restoration` voucher. The enrollment date never changes; `restored_at` is what the 1-year rule reads. The old restoration by hand is gone.
- **Change declarations.** From the portal at any time, from renewal, or by staff. Reviewed at `/admin/changes` by `chg` ≥ 3 (Secretary General and President by default). Approval writes the listed fields to the live profile. Partner changes are recorded with the deed in the declaration and History, because the partner list belongs to the application. All of it shows in the Member Record's History tab.
- **Register.** Search and tabs; clicking a member opens the record with a back link. The empty Member Record tab is gone. "Valid till" replaces "Valid to".

## Accounts (`/admin/finance`)

- **Chart.** MCCI's receipt lines 1 to 9 and expense groups A, A-1 to A-7, B, C and D. Spellings corrected (Letters, Generator, Corolla, Compliance, Punjab, Annual, Packages, Specific, Diesel). The last line of group D reads "U Microfinance Bank": the statement says "Bank Profit: U Microfinance Bank" there, which looks like a slip. More accounts can be added on screen.
- **Paisa.** `fin_*` amounts are bigint paisa, because MCCI's statement carries them. This is the one exception to the whole-rupee rule. Voucher amounts stay whole rupees.
- **Receipts.** Membership and service fees come from vouchers Accounts have verified, on the day they verified them, demo companies excluded: admission, subscription, renewal, restoration and card to line 1; visa, E-BIL and letters to line 2; Certificate of Origin and attestation to line 3. Staff enter only what did not come through a voucher. Fee receipts are assumed to reach the default bank, Bank Al-Habib.
- **Audit mechanism.** An entry is never edited or deleted: it is voided with a reason and entered again. Someone other than the person who recorded it verifies it. Closing a month after audit stops new entries and voids in it; reopening needs a reason. The statement can show verified entries only. Every step is in the audit trail.
- **Bank balances.** Books per bank beside the month-end figure from the bank's statement, with the difference shown. The books start from opening balances and the "books start on" date; set these before relying on the Trial Balance.
- **Reports.** 15 days, month, quarter, year or custom. Print or CSV. Several months show as columns with a total.

## Access

- **Password step.** Each access change asks for the person's own password. This is the owner's "master password": it is tied to a named person in the audit log, which a shared password could not be.
- **Modules.** `fin`, `vot` and `chg` join the Staff & Roles grid.
- **Sections on one page.** A person's own limit for one section (`staff_override_set`), and officers per service: with someone named, only they and Approve-level staff can move that service's requests (a row trigger, so every path is covered).
- **Designations.** The Secretary General can add one, optionally copying another's limits. The Secretary General's own access stays fixed; if the By-Laws change this, it is one rule in `role_permission_set`.

## Website content

Posts carry photos, videos and files, chosen in the same form and uploaded right after saving, so a new post can have them too. Events too. Published files sit in the public `site-media` bucket, which holds only what MCCI publishes. Types are checked by their first bytes, and SVG is refused. The news page has channel tabs and shows the gallery on an open post. The home page is unchanged.

The site's upload limit is 10 MB per file, under the server's 11 MB limit. WhatsApp's own 16 MB limit is also capped by that server limit until nginx is changed, which needs separate approval.

## WhatsApp

- **Audience.** Tabs per question: class, renewal, business, consent, city and sector. The detailed builder is folded underneath, and opens when a filter is more than the tabs can show.
- **Media.** Images, PDF, video and audio (MP3, OGG, M4A).
- **What Meta allows.** Outside the 24-hour reply window, only an approved template can be sent, and a template's header can be an image, video or document but not audio. So a voice note reaches only people who wrote in during the last 24 hours. A browser recording cannot be sent as it is, because WhatsApp does not accept Chrome's recording format; upload a file.
- **Daily limit.** A campaign waits for the next day rather than failing at Meta.

## Ask MCCI AI for staff (`/admin/help`)

A guide of tasks, each with its screen and the access it needs. It works without an AI key, because matching needs no model; when the assistant is on, the model only words the answer. Links come from the guide and the person's own access, never from the model, so it cannot offer a screen they may not open. It takes no action. Asked about the voter list with a date, it links straight to that list.

## Deployment

1. Backup, verify, restore drill.
2. `migrate.sh --apply-next` three times: 0590, 0600, 0610. Default limits are added for the three new modules.
3. `scripts/deploy/release.sh <sha>`.
4. In Accounts, set the opening balances and "books start on" before relying on the Trial Balance.

Rollback: `release.sh --rollback` for the code. The migrations are additive, except that `members.since` becomes nullable and hand restoration is withdrawn, so an older release can show a blank date.
