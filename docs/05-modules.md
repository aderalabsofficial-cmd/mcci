# 05 · Modules and acceptance criteria

Each module lists the prototype screens it must reproduce (`reference/prototype/<role>/<page>/`), the actions
(`catalogue/actions.md`) and acceptance criteria. "AC" items become Playwright tests.

---

## M1 · Accounts, sign-in, invitations
**Screens:** `site/login`, member `profile` (people tab), admin `staff`.
**Build**
- Register (start application): name, mobile, email, password → email verification → company draft created.
- Sign-in: email + password, or email one-time code. Staff must enable TOTP on first sign-in.
- Staff invitations (`staff.invite`), resend, revoke, change designation; per-module limit editor (`perm.*`).
- Company users: Owner invites Manager / Services / Accounts / Viewer (`user.invite`, `user.resend`, `user.remove`).
- "View panel as" is a **Demo** feature — do not build. Instead build a read-only "permissions preview" table.
**AC**
- An invitation link works once, expires in 7 days, and lands on "set password" (+ TOTP for staff).
- A Viewer cannot see any action button that changes data; the server rejects the action if forced.
- Every sign-in, failed sign-in and permission change appears in `audit_log`.

## M2 · Public website
**Screens:** `site/home, about, membership, services, service, directory, verify, track, live, news, resources, contact, login`.
**Build**
- Full-width hero image (`hero-bg.jpg`) under a transparent header that turns solid on scroll; colour layer
  `rgba(navy, .80)` → `rgba(teal, .60–.66)` gradient on desktop, uniform 80 % on ≤ 900 px; text AA contrast.
- Motion: ken-burns hero, particle canvas, scroll reveal, counters, marquee, card tilt/glow, reading progress bar;
  all disabled under `prefers-reduced-motion`.
- Directory reads `public_directory` view only. Verify uses `/api/verify/[code]` (rate-limited 30/min/IP).
- Track shows stage + dates only (no names) for a token.
- Contact creates a ticket (`tk.*`) and emails a reference number.
- Language toggle EN ⇄ اردو (RTL).
**AC**
- Lighthouse ≥ 90 performance / 100 accessibility on home (mobile).
- Hero headline contrast ≥ 4.5 : 1 measured over the image at 3 breakpoints.
- No member private data on any public page.

## M3 · Membership application (member)
**Screens:** `member/join` (6 steps), `membership`, `mtrack`, `form`, `dashboard`.
**Build**
1. Business type → class rule explanation + jurisdiction question.
2. Documents by business type (`document_requirements`), drag & drop, phone camera, preview, replace;
   passport photo with crop (35 × 45 mm, 350 × 450 px JPEG) and face-centred auto-crop.
3. **AI fill** (`wiz.ai`) — see `08-documents-ai.md`. Fields with confidence < 85 highlighted "please check".
   Partners/directors table; extra cards.
4. **Proposer & seconder** — `04-endorsement.md`.
5. Signature pad (or upload), company stamp upload with background cleaning, two declarations.
6. Official 4-page form preview (HTML = PDF), "missing items" list, submit.
- Autosave every field (debounced 600 ms); resume from any device.
- Returned: correction screen listing only rejected items + officer note.
- Dashboard "what to do now" card per stage; 8-step tracker; full history.
**AC**
- A proprietorship applicant sees exactly 7 document slots; Pvt Ltd sees 11.
- Submitting with a missing item is impossible and lists the missing items in plain words.
- The generated PDF matches the paper form layout (page 1 letter, page 2 particulars, pages 3–4 instructions & fees)
  with photo, signatures and stamp placed.

## M4 · Endorsements
See `04-endorsement.md` (screens `member/join` step 4, `member/endorse`, admin `mreview` card, settings block).

## M5 · Review, committee, decision (admin)
**Screens:** `admin/dashboard`, `requests` (pipeline), `mreview`, `committee`, `meetings`.
**Build** document accept/reject with reason, field correction with reason (`adm.edit`), class override (SG),
officer checklist, return / verify / reject, committee agenda (auto-added), approve / defer / reject, approve all,
minutes upload, membership number allocation, voucher creation + email.
**AC** verify routes to committee when both endorsements are signed, else to `proposer`; committee approval
allocates the next number per class and emails the voucher PDF.

## M6 · Payments (manual this phase)
**Screens:** member `payments`; admin `payments`, `psid` (labelled "Payment vouchers").
**Build** voucher PDF (bank, IBAN, amount, due date, reference), receipt upload (image/PDF), Accounts verify / reject
with reason, expiry job, regenerate. Provider abstraction `lib/payments/provider.ts` with only `manual` implemented.
**AC** a verified membership voucher issues temporary membership automatically (setting on) within one request.

## M7 · Temporary → permanent, printing, certificates
**Screens:** member `membership`, `documents`; admin `temp`, `certs`, `serials`, `documents`.
**Build** temporary certificate PDF with QR; 15/7-day alerts; extension (SG); revoke; print batches with steps;
receiving: upload scan + confirm serial → convert; spoiled serials; delivery: collect or courier (manual tracking).
**AC** after conversion the old QR shows "Superseded by <serial>", member status Permanent valid to 31 March, and
both member and admin screens update live.

## M8 · Services (7)
**Screens:** member `apply`, `applications`, `application`; admin `applications`, `review`, `sla`, `approvals`, `services`.
**Build** dynamic form per `service_types` (fields + documents), fee voucher when fee > 0, token, SLA timer,
start / return / approve / sign (single and batch), issued letter PDF with QR, member download.
**AC** each of the 7 services can be requested, returned, resubmitted and issued; SLA breach appears in the monitor.

## M9 · Members register & import
**Screens:** admin `members`, `member`, `import`.
**Build** searchable register, member profile (company, users, documents, payments, history), status change (SG),
change requests approval, **Excel import** with template, dry-run validation report, then commit (`13-seed-import.md`).
**AC** importing MCCI's file creates members who can immediately endorse applicants.

## M10 · Engagement & content
**Screens:** member `notifications`, `events`, `opportunities`, `support`, `assistant`; admin `events`, `complaints`,
`content`, `notify`. **Build** notifications centre, events + registration, complaints with replies, news/pages CMS,
email templates editor (EN/UR) and campaigns (email + portal only), Ask MCCI AI.

## M11 · Reports, audit, settings
**Screens:** admin `reports`, `ai`, `audit`, `integrations`, `settings`.
**Build** reports (applications by stage, time-to-decision, temp memberships, services by SLA, revenue) with CSV
export; audit log filters + export (SG); integrations status page (bank & courier "waiting for partner");
settings (chamber details, bank, fees, temp policy, endorsement rules, toggles, backup download).
