# Actions catalogue

Generated from the v10 prototype action registry (`M.act`). 211 actions. Every button, tab and link in the prototype calls one of these.

- **Build** — implement in this phase (server action / API route + UI).
- **UI** — client-only behaviour (tabs, toggles, filters). Implement in the component.
- **Demo** — prototype helper. Do **not** build (demo shortcuts, account switchers, sample data buttons).

Acceptance rule: every `Build` row has a server action or route handler, an authorization check matching `docs/06-roles-permissions.md`, an audit-log entry when it changes data, and a Playwright test that clicks it.

## `acc.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `acc.locked` | UI | Explain a locked control | `—` | — | — | Shown when a person’s limits do not allow an action |
| `acc.viewas` | Demo | View the panel as another person | `—` | — | — | Not part of the built system — everyone sees only their own limits |
| `acc.as` | Demo | Switch to person (demo) | `—` | — | — | Not part of the built system |

## `adm.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `adm.app.open` | Build | Open membership application | `GET /api/applications/{token}` | applications | Membership Officer · SG · Committee | Full file view |
| `adm.doc.ok` | Build | Accept a document | `PATCH /api/applications/{id}/documents/{doc} {status: verified}` | application_documents, audit_log | Membership Officer | Marks verified with officer name and time |
| `adm.doc.reject` | Build | Reject a document with reason | `PATCH /api/applications/{id}/documents/{doc} {status: rejected, reason}` | application_documents, audit_log | Membership Officer | Reason shown to applicant when the file is returned |
| `adm.check` | Build | Tick officer checklist item | `PATCH /api/applications/{id}/review` | application_reviews | Membership Officer | Checklist stored with the decision |
| `adm.return` | Build | Return application for correction | `POST /api/applications/{id}/return` | applications, application_events, notifications | Membership Officer | Applicant gets an email + portal message with the reason; SLA pauses |
| `adm.verify` | Build | Verify documents → committee (once endorsed) | `POST /api/applications/{id}/verify` | applications, proposals, notifications | Membership Officer | Goes straight to the committee when both endorsements are signed; otherwise waits for them |
| `adm.reject` | Build | Reject application | `POST /api/applications/{id}/reject` | applications, notifications | Secretary General | Final rejection with reason |
| `adm.edit` | Build | Correct a field (staff, with reason) | `PATCH /api/applications/{id} {field, reason}` | applications, audit_log | Membership Officer | Old and new value kept in audit log |
| `adm.cls` | Build | Override membership class | `PATCH /api/applications/{id} {class, reason}` | applications, audit_log | Secretary General | Fee recalculated |
| `adm.prop.remind` | Build | Remind proposer / seconder | `POST /api/endorsements/{id}/remind` | notifications | Membership Officer | Re-sends the request notification; staff can never sign on a member’s behalf |

## `ai.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `ai.open` | Build | Ask MCCI AI | `POST /api/ai/chat` | ai_conversations | Public · members · staff | OpenAI with MCCI knowledge base + the member’s own records (RLS); hands over to a human when unsure |
| `ai.ask` | Build | Ask a suggested question | `POST /api/ai/chat` | — | — | Same as Ask MCCI AI |
| `ai.send` | Build | Send question to AI | `POST /api/ai/chat` | — | — | Same as Ask MCCI AI |

## `app.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `app.fix.upload` | Build | Re-upload a returned document | `POST /api/applications/{id}/documents` | application_documents | Applicant | Replaces the rejected file; officer sees “re-uploaded” |
| `app.resubmit` | Build | Resubmit after correction | `POST /api/applications/{id}/resubmit` | applications, application_events, notifications | Applicant | Returns the file to the same officer with changes highlighted |
| `app.new` | Demo | Start a new membership application | `—` | — | — | Production: each business has its own application record |
| `app.remind` | Build | Remind my proposer / seconder | `POST /api/applications/{id}/proposer-reminder` | notifications | Applicant (max once a day) | Re-sends the confirmation email |

## `audit.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `audit.export` | Build | Export audit log | `GET /api/audit/export.csv` | audit_log | Auditor · SG | Immutable log |
| `audit.view` | UI | Audit entry | `—` | — | — | Detail |

