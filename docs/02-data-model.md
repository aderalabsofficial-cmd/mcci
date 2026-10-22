# 02 · Data model

The full DDL is in `sql/0001_init.sql`; policies in `sql/0002_rls.sql`. Copy both into `supabase/migrations/`
(`20261101000001_init.sql`, `20261101000002_rls.sql`), run `pnpm db:reset`, then `pnpm db:types`.

## Entity map

```
auth.users ─1:1─ profiles ─1:1─ staff ─(designation)─ role_permissions
                     │                └─ staff_permission_overrides
                     └─< company_users >─ companies ─< members ─< temp_memberships
                                              │          │      └─ print_items ─> print_batches
                                              │          └─< endorsements (as endorser)
                                              ├─< applications ─< application_documents
                                              │        ├─< application_partners
                                              │        ├─< application_history
                                              │        ├─< endorsements (proposer, seconder)
                                              │        └─ committee_items ─> meetings
                                              ├─< payment_vouchers
                                              ├─< service_requests ─< service_documents
                                              ├─< documents (QR registry)
                                              ├─< notifications, tickets, change_requests
                                              └─< event_registrations ─> events
settings · audit_log · email_templates · email_log · posts · imports · invitations · document_requirements · service_types
```

## Key decisions

| Topic | Decision |
|---|---|
| Company vs member | A **company** is the business. A **member** row is a membership number held by a company. Users belong to companies through `company_users` with a company role. |
| Applicant before membership | The applicant registers → a `companies` row + `company_users(Owner)` is created at registration; `members` row is created only at committee approval (number allocated with `next_member_no`). |
| Form snapshot | `applications.form` holds page-2 particulars exactly as on the official form (keys in `catalogue/reference-data.md`). On submit, a PDF of the official form is rendered and stored; its sha256 is what endorsers sign (`endorsements.doc_hash`). If the applicant edits the form after a return, existing *Approved* endorsements stay valid only if the fields `name, address, ntn, rep, cnic, biz_type` are unchanged; otherwise they revert to *Pending* with a notification (rule in `04-endorsement.md`). |
| Class rule | `Corporate` if biz_type ∈ {pvt, public, mnc} or (manufacturing and sales_tax) or (sales_tax and turnover ≥ 50 M); else `Associate`. Women fee flag separate. SG can override with reason (audited). |
| Fees | From `settings.fees` (Corporate 5,000 + 12,000 + 500; Associate 4,000 + 7,000 + 500; Women 2,000 + 5,000 + 500; extra card 1,000). Voucher lines copied at creation so later fee changes don't alter old vouchers. |
| Membership year | 1 April – 31 March. `valid_to` = next 31 March after approval. |
| Temporary membership | Separate `temp_memberships` row; `members.status = 'Temporary'` while active. Conversion sets `members.status='Permanent'`, `temp_memberships.status='converted'`, and supersedes the temporary QR document. |
| Numbers | Postgres sequences + defaults (tokens, voucher numbers, member numbers). Never generated client-side. |
| Deletion | Nothing is hard-deleted by users. Use statuses (`Withdrawn`, `Cancelled`, `Revoked`). Hard delete only by retention job. |

## Settings keys (JSON in `settings`)

```
temp           { days:60, alert1:15, alert2:7, extendDays:30, maxExtensions:1, autoIssue:true, servicesAllowed:true, inDirectory:true }
fees           { Corporate:{admission,subscription,card}, Associate:{…}, Women:{…}, extraCard:1000 }
endorse        { sameClass:true, preferSector:true, days:7, remindDay:3, maxPerYear:12, needCode:true, tempMembersMayEndorse:false }
sla            { hours:24, processDays:15 }
voucher        { dueDays:7 }
bank           { name, title, iban, branch }            -- printed on vouchers
chamber        { name, addr, tel, fax, email, web }     -- printed on form & certificates
payment        { provider:'manual' }                    -- 'onebill'|'card' only when bank integration exists
courier        { provider:'manual' }
lang           { urduFirst:false, emailCopy:true }
```

## Indexing & performance
- Queue screens filter by `stage` / `status` + order by date → composite indexes on (`stage`, `submitted_at`).
- Endorser search: trigram index on `companies.name` and `members.rep_name` (`pg_trgm`), filtered by `members.status='Permanent'` and `class`.
- Keep `audit_log` partition-ready (monthly) if volume grows; index `at desc`.
