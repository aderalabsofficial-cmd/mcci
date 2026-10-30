# 06 · Roles and permissions

Levels: **0** No access · **1** View · **2** Edit · **3** Approve. Enforced in three places: RLS (`staff_level(mod)`),
server actions (`requirePermission(mod, level)`), and UI (hide or lock with an explanation tooltip).

## Admin modules → screens

| key | Module | Screens |
|---|---|---|
| dash | Dashboard | dashboard |
| mem | Membership applications | requests, mreview |
| cmt | Committee decisions | committee |
| temp | Temporary & certificates | temp, certs, serials |
| reg | Members register | members, member, import |
| svc | Service requests & signing | applications, review, sla, approvals |
| docs | Documents & QR | documents |
| pay | Payments & vouchers | payments, psid (vouchers) |
| eng | Events, complaints & content | events, meetings, complaints, content, notify |
| rep | Reports & AI | reports, ai |
| staff | Staff & audit | staff, audit |
| plat | Services setup & settings | services, integrations, settings |
| biz | Business directory | bizdir, bizprofile, segments, bizexports (`docs/29`) |
| out | Outreach & consent | consent and suppression on the business profile; campaigns later (`docs/29`) |

## Designations (seniority L1–L5) and default limits

| Designation | L | dash | mem | cmt | temp | reg | svc | docs | pay | eng | rep | staff | plat |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Secretary General | 5 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 |
| President (Signatory) | 5 | 1 | 1 | 1 | 1 | 1 | 3 | 1 | 1 | 1 | 1 | 0 | 0 |
| Deputy Secretary — Membership | 4 | 1 | 3 | 1 | 3 | 3 | 1 | 2 | 1 | 2 | 1 | 1 | 0 |
| Membership Officer | 3 | 1 | 2 | 0 | 2 | 2 | 0 | 1 | 1 | 1 | 1 | 0 | 0 |
| Services Officer | 3 | 1 | 0 | 0 | 0 | 1 | 2 | 2 | 1 | 1 | 1 | 0 | 0 |
| Accounts Officer | 3 | 1 | 1 | 0 | 1 | 1 | 1 | 0 | 3 | 0 | 1 | 0 | 0 |
| Committee Secretary | 2 | 1 | 1 | 3 | 0 | 1 | 0 | 0 | 0 | 2 | 0 | 0 | 0 |
| Front Desk / Data Entry | 1 | 1 | 1 | 0 | 1 | 2 | 1 | 0 | 0 | 2 | 0 | 0 | 0 |
| Auditor (read-only) | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 |

Editable by the Secretary General (Staff & Roles → limits). Per-person overrides allowed.

## Action → required level (server-side map, `lib/permissions/admin.ts`)

| Action pattern | Module | Level |
|---|---|---|
| `adm.app.open` | mem | 1 |
| `adm.reject`, `adm.cls` | mem | 3 |
| other `adm.*` (doc accept/reject, edit, verify, return, checklist, remind) | mem | 2 |
| `cmt.*` | cmt | 3 |
| `temp.extend`, `temp.revoke`, `temp.policy` | temp | 3 |
| `temp.view`, `batch.view`, `batch.file` | temp | 1 |
| other `temp.*`, `batch.create/step`, `dispatch.set`, `serial.*`, `cert.scan*` | temp | 2 |
| `mem.status` | reg | 3 |
| `mem.open` | reg | 1 |
| other `mem.*`, `chg.*`, `imp.*` | reg | 2 |
| `svc.open` | svc | 1 |
| `svc.sign`, `svc.signAll` | svc | 3 |
| `svc.start/return/approve/msg` | svc | 2 |
| `qr.revoke` | docs | 3 |
| `pay.verify`, `pay.reject`, voucher create/cancel | pay | 2 |
| `ev.*`, `mt.*`, `tk.*`, `post.*`, `tpl.*`, `campaign.*` | eng | 2 |
| `rep.*` | rep | 2 |
| `staff.*`, `perm.*` | staff | 3 |
| `audit.*` | staff | 1 |
| `fees.edit`, `backup.now` | plat | 3 |
| `svcset.*`, `int.*`, `settings.save`, `end.policy`, platform `setting.toggle` | plat | 2 |

## Member company roles

| Role | mship | svc | docs | pay | events | profile & users |
|---|---|---|---|---|---|---|
| Owner (authorized representative) | 3 | 3 | 3 | 3 | 3 | 3 |
| Manager | 2 | 2 | 2 | 2 | 2 | 1 |
| Services | 1 | 2 | 1 | 0 | 1 | 1 |
| Accounts | 1 | 1 | 1 | 2 | 0 | 1 |
| Viewer | 1 | 1 | 1 | 1 | 1 | 1 |

Member actions: `wiz.*`, `app.*`, `photo.*`, `sign.*`, `delivery.set`, `renew.*`, `card.request` → mship 2;
`svc.*` → svc 2 (`svc.open` 1); `vault.*` → docs 2; `pay.*` → pay 2; `event.reg`, `opp.*` → events 2;
`user.*`, `profile.change` → profile 3.
**Endorsement signing** (`end.sign`, `end.decline`) → Owner or Manager of the endorser company only.