## `backup.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `backup.now` | Build | Download data backup (JSON) | `POST /api/backups` | all | Super admin | Encrypted daily backups |

## `batch.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `batch.create` | Build | Create print batch | `POST /api/print-batches` | print_batches, print_items, serials | Membership Officer | Reserves serial range |
| `batch.step` | Build | Advance batch (proof → printer → printed → received) | `PATCH /api/print-batches/{id}` | print_batches, print_items | Membership Officer | Receipt requires two-officer count |
| `batch.view` | UI | View batch | `—` | — | — | Detail |
| `batch.file` | Build | Download print file for printer | `GET /api/print-batches/{id}/file` | print_items | Membership Officer | CSV/XML + PDF proof |

## `cal.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `cal.move` | UI | Previous / next month | `—` | — | — | Client-side |
| `cal.day` | UI | Open calendar day | `—` | — | — | Client-side |

## `campaign.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `campaign.renewal` | Build | Send renewal reminders | `POST /api/campaigns/renewal` | notifications | Membership Officer | Runs on 1 March automatically |

## `card.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `card.request` | Build | Request card for partner / director | `POST /api/memberships/{id}/cards` | member_cards, psids | Member | Issues a Rs. 1,000 payment voucher per card; printed with the next batch |

## `cert.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `cert.share` | Build | Copy verification link | `GET /api/verify/{code}` | documents | Public | Public page shows only document type, company, status and dates |
| `cert.scan.pick` | UI | Choose scan of printed certificate | `POST /api/uploads` | — | — | Uploads to private bucket |
| `cert.scan.sample` | Demo | Use sample scan | `—` | — | — | Not in production |

## `chart.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `chart.point` | UI | Show chart value | `—` | — | — | Tooltip |

## `chg.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `chg.decide` | Build | Approve / reject change of particulars | `POST /api/change-requests/{id}/decision` | change_requests, members, applications | Membership Officer | Approved changes update the record and form |

## `cmt.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `cmt.decide` | Build | Committee decision (approve / defer / reject) | `POST /api/committee/{meeting}/decisions` | committee_decisions, applications, psids, notifications | Committee Secretary (records the committee’s decision) | Approval allocates the membership number and issues the payment voucher |
| `cmt.approveAll` | Build | Approve all items on agenda | `POST /api/committee/{meeting}/decisions (bulk)` | committee_decisions | Committee Secretary | Bulk approval after the meeting |

## `contact.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `contact.send` | Build | Send contact message | `POST /api/contact` | tickets | Public | Creates ticket CT-xxxx, emails confirmation; spam-protected (Turnstile) |

## `copy.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `copy` | UI | Copy to clipboard | `—` | — | — | Client-side |

## `dd.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `dd.toggle` | UI | Open dropdown | `—` | — | — | Client-side only |

## `delivery.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `delivery.set` | Build | Choose collection or courier for printed certificate | `PATCH /api/memberships/{id}/delivery` | memberships.delivery | Member | Counter collection with CNIC, or courier — staff enter the tracking number (automatic courier booking once MCCI provides a courier API) |

## `demo.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `demo.open` | Demo | Prototype demo controls | `—` | — | — | Not part of production |
| `demo.preset` | Demo | Jump demo to stage | `—` | — | — | Not part of production |
| `demo.reset` | Demo | Reset demo data | `—` | — | — | Not part of production |
| `demo.audit` | Demo | Run orphan-button audit | `—` | — | — | Runs in CI on every build (Playwright) |

## `dir.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `dir.view` | Build | View member in directory | `GET /api/directory/{no}` | members (public fields) | Public | Only public fields: company, class, sector, city, status |

## `dispatch.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `dispatch.set` | Build | Record collection / courier | `PATCH /api/memberships/{id}/delivery` | memberships.delivery | Membership Officer | Tracking entered manually (automatic courier booking once MCCI provides a courier API); member notified |

## `doc.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `doc.view` | Build | View document | `GET /api/documents/{id}/preview` | documents, storage (private bucket) | Owner member · staff | Signed, short-lived URL to the rendered PDF |
| `doc.print` | Build | Print / save as PDF | `GET /api/documents/{id}.pdf` | documents | Owner member · staff | Server renders a PDF (A4/Letter) with QR; download is logged |

