# 29 · Business directory, segments and exports (owner brief of 30 Oct 2026)

Phase B of MCCI Business Intelligence & Outreach (`docs/28`). There is no prototype screen for this module: it follows
the prototype's design tokens and components, and the wording here and in `messages/*.json` (`biz.*`) is the
specification.

## Screens

| Route | What it does | Minimum level |
|---|---|---|
| `/admin/business-directory` | Search, filter builder with live count, chips, sortable table, paging, selection, data quality | `biz` 1 |
| `/admin/business-directory/profile?id=` | Official record (read only), outreach details, tags, contact, consent, membership history | `biz` 1 |
| `/admin/business-directory/segments` | Saved dynamic segments with today's count; open, export, delete | `biz` 1 |
| `/admin/business-directory/exports` | Choose rows and columns, preview, download, log | `biz` 2 |

## Whose data is what

The directory lists members from the official register. Demo companies and applicants without a membership number are
left out. Official fields (`companies`, `members`) are never written by this module. Editable data lives apart:
`outreach_profiles` (city, district, note), `outreach_tags` + `company_tags`, `outreach_contacts`.

City and district exist only here, because the official record has a free-text address and guessing from it would be
unreliable. Staff enter them. They may later be filled by the member register import.

## Permissions (migration 0570; enforced in the database and again in the server)

| Module | Level | Allows |
|---|---|---|
| `biz` | 1 | Directory, profile, segments, counts |
| `biz` | 2 | Outreach details, tags, saving segments, duplicates, exports of plain columns |
| `biz` | 3 | Sensitive contacts on the profile, sensitive export columns, exports above the approval size |
| `out` | 2 | See contacts, manage contact, record consent, suppress a number |
| `out` | 3 | Lift a suppression |
| `biz` 3 or `out` 2 | | Save or remove a WhatsApp contact |

Default limits are in the migration, marked `TODO(MCCI)`; the Secretary General can change them in Staff & Roles.
Settings key `outreach`: `exportApprovalRows` (1000), `exportMaxRows` (5000), `renewalDueDays` (60). `TODO(MCCI)`.

## Filters

A filter is groups joined with AND. Inside a group, all or any of its conditions. A group can exclude what it matches.
Operators: is, is not, contains, empty, not empty, equals, from, up to, between, includes any or none. The filter
travels in the address, so paging, sorting and a shared link keep it.

The database builds SQL only from a fixed list of fields and operators and quotes every value
(`private.biz_rule`, `private.biz_where`). Saved segments store the filter, never a list, and are labelled Dynamic.
Fixed audience snapshots arrive with campaigns.

Not available as filters yet, because the data does not exist until campaigns do: previously contacted, never
contacted, delivery history.

## Consent and suppression

- Consent belongs to a number. A new number starts at "Not recorded".
- Staff can record consent only with evidence. Member opt-in in the portal waits for MCCI's consent wording (`docs/28` §8).
- Withdrawing consent suppresses the number immediately. Consent cannot be recorded over a suppression.
- Lifting a suppression needs `out` 3 and a reason, and does not restore consent.
- "Could be contacted" counts only consent granted and not suppressed.

## Exports

- Formats: CSV, Excel, PDF. PDFs are English only and up to 8 columns, because the built-in PDF font has no Urdu.
- Preview (first 10 rows and the count) is required before download and is not logged.
- Sensitive columns (telephone, email, WhatsApp, address, NTN) need `biz` 3 and a reason of 5+ characters.
- Above `exportApprovalRows`, `biz` 3 is needed; there is no separate approval queue in this phase. Above
  `exportMaxRows`, refused. At most 30 exports per person per hour.
- The log row is written in the same database call that returns the rows: who, when, filter, format, count, fields,
  sensitive or not, reason. The table has no update or delete for anyone.
- CSV cells starting with `= + - @`, tab or return get an apostrophe. Excel cells are typed as strings. Responses are
  `no-store`; a request from another site is refused.

WhatsApp numbers are kept out of `audit_log` (the audit log is readable by more staff than contacts are).

## Released 30 Oct 2026 (owner approved)

`2f71d59` is live; previous release `5fb267a` kept for rollback. Backup `mcci-20261030T145030Z` verified, restore drill
13/13 PASS, migration 0570 applied (companies and members unchanged; 12 audit rows for the new default limits and
setting). Signed-out live checks passed; signed-in screens not checked live. Production has 0 non-demo members, so the
directory is empty until the register is imported.

## Tests

pgTAP `370_business_directory` (38), unit `business-filters`, e2e `business-directory`.
