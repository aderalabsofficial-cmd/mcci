# 21 · Final decisions and replan (meetings of 27 Oct 2026 + owner's list of 28 Oct 2026)

**Status: final decisions from the owner (28 Oct 2026); the build plan in §10 has started with R1.** It overrides the earlier specs
(docs/00–17) and the prototype wherever they differ.

**Sources, in order of authority:**
1. The owner's written list of 28 Oct 2026 (sent in chat because the recording's transcript mixed topics). **Where
   it differs from the transcript, the owner's list wins.**
2. The meeting recording of 27 Oct 2026 (transcript `mcci_digital_meeting_transcript_and_decisions.md`; *P1 13:35* =
   part 1, minute 13:35) — used only for details the owner's list does not cover.
3. The owner's earlier decision on proposer & seconder (consent only).

**Marks:** `CHANGE` built differently today · `NEW` not built yet · `REMOVE` take out · `SAME` keep · `LATER` next
phase. **(I)** = my interpretation of a point that could be read two ways — correct it if it is wrong.

---

## 1. Who does what — the hierarchy

```
President ─────────── approves the Membership Committee that the SG assigns
   │
Secretary General ─── runs the secretariat; gives staff their system access (view / edit / approve);
   │                  assigns the Membership Committee (needs the President's approval); sees every file
   │
   ├── Membership Committee (assigned by the SG, approved by the President)
   │      ├── Convener ─────── approves or declines new membership applications
   │      └── Members ──────── see the files on the committee desk; may add a note for the Convener
   │
   ├── IT Convener ─────── the ONLY person who may download / export confidential data
   │                       (members register, applicants' documents, CNICs) — everyone else views on screen only
   │
   ├── Deputy Secretary — Membership
   │      └── Membership Officer ─ checks applications, returns them for correction, types the membership
   │                               number, forwards to the committee; restores lapsed members by hand
   ├── Accounts Officer ─── verifies fee receipts
   ├── Services Officer ─── chamber services (C.O., letters)
   ├── Front Desk / Data Entry
   └── Auditor (read-only)
```

1. `NEW` Designations added: **Membership Committee Convener**, **Membership Committee Member**, **IT Convener**.
2. `NEW` **The SG assigns the Membership Committee** (Convener + members, from staff accounts); the assignment is
   **pending until the President approves it** in the admin panel. Only an approved committee can decide.
   A new assignment replaces the old one when the President approves it; both are kept in the history.
3. `NEW` **Confidential data is never downloaded or sent by the Membership Officer (or any other staff, SG
   included).** Only the **IT Convener** can download a document, export the members register or print it in bulk.
   Everyone else views documents on screen. *(Viewing on screen cannot stop a photo of the screen; every view is
   logged with who and when.)*
4. `SAME` 2-step login for staff, 15-minute idle sign-out, permissions per designation saved with the password, and
   every change in the audit log.

## 2. New membership application — the member's steps

### Step 1 — Business category, type and class
5. `CHANGE` Title: **"Apply for New Membership"** / **نئی رکنیت کی درخواست**.
6. `NEW` First question — **two main categories: 1. Manufacturing · 2. Non-manufacturing.**
   **(I)** The choice answers "Are you a manufacturer?" — that question is no longer asked separately.
7. `CHANGE` Then the **business type**: Proprietorship · Partnership / AOP (**Registered** with Form C, or
   **Unregistered**) · Pvt Ltd (incl. Single Member Company) · Multinational · Public Ltd · **LLP**.
   "Manufacturing Concern" is no longer a business type (it is now the main category).
8. `CHANGE` **"For membership class" comes right after**, before the sector:
   - **Body corporate registered with SECP** (Pvt Ltd / SMC, Public Ltd, Multinational, LLP) → **Corporate**
     directly. The class section is **not shown** at all (only "Women entrepreneur").
   - Proprietorship / AOP, **Manufacturing + sales tax (GST) registered** → **Corporate**.
   - Proprietorship / AOP, **Non-manufacturing + GST + turnover ≥ Rs 50 million** → **Corporate**.
   - Proprietorship / AOP **without GST** → **Associate**.
   - Everything else → **Associate**.
   - The turnover question is shown **only** for Non-manufacturing + GST (the only case where it changes the class).
   - The system decides the class; the applicant sees "You will apply as Corporate / Associate — because …".