## `end.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `end.policy` | Build | Edit proposer / seconder rules | `POST/PATCH /api/end` | end | Staff | Simulated in prototype |
| `end.pick` | Build | Choose a member as proposer / seconder | `GET /api/members/eligible?role=` | members (public fields), endorsements | Applicant | Only valid permanent members of the same class; conflicts and yearly limits filtered out |
| `end.compose` | Build | Write a note and send the endorsement request | `POST /api/endorsements` | endorsements, notifications, audit_log | Applicant | Creates the request (expires in 7 days), notifies the member live in their portal and by email |
| `end.remind` | Build | Remind proposer / seconder | `POST /api/endorsements/{id}/remind` | notifications | Applicant (once a day) · Membership Officer | Re-sends the portal notification and email |
| `end.withdraw` | Build | Withdraw request and choose another member | `DELETE /api/endorsements/{id}` | endorsements | Applicant | Request closed; member notified |
| `end.review` | Build | Review an endorsement request | `GET /api/endorsements/{id}` | endorsements, applications (summary) | The requested member only | Shows the applicant summary and their official form (documents stay private) |
| `end.sign` | Build | Approve and sign digitally | `POST /api/endorsements/{id}/sign` | endorsements, signatures, applications, notifications, audit_log | The requested member only (must be signed in) | Declaration + signature + one-time email code; stores time, device and a document hash; signature appears on the official form |
| `end.decl` | UI | Accept endorsement declaration | `—` | — | — | Required before signing |
| `end.clear` | UI | Clear signature | `—` | — | — | Client-side |
| `end.saved` | UI | Use saved signature | `—` | — | — | Signature saved from a previous signing |
| `end.sample` | Demo | Sample signature | `—` | — | — | Not part of the built system |
| `end.decline` | Build | Decline an endorsement request | `POST /api/endorsements/{id}/decline` | endorsements, notifications | The requested member only | Applicant is told and can choose another member |
| `end.demoSign` | Demo | Proposer & seconder sign (demo shortcut) | `—` | — | — | Not part of the built system |

## `ev.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `ev.create` | Build | Create event | `POST/PATCH /api/ev` | ev | Staff | Simulated in prototype |
| `ev.edit` | Build | Edit event | `POST/PATCH /api/ev` | ev | Staff | Simulated in prototype |

## `event.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `event.reg` | Build | Register for event | `POST /api/events/{id}/registrations` | event_registrations | Member | Seat reserved; email confirmation and reminder |
| `event.view` | Build | Event details | `GET /api/events/{id}` | events | Public · member · staff | Details page |

## `faq.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `faq.toggle` | UI | Open FAQ answer | `—` | — | — | Content from CMS |

## `fees.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `fees.edit` | Build | Edit membership fee schedule | `POST/PATCH /api/fees` | fees | Staff | Simulated in prototype |

## `help.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `help.call` | UI | Call MCCI helpdesk | `—` | — | — | tel: link |
| `help.email` | UI | Email MCCI | `—` | — | — | mailto link to the helpdesk |
| `help.visit` | UI | Visit MCCI (address & hours) | `—` | — | — | Map link |

## `imp.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `imp.template` | Build | Download import template | `GET /api/import/template.csv` | — | — | CSV template |
| `imp.file` | Build | Upload CSV / Excel for import | `POST /api/import (validate)` | imports | Membership Officer | Validates NTN, class, expiry; finds duplicates |
| `imp.commit` | Build | Import validated rows / roll back | `POST /api/import/{id}/commit / rollback` | members, imports | Membership Officer | Transactional import with rollback |

## `int.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `int.cfg` | Build | Configure integration | `POST/PATCH /api/int` | int | Staff | Simulated in prototype |
| `int.test` | UI | Test integration | `—` | — | — | Simulated |

## `lang.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `lang.toggle` | Build | English / اردو | `PATCH /api/me/preferences {lang}` | users.preferences | — | Language preference stored on the user; emails follow it |

## `login.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `login.member` | Build | Member sign in | `POST /api/auth/login (Supabase Auth)` | auth.users, sessions | Members | Email / member ID + password, or a one-time code by email; rate-limited |
| `login.otp` | Build | Sign in with email code | `POST /api/auth/otp` | auth.otp | Members | One-time code by email, 5-minute expiry |
| `login.staff` | Build | Staff sign in (2-step) | `POST /api/auth/login + TOTP` | auth.users, staff | Staff | Two-step login enforced for all staff |

