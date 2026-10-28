# 22 · Requirement → implementation matrix (owner's decisions of 27–28 Oct 2026)

Sources: the owner's written list (28 Oct 2026), `docs/21-meeting-decisions-2026-10-27.md`, and the owner's release
instructions of 28 Oct 2026 (phases 1–5). **Status** is one of: `implemented` (built, not yet covered by a test),
`tested` (built and covered by an automated test), `missing`, `ambiguous`, `awaiting MCCI` (a policy MCCI must
decide; the default below is a setting MCCI can change without a deploy). "Where" names the migration / code / test.

Statuses are updated as each release lands; the final state is in §5 and the release checklist (`docs/23`).

## 1. Application (R1)

| # | Requirement | Status | Where / note |
|---|---|---|---|
| 1.1 | Two main categories first: Manufacturing / Non-manufacturing | tested | wizard step 1; `missing()` code `category`; pgTAP 230; e2e application |
| 1.2 | Manufacturing and Non-manufacturing stay distinct; nothing auto-turns a non-manufacturer into a manufacturer | tested | the category is the only source of `form.manufacturing`; unit `classOf` tests. **Contradictory note flagged:** the owner's line "if any business is non-manufacturing then it should be auto detected as a manufacturing" contradicts the two categories; we follow the categories (docs/21 point 6). |
| 1.3 | Body corporate registered with SECP (Pvt/SMC, Public, MNC, LLP) = Corporate; class section hidden | tested | `classOf`, `private.class_of` (0421); pgTAP 230; e2e LLP / Pvt |
| 1.4 | Proprietorship / AOP: Manufacturing + GST → Corporate; Non-manufacturing + GST + turnover ≥ Rs 50 M → Corporate; no GST → Associate | tested | same; turnover asked only for Non-manufacturing + GST |
| 1.5 | AOP registered (Form C) / unregistered | tested | `aopRegistered`; Form C only when registered |
| 1.6 | Sector list: Builders & contractors combined; Pharmaceutical company; banks removed; General consultancy; Car dealers & showrooms; Media and Other services separate | tested | `lib/membership/reference.ts`; unit test "sector list of 28 Oct 2026" |
| 1.7 | Sales tax: registration certificate with w.e.f. date, no return | tested | `stWef`; 0421 labels; pgTAP 230 |
| 1.8 | Authorized representative: passport-size photo, email, address required | tested | photo document `photo` (required), `repEmail`, `repAddress` in `missing()` |
| 1.9 | Partners / directors: email and address required | see R3 | 0421 added the fields; making them **required** at submission: migration 0441 |
| 1.10 | Declaration: "criminal conviction" (word "record" removed) | tested | messages + official form |
| 1.11 | Bilingual guidance on every application step | tested | `wz-guide` on all six steps; e2e checks the Urdu text |
| 1.12 | Blacklisted applicants may apply; AI / sales-tax status never blocks submission | tested | nothing in `app_missing` checks it |

## 2. Hierarchy and approval (R2)

| # | Requirement | Status | Where / note |
|---|---|---|---|
| 2.1 | SG proposes the Membership Committee | tested | `api.cmt_assign_propose` (0430); pgTAP 240; e2e committee |
| 2.2 | President approves the assignment | tested (DB) / UI test in R5 | `api.cmt_assign_decide`; e2e with a President account added in the final pass |
| 2.3 | Only the approved committee does internal committee work; only the Convener decides | tested | `private.is_convener`, `is_committee_member`; negative tests pgTAP 160/240 |
| 2.4 | Membership Officer verifies documents, types the number, forwards | tested | `api.app_verify`, `api.app_forward` |
| 2.5 | Committee notes internal, never in the applicant's tracking view | tested (DB policy) | `app_history_select` policy (0430); e2e check added in the final pass |
| 2.6 | Proposer / seconder consent only | tested | `api.end_approve`; `end_sign` revoked |
| 2.7 | Membership number typed by the officer; class letter matches; unique | tested | `private.typed_member_no`, `app_forward` |
| 2.8 | Re-use of a number only when policy allows | awaiting MCCI | default **no re-use**: a declined file keeps its number reserved; setting `membership.releaseNumberOnDecline` (0441) lets MCCI allow re-use |
| 2.9 | Official numbering convention (C-201 vs MCCI-C-201) | awaiting MCCI | default: stored as typed and normalised (`C-201`); uniqueness compares across both forms |