9. `CHANGE` **Nature of business (sectors)** after the class:
   - Real estate: **"Builder & developer" + "Construction contractor" → one item "Builders & contractors"**.
   - Health: add **"Pharmaceutical company"**.
   - Finance: **remove "Bank / financial institution"** (banks are not MCCI members); **"Management consultancy" →
     "General consultancy"**.
   - Energy & automotive: **remove "Auto dealer"**, add **"Car dealers & showrooms"**.
   - **"Media & Other Services" becomes two sectors: "Media"** (printing & publishing, advertising & media) **and
     "Other services"** (security, cleaning & facility, other).
   - Members already registered under a removed item keep it on their record (shown as before); it is just no longer
     offered for new choices.

### Step 2 — Documents
10. `CHANGE` Sales tax: only the **Sales Tax Registration Certificate** with its **"with effect from" date** — **no
    sales tax return**. Asked only when the applicant said "GST registered".
11. `CHANGE` "Bank certificate" → **"Bank Maintenance Certificate"**. **Form C** only for a Registered AOP.
12. `CHANGE` **AI reads the documents to fill the form — it never blocks submission.** A wrong or unclear file goes to
    the Membership Officer, who decides.
13. `CHANGE` **Blacklisted (sales tax) businesses can apply and become members.** The system marks the member
    "**must be whitelisted by the next renewal**"; it is checked at renewal (renewal is a later phase), not before
    approval.

### Step 3 — Particulars
14. `CHANGE` **Authorized Representative:** name, designation, CNIC, mobile, **email**, **address**, **passport-size
    photo** (uploaded, cropped).
15. `CHANGE` **Partners / directors:** name, CNIC, mobile, **email**, address, photo, CNIC copy, "make a membership
    card" tick. AOP shows "Managing Partner" / "Partner"; companies show "Director".
16. `CHANGE` Cards: Authorized Representative card **mandatory, Rs 500**; each additional card **Rs 1,000** (both on
    the fee voucher).

### Step 4 — Proposer & seconder
17. `CHANGE` **Consent only:** the proposer and seconder press **Approve** or **Decline** in their own portal. **No
    email code, no signature, no other condition.** Who and when is recorded and shown to staff.

### Step 5 — Declaration & signature
18. `CHANGE` "criminal record / conviction" → **"criminal conviction"** (the word "record" removed). The restoration
    line is removed. The tick is mandatory. Signature drawn or uploaded (both stay).

### Step 6 — Review & submit
19. `SAME` Preview "Application Form for New Membership", then submit.

### Every step — Urdu
20. `CHANGE` **Each step of the application shows a short Urdu explanation** of what to do on that step (beside the
    English), and every label, help line and error is in both languages, so a member who is not comfortable in
    English can finish alone.

## 3. What MCCI does with the application

21. `SAME` **Membership Officer** checks the form and documents; can **return it with a note** — the application
    opens again for the applicant to correct, then comes back.
22. `CHANGE` **Membership number is typed by the Membership Officer** (e.g. **C-201** / **A-786**; C = Corporate,
    A = Associate) before forwarding. The system only checks it is unused and that the letter matches the class.
23. `CHANGE` The officer **forwards the file to the Membership Committee.**
24. `CHANGE` **Committee desk = a list of every forwarded file, at once** — no meeting or agenda has to be created
    first. *(Today a forwarded file waits for a meeting agenda; with no meeting scheduled the desk shows nothing — the
    confusion seen with MCCI-2026-M-0265.)* The **Convener approves or declines** (a reason is required to decline).
    Committee members and the SG see the same list. Meeting records stay available as an optional log.
25. `NEW` **Date of enrollment = the day the Convener approves** — set by the system, cannot be changed.
26. `SAME` **Membership year: 1 April – 31 March**, every year. Enrolled on or before 31 March → the year ends that
    31 March; enrolled from 1 April → the new year to the next 31 March.

## 4. Fee, membership and certificate

27. `SAME` **Fee after approval.** On approval the applicant is notified (portal + email) with the voucher:
    membership fee + card fees.
28. `CHANGE` **Bank AL Habib details** are entered by MCCI in the admin panel and then shown on the voucher (until
    then: "to be confirmed — please do not pay yet"). The member uploads the receipt; **Accounts verifies**; the
    membership becomes **active** at once. `LATER` 1Bill.
29. `REMOVE` **Temporary membership** — the stage, temporary certificate, extensions, the "Temporary &
    Certificates" screen and its permission row.
30. `NEW` **Certificates are printed by the State Bank's security printing press**, not by the system. When MCCI
    receives them it **uploads the scans** (one or many at once). The system:
    - **reads each scan** (AI): membership number, company name, class, year, enrollment date, book / serial no.;
    - **matches it to the member** (or shows what did not match) — staff confirm before anything is saved;
    - **stamps a unique QR code on the scanned certificate** (top-right) — scanning it opens the verified record on
      the MCCI website (stops forged or altered certificates);
    - saves the stamped copy; the member sees and downloads **their own** certificate in the portal.
