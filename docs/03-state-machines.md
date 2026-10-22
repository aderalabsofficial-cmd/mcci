# 03 · State machines

All transitions are implemented in `lib/flow/*.ts` as pure functions + one server action each. Since 22 Oct 2026 the
server action calls a narrow `api.*` database function that re-checks the permission inside PostgreSQL and writes the
state, history and audit (decision 4, `docs/17` §1); the service role is not used for user actions. A transition:
1. loads the row `for update`, 2. checks the current state is allowed, 3. checks the actor's permission,
4. writes the new state + `application_history` + `audit_log`, 5. queues notifications, 6. returns the row.
Illegal transitions throw `FlowError('…')` shown to the user as a friendly bilingual message.

## 1. Membership application (`applications.stage`)

```
draft ──submit──▶ submitted ──open by officer──▶ review ──return(note)──▶ returned ──resubmit──▶ review
                                                   │
                                                   ├─verify (all docs ok) ──▶ [both endorsements Approved?]
                                                   │                              ├─ yes ─▶ committee
                                                   │                              └─ no  ─▶ proposer
                                                   └─reject (SG, reason) ──▶ rejected
proposer ──(2nd endorsement signed)──▶ committee        # automatic, see 04-endorsement.md
committee ──approve──▶ payment     (member_no allocated, voucher created & emailed)
committee ──defer────▶ committee   (next meeting)
committee ──reject───▶ rejected
payment ──receipt uploaded──▶ payment (voucher 'Receipt uploaded')
payment ──Accounts verify──▶ temp  (if settings.temp.autoIssue, else staff "Issue temporary")
temp ──certificate scan uploaded + serial confirmed──▶ permanent
draft|submitted|review|returned|proposer ──withdraw (applicant)──▶ withdrawn
```

Guards
- `submit`: `validateApp()` = all required documents uploaded for the business type, photo, signature, stamp
  (not for proprietorship if MCCI agrees), both declarations ticked, jurisdiction confirmed, address matches NTN,
  **proposer and seconder each have a live request (Pending or Approved)**.
- `verify`: every `application_documents.status = 'ok'`; officer checklist complete.
- `approve` (committee): stage = committee; Committee Secretary or SG (`cmt ≥ approve`).
- Member-facing "what to do now" card is derived from stage + sub-states (see prototype `member.js next()`).

## 2. Endorsement (`endorsements.status`) — details in `04-endorsement.md`

```
(none) ──request──▶ Pending ──sign──▶ Approved
                      │ ├──decline(reason)──▶ Declined ──(applicant chooses another)──▶ new row
                      │ ├──expires_at passed──▶ Expired  ──(applicant chooses another)──▶ new row
                      │ └──withdraw (applicant)──▶ Withdrawn
Approved ──material form change after return──▶ Pending (re-sign requested)
```

## 3. Payment voucher (`payment_vouchers.status`)

```
Unpaid ──receipt upload──▶ Receipt uploaded ──verify (Accounts)──▶ Paid
   │                              └──reject(reason)──▶ Rejected ──re-upload──▶ Receipt uploaded
   ├──due date passed (job)──▶ Expired ──regenerate──▶ new voucher
   └──cancel (Accounts, reason)──▶ Cancelled
```
`Paid` on a membership voucher triggers `issueTemporary()` when `settings.temp.autoIssue`.

## 4. Temporary membership (`temp_memberships.status`) and printing (`print_items.status`)

```
issueTemporary: members.status=Temporary, temp row active (expires = now + temp.days), QR doc 'Temporary',
                print_items queued, email + portal message with certificate PDF.
active ──days left = alert1 / alert2 (job)──▶ active (alert sent once each)
active ──expires_at passed (job)──▶ expired   (members.status=TempExpired, services paused, QR shows Expired)
active|expired ──extend (SG, ≤ maxExtensions, reason)──▶ active (expires += extendDays)
active|expired ──convert──▶ converted (members.status=Permanent, valid_to=31 Mar, permanent QR 'Valid',
                                       temporary QR 'Superseded' → superseded_by permanent)
active ──revoke (SG, reason)──▶ revoked (QR 'Revoked')

print_items: queued ──add to batch──▶ sent ──printer confirms──▶ printing ──batch received──▶ received
             received ──scan uploaded + serial confirmed──▶ converted (triggers temp convert)
print_batches: Draft ─▶ Sent to printer ─▶ Printing ─▶ Received ─▶ Closed
```
Serial rules: unique; a spoiled serial is recorded in `serial_spoilage` with reason and never reused.

## 5. Service request (`service_requests.status`)

```
Submitted ──start (Services Officer)──▶ In review ──return(note)──▶ Returned ──member resubmits──▶ In review
In review ──approve──▶ Ready to sign ──sign (President / SG, svc ≥ approve)──▶ Issued (PDF + QR document)
any open ──reject(reason)──▶ Rejected ;  Submitted ──cancel (member)──▶ Cancelled
```
SLA: `sla_due_at = submitted_at + service_types.sla_hours`; job flags breaches; dashboard counts "due in < 4 h".
Only permanent members, and temporary members when `settings.temp.servicesAllowed`, can submit.

## 6. Invitations (staff & company users)

```
Invited ──accept (set password, staff: enable TOTP)──▶ Active
Invited ──7 days──▶ Expired ──resend──▶ Invited (new token)
Invited|Active ──revoke──▶ Revoked
```