## 3. Fee, membership, renewal, restoration (R3)

| # | Requirement | Status | Where / note |
|---|---|---|---|
| 3.1 | No temporary membership stage or certificate | missing → R3 | 0440: activation on verified fee; temp issue / extend refused |
| 3.2 | Accounts verify the fee before the membership becomes active | missing → R3 | `private.voucher_paid` → activation |
| 3.3 | Tenure always 1 April – 31 March of the membership year (never 12 months from approval) | missing → R3 | `private.year_end_of(enrollment date)` |
| 3.4 | Late-year approvals (e.g. approved in March: valid only to that 31 March) | awaiting MCCI | owner said "enrolled up to 31 March → that year ends 31 March". Whether a March applicant pays a full year's subscription for a few days, or the first year is extended, is **not decided**; nothing is invented. |
| 3.5 | Renewal grace period after 31 March | awaiting MCCI | no grace period invented; status becomes Expired after 31 March as today |
| 3.6 | Blacklisted member: must be whitelisted before renewal; auditable decision; clear message to staff | missing → R3 | 0441: officer records "blacklisted" (with source / reason) and later "whitelisted" (with evidence); renewal refuses until whitelisted; not tied to ATL / sales tax |
| 3.7 | Renewal (staff-started, fee verified by Accounts, extends to the next 31 March) | missing → R3 | 0441 `api.member_renew_start`; voucher `renewal`; activation on payment |
| 3.8 | Restoration is a manual Membership Officer action with reason, audit, permission | missing → R3 | 0441 `api.member_restore` |
| 3.9 | Declined, returned, unpaid, duplicate, already-paid applications: safe outcomes | partly tested → R3 | stage checks; voucher state machine; tests in R3 |
| 3.10 | Demo records never get real numbers, certificates, vouchers or permanent approval | tested (approval) → R3 for the rest | 0430 refuses approval; R3/R4 add certificate / voucher guards |

## 4. Certificates and document security (R4, R5)

| # | Requirement | Status | Where / note |
|---|---|---|---|
| 4.1 | Upload scans of security-press certificates to private storage | missing → R4 | bucket `certificate-scans` (private) |
| 4.2 | OCR / AI extraction with confidence; match to members; conflicts flagged | missing → R4 | OpenAI structured output (fake model in tests) |
| 4.3 | Human review and explicit confirmation before any record changes; never auto-create / overwrite | missing → R4 | `api.cert_scan_confirm` only after review; no member creation from OCR |
| 4.4 | Unique QR stamped on the scan, linked to the member's certificate | missing → R4 | `public.documents` (kind `certificate`) + sharp overlay |
| 4.5 | Public verification shows only intended fields | missing → R4 | `api.doc_verify` fields reviewed |
| 4.6 | Log upload, extraction, approval, correction, QR assignment, revocation | missing → R4 | audit triggers + history rows |
| 4.7 | Only the IT Convener downloads / exports confidential documents and the register | missing → R5 | storage policies + server proxy that serves inline only and logs every view |
| 4.8 | A Membership Officer cannot obtain confidential files by URL, server action, API or storage endpoint | missing → R5 | negative tests (pgTAP storage + e2e) |
| 4.9 | Domain move to mcci.org.pk ready (no hard-coded host) | implemented | `APP_URL` everywhere; checked in the final pass. DNS / domain not touched. |

## 5. Not built (agreed "later") and open items
Renewal by the member online, 1Bill, Product Showcase, specimen card, public directory PDF, new logo file, register
filters and split counters (R6), engagement pages (parked M8 — not part of this release).