## `mem.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `mem.open` | UI | Open member record | `—` | — | — | Detail |
| `mem.add` | Build | Add member manually | `POST /api/members` | members | Membership Officer | For legacy records |
| `mem.edit` | Build | Edit member record field | `PATCH /api/members/{no}` | members, audit_log | Membership Officer | Reason logged |
| `mem.status` | Build | Suspend / reactivate member | `PATCH /api/members/{no}/status` | members, documents | Secretary General | Certificate QR follows status |
| `mem.renew` | Build | Issue renewal voucher (subscription only) | `POST /api/memberships/{no}/renewal` | renewals, psids | Accounts · member | Annual subscription only |
| `mem.msg` | Build | Message member | `POST /api/notifications` | notifications | Staff | Email + portal message |
| `mem.cert` | Build | Upload certificate scan (legacy record) | `POST /api/members/{no}/certificate` | certificates | Membership Officer | Stores scan, links serial |

## `menu.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `menu.toggle` | UI | Open / close menu (mobile) | `—` | — | — | Client-side only |

## `modal.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `modal.close` | UI | Close dialog | `—` | — | — | Client-side only |

## `mt.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `mt.create` | Build | Schedule meeting | `POST/PATCH /api/mt` | mt | Staff | Simulated in prototype |
| `mt.minutes` | Build | Record minutes | `POST/PATCH /api/mt` | mt | Staff | Simulated in prototype |

## `nav.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `nav` | UI | Go to page | `—` | — | — | Router navigation |

## `note.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `note.readall` | Build | Mark all notifications read | `POST /api/me/notifications/read-all` | notifications | Member | Marks read |
| `note.open` | Build | Open notification | `PATCH /api/me/notifications/{id}` | notifications | Member | Marks read and shows full text |

## `opp.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `opp.post` | Build | Post a trade requirement | `POST /api/opportunities` | opportunities | Member | Moderated by MCCI and shared with members of the same sector |
| `opp.reply` | Build | Reply to a buyer match | `POST /api/opportunities/{id}/replies` | opportunity_replies | Member | Introduction sent through MCCI |

## `pay.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `pay.upload` | Build | Upload paid bank receipt | `POST /api/vouchers/{no}/receipt` | payment_vouchers, storage.objects, notifications | Member | Photo / PDF of the bank deposit or transfer slip; Accounts are notified to verify |
| `pay.sample` | Demo | Use sample receipt | `—` | — | — | Not part of production |
| `pay.verify` | Build | Verify uploaded bank receipt | `POST /api/vouchers/{no}/verify` | payment_vouchers, payments, memberships, notifications | Accounts Officer | Accounts checks the slip against the bank statement; verification issues the temporary membership |
| `pay.reject` | Build | Reject uploaded receipt with reason | `POST /api/vouchers/{no}/reject` | payment_vouchers, notifications | Accounts Officer | Member asked to upload a clear / correct receipt |

## `perm.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `perm.cycle` | Build | Change a designation’s limit for a module | `PATCH /api/roles/{designation}/limits` | role_permissions, audit_log | Secretary General | Enforced on every screen and action (row-level security in the database) |
| `perm.reset` | Build | Reset limits to defaults | `DELETE /api/roles/limits` | role_permissions | Secretary General | Restores the standard designation limits |

## `persona.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `persona.switch` | Demo | Switch account (demo) | `—` | — | — | In the built system each person signs in with their own account |
| `persona.set` | Demo | Use this account in this tab (demo) | `—` | — | — | Not part of the built system |

## `photo.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `photo.retake` | UI | Choose another photo | `—` | — | — | Re-opens picker |
| `photo.save` | Build | Use cropped photo | `POST /api/applications/{id}/photo` | application_documents | Applicant | Saves the auto-adjusted 35 × 45 mm photo; it is placed on page 1 of the form |

## `post.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `post.view` | Build | Read news / post | `GET /api/posts/{id}` | posts | Public | CMS content |
| `post.create` | Build | Create post | `POST/PATCH /api/post` | post | Staff | Simulated in prototype |
| `post.edit` | Build | Edit post | `POST/PATCH /api/post` | post | Staff | Simulated in prototype |

