# 14 · What MCCI provides and decides

## Needed from MCCI (with the date needed)

| # | Item | Needed by | Used for | If late |
|---|---|---|---|---|
| 1 | Sign-off on the v10 preview (screens, wording, Urdu) | Day 0 | Start of build | Build starts on the signed version |
| 2 | Existing member list (Excel, template in `13-seed-import.md`) | Day 5 | Endorser search, directory, renewals | Endorsements can't be tested with real members |
| 3 | Staff list with designations and emails | Day 5 | Invitations, permissions | Demo staff used on staging |
| 4 | MCCI bank account (bank, title, IBAN, branch) for vouchers | Day 15 | Payment voucher PDF | Placeholder "to be confirmed" on vouchers |
| 5 | Security printer name and certificate serial format | Day 17 | Print batches, serial registry | Default `MCCI-<n>-0<serial>` pattern |
| 6 | Domain / DNS access and sender email address | Day 25 | Go-live, email delivery (SPF/DKIM/DMARC) | Go-live slips |
| 7 | Letter templates / signatures for the 7 services | Day 20 | Issued letters | Prototype wording used |
| 8 | Bank contact for 1Bill / card integration | Later | Automatic payment confirmation (not this phase) | Manual receipts continue |
| 9 | Courier and API (if any) | Later | Automatic tracking (not this phase) | Manual tracking continues |
| 10 | D-U-N-S number + Google Play organisation developer account in MCCI's name | Day 1 (can take 30 days) | Publishing the Android app | App can only go to internal testing |
| 11 | Firebase project under MCCI's Google account | Day 10 | Push notifications | Push tested on staging project only |
| 12 | App name (EN/UR) and icon approval | Day 10 | Store listing | Working name "MCCI Digital" |
| 13 | Privacy policy & terms (legal review) | Day 15 | Registration consent, Play listing | Draft wording marked "draft" |

## Decisions (defaults used until MCCI confirms — all stored in settings)

Database and hosting decisions D-M1 … D-M21 (hosting location, gapless numbers, backups, CNIC protection, NTN
uniqueness, refunds, endorser privacy, QR format, …) are listed in `docs/17-database-architecture.md` §12.

| Decision | Default |
|---|---|
| Endorser category | Same membership class as applicant; same sector shown first |
| Yearly endorsement limit per member | 12 |
| Can temporary members endorse? | No |
| Endorsement response time / reminder | 7 days / day 3 |
| One-time email code when signing | Yes |
| Temporary membership length / extension | 60 days / one extension of 30 days by SG |
| Temporary members can use services / appear in directory | Yes / Yes, labelled "Temporary" |
| Original documents | Scans online; originals handed over at certificate collection |
| Fees | Corporate 17,500 · Associate 11,500 · Women 7,500 · extra card 1,000 (from the form) |
| Service fees | Placeholders (E-BIL 2,000; Visa 1,500; Guarantee 3,000; Samples 1,500; Other 1,000; C.O. 1,000; Attestation 500) |
| Stamp required for proprietorship | Yes (as on the form) — confirm |
| Document retention | While membership active + 7 years |
| SLA clock | Business hours Mon–Sat 09:00–17:00 PKT, holiday list in settings (wall-clock was the old default) |
| Signing when the President is away | Office Bearer (Senior VP / VP) with a dated delegation set by SG |
| Renewal grace / late fee / reinstatement | Grace to 30 June, no late fee, after that renewal + review |
| Duplicate certificate fee · class upgrade | 1,000 · fee difference voucher, membership number kept |
| Digits in Urdu UI | Latin digits for tokens, amounts, CNIC, dates |
| Bilingual labels on phones | EN + UR on tiles, headings, buttons; active language only in long lists |
| Urdu font (licence + size) | `TODO(MCCI)` Jameel Noori Nastaleeq 2009, unmodified (6.8 MB, cached one year per device). Its only licence text is "Free Of Charge For Urdu Lovers" (embedding flag: preview & print), so web use and any modification need MCCI's confirmation. Measured 21 Oct 2026: subsetting saves nothing (24,955 of 25,059 glyphs are Urdu ligatures); lowering precision to 512 units/em gives 5.2 MB (−23%) with unchanged shapes (lines drift ≤ 0.2 px at 20 px), but is a modification. Open-licence alternative to evaluate: Noto Nastaliq Urdu (SIL OFL, may be subset freely). |

## Membership Committee (Release 4) — defaults used until MCCI confirms

| Question | Default in the system |
|---|---|
| Bank account on vouchers (item 4 above) | `settings.bank.confirmed = false`: vouchers and the approval email say "to be confirmed by MCCI — do not pay yet"; the placeholder IBAN is never shown. MCCI provides the account, then `confirmed: true` is set |
| Voucher due period | 7 days (`settings.voucher.dueDays`, docs/02) |
| Fees per class | From the official form (`settings.fees`; Corporate 17,500 · Associate 11,500 · Women 7,500 · extra card 1,000) |
| Starting membership numbers / gapless numbers | 1134 (Corporate) / 2205 (Associate) from the spec samples (D-M20); a rolled-back approval may leave a gap (D-M2) |
| Who records decisions | Committee Secretary or Secretary General (`cmt` level 3) record the committee's decision — the system does not record votes, quorum or attendance; the minutes are free text |
| When decisions can be recorded | On or after the meeting date |
| Deferral | Reason required; the file goes on the next Membership Committee meeting; portal message only (docs/07 has no deferral email) |
| Committees offered for meetings | Membership Committee, Executive Committee, General Body (prototype list); only the Membership Committee has an agenda |
| Voucher as PDF attachment (docs/07) | Not yet: the email carries the voucher details and links to **Payments**, where the voucher prints |
