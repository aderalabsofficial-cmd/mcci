# 04 · Proposer & seconder (member-to-member endorsement)

## Why
The MCCI form requires every application to be "proposed and seconded by any two valid members of the Multan
Chamber". MCCI will **not** arrange proposers. The applicant chooses two existing members; each member decides
from their own account and signs digitally. Staff can remind, never sign on a member's behalf.

The design follows how other chambers and professional bodies run online endorsements: endorsers must be members
in good standing from different organisations; applicants are told to contact them beforehand; the endorser is
notified electronically and confirms online; requests have deadlines and reminders; a member directory search
helps the applicant find endorsers.
(References: Trinidad & Tobago Chamber membership rules; INAE online nomination guide; digital nomination platform
practice — links in the prototype's final report.)

## Eligibility (computed server-side in `lib/endorse/eligible.ts`)
An endorser member `m` is eligible for application `a` and role `r` when **all** hold:
1. `m.status = 'Permanent'` (not Temporary unless `settings.endorse.tempMembersMayEndorse`), `m.valid_to ≥ today`.
2. `settings.endorse.sameClass` → `m.class = a.class` (applying category). Same-sector members sort first when `preferSector`.
3. `m.company_id ≠ a.company_id`, and `m.rep_name` is not the applicant's representative or any partner/director (normalised name + CNIC match).
4. Not the same company as the other live endorser of the same application.
5. Count of `Approved` endorsements by `m` in the last 365 days `< settings.endorse.maxPerYear` (default 12).
6. No other live request (`Pending|Approved`) for `a` with the same `m`.

The picker shows ineligible members greyed with the reason (so the applicant understands), and never shows
private fields (CNIC, mobile, email).

## Flow

| # | Who | Screen (prototype) | What happens |
|---|---|---|---|
| 1 | Applicant | `member/join` step 4 → "Choose a member" | Search by name, company, sector or membership no. Select → write a personal note (prefilled) → **Send request**. Creates `endorsements(status='Pending', expires_at = now + days)`. |
| 2 | System | — | Portal notification (Realtime) + email to all `Owner`/`Manager` users of the endorser's company: "X has asked you to be their proposer". Audit. |
| 3 | Endorser | `member/endorse` (nav badge + dashboard banner) | Sees waiting requests with days left. **Review** opens applicant summary + read-only official form (no documents). |
| 4 | Endorser | Approve & sign modal | Declaration (prefilled with both names + role) + drawn signature (or saved signature) + 6-digit email code → **Sign & approve**. Store signature PNG, `otp_verified_at`, IP, user agent, `doc_hash`, short `ref`. |
| 4b | Endorser | Decline modal | Reason (list + note). Status `Declined`; applicant notified. |
| 5 | System | — | Applicant notified live. When both Approved and the application is in `proposer` stage → `toCommittee()`. If documents are still being reviewed, `verify` will route straight to committee. |
| 6 | Applicant | step 4 / application page | Pending: *Send reminder* (max once per 24 h) / *Withdraw & choose another*. Declined/Expired: *Choose another member*. |
| 7 | Staff | `admin/mreview` card | Status, requested date, signed time, ref, signature thumbnail, endorsement log; **Remind pending member**. No "confirm on behalf". |
| 8 | Official form | page 2 proposer/seconder table | Name, business, membership no., signature image + "Signed digitally <date> · <ref>". |

Submission rule: the applicant can submit once both roles have a live request (Pending or Approved) — endorsements
can complete while documents are reviewed (parallel, saves days).

## Jobs (`/api/cron/endorsements`, hourly)
- Day `remindDay` (3) after request with no decision → reminder email + portal note (once).
- `expires_at` passed → `Expired`, applicant notified ("choose another member").
- Applications in `proposer` stage > 14 days → shown in admin SLA monitor.

## Re-sign rule after correction
If an application is returned and the applicant changes any of `name, address, ntn, rep, cnic, biz_type`, all
`Approved` endorsements switch to `Pending` with a new `expires_at`, and endorsers are told what changed.

## One-time code
- 6 digits, hashed (sha256 + per-row salt) in `endorsement_otps`, valid 10 minutes, max 5 attempts, resend after 60 s.
- Sent to the email of the signed-in endorser user (must be Owner/Manager of the endorser company).

## Evidence & integrity
`doc_hash = sha256(official form PDF bytes at signing time)`; `ref` = first 12 chars of base32(sha256(endorsement id + signed_at)).
The verify page accepts the ref and shows "Signed by <name> (<member no>) on <date> for <application token>".

## Settings (admin → Settings → Proposer & seconder rules)
`sameClass`, `preferSector`, `needCode`, `days` (7), `remindDay` (3), `maxPerYear` (12), `tempMembersMayEndorse` (false).

## Acceptance tests (Playwright, two browser contexts)
1. Applicant sends both requests → endorser context sees badge = 1 within 3 s (Realtime) → signs → applicant sees "Signed" without reload.
2. Ineligible members (different class, expired, same company, limit reached) cannot be selected; server rejects a forged request.
3. Decline → applicant sees reason and can choose another; old row stays in log.
4. Expiry job marks Pending → Expired after `days`.
5. Both signed + documents verified → application in `committee`; official form PDF shows both signatures.
6. Endorser cannot open `application_documents` (RLS test).