## `profile.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `profile.change` | Build | Request change of business particulars | `POST /api/change-requests` | change_requests, audit_log | Member | Form note 4: changes must be communicated to the Chamber — staff approve before the record changes |

## `psid.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `psid.show` | Build | Show payment voucher & how to pay | `GET /api/vouchers/{no}` | payment_vouchers | Owner member · Accounts | Voucher PDF with MCCI bank details. Automatic bank confirmation (1Bill / card) is added when MCCI’s bank provides the integration |
| `psid.markpaid` | Build | Record payment received at MCCI counter / bank | `POST /api/vouchers/{no}/payment` | payments, payment_vouchers | Accounts Officer | Manual entry with bank / receipt reference |
| `psid.gen` | Build | Issue a payment voucher | `POST /api/vouchers` | payment_vouchers | Accounts Officer | Voucher with MCCI bank details |
| `psid.cancel` | Build | Cancel voucher | `DELETE /api/vouchers/{no}` | payment_vouchers | Accounts Officer | Voucher voided |
| `psid.view` | UI | Voucher & receipt details | `—` | — | — | Detail view |

## `pub.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `pub.biz` | UI | Show documents for business type | `—` | — | — | Client-side |

## `qr.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `qr.view` | UI | QR document details | `—` | — | — | Detail |
| `qr.revoke` | Build | Revoke a document | `POST /api/documents/{code}/revoke` | documents, audit_log | Secretary General | Public verify shows Revoked |

## `receipt.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `receipt.view` | Build | View receipt | `GET /api/payments/{id}/receipt.pdf` | payments | Owner member · Accounts | PDF receipt |

## `register.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `register.start` | Build | Start membership application | `POST /api/applications` | applications, auth.users | Public → applicant account | Creates account with email verification, then opens the guided form |

## `renew.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `renew.preview` | Build | Renew membership (opens 1–31 March) | `POST /api/memberships/{id}/renewal` | renewals, psids | Member | Inside the renewal window a payment voucher for the annual subscription only is issued; outside it the button explains when it opens |
| `renew.remind` | Build | Set renewal reminder | `POST /api/reminders` | reminders | Member | Scheduled email on 1 March |

## `rep.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `rep.generate` | Build | Generate report | `POST/PATCH /api/rep` | rep | Staff | Simulated in prototype |

## `res.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `res.download` | Build | Download resource | `GET /api/resources/{id}` | resources, storage.objects | Public | File from CMS library; download counted |

## `search.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `search.open` | Build | Global search (Ctrl K) | `GET /api/search?q=` | members, applications, service_requests, documents | All signed-in users (scoped by row-level security) | Full-text search across records the user may see |

## `serial.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `serial.spoil` | Build | Log spoiled serial | `POST /api/serials/spoilage` | serial_spoilage | Membership Officer | Destruction record required |

## `setting.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `setting.toggle` | Build | Toggle a setting / preference | `PATCH /api/settings / /api/me/preferences` | settings, users.preferences, audit_log | Super admin (platform settings) · each user (own preferences) | Persists the switch and writes an audit entry |

## `settings.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `settings.save` | Build | Save chamber details | `PATCH /api/settings` | settings | Super admin | Used on forms, vouchers & certificates |

## `sign.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `sign.clear` | UI | Clear signature | `—` | — | — | Client-side |
| `sign.save` | Build | Save signature | `POST /api/applications/{id}/signature` | applications.signature | Applicant | As above |

## `sla.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `sla.rules` | Build | Edit SLA hours | `PATCH /api/settings {sla_hours}` | settings | Super admin | Applies to new requests |