31. `CHANGE` Card data (Authorized Representative + additional cards) goes from the application to the card vendor.

## 5. Restoration and renewal
32. `CHANGE` **Restoration is done by hand by the Membership Officer** in the admin panel: on a lapsed member's
    record, "Restore membership" with the years and fees settled and a note. **(I)** No online restoration form for
    members.
33. `LATER` Renewal (including the whitelisting check of point 13).

## 6. Register, directory, branding, domain
34. `CHANGE` Members register filters: class, business type, sector, main category. Counters split Corporate /
    Associate.
35. `CHANGE` Public directory from non-confidential fields only; search by sector; sector list as PDF.
36. `CHANGE` New green MCCI logo everywhere (when the file arrives).
37. `NEW` **Moving to mcci.org.pk:** the system must not depend on the current address — all links, emails, QR codes
    and the Android app read one setting (`APP_URL`). QR codes printed before the move keep working (the old address
    forwards to the new one).

## 7. Not now
WhatsApp, bank / card APIs (1Bill later), courier APIs, iOS, renewal, automatic restoration fees, specimen signature
card, Product Showcase, criminal-record API check.

## 8. Still to confirm with MCCI (defaults used until then — each is a setting MCCI can change without a deploy)
1. Membership number format — default: typed as **C-201 / A-786**, shown exactly as typed.
2. Fee amounts (admission, annual, Corporate / Associate / Women) — today's figures stay until MCCI sends the schedule.
3. Certificate scan layout — a sample scan of each book (Corporate, Associate) to place the QR and train the reading.
4. Directory columns — default: company, address, phone, email, sector; member can hide phone / email.
5. Approval without payment — default: reminders after 7 and 14 days; stays "awaiting fee".

## 9. MCCI to hand over
Bank AL Habib account details · green logo file · sample certificate scans (both books) · card layout · fee schedule
· directory sample · names for President / Convener / IT Convener / committee members accounts · official sending
mailbox · access to mcci.org.pk DNS when ready.

---

## 10. Build plan — releases (each: local tests → backup → production, with the owner's approval)

| Release | What MCCI will see | Points |
|---|---|---|
| **R0** | Invitations emailed to every member imported from a sheet (already built, waiting) | — |
| **R1 · Application form** | Main category first; business type with LLP and AOP registered / unregistered; class section moved up and hidden for body corporates; sector list changes; documents (sales tax w.e.f., Bank Maintenance, Form C); AR email / address / photo, partner email; declaration wording; Urdu guidance on every step; AI and blacklisting never block | 5–20 |
| **R2 · Hierarchy and approval** | New designations; SG assigns committee → President approves; committee desk lists every forwarded file; officer types the membership number; Convener approves / declines; enrollment date locked; proposer / seconder consent only | 1–2, 17, 21–26 |
| **R3 · Fee and activation** | Voucher with card fees; Bank AL Habib details setting; membership active on verified payment; temporary membership removed | 27–29 |
| **R4 · Certificates** | Bulk upload of security-printed certificate scans; AI reading and matching; QR stamped; member sees own certificate; verify page | 30–31 |
| **R5 · Confidential data** | IT Convener only downloads / exports; on-screen viewer for everyone else; view log; manual restoration | 3, 32 |
| **R6 · Register and public** | Register filters and split counters; public directory and sector PDF; logo; `APP_URL` ready for mcci.org.pk; engagement pages (events, complaints, support, notifications, content) | 34–37 |

## 11. Rules added while building (for the owner to confirm or change)
- **R1:** members registered earlier under a removed sector item keep it on their record. The sales tax question is
  still asked of a body corporate, only to know whether to ask for the sales tax certificate; it does not change the
  class.
- **R2:** only the Convener of the committee the President approved can approve or decline. The SG and the meeting
  path (agenda, "approve all") no longer decide; meetings and minutes stay as a record and nothing is placed on an
  agenda.
- **R2:** the Convener can also **return a file to the Membership Officer** with a note. The note is internal (the
  applicant does not see it), and so are committee members' notes.
- **R2:** declining a file **releases its typed number**, so it can be given to someone else.
- **R2:** the Convener and the members must be staff accounts with Membership Committee access (for example the
  designations "Membership Committee Convener" / "Membership Committee Member").
- **R2 · demo files** (test applicants): they can be forwarded and seen on the desk, declined or returned, but **never
  approved** (no voucher, no member record), so test data stays out of the official register. A number typed on a
  demo file never blocks the same number for a real applicant. *This is why MCCI-2026-M-0265 (DEMO · AMIR KHAN) was
  not visible on the old desk: the old desk hid demo files and waited for a meeting.*
