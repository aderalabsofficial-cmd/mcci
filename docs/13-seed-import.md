# 13 · Seed data and member import

## Reference seed (all environments)
From `catalogue/reference-data.json`: `document_requirements` (5 business types), `service_types` (7 services with
fields, documents, fee placeholders), `email_templates`, `settings` (fees, temp policy, endorsement rules, chamber
details, bank placeholders), `role_permissions` (matrix in `06-roles-permissions.md`).

## Demo seed (local + staging only — never production)
Mirror the prototype's demo world so screens look the same:
- 12 existing members (e.g. MCCI-C-1042 Muhammad Arif · Al-Noor Textiles; MCCI-C-1090 Ahmed Raza · Chenab Mangoes
  Export; MCCI-A-2090 Khalid Mehmood · Multan Cotton Traders; one Expired) with Owner users so endorsements can be
  demonstrated.
- Applicant persona: Bilal Hussain · Al-Noor Home Textiles (Pvt) Ltd, Plot 14-B Industrial Estate Multan, with the
  specimen documents (watermarked "SAMPLE") and a demo passport photo.
- Applications M-0232 … M-0243 at every stage (review, returned, proposer with one pending seconder, committee,
  payment, temp day 12, temp expiring, temp expired, permanent), service requests in each status, a print batch,
  events, posts, tickets, staff (one per designation; SG = Kamran Raza).
- Demo passwords documented in `README.md` of the repo, staging only.

## Member Excel import (`admin/import`)
Template columns (first row headers):
`membership_no, class (Corporate|Associate), women (Y/N), company_name, business_type (prop|aop|pvt|mnc|public),
sector, address, ntn, gst, representative_name, representative_cnic, mobile, email, member_since (yyyy-mm-dd),
valid_to (yyyy-mm-dd), status (Permanent|Expired|Suspended), certificate_serial`

Process: upload → server parses (SheetJS) → validation report (duplicates, bad formats, missing email, unknown
class) shown as a table with row numbers → staff fix or skip rows → **Commit** creates companies, members and an
`Owner` invitation per email (sent later in a controlled batch). Import is idempotent on `membership_no`
(update instead of duplicate). Each run stored in `imports` with the report.

As built (migration 0360, `lib/import/*`, `docs/20` Phase C): CSV, `.xlsx`, `.xls` and PDF (PDF read by AI only with
per-file consent). A row with the same `membership_no` is never duplicated and **not updated unless the admin chooses
"Update"** for that row, and only for a member that was itself imported (never one issued or managed on the platform).
Representative CNIC is accepted in files but not stored. Header spellings found in chamber registers are recognised
(e.g. "Name of Firm", "Valid Upto", "Authorised Representative"); dates may be day-first (31/03/2027, 31 Mar 2027).
Owner invitations for imported members are not sent by the import (a later, controlled step).