## `staff.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `staff.invite` | Build | Invite staff member by email | `POST /api/staff/invitations` | staff, invitations, audit_log | Secretary General | Email with a one-time link (7 days); the person sets a password and 2-step login, then gets the limits of the chosen designation |
| `staff.edit` | Build | Open staff member (designation, status, invitation) | `PATCH /api/staff/{id}` | staff, audit_log | Secretary General | Changes apply at the person’s next page load |
| `staff.resend` | Build | Resend staff invitation | `POST /api/staff/invitations/{id}/resend` | invitations | Secretary General | New 7-day link emailed |
| `staff.revoke` | Build | Cancel staff invitation | `DELETE /api/staff/invitations/{id}` | invitations, staff | Secretary General | Link stops working |
| `staff.accept` | Demo | Accept invitation (simulated) | `POST /api/invitations/{token}/accept` | auth.users, staff | — | In the built system the invitee opens the email link, sets a password and 2-step login |
| `staff.reset2fa` | Build | Reset 2-step login | `POST /api/staff/{id}/reset-2fa` | auth.mfa | Secretary General | Person must set up 2-step login again |

## `svc.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `svc.new` | Build | Start a service request | `POST /api/service-requests (draft)` | service_requests | Member (temporary or permanent, not expired) | Checks membership validity first; temporary members are allowed |
| `svc.step` | UI | Service wizard step | `—` | — | — | Client-side |
| `svc.file` | Build | Upload documents for service | `POST /api/service-requests/{id}/documents` | service_documents, storage.objects | Member | Private storage, queued for AI |
| `svc.sample` | Demo | Use sample service documents | `—` | — | — | Not part of production |
| `svc.filedel` | UI | Remove uploaded file | `DELETE /api/service-requests/{id}/documents/{doc}` | — | — | Removes from draft |
| `svc.ai` | Build | Let AI fill the service form | `POST /api/service-requests/{id}/extract` | ai_extractions | Member | Structured extraction; member confirms every field |
| `svc.submit` | Build | Pay fee & submit service request | `POST /api/service-requests/{id}/submit` | service_requests, payments, notifications, audit_log | Member | Token issued and 24-hour clock starts; fee payment voucher issued with the request |
| `svc.cancel` | UI | Cancel service draft | `—` | — | — | Discards draft |
| `svc.open` | Build | Open service request | `GET /api/service-requests/{token}` | service_requests | Owner member · staff | Detail with timeline |
| `svc.fix` | Build | Correct and resubmit service request | `POST /api/service-requests/{token}/resubmit` | service_requests, service_documents | Member | Upload corrected file; SLA restarts |
| `svc.msg` | Build | Message MCCI about a request | `POST /api/service-requests/{token}/messages` | messages | Member · staff | Threaded messages; staff notified |
| `svc.start` | Build | Start review of service request | `PATCH /api/service-requests/{token} {status: in_review}` | service_requests | Services Officer | Assigns to officer |
| `svc.return` | Build | Return service request | `POST /api/service-requests/{token}/return` | service_requests, notifications | Services Officer | Member notified |
| `svc.approve` | Build | Approve → send to signatory | `POST /api/service-requests/{token}/approve` | service_requests | Services Officer | Moves to signing queue |
| `svc.sign` | Build | Sign & issue document with QR | `POST /api/service-requests/{token}/sign` | service_requests, documents, notifications | Signatory (President / SG) | Digital signature + QR; member downloads |
| `svc.signAll` | Build | Sign all ready documents | `POST /api/signing/bulk` | service_requests | Signatory | Bulk sign |

## `svcset.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `svcset.edit` | Build | Edit service fee | `POST/PATCH /api/svcset` | svcset | Staff | Simulated in prototype |

## `tab.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `tab` | UI | Switch tab | `—` | — | — | Client-side only |

## `tbl.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `tbl.sort` | UI | Sort column | `—` | — | — | Server-side ordering on large tables |
| `tbl.export` | Build | Export CSV | `GET /api/{resource}/export.csv` | per table | Staff with read access | Streams the filtered result set; export is written to the audit log |

## `temp.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `temp.issue` | Build | Issue temporary membership (60 days) | `POST /api/memberships/{id}/temporary` | memberships, documents, print_queue, notifications | Membership Officer | Auto on payment (setting); manual for counter cases |
| `temp.view` | UI | Temporary membership details | `—` | — | — | Detail |
| `temp.extend` | Build | Extend temporary membership | `POST /api/memberships/{id}/temporary/extend` | memberships, audit_log, notifications | Secretary General | Max extensions and days from settings; reason required |
| `temp.revoke` | Build | Revoke temporary membership | `POST /api/memberships/{id}/temporary/revoke` | memberships, documents, notifications | Secretary General | QR shows Revoked immediately |
| `temp.remind` | Build | Send reminder to member | `POST /api/notifications` | notifications | Membership Officer | Email + portal message |
| `temp.remindAll` | Build | Message all expiring temporary members | `POST /api/notifications/bulk` | notifications | Membership Officer | Bulk email + portal message |
| `temp.convert` | Build | Upload printed certificate & convert to permanent | `POST /api/memberships/{id}/convert` | memberships, certificates, documents, print_items, notifications, audit_log | Membership Officer | Serial checked against register; temp QR superseded; member updated live |
| `temp.policy` | Build | Edit temporary-membership policy | `POST/PATCH /api/temp` | temp | Staff | Simulated in prototype |

## `theme.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `theme.toggle` | UI | Light / dark theme | `PATCH /api/me/preferences` | — | — | Saved per user in profile preferences |

## `ticket.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `ticket.new` | Build | New help ticket / complaint | `POST /api/tickets` | tickets, notifications | Member · public (contact form) | Ticket number, SLA and owner assigned; email confirmation |
| `ticket.view` | Build | Open ticket | `GET /api/tickets/{id}` | tickets, ticket_replies | Owner · staff | Thread view |
| `ticket.reply` | Build | Reply on ticket | `POST /api/tickets/{id}/replies` | ticket_replies, notifications | Owner · staff | Other side notified by email + portal |

## `tk.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `tk.assign` | Build | Assign ticket | `POST/PATCH /api/tk` | tk | Staff | Simulated in prototype |
| `tk.resolve` | Build | Resolve ticket | `PATCH /api/tickets/{id}` | tickets | Staff | Member asked to rate |

## `tpl.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `tpl.edit` | Build | Edit message template | `POST/PATCH /api/tpl` | tpl | Staff | Simulated in prototype |
| `tpl.test` | Build | Send test message | `POST /api/templates/{id}/test` | notifications | — | Sends a test email to the staff member |

## `track.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `track.go` | Build | Track a token | `GET /api/track/{token}` | applications, service_requests (public view) | Public | Shows stage and time only — no personal data |

## `user.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `user.invite` | Build | Invite a colleague by email | `POST /api/companies/{id}/invitations` | company_users, invitations | Authorized representative (Owner) | Email link (7 days); colleague creates a password and sees only what the role allows |
| `user.remove` | Build | Remove colleague / cancel invitation | `DELETE /api/companies/{id}/users/{user}` | company_users | Owner | Access revoked immediately |
| `user.edit` | Build | Change colleague’s role / resend / cancel | `PATCH /api/companies/{id}/users/{user}` | company_users | Owner | Applies immediately |
| `user.resend` | Build | Resend colleague invitation | `POST /api/companies/{id}/invitations/{inv}/resend` | invitations | Owner | New link emailed |
| `user.accept` | Demo | Colleague accepts invitation (simulated) | `—` | — | — | In the built system the colleague opens the email link and sets a password |

## `vault.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `vault.upload` | Build | Upload a file to my vault | `POST /api/me/documents` | member_documents, storage.objects | Member | Private storage; reusable in future applications |
| `vault.del` | Build | Delete my uploaded file | `DELETE /api/me/documents/{id}` | member_documents | Member | Soft delete (kept 30 days) |

## `verify.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `verify.go` | Build | Verify a document / certificate | `GET /api/verify/{code}` | documents (public view) | Public | Rate-limited public lookup; shows Valid / Temporary / Superseded / Expired / Revoked; each scan counted |

## `wiz.*`

| id | Phase | Label | Planned endpoint | Tables | Who | Behaviour in the real system |
|---|---|---|---|---|---|---|
| `wiz.step` | UI | Go to wizard step | `PATCH /api/applications/{id}` | applications (draft) | — | Draft autosaved on every change |
| `wiz.next` | Build | Next step | `PATCH /api/applications/{id}` | applications (draft) | Applicant | Validates the step server-side, autosaves the draft |
| `wiz.back` | UI | Previous step | `—` | — | — | Client-side |
| `wiz.biz` | Build | Choose business type | `PATCH /api/applications/{id} {business_type}` | applications | Applicant | Sets legal form; document checklist and class rule recalculate |
| `wiz.nat.sector` | Build | Choose nature of business (sector) | `PATCH /api/applications/{id} {sector}` | applications | Applicant | Sector list managed by MCCI in Settings; used for the directory and reports |
| `wiz.nat.item` | Build | Choose what the business does (up to 3) | `PATCH /api/applications/{id} {activities}` | applications | Applicant | Saved with the application; fills Particulars of Business |
| `wiz.juris` | Build | Confirm business is within Multan Chamber jurisdiction (TOR 11 b) | `PATCH /api/applications/{id}` | applications | Applicant | Eligibility rule from the form instructions |
| `wiz.addr` | Build | Confirm business address matches the NTN certificate | `PATCH /api/applications/{id}` | applications | Applicant | Officer checks it against the uploaded NTN certificate |
| `wiz.flag` | Build | Answer a yes / no question (manufacturing, women-owned, sales tax, turnover) | `PATCH /api/applications/{id}` | applications | Applicant | Recalculates Corporate / Associate class and fee |
| `wiz.doc.upload` | Build | Upload a required document | `POST /api/applications/{id}/documents (multipart) → storage` | application_documents, storage.objects | Applicant | Virus-scanned, stored in a private bucket, queued for AI reading |
| `wiz.doc.remove` | Build | Remove a document | `DELETE /api/applications/{id}/documents/{doc}` | application_documents | Applicant (draft only) | Soft-deletes the file |
| `wiz.doc.view` | Build | Preview a document | `GET /api/documents/{id}/preview` | application_documents | Applicant · staff | Signed URL preview |
| `wiz.sample` | Demo | Use sample documents | `—` | — | — | Not part of the built system |
| `wiz.ai` | Build | Read documents with AI and fill the form | `POST /api/applications/{id}/extract` | ai_extractions, applications | Applicant | Each file → OpenAI structured extraction (JSON schema per document type); fields saved with confidence + source; nothing is auto-approved |
| `wiz.partner.add` | Build | Add partner / director | `PATCH /api/applications/{id}` | application_partners | Applicant | Max 6 rows as on the form |
| `wiz.partner.del` | Build | Remove partner / director | `PATCH /api/applications/{id}` | application_partners | Applicant | Removes the row |
| `wiz.partner.card` | Build | Request a membership card for a partner (Rs. 1,000) | `PATCH /api/applications/{id}` | application_partners, fees | Applicant | Adds optional card fee to the payment voucher |
| `wiz.photo` | Build | Upload passport-size photo (auto-crop 35 × 45 mm) | `POST /api/applications/{id}/photo` | application_documents, storage.objects | Applicant | Server stores original + cropped 350×450 JPEG; face check runs server-side |
| `wiz.sign` | Build | Draw signature | `POST /api/applications/{id}/signature` | applications.signature | Applicant | Stored as PNG with timestamp, IP and device for evidence |
| `wiz.sign.upload` | Build | Upload signature image | `POST /api/applications/{id}/signature` | applications.signature | Applicant | Background removed server-side, ink kept |
| `wiz.stamp.upload` | Build | Upload company stamp / seal (photo) | `POST /api/applications/{id}/stamp` | applications.stamp | Applicant | Paper background removed automatically; placed in the stamp box on pages 1 and 2 |
| `wiz.stamp.sample` | Demo | Use sample stamp & signature | `—` | — | — | Not part of production |
| `wiz.declare` | Build | Accept a declaration | `PATCH /api/applications/{id}` | applications.declarations | Applicant | Stores acceptance with timestamp |
| `wiz.form` | Build | Preview the official MCCI form | `GET /api/applications/{id}/form.pdf` | applications | Applicant · staff | Server renders the filled 4-page form as PDF |
| `wiz.save` | Build | Save draft | `PATCH /api/applications/{id}` | applications | Applicant | Draft saved (also autosaved on every change) |
| `wiz.submit` | Build | Submit application | `POST /api/applications/{id}/submit` | applications, application_events, notifications, audit_log | Applicant | Locks the form, issues token, starts SLA, sends email + portal receipt, notifies Membership Desk |
| `wiz.photo.demo` | Demo | Use the sample passport photo | `—` | — | — | Not part of the built system |
| `wiz.prop.demo` | Demo | Send demo requests to two members | `—` | — | — | Not part of the built system |
