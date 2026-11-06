# MCCI Phase 1 — interactive element test report

Generated 2026-11-06 08:31 UTC by `scripts/acceptance/report.mjs` from the crawl in `tests/e2e/acceptance.spec.ts`. One row per distinct control on each page (route × language × kind × action/label). A link is PASS when its target was requested with the persona's session and answered; a control is PASS when an automated functional spec exercises it (matched by its `data-action` or label); PARTIAL = present, named and wired, but no automated test exercises its outcome; FAIL = unwired, unnamed, disabled without a reason, or a link to an error/404. Hit area is the rendered size in px at 1440 × 900.

## Counts

| Kind | Elements |
|---|---|
| link | 3369 |
| button | 1318 |
| input:checkbox | 112 |
| input:text | 78 |
| input:number | 54 |
| tab | 42 |
| submit | 40 |
| select | 32 |
| disclosure | 27 |
| input:radio | 22 |
| textarea | 22 |
| input:date | 14 |
| input:search | 14 |
| input:email | 8 |
| input:password | 8 |
| input:tel | 2 |

| Status | Elements |
|---|---|
| PASS | 3981 |
| PARTIAL | 1181 |

## Failures first

| Test ID | Route | Lang | Kind | Name | data-action | Result | Why |
|---|---|---|---|---|---|---|---|

## All elements

| Test ID | Route | Lang | Kind | Name | data-action / href | Seen by | Hit | Status | How verified |
|---|---|---|---|---|---|---|---|---|---|
| EL-SITE-001 | `/about` | en | button | Change language to Urdu | lang.toggle | 2 | 82x44 | PASS | exercised by a functional spec |
| EL-SITE-002 | `/about` | en | button | Pause the news ticker | ticker.pause | 2 | 44x37 | PASS | exercised by a functional spec |
| EL-SITE-003 | `/about` | en | link | About | /about | 2 | 68x38 | PASS | target answered 200 |
| EL-SITE-004 | `/about` | en | link | All news and notifications | ticker.all | 2 | 95x37 | PASS | target answered 200 |
| EL-SITE-005 | `/about` | en | link | Certificate of Origin | /service?s=co | 2 | 245x31 | PASS | target answered 200 |
| EL-SITE-006 | `/about` | en | link | Contact | /contact | 2 | 82x38 | PASS | target answered 200 |
| EL-SITE-007 | `/about` | en | link | Digital access Every service online, from any city. | nav | 2 | 371x192 | PASS | target answered 200 |
| EL-SITE-008 | `/about` | en | link | Directory | /directory | 2 | 90x38 | PASS | target answered 200 |
| EL-SITE-009 | `/about` | en | link | E-BIL | /service?s=ebil | 2 | 245x31 | PASS | target answered 200 |
| EL-SITE-010 | `/about` | en | link | Home | nav | 2 | 44x44 | PASS | target answered 200 |
| EL-SITE-011 | `/about` | en | link | MCCI Digital Chamber ایوانِ تجارت و صنعت ملتان | / | 2 | 157x59 | PASS | target answered 200 |
| EL-SITE-012 | `/about` | en | link | Member Login | /login | 2 | 160x44 | PASS | target answered 200 |
| EL-SITE-013 | `/about` | en | link | Membership | /membership | 2 | 112x38 | PASS | target answered 200 |
| EL-SITE-014 | `/about` | en | link | News | /news | 2 | 63x38 | PASS | target answered 200 |
| EL-SITE-015 | `/about` | en | link | NEWS Chamber news c36f7d | ticker.post | 2 | 194x38 | PASS | target answered 200 |
| EL-SITE-016 | `/about` | en | link | NEWS Chamber news d098e0 | ticker.post | 2 | 201x38 | PASS | target answered 200 |
| EL-SITE-017 | `/about` | en | link | Resources | /resources | 2 | 98x38 | PASS | target answered 200 |
| EL-SITE-018 | `/about` | en | link | Services | /services | 2 | 84x38 | PASS | target answered 200 |
| EL-SITE-019 | `/about` | en | link | Skip to content | #main | 2 | 144x47 | PASS | in-page anchor |
| EL-SITE-020 | `/about` | en | link | Track | /track | 2 | 61x38 | PASS | target answered 200 |
| EL-SITE-021 | `/about` | en | link | Verify | /verify | 2 | 65x38 | PASS | target answered 200 |
| EL-SITE-022 | `/about` | en | link | Visa letters | /service?s=visa | 2 | 245x31 | PASS | target answered 200 |
| EL-SITE-023 | `/about` | ur | button | خبروں کی پٹی روکیں | ticker.pause | 1 | 44x37 | PASS | exercised by a functional spec |
| EL-SITE-024 | `/about` | ur | button | زبان انگریزی میں بدلیں | lang.toggle | 1 | 82x44 | PASS | exercised by a functional spec |
| EL-SITE-025 | `/about` | ur | link | ای-بِل | /ur/service?s=ebil | 1 | 245x37 | PASS | target answered 200 |
| EL-SITE-026 | `/about` | ur | link | ایم سی سی آئی ڈیجیٹل چیمبر ایوانِ تجارت و صنعت ملتان | /ur | 1 | 157x79 | PASS | target answered 200 |
| EL-SITE-027 | `/about` | ur | link | تصدیق | /ur/verify | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-028 | `/about` | ur | link | تعارف | /ur/about | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-029 | `/about` | ur | link | تمام خبریں اور اعلانات | ticker.all | 1 | 89x37 | PASS | target answered 200 |
| EL-SITE-030 | `/about` | ur | link | ٹریک | /ur/track | 1 | 45x38 | PASS | target answered 200 |
| EL-SITE-031 | `/about` | ur | link | خبر Chamber news c36f7d | ticker.post | 1 | 169x38 | PASS | target answered 200 |
| EL-SITE-032 | `/about` | ur | link | خبر Chamber news d098e0 | ticker.post | 1 | 174x38 | PASS | target answered 200 |
| EL-SITE-033 | `/about` | ur | link | خبریں | /ur/news | 1 | 45x38 | PASS | target answered 200 |
| EL-SITE-034 | `/about` | ur | link | خدمات | /ur/services | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-035 | `/about` | ur | link | ڈائریکٹری | /ur/directory | 1 | 59x38 | PASS | target answered 200 |
| EL-SITE-036 | `/about` | ur | link | ڈیجیٹل رسائی ہر خدمت آن لائن، کسی بھی شہر سے۔ | nav | 1 | 371x205 | PASS | target answered 200 |
| EL-SITE-037 | `/about` | ur | link | رابطہ | /ur/contact | 1 | 41x38 | PASS | target answered 200 |
| EL-SITE-038 | `/about` | ur | link | رکنیت | /ur/membership | 1 | 46x38 | PASS | target answered 200 |
| EL-SITE-039 | `/about` | ur | link | سرٹیفکیٹ آف اوریجن | /ur/service?s=co | 1 | 245x37 | PASS | target answered 200 |
| EL-SITE-040 | `/about` | ur | link | ممبر لاگ اِن | /ur/login | 1 | 106x44 | PASS | target answered 200 |
| EL-SITE-041 | `/about` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-SITE-042 | `/about` | ur | link | ہوم | nav | 1 | 44x44 | PASS | target answered 200 |
| EL-SITE-043 | `/about` | ur | link | وسائل | /ur/resources | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-044 | `/about` | ur | link | ویزا لیٹر | /ur/service?s=visa | 1 | 245x37 | PASS | target answered 200 |
| EL-REP-001 | `/admin/ai` | en | button | Light or dark theme | theme.toggle | 8 | 44x44 | PASS | exercised by a functional spec |
| EL-REP-002 | `/admin/ai` | en | button | Sign out | logout | 8 | 116x44 | PASS | exercised by a functional spec |
| EL-REP-003 | `/admin/ai` | en | input:date | Election schedule announced on |  | 5 | 204x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-REP-004 | `/admin/ai` | en | link | Accounts | /admin/finance | 8 | 238x44 | PASS | target answered 200 |
| EL-REP-005 | `/admin/ai` | en | link | AI Insights | /admin/ai | 8 | 129x46 | PASS | target answered 200 |
| EL-REP-006 | `/admin/ai` | en | link | All classes | voter.class | 5 | 104x44 | PASS | target answered 200 |
| EL-REP-007 | `/admin/ai` | en | link | Ask MCCI AI | /admin/help | 8 | 238x44 | PASS | target answered 200 |
| EL-REP-008 | `/admin/ai` | en | link | Associate | voter.class | 5 | 102x44 | PASS | target answered 200 |
| EL-REP-009 | `/admin/ai` | en | link | Business Directory | /admin/business-directory | 8 | 238x44 | PASS | target answered 200 |
| EL-REP-010 | `/admin/ai` | en | link | Certificates | /admin/temp | 8 | 238x44 | PASS | target answered 200 |
| EL-REP-011 | `/admin/ai` | en | link | Complaint Desk | /admin/complaints | 8 | 238x44 | PASS | target answered 200 |
| EL-REP-012 | `/admin/ai` | en | link | Content & Messaging | /admin/content | 8 | 238x44 | PASS | target answered 200 |
| EL-REP-013 | `/admin/ai` | en | link | Corporate | voter.class | 5 | 105x44 | PASS | target answered 200 |
| EL-REP-014 | `/admin/ai` | en | link | Documents & QR | /admin/documents | 8 | 238x44 | PASS | target answered 200 |
| EL-REP-015 | `/admin/ai` | en | link | Download the list | voter.export | 2 | 166x44 | PARTIAL | download or sign-out link, not requested |
| EL-REP-016 | `/admin/ai` | en | link | Eligible | voter.result | 5 | 84x44 | PASS | target answered 200 |
| EL-REP-017 | `/admin/ai` | en | link | Events & Meetings | /admin/events | 8 | 238x44 | PASS | target answered 200 |
| EL-REP-018 | `/admin/ai` | en | link | Everyone | voter.result | 5 | 98x44 | PASS | target answered 200 |
| EL-REP-019 | `/admin/ai` | en | link | MCCI Admin Secretariat Panel | /admin | 8 | 238x82 | PASS | target answered 200 |
| EL-REP-020 | `/admin/ai` | en | link | MCCI-C-9001 | member.open | 5 | 108x44 | PASS | target answered 200 |
| EL-REP-021 | `/admin/ai` | en | link | MCCI-C-9002 | member.open | 5 | 111x44 | PASS | target answered 200 |
| EL-REP-022 | `/admin/ai` | en | link | MCCI-C-918470 | member.open | 5 | 125x44 | PASS | target answered 200 |
| EL-REP-023 | `/admin/ai` | en | link | MCCI-C-946465 | member.open | 5 | 128x44 | PASS | target answered 200 |
| EL-REP-024 | `/admin/ai` | en | link | MCCI-C-975169 | member.open | 5 | 122x44 | PASS | target answered 200 |
| EL-REP-025 | `/admin/ai` | en | link | Members Register | /admin/members | 8 | 238x44 | PASS | target answered 200 |
| EL-REP-026 | `/admin/ai` | en | link | Membership Pipeline | /admin/requests | 8 | 238x44 | PASS | target answered 200 |
| EL-REP-027 | `/admin/ai` | en | link | Not eligible | voter.result | 5 | 111x44 | PASS | target answered 200 |
| EL-REP-028 | `/admin/ai` | en | link | Payments | /admin/payments | 8 | 238x44 | PASS | target answered 200 |
| EL-REP-029 | `/admin/ai` | en | link | Reports & AI | /admin/reports | 8 | 238x44 | PASS | target answered 200 |
| EL-REP-030 | `/admin/ai` | en | link | Service Requests | /admin/applications | 8 | 238x44 | PASS | target answered 200 |
| EL-REP-031 | `/admin/ai` | en | link | Services & Integrations | /admin/services | 8 | 238x44 | PASS | target answered 200 |
| EL-REP-032 | `/admin/ai` | en | link | Settings | /admin/settings | 8 | 238x44 | PASS | target answered 200 |
| EL-REP-033 | `/admin/ai` | en | link | Skip to content | #main | 8 | 144x47 | PASS | in-page anchor |
| EL-REP-034 | `/admin/ai` | en | link | Staff & Audit | /admin/staff | 8 | 238x44 | PASS | target answered 200 |
| EL-REP-035 | `/admin/ai` | en | link | WhatsApp | /admin/whatsapp | 8 | 238x44 | PASS | target answered 200 |
| EL-REP-036 | `/admin/ai` | en | submit | Make the list | voter.apply | 5 | 123x44 | PASS | exercised by a functional spec |
| EL-REP-037 | `/admin/ai` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-REP-038 | `/admin/ai` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-REP-039 | `/admin/ai` | ur | input:date | انتخابی شیڈول کے اعلان کی تاریخ |  | 1 | 147x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-REP-040 | `/admin/ai` | ur | link | MCCI-C-9001 | member.open | 1 | 108x44 | PASS | target answered 200 |
| EL-REP-041 | `/admin/ai` | ur | link | MCCI-C-9002 | member.open | 1 | 111x44 | PASS | target answered 200 |
| EL-REP-042 | `/admin/ai` | ur | link | MCCI-C-918470 | member.open | 1 | 125x44 | PASS | target answered 200 |
| EL-REP-043 | `/admin/ai` | ur | link | MCCI-C-946465 | member.open | 1 | 128x44 | PASS | target answered 200 |
| EL-REP-044 | `/admin/ai` | ur | link | MCCI-C-975169 | member.open | 1 | 122x44 | PASS | target answered 200 |
| EL-REP-045 | `/admin/ai` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-REP-046 | `/admin/ai` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-REP-047 | `/admin/ai` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-REP-048 | `/admin/ai` | ur | link | اہل | voter.result | 1 | 47x44 | PASS | target answered 200 |
| EL-REP-049 | `/admin/ai` | ur | link | ایسوسی ایٹ | voter.class | 1 | 76x44 | PASS | target answered 200 |
| EL-REP-050 | `/admin/ai` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-REP-051 | `/admin/ai` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-REP-052 | `/admin/ai` | ur | link | اے آئی جائزہ | /ur/admin/ai | 1 | 109x52 | PASS | target answered 200 |
| EL-REP-053 | `/admin/ai` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-REP-054 | `/admin/ai` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-REP-055 | `/admin/ai` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-REP-056 | `/admin/ai` | ur | link | تمام اقسام | voter.class | 1 | 69x44 | PASS | target answered 200 |
| EL-REP-057 | `/admin/ai` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-REP-058 | `/admin/ai` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-REP-059 | `/admin/ai` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-REP-060 | `/admin/ai` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-REP-061 | `/admin/ai` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-REP-062 | `/admin/ai` | ur | link | سب | voter.result | 1 | 50x44 | PASS | target answered 200 |
| EL-REP-063 | `/admin/ai` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-REP-064 | `/admin/ai` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-REP-065 | `/admin/ai` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-REP-066 | `/admin/ai` | ur | link | غیر اہل | voter.result | 1 | 61x44 | PASS | target answered 200 |
| EL-REP-067 | `/admin/ai` | ur | link | فہرست ڈاؤن لوڈ کریں | voter.export | 1 | 129x45 | PARTIAL | download or sign-out link, not requested |
| EL-REP-068 | `/admin/ai` | ur | link | کارپوریٹ | voter.class | 1 | 68x44 | PASS | target answered 200 |
| EL-REP-069 | `/admin/ai` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-REP-070 | `/admin/ai` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-REP-071 | `/admin/ai` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-REP-072 | `/admin/ai` | ur | submit | فہرست بنائیں | voter.apply | 1 | 81x49 | PASS | exercised by a functional spec |
| EL-SVC-001 | `/admin/applications` | en | button | Light or dark theme | theme.toggle | 7 | 44x44 | PASS | exercised by a functional spec |
| EL-SVC-002 | `/admin/applications` | en | button | Sign out | logout | 7 | 116x44 | PASS | exercised by a functional spec |
| EL-SVC-003 | `/admin/applications` | en | link | Accounts | /admin/finance | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-004 | `/admin/applications` | en | link | Ask MCCI AI | /admin/help | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-005 | `/admin/applications` | en | link | Business Directory | /admin/business-directory | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-006 | `/admin/applications` | en | link | Certificates | /admin/temp | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-007 | `/admin/applications` | en | link | Complaint Desk | /admin/complaints | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-008 | `/admin/applications` | en | link | Content & Messaging | /admin/content | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-009 | `/admin/applications` | en | link | Documents & QR | /admin/documents | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-010 | `/admin/applications` | en | link | Due < 3 hrs 1 SLA risk | nav | 7 | 269x119 | PASS | target answered 200 |
| EL-SVC-011 | `/admin/applications` | en | link | Events & Meetings | /admin/events | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-012 | `/admin/applications` | en | link | MCCI Admin Secretariat Panel | /admin | 7 | 238x82 | PASS | target answered 200 |
| EL-SVC-013 | `/admin/applications` | en | link | Members Register | /admin/members | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-014 | `/admin/applications` | en | link | Membership Pipeline | /admin/requests | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-015 | `/admin/applications` | en | link | Open MCCI-2026-10482 | svc.open | 7 | 179x90 | PASS | target answered 200 |
| EL-SVC-016 | `/admin/applications` | en | link | Open MCCI-2026-10483 | svc.open | 7 | 179x108 | PASS | target answered 200 |
| EL-SVC-017 | `/admin/applications` | en | link | Payments | /admin/payments | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-018 | `/admin/applications` | en | link | Reports & AI | /admin/reports | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-019 | `/admin/applications` | en | link | Review Desk | /admin/review | 7 | 147x46 | PASS | target answered 200 |
| EL-SVC-020 | `/admin/applications` | en | link | Service Requests | /admin/applications | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-021 | `/admin/applications` | en | link | Services & Integrations | /admin/services | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-022 | `/admin/applications` | en | link | Settings | /admin/settings | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-023 | `/admin/applications` | en | link | Signing | /admin/approvals | 7 | 109x46 | PASS | target answered 200 |
| EL-SVC-024 | `/admin/applications` | en | link | Skip to content | #main | 7 | 144x47 | PASS | in-page anchor |
| EL-SVC-025 | `/admin/applications` | en | link | SLA Monitor | /admin/sla | 7 | 143x46 | PASS | target answered 200 |
| EL-SVC-026 | `/admin/applications` | en | link | Staff & Audit | /admin/staff | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-027 | `/admin/applications` | en | link | To sign 0 Signatory queue | nav | 7 | 269x119 | PASS | target answered 200 |
| EL-SVC-028 | `/admin/applications` | en | link | WhatsApp | /admin/whatsapp | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-029 | `/admin/applications` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-SVC-030 | `/admin/applications` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-SVC-031 | `/admin/applications` | ur | link | 3 گھنٹے سے کم 1 وقت کا خطرہ | nav | 1 | 269x141 | PASS | target answered 200 |
| EL-SVC-032 | `/admin/applications` | ur | link | MCCI-2026-10482 کھولیں | svc.open | 1 | 179x100 | PASS | target answered 200 |
| EL-SVC-033 | `/admin/applications` | ur | link | MCCI-2026-10483 کھولیں | svc.open | 1 | 179x100 | PASS | target answered 200 |
| EL-SVC-034 | `/admin/applications` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-035 | `/admin/applications` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-036 | `/admin/applications` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-037 | `/admin/applications` | ur | link | ایس ایل اے مانیٹر | /ur/admin/sla | 1 | 126x52 | PASS | target answered 200 |
| EL-SVC-038 | `/admin/applications` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-SVC-039 | `/admin/applications` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-040 | `/admin/applications` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-041 | `/admin/applications` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-042 | `/admin/applications` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-043 | `/admin/applications` | ur | link | جائزہ ڈیسک | /ur/admin/review | 1 | 98x52 | PASS | target answered 200 |
| EL-SVC-044 | `/admin/applications` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-045 | `/admin/applications` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-046 | `/admin/applications` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-047 | `/admin/applications` | ur | link | دستخط | /ur/admin/approvals | 1 | 74x52 | PASS | target answered 200 |
| EL-SVC-048 | `/admin/applications` | ur | link | دستخط کے لیے 0 دستخط کی قطار | nav | 1 | 269x141 | PASS | target answered 200 |
| EL-SVC-049 | `/admin/applications` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-050 | `/admin/applications` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-051 | `/admin/applications` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-052 | `/admin/applications` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-053 | `/admin/applications` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-054 | `/admin/applications` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-055 | `/admin/applications` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-SVC-056 | `/admin/applications` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-057 | `/admin/approvals` | en | button | Light or dark theme | theme.toggle | 7 | 44x44 | PASS | exercised by a functional spec |
| EL-SVC-058 | `/admin/approvals` | en | button | Sign all (0) | svc.signAll | 2 | 130x44 | PARTIAL | disabled: Nothing is waiting for a signature. |
| EL-SVC-059 | `/admin/approvals` | en | button | Sign out | logout | 7 | 116x44 | PASS | exercised by a functional spec |
| EL-SVC-060 | `/admin/approvals` | en | link | Accounts | /admin/finance | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-061 | `/admin/approvals` | en | link | Ask MCCI AI | /admin/help | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-062 | `/admin/approvals` | en | link | Business Directory | /admin/business-directory | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-063 | `/admin/approvals` | en | link | Certificates | /admin/temp | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-064 | `/admin/approvals` | en | link | Complaint Desk | /admin/complaints | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-065 | `/admin/approvals` | en | link | Content & Messaging | /admin/content | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-066 | `/admin/approvals` | en | link | Documents & QR | /admin/documents | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-067 | `/admin/approvals` | en | link | Events & Meetings | /admin/events | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-068 | `/admin/approvals` | en | link | MCCI Admin Secretariat Panel | /admin | 7 | 238x82 | PASS | target answered 200 |
| EL-SVC-069 | `/admin/approvals` | en | link | Members Register | /admin/members | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-070 | `/admin/approvals` | en | link | Membership Pipeline | /admin/requests | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-071 | `/admin/approvals` | en | link | Payments | /admin/payments | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-072 | `/admin/approvals` | en | link | Reports & AI | /admin/reports | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-073 | `/admin/approvals` | en | link | Review Desk | /admin/review | 7 | 147x46 | PASS | target answered 200 |
| EL-SVC-074 | `/admin/approvals` | en | link | Service Requests | /admin/applications | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-075 | `/admin/approvals` | en | link | Services & Integrations | /admin/services | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-076 | `/admin/approvals` | en | link | Settings | /admin/settings | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-077 | `/admin/approvals` | en | link | Signing | /admin/approvals | 7 | 109x46 | PASS | target answered 200 |
| EL-SVC-078 | `/admin/approvals` | en | link | Skip to content | #main | 7 | 144x47 | PASS | in-page anchor |
| EL-SVC-079 | `/admin/approvals` | en | link | SLA Monitor | /admin/sla | 7 | 143x46 | PASS | target answered 200 |
| EL-SVC-080 | `/admin/approvals` | en | link | Staff & Audit | /admin/staff | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-081 | `/admin/approvals` | en | link | WhatsApp | /admin/whatsapp | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-082 | `/admin/approvals` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-SVC-083 | `/admin/approvals` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-SVC-084 | `/admin/approvals` | ur | button | سب پر دستخط (0) | svc.signAll | 1 | 130x47 | PARTIAL | disabled: دستخط کے لیے کچھ نہیں۔ |
| EL-SVC-085 | `/admin/approvals` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-086 | `/admin/approvals` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-087 | `/admin/approvals` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-088 | `/admin/approvals` | ur | link | ایس ایل اے مانیٹر | /ur/admin/sla | 1 | 126x52 | PASS | target answered 200 |
| EL-SVC-089 | `/admin/approvals` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-SVC-090 | `/admin/approvals` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-091 | `/admin/approvals` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-092 | `/admin/approvals` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-093 | `/admin/approvals` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-094 | `/admin/approvals` | ur | link | جائزہ ڈیسک | /ur/admin/review | 1 | 98x52 | PASS | target answered 200 |
| EL-SVC-095 | `/admin/approvals` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-096 | `/admin/approvals` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-097 | `/admin/approvals` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-098 | `/admin/approvals` | ur | link | دستخط | /ur/admin/approvals | 1 | 74x52 | PASS | target answered 200 |
| EL-SVC-099 | `/admin/approvals` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-100 | `/admin/approvals` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-101 | `/admin/approvals` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-102 | `/admin/approvals` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-103 | `/admin/approvals` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-104 | `/admin/approvals` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-105 | `/admin/approvals` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-SVC-106 | `/admin/approvals` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-STAFF-001 | `/admin/audit` | en | button | Light or dark theme | theme.toggle | 4 | 44x44 | PASS | exercised by a functional spec |
| EL-STAFF-002 | `/admin/audit` | en | button | Show | audit.filter | 4 | 73x44 | PASS | exercised by a functional spec |
| EL-STAFF-003 | `/admin/audit` | en | button | Sign out | logout | 4 | 116x44 | PASS | exercised by a functional spec |
| EL-STAFF-004 | `/admin/audit` | en | disclosure | 1 field(s) changed |  | 4 | 301x23 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-005 | `/admin/audit` | en | disclosure | 10 field(s) changed |  | 4 | 301x23 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-006 | `/admin/audit` | en | disclosure | 12 field(s) changed |  | 4 | 301x23 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-007 | `/admin/audit` | en | disclosure | 18 field(s) changed |  | 4 | 301x23 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-008 | `/admin/audit` | en | disclosure | 2 field(s) changed |  | 4 | 301x23 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-009 | `/admin/audit` | en | disclosure | 20 field(s) changed |  | 4 | 301x23 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-010 | `/admin/audit` | en | disclosure | 23 field(s) changed |  | 4 | 301x23 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-011 | `/admin/audit` | en | disclosure | 26 field(s) changed |  | 1 | 302x23 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-012 | `/admin/audit` | en | disclosure | 3 field(s) changed |  | 4 | 301x23 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-013 | `/admin/audit` | en | disclosure | 4 field(s) changed |  | 4 | 301x23 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-014 | `/admin/audit` | en | disclosure | 6 field(s) changed |  | 4 | 301x23 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-015 | `/admin/audit` | en | disclosure | 7 field(s) changed |  | 4 | 301x23 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-016 | `/admin/audit` | en | input:text | Search the audit log… |  | 4 | 863x45 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-017 | `/admin/audit` | en | link | Accounts | /admin/finance | 4 | 238x44 | PASS | target answered 200 |
| EL-STAFF-018 | `/admin/audit` | en | link | Ask MCCI AI | /admin/help | 4 | 238x44 | PASS | target answered 200 |
| EL-STAFF-019 | `/admin/audit` | en | link | Audit Trail | /admin/audit | 4 | 125x46 | PASS | target answered 200 |
| EL-STAFF-020 | `/admin/audit` | en | link | Business Directory | /admin/business-directory | 4 | 238x44 | PASS | target answered 200 |
| EL-STAFF-021 | `/admin/audit` | en | link | Certificates | /admin/temp | 4 | 238x44 | PASS | target answered 200 |
| EL-STAFF-022 | `/admin/audit` | en | link | Complaint Desk | /admin/complaints | 4 | 238x44 | PASS | target answered 200 |
| EL-STAFF-023 | `/admin/audit` | en | link | Content & Messaging | /admin/content | 4 | 238x44 | PASS | target answered 200 |
| EL-STAFF-024 | `/admin/audit` | en | link | Documents & QR | /admin/documents | 4 | 238x44 | PASS | target answered 200 |
| EL-STAFF-025 | `/admin/audit` | en | link | Events & Meetings | /admin/events | 4 | 238x44 | PASS | target answered 200 |
| EL-STAFF-026 | `/admin/audit` | en | link | Export CSV | audit.export | 1 | 114x44 | PARTIAL | download or sign-out link, not requested |
| EL-STAFF-027 | `/admin/audit` | en | link | MCCI Admin Secretariat Panel | /admin | 4 | 238x82 | PASS | target answered 200 |
| EL-STAFF-028 | `/admin/audit` | en | link | Members Register | /admin/members | 4 | 238x44 | PASS | target answered 200 |
| EL-STAFF-029 | `/admin/audit` | en | link | Membership Pipeline | /admin/requests | 4 | 238x44 | PASS | target answered 200 |
| EL-STAFF-030 | `/admin/audit` | en | link | Payments | /admin/payments | 4 | 238x44 | PASS | target answered 200 |
| EL-STAFF-031 | `/admin/audit` | en | link | Reports & AI | /admin/reports | 4 | 238x44 | PASS | target answered 200 |
| EL-STAFF-032 | `/admin/audit` | en | link | Service Requests | /admin/applications | 4 | 238x44 | PASS | target answered 200 |
| EL-STAFF-033 | `/admin/audit` | en | link | Services & Integrations | /admin/services | 4 | 238x44 | PASS | target answered 200 |
| EL-STAFF-034 | `/admin/audit` | en | link | Settings | /admin/settings | 4 | 238x44 | PASS | target answered 200 |
| EL-STAFF-035 | `/admin/audit` | en | link | Skip to content | #main | 4 | 144x47 | PASS | in-page anchor |
| EL-STAFF-036 | `/admin/audit` | en | link | Staff & Audit | /admin/staff | 4 | 238x44 | PASS | target answered 200 |
| EL-STAFF-037 | `/admin/audit` | en | link | WhatsApp | /admin/whatsapp | 4 | 238x44 | PASS | target answered 200 |
| EL-STAFF-038 | `/admin/audit` | en | select | Period |  | 4 | 124x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-039 | `/admin/audit` | ur | button | دکھائیں | audit.filter | 1 | 60x49 | PASS | exercised by a functional spec |
| EL-STAFF-040 | `/admin/audit` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-STAFF-041 | `/admin/audit` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-STAFF-042 | `/admin/audit` | ur | disclosure | 1 خانے تبدیل |  | 1 | 295x29 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-043 | `/admin/audit` | ur | disclosure | 10 خانے تبدیل |  | 1 | 295x29 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-044 | `/admin/audit` | ur | disclosure | 12 خانے تبدیل |  | 1 | 295x29 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-045 | `/admin/audit` | ur | disclosure | 18 خانے تبدیل |  | 1 | 295x29 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-046 | `/admin/audit` | ur | disclosure | 2 خانے تبدیل |  | 1 | 295x29 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-047 | `/admin/audit` | ur | disclosure | 20 خانے تبدیل |  | 1 | 295x29 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-048 | `/admin/audit` | ur | disclosure | 23 خانے تبدیل |  | 1 | 295x29 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-049 | `/admin/audit` | ur | disclosure | 3 خانے تبدیل |  | 1 | 295x29 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-050 | `/admin/audit` | ur | disclosure | 4 خانے تبدیل |  | 1 | 295x29 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-051 | `/admin/audit` | ur | disclosure | 6 خانے تبدیل |  | 1 | 295x29 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-052 | `/admin/audit` | ur | disclosure | 7 خانے تبدیل |  | 1 | 295x29 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-053 | `/admin/audit` | ur | input:text | آڈٹ لاگ تلاش کریں… |  | 1 | 923x51 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-054 | `/admin/audit` | ur | link | آڈٹ ریکارڈ | /ur/admin/audit | 1 | 98x52 | PASS | target answered 200 |
| EL-STAFF-055 | `/admin/audit` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-STAFF-056 | `/admin/audit` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-STAFF-057 | `/admin/audit` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-STAFF-058 | `/admin/audit` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-STAFF-059 | `/admin/audit` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-STAFF-060 | `/admin/audit` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-STAFF-061 | `/admin/audit` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-STAFF-062 | `/admin/audit` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-STAFF-063 | `/admin/audit` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-STAFF-064 | `/admin/audit` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-STAFF-065 | `/admin/audit` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-STAFF-066 | `/admin/audit` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-STAFF-067 | `/admin/audit` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-STAFF-068 | `/admin/audit` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-STAFF-069 | `/admin/audit` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-STAFF-070 | `/admin/audit` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-STAFF-071 | `/admin/audit` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-STAFF-072 | `/admin/audit` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-STAFF-073 | `/admin/audit` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-STAFF-074 | `/admin/audit` | ur | select | مدت |  | 1 | 77x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-001 | `/admin/business-directory/exports` | en | button | Add filter group | biz.group.add | 3 | 148x44 | PASS | exercised by a functional spec |
| EL-BIZ-002 | `/admin/business-directory/exports` | en | button | Apply filters | biz.filter.apply | 3 | 141x44 | PASS | exercised by a functional spec |
| EL-BIZ-003 | `/admin/business-directory/exports` | en | button | Clear | biz.filter.clear | 3 | 83x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-004 | `/admin/business-directory/exports` | en | button | Download | biz.export.download | 3 | 128x44 | PASS | exercised by a functional spec |
| EL-BIZ-005 | `/admin/business-directory/exports` | en | button | Light or dark theme | theme.toggle | 3 | 44x44 | PASS | exercised by a functional spec |
| EL-BIZ-006 | `/admin/business-directory/exports` | en | button | Preview | biz.export.preview | 3 | 100x44 | PASS | exercised by a functional spec |
| EL-BIZ-007 | `/admin/business-directory/exports` | en | button | Sign out | logout | 3 | 116x44 | PASS | exercised by a functional spec |
| EL-BIZ-008 | `/admin/business-directory/exports` | en | input:checkbox | Address |  | 3 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-009 | `/admin/business-directory/exports` | en | input:checkbox | Business name |  | 3 | 20x20 | PASS | exercised by a functional spec |
| EL-BIZ-010 | `/admin/business-directory/exports` | en | input:checkbox | Category |  | 3 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-011 | `/admin/business-directory/exports` | en | input:checkbox | City |  | 3 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-012 | `/admin/business-directory/exports` | en | input:checkbox | Class |  | 3 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-013 | `/admin/business-directory/exports` | en | input:checkbox | District |  | 3 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-014 | `/admin/business-directory/exports` | en | input:checkbox | Email |  | 3 | 20x20 | PASS | exercised by a functional spec |
| EL-BIZ-015 | `/admin/business-directory/exports` | en | input:checkbox | Industry sector |  | 3 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-016 | `/admin/business-directory/exports` | en | input:checkbox | Internal tags |  | 3 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-017 | `/admin/business-directory/exports` | en | input:checkbox | Member since |  | 3 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-018 | `/admin/business-directory/exports` | en | input:checkbox | Membership no. |  | 3 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-019 | `/admin/business-directory/exports` | en | input:checkbox | Nature of business |  | 3 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-020 | `/admin/business-directory/exports` | en | input:checkbox | NTN |  | 3 | 20x20 | PASS | exercised by a functional spec |
| EL-BIZ-021 | `/admin/business-directory/exports` | en | input:checkbox | Registration |  | 3 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-022 | `/admin/business-directory/exports` | en | input:checkbox | Representative |  | 3 | 20x20 | PASS | exercised by a functional spec |
| EL-BIZ-023 | `/admin/business-directory/exports` | en | input:checkbox | Status |  | 3 | 20x20 | PASS | exercised by a functional spec |
| EL-BIZ-024 | `/admin/business-directory/exports` | en | input:checkbox | Telephone |  | 3 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-025 | `/admin/business-directory/exports` | en | input:checkbox | Valid till |  | 3 | 20x20 | PASS | exercised by a functional spec |
| EL-BIZ-026 | `/admin/business-directory/exports` | en | input:checkbox | WhatsApp consent |  | 3 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-027 | `/admin/business-directory/exports` | en | input:checkbox | WhatsApp number |  | 3 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-028 | `/admin/business-directory/exports` | en | input:radio | All matching the filters above |  | 3 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-029 | `/admin/business-directory/exports` | en | input:radio | Nothing selected in the directory |  | 3 | 20x20 | PARTIAL | disabled: Nothing selected in the directory |
| EL-BIZ-030 | `/admin/business-directory/exports` | en | input:search | Search by name or membership number |  | 3 | 1080x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-031 | `/admin/business-directory/exports` | en | input:text | Reason (optional) |  | 3 | 535x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-032 | `/admin/business-directory/exports` | en | link | Accounts | /admin/finance | 3 | 238x44 | PASS | target answered 200 |
| EL-BIZ-033 | `/admin/business-directory/exports` | en | link | Ask MCCI AI | /admin/help | 3 | 238x44 | PASS | target answered 200 |
| EL-BIZ-034 | `/admin/business-directory/exports` | en | link | Back to directory | biz.back | 3 | 182x44 | PASS | target answered 200 |
| EL-BIZ-035 | `/admin/business-directory/exports` | en | link | Business Directory | /admin/business-directory | 3 | 238x44 | PASS | target answered 200 |
| EL-BIZ-036 | `/admin/business-directory/exports` | en | link | Certificates | /admin/temp | 3 | 238x44 | PASS | target answered 200 |
| EL-BIZ-037 | `/admin/business-directory/exports` | en | link | Complaint Desk | /admin/complaints | 3 | 238x44 | PASS | target answered 200 |
| EL-BIZ-038 | `/admin/business-directory/exports` | en | link | Content & Messaging | /admin/content | 3 | 238x44 | PASS | target answered 200 |
| EL-BIZ-039 | `/admin/business-directory/exports` | en | link | Documents & QR | /admin/documents | 3 | 238x44 | PASS | target answered 200 |
| EL-BIZ-040 | `/admin/business-directory/exports` | en | link | Events & Meetings | /admin/events | 3 | 238x44 | PASS | target answered 200 |
| EL-BIZ-041 | `/admin/business-directory/exports` | en | link | Exports | /admin/business-directory/exports | 3 | 111x46 | PASS | target answered 200 |
| EL-BIZ-042 | `/admin/business-directory/exports` | en | link | MCCI Admin Secretariat Panel | /admin | 3 | 238x82 | PASS | target answered 200 |
| EL-BIZ-043 | `/admin/business-directory/exports` | en | link | Members Register | /admin/members | 3 | 238x44 | PASS | target answered 200 |
| EL-BIZ-044 | `/admin/business-directory/exports` | en | link | Membership Pipeline | /admin/requests | 3 | 238x44 | PASS | target answered 200 |
| EL-BIZ-045 | `/admin/business-directory/exports` | en | link | Payments | /admin/payments | 3 | 238x44 | PASS | target answered 200 |
| EL-BIZ-046 | `/admin/business-directory/exports` | en | link | Profile | /admin/business-directory/profile | 3 | 101x46 | PASS | target answered 200 |
| EL-BIZ-047 | `/admin/business-directory/exports` | en | link | Reports & AI | /admin/reports | 3 | 238x44 | PASS | target answered 200 |
| EL-BIZ-048 | `/admin/business-directory/exports` | en | link | Segments | /admin/business-directory/segments | 3 | 129x46 | PASS | target answered 200 |
| EL-BIZ-049 | `/admin/business-directory/exports` | en | link | Service Requests | /admin/applications | 3 | 238x44 | PASS | target answered 200 |
| EL-BIZ-050 | `/admin/business-directory/exports` | en | link | Services & Integrations | /admin/services | 3 | 238x44 | PASS | target answered 200 |
| EL-BIZ-051 | `/admin/business-directory/exports` | en | link | Settings | /admin/settings | 3 | 238x44 | PASS | target answered 200 |
| EL-BIZ-052 | `/admin/business-directory/exports` | en | link | Skip to content | #main | 3 | 144x47 | PASS | in-page anchor |
| EL-BIZ-053 | `/admin/business-directory/exports` | en | link | Staff & Audit | /admin/staff | 3 | 238x44 | PASS | target answered 200 |
| EL-BIZ-054 | `/admin/business-directory/exports` | en | link | WhatsApp | /admin/whatsapp | 3 | 238x44 | PASS | target answered 200 |
| EL-BIZ-055 | `/admin/business-directory/exports` | en | select | FormatCSVExcel (XLSX)PDF (English only) |  | 3 | 535x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-056 | `/admin/business-directory/exports` | ur | button | پیش منظر | biz.export.preview | 1 | 79x47 | PASS | exercised by a functional spec |
| EL-BIZ-057 | `/admin/business-directory/exports` | ur | button | ڈاؤن لوڈ کریں | biz.export.download | 1 | 109x47 | PASS | exercised by a functional spec |
| EL-BIZ-058 | `/admin/business-directory/exports` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-BIZ-059 | `/admin/business-directory/exports` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-BIZ-060 | `/admin/business-directory/exports` | ur | button | صاف کریں | biz.filter.clear | 1 | 87x47 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-061 | `/admin/business-directory/exports` | ur | button | فلٹر گروپ شامل کریں | biz.group.add | 1 | 123x44 | PASS | exercised by a functional spec |
| EL-BIZ-062 | `/admin/business-directory/exports` | ur | button | فلٹر لگائیں | biz.filter.apply | 1 | 90x47 | PASS | exercised by a functional spec |
| EL-BIZ-063 | `/admin/business-directory/exports` | ur | input:checkbox | اندرونی ٹیگ |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-064 | `/admin/business-directory/exports` | ur | input:checkbox | ای میل |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-065 | `/admin/business-directory/exports` | ur | input:checkbox | این ٹی این |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-066 | `/admin/business-directory/exports` | ur | input:checkbox | پتہ |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-067 | `/admin/business-directory/exports` | ur | input:checkbox | ٹیلی فون |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-068 | `/admin/business-directory/exports` | ur | input:checkbox | حیثیت |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-069 | `/admin/business-directory/exports` | ur | input:checkbox | رجسٹریشن |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-070 | `/admin/business-directory/exports` | ur | input:checkbox | رکن از |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-071 | `/admin/business-directory/exports` | ur | input:checkbox | رکنیت نمبر |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-072 | `/admin/business-directory/exports` | ur | input:checkbox | زمرہ |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-073 | `/admin/business-directory/exports` | ur | input:checkbox | شہر |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-074 | `/admin/business-directory/exports` | ur | input:checkbox | صنعتی شعبہ |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-075 | `/admin/business-directory/exports` | ur | input:checkbox | ضلع |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-076 | `/admin/business-directory/exports` | ur | input:checkbox | قسم |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-077 | `/admin/business-directory/exports` | ur | input:checkbox | کارآمد تا |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-078 | `/admin/business-directory/exports` | ur | input:checkbox | کاروبار کا نام |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-079 | `/admin/business-directory/exports` | ur | input:checkbox | کاروبار کی نوعیت |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-080 | `/admin/business-directory/exports` | ur | input:checkbox | نمائندہ |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-081 | `/admin/business-directory/exports` | ur | input:checkbox | واٹس ایپ رضامندی |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-082 | `/admin/business-directory/exports` | ur | input:checkbox | واٹس ایپ نمبر |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-083 | `/admin/business-directory/exports` | ur | input:radio | اوپر کے فلٹر سے مطابقت رکھنے والے تمام |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-084 | `/admin/business-directory/exports` | ur | input:radio | ڈائریکٹری میں کچھ منتخب نہیں |  | 1 | 20x20 | PARTIAL | disabled: ڈائریکٹری میں کچھ منتخب نہیں |
| EL-BIZ-085 | `/admin/business-directory/exports` | ur | input:search | نام یا رکنیت نمبر سے تلاش کریں |  | 1 | 1080x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-086 | `/admin/business-directory/exports` | ur | input:text | وجہ (اختیاری) |  | 1 | 535x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-087 | `/admin/business-directory/exports` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-088 | `/admin/business-directory/exports` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-089 | `/admin/business-directory/exports` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-090 | `/admin/business-directory/exports` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-BIZ-091 | `/admin/business-directory/exports` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-092 | `/admin/business-directory/exports` | ur | link | برآمدات | /ur/admin/business-directory/exports | 1 | 89x52 | PASS | target answered 200 |
| EL-BIZ-093 | `/admin/business-directory/exports` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-094 | `/admin/business-directory/exports` | ur | link | پروفائل | /ur/admin/business-directory/profile | 1 | 84x52 | PASS | target answered 200 |
| EL-BIZ-095 | `/admin/business-directory/exports` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-096 | `/admin/business-directory/exports` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-097 | `/admin/business-directory/exports` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-098 | `/admin/business-directory/exports` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-099 | `/admin/business-directory/exports` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-100 | `/admin/business-directory/exports` | ur | link | ڈائریکٹری پر واپس | biz.back | 1 | 125x49 | PASS | target answered 200 |
| EL-BIZ-101 | `/admin/business-directory/exports` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-102 | `/admin/business-directory/exports` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-103 | `/admin/business-directory/exports` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-104 | `/admin/business-directory/exports` | ur | link | سیگمنٹس | /ur/admin/business-directory/segments | 1 | 86x52 | PASS | target answered 200 |
| EL-BIZ-105 | `/admin/business-directory/exports` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-106 | `/admin/business-directory/exports` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-107 | `/admin/business-directory/exports` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-108 | `/admin/business-directory/exports` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-BIZ-109 | `/admin/business-directory/exports` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-110 | `/admin/business-directory/exports` | ur | select | فارمیٹCSVExcel (XLSX)پی ڈی ایف (صرف انگریزی) |  | 1 | 535x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-111 | `/admin/business-directory/profile` | en | button | Light or dark theme | theme.toggle | 6 | 44x44 | PASS | exercised by a functional spec |
| EL-BIZ-112 | `/admin/business-directory/profile` | en | button | Sign out | logout | 6 | 116x44 | PASS | exercised by a functional spec |
| EL-BIZ-113 | `/admin/business-directory/profile` | en | link | Accounts | /admin/finance | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-114 | `/admin/business-directory/profile` | en | link | Ask MCCI AI | /admin/help | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-115 | `/admin/business-directory/profile` | en | link | Back to directory | biz.back | 6 | 182x44 | PASS | target answered 200 |
| EL-BIZ-116 | `/admin/business-directory/profile` | en | link | Business Directory | /admin/business-directory | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-117 | `/admin/business-directory/profile` | en | link | Certificates | /admin/temp | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-118 | `/admin/business-directory/profile` | en | link | Complaint Desk | /admin/complaints | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-119 | `/admin/business-directory/profile` | en | link | Content & Messaging | /admin/content | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-120 | `/admin/business-directory/profile` | en | link | Documents & QR | /admin/documents | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-121 | `/admin/business-directory/profile` | en | link | Events & Meetings | /admin/events | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-122 | `/admin/business-directory/profile` | en | link | Exports | /admin/business-directory/exports | 6 | 111x46 | PASS | target answered 200 |
| EL-BIZ-123 | `/admin/business-directory/profile` | en | link | MCCI Admin Secretariat Panel | /admin | 6 | 238x82 | PASS | target answered 200 |
| EL-BIZ-124 | `/admin/business-directory/profile` | en | link | Members Register | /admin/members | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-125 | `/admin/business-directory/profile` | en | link | Membership Pipeline | /admin/requests | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-126 | `/admin/business-directory/profile` | en | link | Payments | /admin/payments | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-127 | `/admin/business-directory/profile` | en | link | Profile | /admin/business-directory/profile | 6 | 101x46 | PASS | target answered 200 |
| EL-BIZ-128 | `/admin/business-directory/profile` | en | link | Reports & AI | /admin/reports | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-129 | `/admin/business-directory/profile` | en | link | Segments | /admin/business-directory/segments | 6 | 129x46 | PASS | target answered 200 |
| EL-BIZ-130 | `/admin/business-directory/profile` | en | link | Service Requests | /admin/applications | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-131 | `/admin/business-directory/profile` | en | link | Services & Integrations | /admin/services | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-132 | `/admin/business-directory/profile` | en | link | Settings | /admin/settings | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-133 | `/admin/business-directory/profile` | en | link | Skip to content | #main | 6 | 144x47 | PASS | in-page anchor |
| EL-BIZ-134 | `/admin/business-directory/profile` | en | link | Staff & Audit | /admin/staff | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-135 | `/admin/business-directory/profile` | en | link | WhatsApp | /admin/whatsapp | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-136 | `/admin/business-directory/profile` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-BIZ-137 | `/admin/business-directory/profile` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-BIZ-138 | `/admin/business-directory/profile` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-139 | `/admin/business-directory/profile` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-140 | `/admin/business-directory/profile` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-141 | `/admin/business-directory/profile` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-BIZ-142 | `/admin/business-directory/profile` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-143 | `/admin/business-directory/profile` | ur | link | برآمدات | /ur/admin/business-directory/exports | 1 | 89x52 | PASS | target answered 200 |
| EL-BIZ-144 | `/admin/business-directory/profile` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-145 | `/admin/business-directory/profile` | ur | link | پروفائل | /ur/admin/business-directory/profile | 1 | 84x52 | PASS | target answered 200 |
| EL-BIZ-146 | `/admin/business-directory/profile` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-147 | `/admin/business-directory/profile` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-148 | `/admin/business-directory/profile` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-149 | `/admin/business-directory/profile` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-150 | `/admin/business-directory/profile` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-151 | `/admin/business-directory/profile` | ur | link | ڈائریکٹری پر واپس | biz.back | 1 | 125x49 | PASS | target answered 200 |
| EL-BIZ-152 | `/admin/business-directory/profile` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-153 | `/admin/business-directory/profile` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-154 | `/admin/business-directory/profile` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-155 | `/admin/business-directory/profile` | ur | link | سیگمنٹس | /ur/admin/business-directory/segments | 1 | 86x52 | PASS | target answered 200 |
| EL-BIZ-156 | `/admin/business-directory/profile` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-157 | `/admin/business-directory/profile` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-158 | `/admin/business-directory/profile` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-159 | `/admin/business-directory/profile` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-BIZ-160 | `/admin/business-directory/profile` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-161 | `/admin/business-directory/segments` | en | button | Light or dark theme | theme.toggle | 6 | 44x44 | PASS | exercised by a functional spec |
| EL-BIZ-162 | `/admin/business-directory/segments` | en | button | Sign out | logout | 6 | 116x44 | PASS | exercised by a functional spec |
| EL-BIZ-163 | `/admin/business-directory/segments` | en | link | Accounts | /admin/finance | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-164 | `/admin/business-directory/segments` | en | link | Ask MCCI AI | /admin/help | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-165 | `/admin/business-directory/segments` | en | link | Back to directory | biz.back | 6 | 182x44 | PASS | target answered 200 |
| EL-BIZ-166 | `/admin/business-directory/segments` | en | link | Business Directory | /admin/business-directory | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-167 | `/admin/business-directory/segments` | en | link | Certificates | /admin/temp | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-168 | `/admin/business-directory/segments` | en | link | Complaint Desk | /admin/complaints | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-169 | `/admin/business-directory/segments` | en | link | Content & Messaging | /admin/content | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-170 | `/admin/business-directory/segments` | en | link | Documents & QR | /admin/documents | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-171 | `/admin/business-directory/segments` | en | link | Events & Meetings | /admin/events | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-172 | `/admin/business-directory/segments` | en | link | Exports | /admin/business-directory/exports | 6 | 111x46 | PASS | target answered 200 |
| EL-BIZ-173 | `/admin/business-directory/segments` | en | link | MCCI Admin Secretariat Panel | /admin | 6 | 238x82 | PASS | target answered 200 |
| EL-BIZ-174 | `/admin/business-directory/segments` | en | link | Members Register | /admin/members | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-175 | `/admin/business-directory/segments` | en | link | Membership Pipeline | /admin/requests | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-176 | `/admin/business-directory/segments` | en | link | Payments | /admin/payments | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-177 | `/admin/business-directory/segments` | en | link | Profile | /admin/business-directory/profile | 6 | 101x46 | PASS | target answered 200 |
| EL-BIZ-178 | `/admin/business-directory/segments` | en | link | Reports & AI | /admin/reports | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-179 | `/admin/business-directory/segments` | en | link | Segments | /admin/business-directory/segments | 6 | 129x46 | PASS | target answered 200 |
| EL-BIZ-180 | `/admin/business-directory/segments` | en | link | Service Requests | /admin/applications | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-181 | `/admin/business-directory/segments` | en | link | Services & Integrations | /admin/services | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-182 | `/admin/business-directory/segments` | en | link | Settings | /admin/settings | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-183 | `/admin/business-directory/segments` | en | link | Skip to content | #main | 6 | 144x47 | PASS | in-page anchor |
| EL-BIZ-184 | `/admin/business-directory/segments` | en | link | Staff & Audit | /admin/staff | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-185 | `/admin/business-directory/segments` | en | link | WhatsApp | /admin/whatsapp | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-186 | `/admin/business-directory/segments` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-BIZ-187 | `/admin/business-directory/segments` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-BIZ-188 | `/admin/business-directory/segments` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-189 | `/admin/business-directory/segments` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-190 | `/admin/business-directory/segments` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-191 | `/admin/business-directory/segments` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-BIZ-192 | `/admin/business-directory/segments` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-193 | `/admin/business-directory/segments` | ur | link | برآمدات | /ur/admin/business-directory/exports | 1 | 89x52 | PASS | target answered 200 |
| EL-BIZ-194 | `/admin/business-directory/segments` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-195 | `/admin/business-directory/segments` | ur | link | پروفائل | /ur/admin/business-directory/profile | 1 | 84x52 | PASS | target answered 200 |
| EL-BIZ-196 | `/admin/business-directory/segments` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-197 | `/admin/business-directory/segments` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-198 | `/admin/business-directory/segments` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-199 | `/admin/business-directory/segments` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-200 | `/admin/business-directory/segments` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-201 | `/admin/business-directory/segments` | ur | link | ڈائریکٹری پر واپس | biz.back | 1 | 125x49 | PASS | target answered 200 |
| EL-BIZ-202 | `/admin/business-directory/segments` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-203 | `/admin/business-directory/segments` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-204 | `/admin/business-directory/segments` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-205 | `/admin/business-directory/segments` | ur | link | سیگمنٹس | /ur/admin/business-directory/segments | 1 | 86x52 | PASS | target answered 200 |
| EL-BIZ-206 | `/admin/business-directory/segments` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-207 | `/admin/business-directory/segments` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-208 | `/admin/business-directory/segments` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-209 | `/admin/business-directory/segments` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-BIZ-210 | `/admin/business-directory/segments` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-211 | `/admin/business-directory` | en | button | Add filter group | biz.group.add | 6 | 148x44 | PASS | exercised by a functional spec |
| EL-BIZ-212 | `/admin/business-directory` | en | button | Apply filters | biz.filter.apply | 6 | 141x44 | PASS | exercised by a functional spec |
| EL-BIZ-213 | `/admin/business-directory` | en | button | Clear | biz.filter.clear | 6 | 83x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-214 | `/admin/business-directory` | en | button | Light or dark theme | theme.toggle | 6 | 44x44 | PASS | exercised by a functional spec |
| EL-BIZ-215 | `/admin/business-directory` | en | button | Save as segment | biz.segment.save | 3 | 155x44 | PASS | exercised by a functional spec |
| EL-BIZ-216 | `/admin/business-directory` | en | button | Select all 5 matching | biz.select.matching | 6 | 156x44 | PASS | exercised by a functional spec |
| EL-BIZ-217 | `/admin/business-directory` | en | button | Sign out | logout | 6 | 116x44 | PASS | exercised by a functional spec |
| EL-BIZ-218 | `/admin/business-directory` | en | input:checkbox | Select Company B (member) | biz.select.row | 6 | 22x22 | PASS | exercised by a functional spec |
| EL-BIZ-219 | `/admin/business-directory` | en | input:checkbox | Select Company E (endorser) | biz.select.row | 6 | 22x22 | PASS | exercised by a functional spec |
| EL-BIZ-220 | `/admin/business-directory` | en | input:checkbox | Select E2E 5a407e56 Traders | biz.select.row | 6 | 22x22 | PASS | exercised by a functional spec |
| EL-BIZ-221 | `/admin/business-directory` | en | input:checkbox | Select E2E adf6afb6 Traders | biz.select.row | 6 | 22x22 | PASS | exercised by a functional spec |
| EL-BIZ-222 | `/admin/business-directory` | en | input:checkbox | Select E2E b88952ae Traders | biz.select.row | 6 | 22x22 | PASS | exercised by a functional spec |
| EL-BIZ-223 | `/admin/business-directory` | en | input:checkbox | Select this page | biz.select.page | 6 | 22x22 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-224 | `/admin/business-directory` | en | input:search | Search by name or membership number |  | 6 | 1080x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-225 | `/admin/business-directory` | en | link | Accounts | /admin/finance | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-226 | `/admin/business-directory` | en | link | Ask MCCI AI | /admin/help | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-227 | `/admin/business-directory` | en | link | Business Directory | /admin/business-directory | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-228 | `/admin/business-directory` | en | link | Business name | biz.sort | 6 | 109x44 | PASS | target answered 200 |
| EL-BIZ-229 | `/admin/business-directory` | en | link | Category | biz.sort | 6 | 59x44 | PASS | target answered 200 |
| EL-BIZ-230 | `/admin/business-directory` | en | link | Certificates | /admin/temp | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-231 | `/admin/business-directory` | en | link | City | biz.sort | 6 | 26x44 | PASS | target answered 200 |
| EL-BIZ-232 | `/admin/business-directory` | en | link | Class | biz.sort | 6 | 34x44 | PASS | target answered 200 |
| EL-BIZ-233 | `/admin/business-directory` | en | link | Company B (member) | biz.profile.open | 6 | 162x44 | PASS | target answered 200 |
| EL-BIZ-234 | `/admin/business-directory` | en | link | Company E (endorser) | biz.profile.open | 6 | 165x44 | PASS | target answered 200 |
| EL-BIZ-235 | `/admin/business-directory` | en | link | Complaint Desk | /admin/complaints | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-236 | `/admin/business-directory` | en | link | Content & Messaging | /admin/content | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-237 | `/admin/business-directory` | en | link | Documents & QR | /admin/documents | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-238 | `/admin/business-directory` | en | link | E2E 5a407e56 Traders | biz.profile.open | 6 | 161x44 | PASS | target answered 200 |
| EL-BIZ-239 | `/admin/business-directory` | en | link | E2E adf6afb6 Traders | biz.profile.open | 6 | 155x44 | PASS | target answered 200 |
| EL-BIZ-240 | `/admin/business-directory` | en | link | E2E b88952ae Traders | biz.profile.open | 6 | 161x44 | PASS | target answered 200 |
| EL-BIZ-241 | `/admin/business-directory` | en | link | Events & Meetings | /admin/events | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-242 | `/admin/business-directory` | en | link | Export | biz.export.open | 3 | 92x44 | PASS | target answered 200 |
| EL-BIZ-243 | `/admin/business-directory` | en | link | Exports | /admin/business-directory/exports | 6 | 111x46 | PASS | target answered 200 |
| EL-BIZ-244 | `/admin/business-directory` | en | link | Exports | biz.exports.open | 3 | 113x44 | PASS | target answered 200 |
| EL-BIZ-245 | `/admin/business-directory` | en | link | MCCI Admin Secretariat Panel | /admin | 6 | 238x82 | PASS | target answered 200 |
| EL-BIZ-246 | `/admin/business-directory` | en | link | Members Register | /admin/members | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-247 | `/admin/business-directory` | en | link | Membership no. | biz.sort | 6 | 102x44 | PASS | target answered 200 |
| EL-BIZ-248 | `/admin/business-directory` | en | link | Membership Pipeline | /admin/requests | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-249 | `/admin/business-directory` | en | link | Nature of business | biz.sort | 6 | 116x44 | PASS | target answered 200 |
| EL-BIZ-250 | `/admin/business-directory` | en | link | Payments | /admin/payments | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-251 | `/admin/business-directory` | en | link | Profile | /admin/business-directory/profile | 6 | 101x46 | PASS | target answered 200 |
| EL-BIZ-252 | `/admin/business-directory` | en | link | Reports & AI | /admin/reports | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-253 | `/admin/business-directory` | en | link | Segments | /admin/business-directory/segments | 6 | 129x46 | PASS | target answered 200 |
| EL-BIZ-254 | `/admin/business-directory` | en | link | Segments | biz.segments.open | 6 | 131x44 | PASS | target answered 200 |
| EL-BIZ-255 | `/admin/business-directory` | en | link | Send WhatsApp | wa.compose.open | 3 | 151x44 | PASS | target answered 200 |
| EL-BIZ-256 | `/admin/business-directory` | en | link | Service Requests | /admin/applications | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-257 | `/admin/business-directory` | en | link | Services & Integrations | /admin/services | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-258 | `/admin/business-directory` | en | link | Settings | /admin/settings | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-259 | `/admin/business-directory` | en | link | Show incomplete profiles | biz.incomplete | 6 | 181x44 | PASS | target answered 200 |
| EL-BIZ-260 | `/admin/business-directory` | en | link | Skip to content | #main | 6 | 144x47 | PASS | in-page anchor |
| EL-BIZ-261 | `/admin/business-directory` | en | link | Staff & Audit | /admin/staff | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-262 | `/admin/business-directory` | en | link | Status | biz.sort | 6 | 41x44 | PASS | target answered 200 |
| EL-BIZ-263 | `/admin/business-directory` | en | link | Valid till | biz.sort | 6 | 50x44 | PASS | target answered 200 |
| EL-BIZ-264 | `/admin/business-directory` | en | link | WhatsApp | /admin/whatsapp | 6 | 238x44 | PASS | target answered 200 |
| EL-BIZ-265 | `/admin/business-directory` | en | link | WhatsApp consent | biz.sort | 6 | 120x44 | PASS | target answered 200 |
| EL-BIZ-266 | `/admin/business-directory` | ur | button | تمام 5 مطابقت رکھنے والے منتخب کریں | biz.select.matching | 1 | 154x44 | PASS | exercised by a functional spec |
| EL-BIZ-267 | `/admin/business-directory` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-BIZ-268 | `/admin/business-directory` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-BIZ-269 | `/admin/business-directory` | ur | button | سیگمنٹ کے طور پر محفوظ کریں | biz.segment.save | 1 | 150x47 | PASS | exercised by a functional spec |
| EL-BIZ-270 | `/admin/business-directory` | ur | button | صاف کریں | biz.filter.clear | 1 | 87x47 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-271 | `/admin/business-directory` | ur | button | فلٹر گروپ شامل کریں | biz.group.add | 1 | 123x44 | PASS | exercised by a functional spec |
| EL-BIZ-272 | `/admin/business-directory` | ur | button | فلٹر لگائیں | biz.filter.apply | 1 | 90x47 | PASS | exercised by a functional spec |
| EL-BIZ-273 | `/admin/business-directory` | ur | input:checkbox | Company B (member) منتخب کریں | biz.select.row | 1 | 22x22 | PASS | exercised by a functional spec |
| EL-BIZ-274 | `/admin/business-directory` | ur | input:checkbox | Company E (endorser) منتخب کریں | biz.select.row | 1 | 22x22 | PASS | exercised by a functional spec |
| EL-BIZ-275 | `/admin/business-directory` | ur | input:checkbox | E2E 5a407e56 Traders منتخب کریں | biz.select.row | 1 | 22x22 | PASS | exercised by a functional spec |
| EL-BIZ-276 | `/admin/business-directory` | ur | input:checkbox | E2E adf6afb6 Traders منتخب کریں | biz.select.row | 1 | 22x22 | PASS | exercised by a functional spec |
| EL-BIZ-277 | `/admin/business-directory` | ur | input:checkbox | E2E b88952ae Traders منتخب کریں | biz.select.row | 1 | 22x22 | PASS | exercised by a functional spec |
| EL-BIZ-278 | `/admin/business-directory` | ur | input:checkbox | یہ صفحہ منتخب کریں | biz.select.page | 1 | 22x22 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-279 | `/admin/business-directory` | ur | input:search | نام یا رکنیت نمبر سے تلاش کریں |  | 1 | 1080x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-BIZ-280 | `/admin/business-directory` | ur | link | Company B (member) | biz.profile.open | 1 | 162x44 | PASS | target answered 200 |
| EL-BIZ-281 | `/admin/business-directory` | ur | link | Company E (endorser) | biz.profile.open | 1 | 165x44 | PASS | target answered 200 |
| EL-BIZ-282 | `/admin/business-directory` | ur | link | E2E 5a407e56 Traders | biz.profile.open | 1 | 161x44 | PASS | target answered 200 |
| EL-BIZ-283 | `/admin/business-directory` | ur | link | E2E adf6afb6 Traders | biz.profile.open | 1 | 155x44 | PASS | target answered 200 |
| EL-BIZ-284 | `/admin/business-directory` | ur | link | E2E b88952ae Traders | biz.profile.open | 1 | 161x44 | PASS | target answered 200 |
| EL-BIZ-285 | `/admin/business-directory` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-286 | `/admin/business-directory` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-287 | `/admin/business-directory` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-288 | `/admin/business-directory` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-BIZ-289 | `/admin/business-directory` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-290 | `/admin/business-directory` | ur | link | برآمد کریں | biz.export.open | 1 | 86x44 | PASS | target answered 200 |
| EL-BIZ-291 | `/admin/business-directory` | ur | link | برآمدات | /ur/admin/business-directory/exports | 1 | 89x52 | PASS | target answered 200 |
| EL-BIZ-292 | `/admin/business-directory` | ur | link | برآمدات | biz.exports.open | 1 | 91x49 | PASS | target answered 200 |
| EL-BIZ-293 | `/admin/business-directory` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-294 | `/admin/business-directory` | ur | link | پروفائل | /ur/admin/business-directory/profile | 1 | 84x52 | PASS | target answered 200 |
| EL-BIZ-295 | `/admin/business-directory` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-296 | `/admin/business-directory` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-297 | `/admin/business-directory` | ur | link | حیثیت | biz.sort | 1 | 20x44 | PASS | target answered 200 |
| EL-BIZ-298 | `/admin/business-directory` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-299 | `/admin/business-directory` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-300 | `/admin/business-directory` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-301 | `/admin/business-directory` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-302 | `/admin/business-directory` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-303 | `/admin/business-directory` | ur | link | رکنیت نمبر | biz.sort | 1 | 31x44 | PASS | target answered 200 |
| EL-BIZ-304 | `/admin/business-directory` | ur | link | زمرہ | biz.sort | 1 | 15x44 | PASS | target answered 200 |
| EL-BIZ-305 | `/admin/business-directory` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-306 | `/admin/business-directory` | ur | link | سیگمنٹس | /ur/admin/business-directory/segments | 1 | 86x52 | PASS | target answered 200 |
| EL-BIZ-307 | `/admin/business-directory` | ur | link | سیگمنٹس | biz.segments.open | 1 | 88x49 | PASS | target answered 200 |
| EL-BIZ-308 | `/admin/business-directory` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-309 | `/admin/business-directory` | ur | link | شہر | biz.sort | 1 | 10x44 | PASS | target answered 200 |
| EL-BIZ-310 | `/admin/business-directory` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-311 | `/admin/business-directory` | ur | link | قسم | biz.sort | 1 | 11x44 | PASS | target answered 200 |
| EL-BIZ-312 | `/admin/business-directory` | ur | link | کارآمد تا | biz.sort | 1 | 25x44 | PASS | target answered 200 |
| EL-BIZ-313 | `/admin/business-directory` | ur | link | کاروبار کا نام | biz.sort | 1 | 54x44 | PASS | target answered 200 |
| EL-BIZ-314 | `/admin/business-directory` | ur | link | کاروبار کی نوعیت | biz.sort | 1 | 51x44 | PASS | target answered 200 |
| EL-BIZ-315 | `/admin/business-directory` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-316 | `/admin/business-directory` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-BIZ-317 | `/admin/business-directory` | ur | link | نامکمل پروفائل دکھائیں | biz.incomplete | 1 | 85x44 | PASS | target answered 200 |
| EL-BIZ-318 | `/admin/business-directory` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-BIZ-319 | `/admin/business-directory` | ur | link | واٹس ایپ بھیجیں | wa.compose.open | 1 | 106x44 | PASS | target answered 200 |
| EL-BIZ-320 | `/admin/business-directory` | ur | link | واٹس ایپ رضامندی | biz.sort | 1 | 64x44 | PASS | target answered 200 |
| EL-REG-001 | `/admin/changes` | en | button | Approve | chg.approve | 2 | 94x44 | PASS | exercised by a functional spec |
| EL-REG-002 | `/admin/changes` | en | button | Light or dark theme | theme.toggle | 5 | 44x44 | PASS | exercised by a functional spec |
| EL-REG-003 | `/admin/changes` | en | button | Reject | chg.reject | 2 | 67x44 | PASS | exercised by a functional spec |
| EL-REG-004 | `/admin/changes` | en | button | Sign out | logout | 5 | 116x44 | PASS | exercised by a functional spec |
| EL-REG-005 | `/admin/changes` | en | input:text | Note (a reason is required to reject) |  | 2 | 1080x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-REG-006 | `/admin/changes` | en | link | Accounts | /admin/finance | 5 | 238x44 | PASS | target answered 200 |
| EL-REG-007 | `/admin/changes` | en | link | Ask MCCI AI | /admin/help | 5 | 238x44 | PASS | target answered 200 |
| EL-REG-008 | `/admin/changes` | en | link | bill.pdf | chg.doc | 5 | 72x44 | PARTIAL | download or sign-out link, not requested |
| EL-REG-009 | `/admin/changes` | en | link | Business Directory | /admin/business-directory | 5 | 238x44 | PASS | target answered 200 |
| EL-REG-010 | `/admin/changes` | en | link | Certificates | /admin/temp | 5 | 238x44 | PASS | target answered 200 |
| EL-REG-011 | `/admin/changes` | en | link | Change Declarations | /admin/changes | 5 | 206x46 | PASS | target answered 200 |
| EL-REG-012 | `/admin/changes` | en | link | Complaint Desk | /admin/complaints | 5 | 238x44 | PASS | target answered 200 |
| EL-REG-013 | `/admin/changes` | en | link | Content & Messaging | /admin/content | 5 | 238x44 | PASS | target answered 200 |
| EL-REG-014 | `/admin/changes` | en | link | Data Import | /admin/import | 5 | 141x46 | PASS | target answered 200 |
| EL-REG-015 | `/admin/changes` | en | link | Documents & QR | /admin/documents | 5 | 238x44 | PASS | target answered 200 |
| EL-REG-016 | `/admin/changes` | en | link | E2E adf6afb6 Traders | member.open | 5 | 129x44 | PASS | target answered 200 |
| EL-REG-017 | `/admin/changes` | en | link | Events & Meetings | /admin/events | 5 | 238x44 | PASS | target answered 200 |
| EL-REG-018 | `/admin/changes` | en | link | MCCI Admin Secretariat Panel | /admin | 5 | 238x82 | PASS | target answered 200 |
| EL-REG-019 | `/admin/changes` | en | link | Members Register | /admin/members | 5 | 238x44 | PASS | target answered 200 |
| EL-REG-020 | `/admin/changes` | en | link | Membership Pipeline | /admin/requests | 5 | 238x44 | PASS | target answered 200 |
| EL-REG-021 | `/admin/changes` | en | link | Payments | /admin/payments | 5 | 238x44 | PASS | target answered 200 |
| EL-REG-022 | `/admin/changes` | en | link | Reports & AI | /admin/reports | 5 | 238x44 | PASS | target answered 200 |
| EL-REG-023 | `/admin/changes` | en | link | Service Requests | /admin/applications | 5 | 238x44 | PASS | target answered 200 |
| EL-REG-024 | `/admin/changes` | en | link | Services & Integrations | /admin/services | 5 | 238x44 | PASS | target answered 200 |
| EL-REG-025 | `/admin/changes` | en | link | Settings | /admin/settings | 5 | 238x44 | PASS | target answered 200 |
| EL-REG-026 | `/admin/changes` | en | link | Skip to content | #main | 5 | 144x47 | PASS | in-page anchor |
| EL-REG-027 | `/admin/changes` | en | link | Staff & Audit | /admin/staff | 5 | 238x44 | PASS | target answered 200 |
| EL-REG-028 | `/admin/changes` | en | link | WhatsApp | /admin/whatsapp | 5 | 238x44 | PASS | target answered 200 |
| EL-REG-029 | `/admin/changes` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-REG-030 | `/admin/changes` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-REG-031 | `/admin/changes` | ur | button | مسترد کریں | chg.reject | 1 | 64x47 | PASS | exercised by a functional spec |
| EL-REG-032 | `/admin/changes` | ur | button | منظور کریں | chg.approve | 1 | 72x47 | PASS | exercised by a functional spec |
| EL-REG-033 | `/admin/changes` | ur | input:text | نوٹ (مسترد کرنے کے لیے وجہ ضروری ہے) |  | 1 | 1080x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-REG-034 | `/admin/changes` | ur | link | bill.pdf | chg.doc | 1 | 72x44 | PARTIAL | download or sign-out link, not requested |
| EL-REG-035 | `/admin/changes` | ur | link | E2E adf6afb6 Traders | member.open | 1 | 134x44 | PASS | target answered 200 |
| EL-REG-036 | `/admin/changes` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-037 | `/admin/changes` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-038 | `/admin/changes` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-039 | `/admin/changes` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-REG-040 | `/admin/changes` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-041 | `/admin/changes` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-042 | `/admin/changes` | ur | link | تبدیلی کے اقرار نامے | /ur/admin/changes | 1 | 137x52 | PASS | target answered 200 |
| EL-REG-043 | `/admin/changes` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-044 | `/admin/changes` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-045 | `/admin/changes` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-046 | `/admin/changes` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-047 | `/admin/changes` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-048 | `/admin/changes` | ur | link | ڈیٹا امپورٹ | /ur/admin/import | 1 | 99x52 | PASS | target answered 200 |
| EL-REG-049 | `/admin/changes` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-050 | `/admin/changes` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-051 | `/admin/changes` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-052 | `/admin/changes` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-053 | `/admin/changes` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-054 | `/admin/changes` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-055 | `/admin/changes` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-REG-056 | `/admin/changes` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-CMT-001 | `/admin/committee` | en | button | Assign committee | cmt.assign | 1 | 165x44 | PASS | exercised by a functional spec |
| EL-CMT-002 | `/admin/committee` | en | button | Light or dark theme | theme.toggle | 7 | 44x44 | PASS | exercised by a functional spec |
| EL-CMT-003 | `/admin/committee` | en | button | Sign out | logout | 7 | 116x44 | PASS | exercised by a functional spec |
| EL-CMT-004 | `/admin/committee` | en | link | Accounts | /admin/finance | 7 | 238x44 | PASS | target answered 200 |
| EL-CMT-005 | `/admin/committee` | en | link | Application Review | /admin/mreview | 7 | 195x46 | PASS | target answered 200 |
| EL-CMT-006 | `/admin/committee` | en | link | Ask MCCI AI | /admin/help | 7 | 238x44 | PASS | target answered 200 |
| EL-CMT-007 | `/admin/committee` | en | link | Business Directory | /admin/business-directory | 7 | 238x44 | PASS | target answered 200 |
| EL-CMT-008 | `/admin/committee` | en | link | Certificates | /admin/temp | 7 | 238x44 | PASS | target answered 200 |
| EL-CMT-009 | `/admin/committee` | en | link | Committee Desk | /admin/committee | 7 | 177x46 | PASS | target answered 200 |
| EL-CMT-010 | `/admin/committee` | en | link | Complaint Desk | /admin/complaints | 7 | 238x44 | PASS | target answered 200 |
| EL-CMT-011 | `/admin/committee` | en | link | Content & Messaging | /admin/content | 7 | 238x44 | PASS | target answered 200 |
| EL-CMT-012 | `/admin/committee` | en | link | Documents & QR | /admin/documents | 7 | 238x44 | PASS | target answered 200 |
| EL-CMT-013 | `/admin/committee` | en | link | Events & Meetings | /admin/events | 7 | 238x44 | PASS | target answered 200 |
| EL-CMT-014 | `/admin/committee` | en | link | MCCI Admin Secretariat Panel | /admin | 7 | 238x82 | PASS | target answered 200 |
| EL-CMT-015 | `/admin/committee` | en | link | Meetings & minutes | nav | 7 | 200x44 | PASS | target answered 200 |
| EL-CMT-016 | `/admin/committee` | en | link | Members Register | /admin/members | 7 | 238x44 | PASS | target answered 200 |
| EL-CMT-017 | `/admin/committee` | en | link | Membership Pipeline | /admin/requests | 7 | 238x44 | PASS | target answered 200 |
| EL-CMT-018 | `/admin/committee` | en | link | Payments | /admin/payments | 7 | 238x44 | PASS | target answered 200 |
| EL-CMT-019 | `/admin/committee` | en | link | Reports & AI | /admin/reports | 7 | 238x44 | PASS | target answered 200 |
| EL-CMT-020 | `/admin/committee` | en | link | Service Requests | /admin/applications | 7 | 238x44 | PASS | target answered 200 |
| EL-CMT-021 | `/admin/committee` | en | link | Services & Integrations | /admin/services | 7 | 238x44 | PASS | target answered 200 |
| EL-CMT-022 | `/admin/committee` | en | link | Settings | /admin/settings | 7 | 238x44 | PASS | target answered 200 |
| EL-CMT-023 | `/admin/committee` | en | link | Skip to content | #main | 7 | 144x47 | PASS | in-page anchor |
| EL-CMT-024 | `/admin/committee` | en | link | Staff & Audit | /admin/staff | 7 | 238x44 | PASS | target answered 200 |
| EL-CMT-025 | `/admin/committee` | en | link | WhatsApp | /admin/whatsapp | 7 | 238x44 | PASS | target answered 200 |
| EL-CMT-026 | `/admin/committee` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-CMT-027 | `/admin/committee` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-CMT-028 | `/admin/committee` | ur | button | کمیٹی مقرر کریں | cmt.assign | 1 | 103x44 | PASS | exercised by a functional spec |
| EL-CMT-029 | `/admin/committee` | ur | link | اجلاس اور کارروائی | nav | 1 | 126x49 | PASS | target answered 200 |
| EL-CMT-030 | `/admin/committee` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-CMT-031 | `/admin/committee` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-CMT-032 | `/admin/committee` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-CMT-033 | `/admin/committee` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-CMT-034 | `/admin/committee` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-CMT-035 | `/admin/committee` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-CMT-036 | `/admin/committee` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-CMT-037 | `/admin/committee` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-CMT-038 | `/admin/committee` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-CMT-039 | `/admin/committee` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-CMT-040 | `/admin/committee` | ur | link | درخواست کا جائزہ | /ur/admin/mreview | 1 | 121x52 | PASS | target answered 200 |
| EL-CMT-041 | `/admin/committee` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-CMT-042 | `/admin/committee` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-CMT-043 | `/admin/committee` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-CMT-044 | `/admin/committee` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-CMT-045 | `/admin/committee` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-CMT-046 | `/admin/committee` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-CMT-047 | `/admin/committee` | ur | link | کمیٹی ڈیسک | /ur/admin/committee | 1 | 97x52 | PASS | target answered 200 |
| EL-CMT-048 | `/admin/committee` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-CMT-049 | `/admin/committee` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-CMT-050 | `/admin/committee` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-ENG-001 | `/admin/complaints` | en | button | Light or dark theme | theme.toggle | 8 | 44x44 | PASS | exercised by a functional spec |
| EL-ENG-002 | `/admin/complaints` | en | button | Show | ticket.filter | 8 | 73x44 | PASS | exercised by a functional spec |
| EL-ENG-003 | `/admin/complaints` | en | button | Sign out | logout | 8 | 116x44 | PASS | exercised by a functional spec |
| EL-ENG-004 | `/admin/complaints` | en | input:text | Search tickets… |  | 8 | 887x45 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-005 | `/admin/complaints` | en | link | Accounts | /admin/finance | 8 | 238x44 | PASS | target answered 200 |
| EL-ENG-006 | `/admin/complaints` | en | link | Ask MCCI AI | /admin/help | 8 | 238x44 | PASS | target answered 200 |
| EL-ENG-007 | `/admin/complaints` | en | link | Business Directory | /admin/business-directory | 8 | 238x44 | PASS | target answered 200 |
| EL-ENG-008 | `/admin/complaints` | en | link | Certificates | /admin/temp | 8 | 238x44 | PASS | target answered 200 |
| EL-ENG-009 | `/admin/complaints` | en | link | Complaint Desk | /admin/complaints | 8 | 238x44 | PASS | target answered 200 |
| EL-ENG-010 | `/admin/complaints` | en | link | Content & Messaging | /admin/content | 8 | 238x44 | PASS | target answered 200 |
| EL-ENG-011 | `/admin/complaints` | en | link | Documents & QR | /admin/documents | 8 | 238x44 | PASS | target answered 200 |
| EL-ENG-012 | `/admin/complaints` | en | link | Events & Meetings | /admin/events | 8 | 238x44 | PASS | target answered 200 |
| EL-ENG-013 | `/admin/complaints` | en | link | MCCI Admin Secretariat Panel | /admin | 8 | 238x82 | PASS | target answered 200 |
| EL-ENG-014 | `/admin/complaints` | en | link | Members Register | /admin/members | 8 | 238x44 | PASS | target answered 200 |
| EL-ENG-015 | `/admin/complaints` | en | link | Membership Pipeline | /admin/requests | 8 | 238x44 | PASS | target answered 200 |
| EL-ENG-016 | `/admin/complaints` | en | link | Payments | /admin/payments | 8 | 238x44 | PASS | target answered 200 |
| EL-ENG-017 | `/admin/complaints` | en | link | Reports & AI | /admin/reports | 8 | 238x44 | PASS | target answered 200 |
| EL-ENG-018 | `/admin/complaints` | en | link | Service Requests | /admin/applications | 8 | 238x44 | PASS | target answered 200 |
| EL-ENG-019 | `/admin/complaints` | en | link | Services & Integrations | /admin/services | 8 | 238x44 | PASS | target answered 200 |
| EL-ENG-020 | `/admin/complaints` | en | link | Settings | /admin/settings | 8 | 238x44 | PASS | target answered 200 |
| EL-ENG-021 | `/admin/complaints` | en | link | Skip to content | #main | 8 | 144x47 | PASS | in-page anchor |
| EL-ENG-022 | `/admin/complaints` | en | link | Staff & Audit | /admin/staff | 8 | 238x44 | PASS | target answered 200 |
| EL-ENG-023 | `/admin/complaints` | en | link | TK-2026-0040 | ticket.view | 8 | 116x44 | PASS | target answered 200 |
| EL-ENG-024 | `/admin/complaints` | en | link | WhatsApp | /admin/whatsapp | 8 | 238x44 | PASS | target answered 200 |
| EL-ENG-025 | `/admin/complaints` | en | select | Status |  | 8 | 100x44 | PASS | exercised by a functional spec |
| EL-ENG-026 | `/admin/complaints` | ur | button | دکھائیں | ticket.filter | 1 | 60x49 | PASS | exercised by a functional spec |
| EL-ENG-027 | `/admin/complaints` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-ENG-028 | `/admin/complaints` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-ENG-029 | `/admin/complaints` | ur | input:text | ٹکٹ تلاش کریں… |  | 1 | 934x51 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-030 | `/admin/complaints` | ur | link | TK-2026-0040 | ticket.view | 1 | 116x44 | PASS | target answered 200 |
| EL-ENG-031 | `/admin/complaints` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-ENG-032 | `/admin/complaints` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-ENG-033 | `/admin/complaints` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-ENG-034 | `/admin/complaints` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-ENG-035 | `/admin/complaints` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-ENG-036 | `/admin/complaints` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-ENG-037 | `/admin/complaints` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-ENG-038 | `/admin/complaints` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-ENG-039 | `/admin/complaints` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-ENG-040 | `/admin/complaints` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-ENG-041 | `/admin/complaints` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-ENG-042 | `/admin/complaints` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-ENG-043 | `/admin/complaints` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-ENG-044 | `/admin/complaints` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-ENG-045 | `/admin/complaints` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-ENG-046 | `/admin/complaints` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-ENG-047 | `/admin/complaints` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-ENG-048 | `/admin/complaints` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-ENG-049 | `/admin/complaints` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-ENG-050 | `/admin/complaints` | ur | select | حیثیت |  | 1 | 66x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-CMS-001 | `/admin/content` | en | button | Edit Chamber news c36f7d | post.edit | 4 | 42x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-CMS-002 | `/admin/content` | en | button | Edit Chamber news d098e0 | post.edit | 4 | 42x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-CMS-003 | `/admin/content` | en | button | Edit Draft note c36f7d | post.edit | 4 | 42x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-CMS-004 | `/admin/content` | en | button | Edit Draft note d098e0 | post.edit | 4 | 42x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-CMS-005 | `/admin/content` | en | button | Light or dark theme | theme.toggle | 8 | 44x44 | PASS | exercised by a functional spec |
| EL-CMS-006 | `/admin/content` | en | button | New post | post.create | 4 | 124x44 | PASS | exercised by a functional spec |
| EL-CMS-007 | `/admin/content` | en | button | Share a buyer inquiry | opp.share | 8 | 207x44 | PASS | exercised by a functional spec |
| EL-CMS-008 | `/admin/content` | en | button | Sign out | logout | 8 | 116x44 | PASS | exercised by a functional spec |
| EL-CMS-009 | `/admin/content` | en | link | Accounts | /admin/finance | 8 | 238x44 | PASS | target answered 200 |
| EL-CMS-010 | `/admin/content` | en | link | All (4) | content.channel | 8 | 73x44 | PASS | target answered 200 |
| EL-CMS-011 | `/admin/content` | en | link | Ask MCCI AI | /admin/help | 8 | 238x44 | PASS | target answered 200 |
| EL-CMS-012 | `/admin/content` | en | link | Business Directory | /admin/business-directory | 8 | 238x44 | PASS | target answered 200 |
| EL-CMS-013 | `/admin/content` | en | link | Certificates | /admin/temp | 8 | 238x44 | PASS | target answered 200 |
| EL-CMS-014 | `/admin/content` | en | link | Circular (0) | content.channel | 8 | 110x44 | PASS | target answered 200 |
| EL-CMS-015 | `/admin/content` | en | link | Complaint Desk | /admin/complaints | 8 | 238x44 | PASS | target answered 200 |
| EL-CMS-016 | `/admin/content` | en | link | Content & Messaging | /admin/content | 8 | 238x44 | PASS | target answered 200 |
| EL-CMS-017 | `/admin/content` | en | link | Documents & QR | /admin/documents | 8 | 238x44 | PASS | target answered 200 |
| EL-CMS-018 | `/admin/content` | en | link | Event (0) | content.channel | 8 | 96x44 | PASS | target answered 200 |
| EL-CMS-019 | `/admin/content` | en | link | Events & Meetings | /admin/events | 8 | 238x44 | PASS | target answered 200 |
| EL-CMS-020 | `/admin/content` | en | link | MCCI Admin Secretariat Panel | /admin | 8 | 238x82 | PASS | target answered 200 |
| EL-CMS-021 | `/admin/content` | en | link | Members Register | /admin/members | 8 | 238x44 | PASS | target answered 200 |
| EL-CMS-022 | `/admin/content` | en | link | Membership Pipeline | /admin/requests | 8 | 238x44 | PASS | target answered 200 |
| EL-CMS-023 | `/admin/content` | en | link | News (4) | content.channel | 8 | 95x44 | PASS | target answered 200 |
| EL-CMS-024 | `/admin/content` | en | link | Notice (0) | content.channel | 8 | 103x44 | PASS | target answered 200 |
| EL-CMS-025 | `/admin/content` | en | link | Notification Center | /admin/notify | 8 | 193x46 | PASS | target answered 200 |
| EL-CMS-026 | `/admin/content` | en | link | Payments | /admin/payments | 8 | 238x44 | PASS | target answered 200 |
| EL-CMS-027 | `/admin/content` | en | link | Reports & AI | /admin/reports | 8 | 238x44 | PASS | target answered 200 |
| EL-CMS-028 | `/admin/content` | en | link | Service Requests | /admin/applications | 8 | 238x44 | PASS | target answered 200 |
| EL-CMS-029 | `/admin/content` | en | link | Services & Integrations | /admin/services | 8 | 238x44 | PASS | target answered 200 |
| EL-CMS-030 | `/admin/content` | en | link | Settings | /admin/settings | 8 | 238x44 | PASS | target answered 200 |
| EL-CMS-031 | `/admin/content` | en | link | Skip to content | #main | 8 | 144x47 | PASS | in-page anchor |
| EL-CMS-032 | `/admin/content` | en | link | Staff & Audit | /admin/staff | 8 | 238x44 | PASS | target answered 200 |
| EL-CMS-033 | `/admin/content` | en | link | WhatsApp | /admin/whatsapp | 8 | 238x44 | PASS | target answered 200 |
| EL-CMS-034 | `/admin/content` | ur | button | Chamber news c36f7d میں ترمیم | post.edit | 1 | 42x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-CMS-035 | `/admin/content` | ur | button | Chamber news d098e0 میں ترمیم | post.edit | 1 | 42x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-CMS-036 | `/admin/content` | ur | button | Draft note c36f7d میں ترمیم | post.edit | 1 | 42x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-CMS-037 | `/admin/content` | ur | button | Draft note d098e0 میں ترمیم | post.edit | 1 | 42x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-CMS-038 | `/admin/content` | ur | button | خریدار کی پوچھ گچھ شیئر کریں | opp.share | 1 | 168x49 | PASS | exercised by a functional spec |
| EL-CMS-039 | `/admin/content` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-CMS-040 | `/admin/content` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-CMS-041 | `/admin/content` | ur | button | نئی پوسٹ | post.create | 1 | 91x47 | PASS | exercised by a functional spec |
| EL-CMS-042 | `/admin/content` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-CMS-043 | `/admin/content` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-CMS-044 | `/admin/content` | ur | link | اطلاعات مرکز | /ur/admin/notify | 1 | 108x52 | PASS | target answered 200 |
| EL-CMS-045 | `/admin/content` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-CMS-046 | `/admin/content` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-CMS-047 | `/admin/content` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-CMS-048 | `/admin/content` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-CMS-049 | `/admin/content` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-CMS-050 | `/admin/content` | ur | link | تقریب (0) | content.channel | 1 | 83x44 | PASS | target answered 200 |
| EL-CMS-051 | `/admin/content` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-CMS-052 | `/admin/content` | ur | link | خبر (4) | content.channel | 1 | 67x44 | PASS | target answered 200 |
| EL-CMS-053 | `/admin/content` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-CMS-054 | `/admin/content` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-CMS-055 | `/admin/content` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-CMS-056 | `/admin/content` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-CMS-057 | `/admin/content` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-CMS-058 | `/admin/content` | ur | link | سب (4) | content.channel | 1 | 73x44 | PASS | target answered 200 |
| EL-CMS-059 | `/admin/content` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-CMS-060 | `/admin/content` | ur | link | سرکلر (0) | content.channel | 1 | 77x44 | PASS | target answered 200 |
| EL-CMS-061 | `/admin/content` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-CMS-062 | `/admin/content` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-CMS-063 | `/admin/content` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-CMS-064 | `/admin/content` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-CMS-065 | `/admin/content` | ur | link | نوٹس (0) | content.channel | 1 | 75x44 | PASS | target answered 200 |
| EL-CMS-066 | `/admin/content` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-DOC-001 | `/admin/documents` | en | button | Light or dark theme | theme.toggle | 9 | 44x44 | PASS | exercised by a functional spec |
| EL-DOC-002 | `/admin/documents` | en | button | Revoke | qr.revoke | 1 | 73x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-DOC-003 | `/admin/documents` | en | button | Sign out | logout | 9 | 116x44 | PASS | exercised by a functional spec |
| EL-DOC-004 | `/admin/documents` | en | link | Accounts | /admin/finance | 9 | 238x44 | PASS | target answered 200 |
| EL-DOC-005 | `/admin/documents` | en | link | Ask MCCI AI | /admin/help | 9 | 238x44 | PASS | target answered 200 |
| EL-DOC-006 | `/admin/documents` | en | link | Business Directory | /admin/business-directory | 9 | 238x44 | PASS | target answered 200 |
| EL-DOC-007 | `/admin/documents` | en | link | Certificates | /admin/temp | 9 | 238x44 | PASS | target answered 200 |
| EL-DOC-008 | `/admin/documents` | en | link | Complaint Desk | /admin/complaints | 9 | 238x44 | PASS | target answered 200 |
| EL-DOC-009 | `/admin/documents` | en | link | Content & Messaging | /admin/content | 9 | 238x44 | PASS | target answered 200 |
| EL-DOC-010 | `/admin/documents` | en | link | Documents & QR | /admin/documents | 9 | 238x44 | PASS | target answered 200 |
| EL-DOC-011 | `/admin/documents` | en | link | Events & Meetings | /admin/events | 9 | 238x44 | PASS | target answered 200 |
| EL-DOC-012 | `/admin/documents` | en | link | MCCI Admin Secretariat Panel | /admin | 9 | 238x82 | PASS | target answered 200 |
| EL-DOC-013 | `/admin/documents` | en | link | Members Register | /admin/members | 9 | 238x44 | PASS | target answered 200 |
| EL-DOC-014 | `/admin/documents` | en | link | Membership Pipeline | /admin/requests | 9 | 238x44 | PASS | target answered 200 |
| EL-DOC-015 | `/admin/documents` | en | link | Open | qr.view | 9 | 62x44 | PASS | target answered 200 |
| EL-DOC-016 | `/admin/documents` | en | link | Payments | /admin/payments | 9 | 238x44 | PASS | target answered 200 |
| EL-DOC-017 | `/admin/documents` | en | link | Reports & AI | /admin/reports | 9 | 238x44 | PASS | target answered 200 |
| EL-DOC-018 | `/admin/documents` | en | link | Service Requests | /admin/applications | 9 | 238x44 | PASS | target answered 200 |
| EL-DOC-019 | `/admin/documents` | en | link | Services & Integrations | /admin/services | 9 | 238x44 | PASS | target answered 200 |
| EL-DOC-020 | `/admin/documents` | en | link | Settings | /admin/settings | 9 | 238x44 | PASS | target answered 200 |
| EL-DOC-021 | `/admin/documents` | en | link | Skip to content | #main | 9 | 144x47 | PASS | in-page anchor |
| EL-DOC-022 | `/admin/documents` | en | link | Staff & Audit | /admin/staff | 9 | 238x44 | PASS | target answered 200 |
| EL-DOC-023 | `/admin/documents` | en | link | WhatsApp | /admin/whatsapp | 9 | 238x44 | PASS | target answered 200 |
| EL-DOC-024 | `/admin/documents` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-DOC-025 | `/admin/documents` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-DOC-026 | `/admin/documents` | ur | button | منسوخ | qr.revoke | 1 | 48x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-DOC-027 | `/admin/documents` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-DOC-028 | `/admin/documents` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-DOC-029 | `/admin/documents` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-DOC-030 | `/admin/documents` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-DOC-031 | `/admin/documents` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-DOC-032 | `/admin/documents` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-DOC-033 | `/admin/documents` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-DOC-034 | `/admin/documents` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-DOC-035 | `/admin/documents` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-DOC-036 | `/admin/documents` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-DOC-037 | `/admin/documents` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-DOC-038 | `/admin/documents` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-DOC-039 | `/admin/documents` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-DOC-040 | `/admin/documents` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-DOC-041 | `/admin/documents` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-DOC-042 | `/admin/documents` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-DOC-043 | `/admin/documents` | ur | link | کھولیں | qr.view | 1 | 47x44 | PASS | target answered 200 |
| EL-DOC-044 | `/admin/documents` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-DOC-045 | `/admin/documents` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-DOC-046 | `/admin/documents` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-ENG-051 | `/admin/events` | en | button | 2027-01-01 | cal.day | 8 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-052 | `/admin/events` | en | button | 2027-01-02 | cal.day | 8 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-053 | `/admin/events` | en | button | 2027-01-03 | cal.day | 8 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-054 | `/admin/events` | en | button | 2027-01-04 | cal.day | 8 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-055 | `/admin/events` | en | button | 2027-01-05 | cal.day | 8 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-056 | `/admin/events` | en | button | 2027-01-06 | cal.day | 8 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-057 | `/admin/events` | en | button | 2027-01-07 | cal.day | 8 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-058 | `/admin/events` | en | button | 2027-01-08 | cal.day | 8 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-059 | `/admin/events` | en | button | 2027-01-09 | cal.day | 8 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-060 | `/admin/events` | en | button | 2027-01-10 | cal.day | 8 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-061 | `/admin/events` | en | button | 2027-01-11 | cal.day | 8 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-062 | `/admin/events` | en | button | 2027-01-12 | cal.day | 8 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-063 | `/admin/events` | en | button | 2027-01-13 | cal.day | 8 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-064 | `/admin/events` | en | button | 2027-01-14 | cal.day | 8 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-065 | `/admin/events` | en | button | 2027-01-15 · 2 Events | cal.day | 8 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-066 | `/admin/events` | en | button | 2027-01-16 | cal.day | 8 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-067 | `/admin/events` | en | button | 2027-01-17 | cal.day | 8 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-068 | `/admin/events` | en | button | 2027-01-18 | cal.day | 8 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-069 | `/admin/events` | en | button | 2027-01-19 | cal.day | 8 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-070 | `/admin/events` | en | button | 2027-01-20 | cal.day | 8 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-071 | `/admin/events` | en | button | 2027-01-21 | cal.day | 8 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-072 | `/admin/events` | en | button | 2027-01-22 | cal.day | 8 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-073 | `/admin/events` | en | button | 2027-01-23 | cal.day | 8 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-074 | `/admin/events` | en | button | 2027-01-24 | cal.day | 8 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-075 | `/admin/events` | en | button | 2027-01-25 | cal.day | 8 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-076 | `/admin/events` | en | button | 2027-01-26 | cal.day | 8 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-077 | `/admin/events` | en | button | 2027-01-27 | cal.day | 8 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-078 | `/admin/events` | en | button | 2027-01-28 | cal.day | 8 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-079 | `/admin/events` | en | button | 2027-01-29 | cal.day | 8 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-080 | `/admin/events` | en | button | 2027-01-30 | cal.day | 8 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-081 | `/admin/events` | en | button | 2027-01-31 | cal.day | 8 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-082 | `/admin/events` | en | button | Create event | ev.create | 4 | 149x44 | PASS | exercised by a functional spec |
| EL-ENG-083 | `/admin/events` | en | button | Edit Export clinic c36f7d | ev.edit | 4 | 42x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-084 | `/admin/events` | en | button | Edit Export clinic d098e0 | ev.edit | 4 | 42x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-085 | `/admin/events` | en | button | Light or dark theme | theme.toggle | 8 | 44x44 | PASS | exercised by a functional spec |
| EL-ENG-086 | `/admin/events` | en | button | Next month | cal.move | 8 | 48x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-087 | `/admin/events` | en | button | Previous month | cal.move | 8 | 48x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-088 | `/admin/events` | en | button | Sign out | logout | 8 | 116x44 | PASS | exercised by a functional spec |
| EL-ENG-089 | `/admin/events` | en | link | Accounts | /admin/finance | 8 | 238x44 | PASS | target answered 200 |
| EL-ENG-090 | `/admin/events` | en | link | Ask MCCI AI | /admin/help | 8 | 238x44 | PASS | target answered 200 |
| EL-ENG-091 | `/admin/events` | en | link | Business Directory | /admin/business-directory | 8 | 238x44 | PASS | target answered 200 |
| EL-ENG-092 | `/admin/events` | en | link | Certificates | /admin/temp | 8 | 238x44 | PASS | target answered 200 |
| EL-ENG-093 | `/admin/events` | en | link | Complaint Desk | /admin/complaints | 8 | 238x44 | PASS | target answered 200 |
| EL-ENG-094 | `/admin/events` | en | link | Content & Messaging | /admin/content | 8 | 238x44 | PASS | target answered 200 |
| EL-ENG-095 | `/admin/events` | en | link | Documents & QR | /admin/documents | 8 | 238x44 | PASS | target answered 200 |
| EL-ENG-096 | `/admin/events` | en | link | Events & Meetings | /admin/events | 8 | 238x44 | PASS | target answered 200 |
| EL-ENG-097 | `/admin/events` | en | link | MCCI Admin Secretariat Panel | /admin | 8 | 238x82 | PASS | target answered 200 |
| EL-ENG-098 | `/admin/events` | en | link | Meetings & Minutes | /admin/meetings | 8 | 197x46 | PASS | target answered 200 |
| EL-ENG-099 | `/admin/events` | en | link | Members Register | /admin/members | 8 | 238x44 | PASS | target answered 200 |
| EL-ENG-100 | `/admin/events` | en | link | Membership Pipeline | /admin/requests | 8 | 238x44 | PASS | target answered 200 |
| EL-ENG-101 | `/admin/events` | en | link | Payments | /admin/payments | 8 | 238x44 | PASS | target answered 200 |
| EL-ENG-102 | `/admin/events` | en | link | Reports & AI | /admin/reports | 8 | 238x44 | PASS | target answered 200 |
| EL-ENG-103 | `/admin/events` | en | link | Service Requests | /admin/applications | 8 | 238x44 | PASS | target answered 200 |
| EL-ENG-104 | `/admin/events` | en | link | Services & Integrations | /admin/services | 8 | 238x44 | PASS | target answered 200 |
| EL-ENG-105 | `/admin/events` | en | link | Settings | /admin/settings | 8 | 238x44 | PASS | target answered 200 |
| EL-ENG-106 | `/admin/events` | en | link | Skip to content | #main | 8 | 144x47 | PASS | in-page anchor |
| EL-ENG-107 | `/admin/events` | en | link | Staff & Audit | /admin/staff | 8 | 238x44 | PASS | target answered 200 |
| EL-ENG-108 | `/admin/events` | en | link | WhatsApp | /admin/whatsapp | 8 | 238x44 | PASS | target answered 200 |
| EL-ENG-109 | `/admin/events` | ur | button | 2027-01-01 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-110 | `/admin/events` | ur | button | 2027-01-02 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-111 | `/admin/events` | ur | button | 2027-01-03 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-112 | `/admin/events` | ur | button | 2027-01-04 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-113 | `/admin/events` | ur | button | 2027-01-05 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-114 | `/admin/events` | ur | button | 2027-01-06 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-115 | `/admin/events` | ur | button | 2027-01-07 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-116 | `/admin/events` | ur | button | 2027-01-08 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-117 | `/admin/events` | ur | button | 2027-01-09 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-118 | `/admin/events` | ur | button | 2027-01-10 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-119 | `/admin/events` | ur | button | 2027-01-11 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-120 | `/admin/events` | ur | button | 2027-01-12 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-121 | `/admin/events` | ur | button | 2027-01-13 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-122 | `/admin/events` | ur | button | 2027-01-14 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-123 | `/admin/events` | ur | button | 2027-01-15 · 2 تقریبات | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-124 | `/admin/events` | ur | button | 2027-01-16 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-125 | `/admin/events` | ur | button | 2027-01-17 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-126 | `/admin/events` | ur | button | 2027-01-18 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-127 | `/admin/events` | ur | button | 2027-01-19 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-128 | `/admin/events` | ur | button | 2027-01-20 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-129 | `/admin/events` | ur | button | 2027-01-21 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-130 | `/admin/events` | ur | button | 2027-01-22 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-131 | `/admin/events` | ur | button | 2027-01-23 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-132 | `/admin/events` | ur | button | 2027-01-24 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-133 | `/admin/events` | ur | button | 2027-01-25 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-134 | `/admin/events` | ur | button | 2027-01-26 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-135 | `/admin/events` | ur | button | 2027-01-27 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-136 | `/admin/events` | ur | button | 2027-01-28 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-137 | `/admin/events` | ur | button | 2027-01-29 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-138 | `/admin/events` | ur | button | 2027-01-30 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-139 | `/admin/events` | ur | button | 2027-01-31 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-140 | `/admin/events` | ur | button | Export clinic c36f7d میں ترمیم | ev.edit | 1 | 42x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-141 | `/admin/events` | ur | button | Export clinic d098e0 میں ترمیم | ev.edit | 1 | 42x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-142 | `/admin/events` | ur | button | اگلا مہینہ | cal.move | 1 | 48x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-143 | `/admin/events` | ur | button | پچھلا مہینہ | cal.move | 1 | 48x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-144 | `/admin/events` | ur | button | تقریب بنائیں | ev.create | 1 | 104x47 | PASS | exercised by a functional spec |
| EL-ENG-145 | `/admin/events` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-ENG-146 | `/admin/events` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-ENG-147 | `/admin/events` | ur | link | اجلاس اور کارروائی | /ur/admin/meetings | 1 | 124x52 | PASS | target answered 200 |
| EL-ENG-148 | `/admin/events` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-ENG-149 | `/admin/events` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-ENG-150 | `/admin/events` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-ENG-151 | `/admin/events` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-ENG-152 | `/admin/events` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-ENG-153 | `/admin/events` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-ENG-154 | `/admin/events` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-ENG-155 | `/admin/events` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-ENG-156 | `/admin/events` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-ENG-157 | `/admin/events` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-ENG-158 | `/admin/events` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-ENG-159 | `/admin/events` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-ENG-160 | `/admin/events` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-ENG-161 | `/admin/events` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-ENG-162 | `/admin/events` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-ENG-163 | `/admin/events` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-ENG-164 | `/admin/events` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-ENG-165 | `/admin/events` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-ENG-166 | `/admin/events` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-001 | `/admin/finance` | en | button | Light or dark theme | theme.toggle | 4 | 44x44 | PASS | exercised by a functional spec |
| EL-FIN-002 | `/admin/finance` | en | button | Print | fin.print | 4 | 89x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-FIN-003 | `/admin/finance` | en | button | Sign out | logout | 4 | 116x44 | PASS | exercised by a functional spec |
| EL-FIN-004 | `/admin/finance` | en | input:checkbox | Verified entries only |  | 4 | 20x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-FIN-005 | `/admin/finance` | en | input:date | From |  | 4 | 147x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-FIN-006 | `/admin/finance` | en | input:date | To |  | 4 | 147x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-FIN-007 | `/admin/finance` | en | link | Accounts | /admin/finance | 4 | 238x44 | PASS | target answered 200 |
| EL-FIN-008 | `/admin/finance` | en | link | Ask MCCI AI | /admin/help | 4 | 238x44 | PASS | target answered 200 |
| EL-FIN-009 | `/admin/finance` | en | link | Banks & Closing | fin.tab | 4 | 143x44 | PASS | target answered 200 |
| EL-FIN-010 | `/admin/finance` | en | link | Business Directory | /admin/business-directory | 4 | 238x44 | PASS | target answered 200 |
| EL-FIN-011 | `/admin/finance` | en | link | Certificates | /admin/temp | 4 | 238x44 | PASS | target answered 200 |
| EL-FIN-012 | `/admin/finance` | en | link | Complaint Desk | /admin/complaints | 4 | 238x44 | PASS | target answered 200 |
| EL-FIN-013 | `/admin/finance` | en | link | Content & Messaging | /admin/content | 4 | 238x44 | PASS | target answered 200 |
| EL-FIN-014 | `/admin/finance` | en | link | Documents & QR | /admin/documents | 4 | 238x44 | PASS | target answered 200 |
| EL-FIN-015 | `/admin/finance` | en | link | Download CSV | fin.export | 4 | 165x44 | PARTIAL | download or sign-out link, not requested |
| EL-FIN-016 | `/admin/finance` | en | link | Events & Meetings | /admin/events | 4 | 238x44 | PASS | target answered 200 |
| EL-FIN-017 | `/admin/finance` | en | link | Last 15 days | fin.preset | 4 | 115x44 | PASS | target answered 200 |
| EL-FIN-018 | `/admin/finance` | en | link | MCCI Admin Secretariat Panel | /admin | 4 | 238x82 | PASS | target answered 200 |
| EL-FIN-019 | `/admin/finance` | en | link | Members Register | /admin/members | 4 | 238x44 | PASS | target answered 200 |
| EL-FIN-020 | `/admin/finance` | en | link | Membership Pipeline | /admin/requests | 4 | 238x44 | PASS | target answered 200 |
| EL-FIN-021 | `/admin/finance` | en | link | Payments | /admin/payments | 4 | 238x44 | PASS | target answered 200 |
| EL-FIN-022 | `/admin/finance` | en | link | Profit & Loss | fin.tab | 4 | 119x44 | PASS | target answered 200 |
| EL-FIN-023 | `/admin/finance` | en | link | Receipts & Expenses | fin.tab | 4 | 176x44 | PASS | target answered 200 |
| EL-FIN-024 | `/admin/finance` | en | link | Reports & AI | /admin/reports | 4 | 238x44 | PASS | target answered 200 |
| EL-FIN-025 | `/admin/finance` | en | link | Service Requests | /admin/applications | 4 | 238x44 | PASS | target answered 200 |
| EL-FIN-026 | `/admin/finance` | en | link | Services & Integrations | /admin/services | 4 | 238x44 | PASS | target answered 200 |
| EL-FIN-027 | `/admin/finance` | en | link | Settings | /admin/settings | 4 | 238x44 | PASS | target answered 200 |
| EL-FIN-028 | `/admin/finance` | en | link | Skip to content | #main | 4 | 144x47 | PASS | in-page anchor |
| EL-FIN-029 | `/admin/finance` | en | link | Staff & Audit | /admin/staff | 4 | 238x44 | PASS | target answered 200 |
| EL-FIN-030 | `/admin/finance` | en | link | This month | fin.preset | 4 | 108x44 | PASS | target answered 200 |
| EL-FIN-031 | `/admin/finance` | en | link | This quarter | fin.preset | 4 | 114x44 | PASS | target answered 200 |
| EL-FIN-032 | `/admin/finance` | en | link | This year | fin.preset | 4 | 93x44 | PASS | target answered 200 |
| EL-FIN-033 | `/admin/finance` | en | link | Trial Balance | fin.tab | 4 | 118x44 | PASS | target answered 200 |
| EL-FIN-034 | `/admin/finance` | en | link | WhatsApp | /admin/whatsapp | 4 | 238x44 | PASS | target answered 200 |
| EL-FIN-035 | `/admin/finance` | en | submit | Show | fin.range.apply | 4 | 73x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-FIN-036 | `/admin/finance` | ur | button | پرنٹ | fin.print | 1 | 77x49 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-FIN-037 | `/admin/finance` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-FIN-038 | `/admin/finance` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-FIN-039 | `/admin/finance` | ur | input:checkbox | صرف تصدیق شدہ اندراجات |  | 1 | 20x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-FIN-040 | `/admin/finance` | ur | input:date | از |  | 1 | 147x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-FIN-041 | `/admin/finance` | ur | input:date | تا |  | 1 | 147x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-FIN-042 | `/admin/finance` | ur | link | آخری 15 دن | fin.preset | 1 | 87x44 | PASS | target answered 200 |
| EL-FIN-043 | `/admin/finance` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-044 | `/admin/finance` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-045 | `/admin/finance` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-046 | `/admin/finance` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-FIN-047 | `/admin/finance` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-048 | `/admin/finance` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-049 | `/admin/finance` | ur | link | بینک اور بندش | fin.tab | 1 | 87x44 | PASS | target answered 200 |
| EL-FIN-050 | `/admin/finance` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-051 | `/admin/finance` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-052 | `/admin/finance` | ur | link | ٹرائل بیلنس | fin.tab | 1 | 77x44 | PASS | target answered 200 |
| EL-FIN-053 | `/admin/finance` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-054 | `/admin/finance` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-055 | `/admin/finance` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-056 | `/admin/finance` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-057 | `/admin/finance` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-058 | `/admin/finance` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-059 | `/admin/finance` | ur | link | سی ایس وی ڈاؤن لوڈ | fin.export | 1 | 136x49 | PARTIAL | download or sign-out link, not requested |
| EL-FIN-060 | `/admin/finance` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-061 | `/admin/finance` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-062 | `/admin/finance` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-063 | `/admin/finance` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-FIN-064 | `/admin/finance` | ur | link | نفع و نقصان | fin.tab | 1 | 77x44 | PASS | target answered 200 |
| EL-FIN-065 | `/admin/finance` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-066 | `/admin/finance` | ur | link | وصولیاں اور اخراجات | fin.tab | 1 | 111x44 | PASS | target answered 200 |
| EL-FIN-067 | `/admin/finance` | ur | link | یہ سال | fin.preset | 1 | 60x44 | PASS | target answered 200 |
| EL-FIN-068 | `/admin/finance` | ur | link | یہ سہ ماہی | fin.preset | 1 | 69x44 | PASS | target answered 200 |
| EL-FIN-069 | `/admin/finance` | ur | link | یہ مہینہ | fin.preset | 1 | 61x44 | PASS | target answered 200 |
| EL-FIN-070 | `/admin/finance` | ur | submit | دکھائیں | fin.range.apply | 1 | 60x49 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ADMIN-001 | `/admin/help` | en | button | Ask | guide.ask | 12 | 80x44 | PASS | exercised by a functional spec |
| EL-ADMIN-002 | `/admin/help` | en | button | Give someone access to one section | guide.suggest | 12 | 256x44 | PASS | exercised by a functional spec |
| EL-ADMIN-003 | `/admin/help` | en | button | How do I record an expense? | guide.suggest | 12 | 208x44 | PASS | exercised by a functional spec |
| EL-ADMIN-004 | `/admin/help` | en | button | Light or dark theme | theme.toggle | 12 | 44x44 | PASS | exercised by a functional spec |
| EL-ADMIN-005 | `/admin/help` | en | button | Make the voter list | guide.suggest | 12 | 141x44 | PASS | exercised by a functional spec |
| EL-ADMIN-006 | `/admin/help` | en | button | Publish a news post with photos | guide.suggest | 12 | 227x44 | PASS | exercised by a functional spec |
| EL-ADMIN-007 | `/admin/help` | en | button | Restore a lapsed member | guide.suggest | 12 | 186x44 | PASS | exercised by a functional spec |
| EL-ADMIN-008 | `/admin/help` | en | button | Send a WhatsApp message to many members | guide.suggest | 12 | 313x44 | PASS | exercised by a functional spec |
| EL-ADMIN-009 | `/admin/help` | en | button | Sign out | logout | 12 | 116x44 | PASS | exercised by a functional spec |
| EL-ADMIN-010 | `/admin/help` | en | input:text | Your question |  | 12 | 990x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ADMIN-011 | `/admin/help` | en | link | Accounts | /admin/finance | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-012 | `/admin/help` | en | link | Ask MCCI AI | /admin/help | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-013 | `/admin/help` | en | link | Business Directory | /admin/business-directory | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-014 | `/admin/help` | en | link | Certificates | /admin/temp | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-015 | `/admin/help` | en | link | Complaint Desk | /admin/complaints | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-016 | `/admin/help` | en | link | Content & Messaging | /admin/content | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-017 | `/admin/help` | en | link | Documents & QR | /admin/documents | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-018 | `/admin/help` | en | link | Events & Meetings | /admin/events | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-019 | `/admin/help` | en | link | MCCI Admin Secretariat Panel | /admin | 12 | 238x82 | PASS | target answered 200 |
| EL-ADMIN-020 | `/admin/help` | en | link | Members Register | /admin/members | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-021 | `/admin/help` | en | link | Membership Pipeline | /admin/requests | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-022 | `/admin/help` | en | link | Payments | /admin/payments | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-023 | `/admin/help` | en | link | Reports & AI | /admin/reports | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-024 | `/admin/help` | en | link | Service Requests | /admin/applications | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-025 | `/admin/help` | en | link | Services & Integrations | /admin/services | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-026 | `/admin/help` | en | link | Settings | /admin/settings | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-027 | `/admin/help` | en | link | Skip to content | #main | 12 | 144x47 | PASS | in-page anchor |
| EL-ADMIN-028 | `/admin/help` | en | link | Staff & Audit | /admin/staff | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-029 | `/admin/help` | en | link | WhatsApp | /admin/whatsapp | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-030 | `/admin/help` | ur | button | پوچھیں | guide.ask | 1 | 79x47 | PASS | exercised by a functional spec |
| EL-ADMIN-031 | `/admin/help` | ur | button | تصاویر کے ساتھ خبر شائع کریں | guide.suggest | 1 | 130x44 | PASS | exercised by a functional spec |
| EL-ADMIN-032 | `/admin/help` | ur | button | خرچ کیسے درج کروں؟ | guide.suggest | 1 | 100x44 | PASS | exercised by a functional spec |
| EL-ADMIN-033 | `/admin/help` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-ADMIN-034 | `/admin/help` | ur | button | زائد المیعاد ممبر بحال کریں | guide.suggest | 1 | 112x44 | PASS | exercised by a functional spec |
| EL-ADMIN-035 | `/admin/help` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-ADMIN-036 | `/admin/help` | ur | button | کئی ممبران کو واٹس ایپ پیغام بھیجیں | guide.suggest | 1 | 146x44 | PASS | exercised by a functional spec |
| EL-ADMIN-037 | `/admin/help` | ur | button | کسی کو ایک سیکشن کی رسائی دیں | guide.suggest | 1 | 131x44 | PASS | exercised by a functional spec |
| EL-ADMIN-038 | `/admin/help` | ur | button | ووٹر لسٹ بنائیں | guide.suggest | 1 | 77x44 | PASS | exercised by a functional spec |
| EL-ADMIN-039 | `/admin/help` | ur | input:text | آپ کا سوال |  | 1 | 991x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ADMIN-040 | `/admin/help` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-041 | `/admin/help` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-042 | `/admin/help` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-043 | `/admin/help` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-ADMIN-044 | `/admin/help` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-045 | `/admin/help` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-046 | `/admin/help` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-047 | `/admin/help` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-048 | `/admin/help` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-049 | `/admin/help` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-050 | `/admin/help` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-051 | `/admin/help` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-052 | `/admin/help` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-053 | `/admin/help` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-054 | `/admin/help` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-055 | `/admin/help` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-056 | `/admin/help` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-057 | `/admin/help` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-ADMIN-058 | `/admin/help` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-057 | `/admin/import` | en | button | Light or dark theme | theme.toggle | 4 | 44x44 | PASS | exercised by a functional spec |
| EL-REG-058 | `/admin/import` | en | button | Sign out | logout | 4 | 116x44 | PASS | exercised by a functional spec |
| EL-REG-059 | `/admin/import` | en | button | Upload file | imp.file | 4 | 132x44 | PASS | exercised by a functional spec |
| EL-REG-060 | `/admin/import` | en | link | 3 Nov 2026, 15:04 | imp.open | 4 | 132x44 | PASS | target answered 200 |
| EL-REG-061 | `/admin/import` | en | link | 3 Nov 2026, 15:04 | imp.open | 4 | 132x44 | PASS | target answered 200 |
| EL-REG-062 | `/admin/import` | en | link | 6 Nov 2026, 12:18 | imp.open | 4 | 127x44 | PASS | target answered 200 |
| EL-REG-063 | `/admin/import` | en | link | 6 Nov 2026, 12:18 | imp.open | 4 | 127x44 | PASS | target answered 200 |
| EL-REG-064 | `/admin/import` | en | link | Accounts | /admin/finance | 4 | 238x44 | PASS | target answered 200 |
| EL-REG-065 | `/admin/import` | en | link | Ask MCCI AI | /admin/help | 4 | 238x44 | PASS | target answered 200 |
| EL-REG-066 | `/admin/import` | en | link | Business Directory | /admin/business-directory | 4 | 238x44 | PASS | target answered 200 |
| EL-REG-067 | `/admin/import` | en | link | Certificates | /admin/temp | 4 | 238x44 | PASS | target answered 200 |
| EL-REG-068 | `/admin/import` | en | link | Change Declarations | /admin/changes | 4 | 206x46 | PASS | target answered 200 |
| EL-REG-069 | `/admin/import` | en | link | Complaint Desk | /admin/complaints | 4 | 238x44 | PASS | target answered 200 |
| EL-REG-070 | `/admin/import` | en | link | Content & Messaging | /admin/content | 4 | 238x44 | PASS | target answered 200 |
| EL-REG-071 | `/admin/import` | en | link | Data Import | /admin/import | 4 | 141x46 | PASS | target answered 200 |
| EL-REG-072 | `/admin/import` | en | link | Documents & QR | /admin/documents | 4 | 238x44 | PASS | target answered 200 |
| EL-REG-073 | `/admin/import` | en | link | Download template | imp.template | 4 | 201x44 | PARTIAL | external / file link (not requested) |
| EL-REG-074 | `/admin/import` | en | link | Events & Meetings | /admin/events | 4 | 238x44 | PASS | target answered 200 |
| EL-REG-075 | `/admin/import` | en | link | MCCI Admin Secretariat Panel | /admin | 4 | 238x82 | PASS | target answered 200 |
| EL-REG-076 | `/admin/import` | en | link | Members Register | /admin/members | 4 | 238x44 | PASS | target answered 200 |
| EL-REG-077 | `/admin/import` | en | link | Membership Pipeline | /admin/requests | 4 | 238x44 | PASS | target answered 200 |
| EL-REG-078 | `/admin/import` | en | link | Payments | /admin/payments | 4 | 238x44 | PASS | target answered 200 |
| EL-REG-079 | `/admin/import` | en | link | Reports & AI | /admin/reports | 4 | 238x44 | PASS | target answered 200 |
| EL-REG-080 | `/admin/import` | en | link | Service Requests | /admin/applications | 4 | 238x44 | PASS | target answered 200 |
| EL-REG-081 | `/admin/import` | en | link | Services & Integrations | /admin/services | 4 | 238x44 | PASS | target answered 200 |
| EL-REG-082 | `/admin/import` | en | link | Settings | /admin/settings | 4 | 238x44 | PASS | target answered 200 |
| EL-REG-083 | `/admin/import` | en | link | Skip to content | #main | 4 | 144x47 | PASS | in-page anchor |
| EL-REG-084 | `/admin/import` | en | link | Staff & Audit | /admin/staff | 4 | 238x44 | PASS | target answered 200 |
| EL-REG-085 | `/admin/import` | en | link | WhatsApp | /admin/whatsapp | 4 | 238x44 | PASS | target answered 200 |
| EL-REG-086 | `/admin/import` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-REG-087 | `/admin/import` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-REG-088 | `/admin/import` | ur | button | فائل اپ لوڈ کریں | imp.file | 1 | 125x49 | PASS | exercised by a functional spec |
| EL-REG-089 | `/admin/import` | ur | link | 3 نومبر، 2026، 03:04 PM | imp.open | 1 | 152x44 | PASS | target answered 200 |
| EL-REG-090 | `/admin/import` | ur | link | 3 نومبر، 2026، 03:04 PM | imp.open | 1 | 152x44 | PASS | target answered 200 |
| EL-REG-091 | `/admin/import` | ur | link | 6 نومبر، 2026، 12:18 PM | imp.open | 1 | 143x44 | PASS | target answered 200 |
| EL-REG-092 | `/admin/import` | ur | link | 6 نومبر، 2026، 12:18 PM | imp.open | 1 | 143x44 | PASS | target answered 200 |
| EL-REG-093 | `/admin/import` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-094 | `/admin/import` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-095 | `/admin/import` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-096 | `/admin/import` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-REG-097 | `/admin/import` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-098 | `/admin/import` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-099 | `/admin/import` | ur | link | تبدیلی کے اقرار نامے | /ur/admin/changes | 1 | 137x52 | PASS | target answered 200 |
| EL-REG-100 | `/admin/import` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-101 | `/admin/import` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-102 | `/admin/import` | ur | link | ٹیمپلیٹ ڈاؤن لوڈ کریں | imp.template | 1 | 143x49 | PARTIAL | external / file link (not requested) |
| EL-REG-103 | `/admin/import` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-104 | `/admin/import` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-105 | `/admin/import` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-106 | `/admin/import` | ur | link | ڈیٹا امپورٹ | /ur/admin/import | 1 | 99x52 | PASS | target answered 200 |
| EL-REG-107 | `/admin/import` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-108 | `/admin/import` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-109 | `/admin/import` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-110 | `/admin/import` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-111 | `/admin/import` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-112 | `/admin/import` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-113 | `/admin/import` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-REG-114 | `/admin/import` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-001 | `/admin/integrations` | en | button | Light or dark theme | theme.toggle | 8 | 44x44 | PASS | exercised by a functional spec |
| EL-PLAT-002 | `/admin/integrations` | en | button | Sign out | logout | 8 | 116x44 | PASS | exercised by a functional spec |
| EL-PLAT-003 | `/admin/integrations` | en | link | Accounts | /admin/finance | 8 | 238x44 | PASS | target answered 200 |
| EL-PLAT-004 | `/admin/integrations` | en | link | Ask MCCI AI | /admin/help | 8 | 238x44 | PASS | target answered 200 |
| EL-PLAT-005 | `/admin/integrations` | en | link | Business Directory | /admin/business-directory | 8 | 238x44 | PASS | target answered 200 |
| EL-PLAT-006 | `/admin/integrations` | en | link | Certificates | /admin/temp | 8 | 238x44 | PASS | target answered 200 |
| EL-PLAT-007 | `/admin/integrations` | en | link | Complaint Desk | /admin/complaints | 8 | 238x44 | PASS | target answered 200 |
| EL-PLAT-008 | `/admin/integrations` | en | link | Content & Messaging | /admin/content | 8 | 238x44 | PASS | target answered 200 |
| EL-PLAT-009 | `/admin/integrations` | en | link | Documents & QR | /admin/documents | 8 | 238x44 | PASS | target answered 200 |
| EL-PLAT-010 | `/admin/integrations` | en | link | Events & Meetings | /admin/events | 8 | 238x44 | PASS | target answered 200 |
| EL-PLAT-011 | `/admin/integrations` | en | link | Integrations | /admin/integrations | 8 | 143x46 | PASS | target answered 200 |
| EL-PLAT-012 | `/admin/integrations` | en | link | MCCI Admin Secretariat Panel | /admin | 8 | 238x82 | PASS | target answered 200 |
| EL-PLAT-013 | `/admin/integrations` | en | link | Members Register | /admin/members | 8 | 238x44 | PASS | target answered 200 |
| EL-PLAT-014 | `/admin/integrations` | en | link | Membership Pipeline | /admin/requests | 8 | 238x44 | PASS | target answered 200 |
| EL-PLAT-015 | `/admin/integrations` | en | link | Payments | /admin/payments | 8 | 238x44 | PASS | target answered 200 |
| EL-PLAT-016 | `/admin/integrations` | en | link | Reports & AI | /admin/reports | 8 | 238x44 | PASS | target answered 200 |
| EL-PLAT-017 | `/admin/integrations` | en | link | Send a test | nav | 3 | 113x44 | PASS | target answered 200 |
| EL-PLAT-018 | `/admin/integrations` | en | link | Service Requests | /admin/applications | 8 | 238x44 | PASS | target answered 200 |
| EL-PLAT-019 | `/admin/integrations` | en | link | Services & Integrations | /admin/services | 8 | 238x44 | PASS | target answered 200 |
| EL-PLAT-020 | `/admin/integrations` | en | link | Settings | /admin/settings | 8 | 238x44 | PASS | target answered 200 |
| EL-PLAT-021 | `/admin/integrations` | en | link | Skip to content | #main | 8 | 144x47 | PASS | in-page anchor |
| EL-PLAT-022 | `/admin/integrations` | en | link | Staff & Audit | /admin/staff | 8 | 238x44 | PASS | target answered 200 |
| EL-PLAT-023 | `/admin/integrations` | en | link | WhatsApp | /admin/whatsapp | 8 | 238x44 | PASS | target answered 200 |
| EL-PLAT-024 | `/admin/integrations` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-PLAT-025 | `/admin/integrations` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-PLAT-026 | `/admin/integrations` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-027 | `/admin/integrations` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-028 | `/admin/integrations` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-029 | `/admin/integrations` | ur | link | انٹیگریشنز | /ur/admin/integrations | 1 | 88x52 | PASS | target answered 200 |
| EL-PLAT-030 | `/admin/integrations` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-PLAT-031 | `/admin/integrations` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-032 | `/admin/integrations` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-033 | `/admin/integrations` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-034 | `/admin/integrations` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-035 | `/admin/integrations` | ur | link | ٹیسٹ بھیجیں | nav | 1 | 80x49 | PASS | target answered 200 |
| EL-PLAT-036 | `/admin/integrations` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-037 | `/admin/integrations` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-038 | `/admin/integrations` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-039 | `/admin/integrations` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-040 | `/admin/integrations` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-041 | `/admin/integrations` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-042 | `/admin/integrations` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-043 | `/admin/integrations` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-044 | `/admin/integrations` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-045 | `/admin/integrations` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-PLAT-046 | `/admin/integrations` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-CMT-051 | `/admin/meetings` | en | button | Light or dark theme | theme.toggle | 7 | 44x44 | PASS | exercised by a functional spec |
| EL-CMT-052 | `/admin/meetings` | en | button | Record minutes | mt.minutes | 3 | 149x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-CMT-053 | `/admin/meetings` | en | button | Schedule meeting | mt.create | 3 | 186x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-CMT-054 | `/admin/meetings` | en | button | Sign out | logout | 7 | 116x44 | PASS | exercised by a functional spec |
| EL-CMT-055 | `/admin/meetings` | en | link | Accounts | /admin/finance | 7 | 238x44 | PASS | target answered 200 |
| EL-CMT-056 | `/admin/meetings` | en | link | Ask MCCI AI | /admin/help | 7 | 238x44 | PASS | target answered 200 |
| EL-CMT-057 | `/admin/meetings` | en | link | Business Directory | /admin/business-directory | 7 | 238x44 | PASS | target answered 200 |
| EL-CMT-058 | `/admin/meetings` | en | link | Certificates | /admin/temp | 7 | 238x44 | PASS | target answered 200 |
| EL-CMT-059 | `/admin/meetings` | en | link | Complaint Desk | /admin/complaints | 7 | 238x44 | PASS | target answered 200 |
| EL-CMT-060 | `/admin/meetings` | en | link | Content & Messaging | /admin/content | 7 | 238x44 | PASS | target answered 200 |
| EL-CMT-061 | `/admin/meetings` | en | link | Documents & QR | /admin/documents | 7 | 238x44 | PASS | target answered 200 |
| EL-CMT-062 | `/admin/meetings` | en | link | Events & Meetings | /admin/events | 7 | 238x44 | PASS | target answered 200 |
| EL-CMT-063 | `/admin/meetings` | en | link | MCCI Admin Secretariat Panel | /admin | 7 | 238x82 | PASS | target answered 200 |
| EL-CMT-064 | `/admin/meetings` | en | link | Meetings & Minutes | /admin/meetings | 7 | 197x46 | PASS | target answered 200 |
| EL-CMT-065 | `/admin/meetings` | en | link | Members Register | /admin/members | 7 | 238x44 | PASS | target answered 200 |
| EL-CMT-066 | `/admin/meetings` | en | link | Membership Pipeline | /admin/requests | 7 | 238x44 | PASS | target answered 200 |
| EL-CMT-067 | `/admin/meetings` | en | link | Payments | /admin/payments | 7 | 238x44 | PASS | target answered 200 |
| EL-CMT-068 | `/admin/meetings` | en | link | Reports & AI | /admin/reports | 7 | 238x44 | PASS | target answered 200 |
| EL-CMT-069 | `/admin/meetings` | en | link | Service Requests | /admin/applications | 7 | 238x44 | PASS | target answered 200 |
| EL-CMT-070 | `/admin/meetings` | en | link | Services & Integrations | /admin/services | 7 | 238x44 | PASS | target answered 200 |
| EL-CMT-071 | `/admin/meetings` | en | link | Settings | /admin/settings | 7 | 238x44 | PASS | target answered 200 |
| EL-CMT-072 | `/admin/meetings` | en | link | Skip to content | #main | 7 | 144x47 | PASS | in-page anchor |
| EL-CMT-073 | `/admin/meetings` | en | link | Staff & Audit | /admin/staff | 7 | 238x44 | PASS | target answered 200 |
| EL-CMT-074 | `/admin/meetings` | en | link | WhatsApp | /admin/whatsapp | 7 | 238x44 | PASS | target answered 200 |
| EL-CMT-075 | `/admin/meetings` | ur | button | اجلاس طے کریں | mt.create | 1 | 118x47 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-CMT-076 | `/admin/meetings` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-CMT-077 | `/admin/meetings` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-CMT-078 | `/admin/meetings` | ur | button | کارروائی درج کریں | mt.minutes | 1 | 112x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-CMT-079 | `/admin/meetings` | ur | link | اجلاس اور کارروائی | /ur/admin/meetings | 1 | 124x52 | PASS | target answered 200 |
| EL-CMT-080 | `/admin/meetings` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-CMT-081 | `/admin/meetings` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-CMT-082 | `/admin/meetings` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-CMT-083 | `/admin/meetings` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-CMT-084 | `/admin/meetings` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-CMT-085 | `/admin/meetings` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-CMT-086 | `/admin/meetings` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-CMT-087 | `/admin/meetings` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-CMT-088 | `/admin/meetings` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-CMT-089 | `/admin/meetings` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-CMT-090 | `/admin/meetings` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-CMT-091 | `/admin/meetings` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-CMT-092 | `/admin/meetings` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-CMT-093 | `/admin/meetings` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-CMT-094 | `/admin/meetings` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-CMT-095 | `/admin/meetings` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-CMT-096 | `/admin/meetings` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-CMT-097 | `/admin/meetings` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-CMT-098 | `/admin/meetings` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-115 | `/admin/members` | en | button | Add demo account | demo.add | 2 | 194x44 | PASS | exercised by a functional spec |
| EL-REG-116 | `/admin/members` | en | button | Add member | mem.add | 4 | 149x44 | PASS | exercised by a functional spec |
| EL-REG-117 | `/admin/members` | en | button | Light or dark theme | theme.toggle | 11 | 44x44 | PASS | exercised by a functional spec |
| EL-REG-118 | `/admin/members` | en | button | Mark an applicant as demo | demo.mark | 2 | 249x44 | PASS | exercised by a functional spec |
| EL-REG-119 | `/admin/members` | en | button | Mark blacklisted | reg.blacklist | 4 | 130x44 | PASS | exercised by a functional spec |
| EL-REG-120 | `/admin/members` | en | button | Renew | reg.renew | 4 | 69x44 | PASS | exercised by a functional spec |
| EL-REG-121 | `/admin/members` | en | button | Save | reg.season.save | 2 | 68x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-REG-122 | `/admin/members` | en | button | Sign out | logout | 11 | 116x44 | PASS | exercised by a functional spec |
| EL-REG-123 | `/admin/members` | en | input:date | Renewals open from |  | 2 | 147x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-REG-124 | `/admin/members` | en | input:search | Search |  | 11 | 962x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-REG-125 | `/admin/members` | en | input:text | Reason |  | 2 | 180x44 | PASS | exercised by a functional spec |
| EL-REG-126 | `/admin/members` | en | link | Accounts | /admin/finance | 11 | 238x44 | PASS | target answered 200 |
| EL-REG-127 | `/admin/members` | en | link | Active (5) | reg.show | 11 | 100x44 | PASS | target answered 200 |
| EL-REG-128 | `/admin/members` | en | link | All (5) | reg.show | 11 | 73x44 | PASS | target answered 200 |
| EL-REG-129 | `/admin/members` | en | link | Ask MCCI AI | /admin/help | 11 | 238x44 | PASS | target answered 200 |
| EL-REG-130 | `/admin/members` | en | link | Associate (0) | reg.show | 11 | 125x44 | PASS | target answered 200 |
| EL-REG-131 | `/admin/members` | en | link | Blacklisted (0) | reg.show | 11 | 133x44 | PASS | target answered 200 |
| EL-REG-132 | `/admin/members` | en | link | Business Directory | /admin/business-directory | 11 | 238x44 | PASS | target answered 200 |
| EL-REG-133 | `/admin/members` | en | link | Certificates | /admin/temp | 11 | 238x44 | PASS | target answered 200 |
| EL-REG-134 | `/admin/members` | en | link | Change Declarations | /admin/changes | 11 | 206x46 | PASS | target answered 200 |
| EL-REG-135 | `/admin/members` | en | link | Complaint Desk | /admin/complaints | 11 | 238x44 | PASS | target answered 200 |
| EL-REG-136 | `/admin/members` | en | link | Content & Messaging | /admin/content | 11 | 238x44 | PASS | target answered 200 |
| EL-REG-137 | `/admin/members` | en | link | Corporate (5) | reg.show | 11 | 127x44 | PASS | target answered 200 |
| EL-REG-138 | `/admin/members` | en | link | Data Import | /admin/import | 11 | 141x46 | PASS | target answered 200 |
| EL-REG-139 | `/admin/members` | en | link | Date missing (0) | reg.show | 11 | 144x44 | PASS | target answered 200 |
| EL-REG-140 | `/admin/members` | en | link | Documents & QR | /admin/documents | 11 | 238x44 | PASS | target answered 200 |
| EL-REG-141 | `/admin/members` | en | link | Events & Meetings | /admin/events | 11 | 238x44 | PASS | target answered 200 |
| EL-REG-142 | `/admin/members` | en | link | Export register (CSV) | reg.export | 1 | 187x44 | PARTIAL | download or sign-out link, not requested |
| EL-REG-143 | `/admin/members` | en | link | Lapsed (0) | reg.show | 11 | 107x44 | PASS | target answered 200 |
| EL-REG-144 | `/admin/members` | en | link | MCCI Admin Secretariat Panel | /admin | 11 | 238x82 | PASS | target answered 200 |
| EL-REG-145 | `/admin/members` | en | link | MCCI-C-9001 | member.open | 11 | 108x44 | PASS | target answered 200 |
| EL-REG-146 | `/admin/members` | en | link | MCCI-C-9002 | member.open | 11 | 111x44 | PASS | target answered 200 |
| EL-REG-147 | `/admin/members` | en | link | MCCI-C-918470 | member.open | 11 | 125x44 | PASS | target answered 200 |
| EL-REG-148 | `/admin/members` | en | link | MCCI-C-946465 | member.open | 11 | 128x44 | PASS | target answered 200 |
| EL-REG-149 | `/admin/members` | en | link | MCCI-C-975169 | member.open | 11 | 122x44 | PASS | target answered 200 |
| EL-REG-150 | `/admin/members` | en | link | Members Register | /admin/members | 11 | 238x44 | PASS | target answered 200 |
| EL-REG-151 | `/admin/members` | en | link | Membership Pipeline | /admin/requests | 11 | 238x44 | PASS | target answered 200 |
| EL-REG-152 | `/admin/members` | en | link | Payments | /admin/payments | 11 | 238x44 | PASS | target answered 200 |
| EL-REG-153 | `/admin/members` | en | link | Reports & AI | /admin/reports | 11 | 238x44 | PASS | target answered 200 |
| EL-REG-154 | `/admin/members` | en | link | Service Requests | /admin/applications | 11 | 238x44 | PASS | target answered 200 |
| EL-REG-155 | `/admin/members` | en | link | Services & Integrations | /admin/services | 11 | 238x44 | PASS | target answered 200 |
| EL-REG-156 | `/admin/members` | en | link | Settings | /admin/settings | 11 | 238x44 | PASS | target answered 200 |
| EL-REG-157 | `/admin/members` | en | link | Skip to content | #main | 11 | 144x47 | PASS | in-page anchor |
| EL-REG-158 | `/admin/members` | en | link | Staff & Audit | /admin/staff | 11 | 238x44 | PASS | target answered 200 |
| EL-REG-159 | `/admin/members` | en | link | WhatsApp | /admin/whatsapp | 11 | 238x44 | PASS | target answered 200 |
| EL-REG-160 | `/admin/members` | en | submit | Search | reg.search | 11 | 106x44 | PASS | exercised by a functional spec |
| EL-REG-161 | `/admin/members` | ur | button | بلیک لسٹ درج کریں | reg.blacklist | 1 | 95x44 | PASS | exercised by a functional spec |
| EL-REG-162 | `/admin/members` | ur | button | تجدید | reg.renew | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-REG-163 | `/admin/members` | ur | button | درخواست گزار کو ڈیمو بنائیں | demo.mark | 1 | 164x49 | PASS | exercised by a functional spec |
| EL-REG-164 | `/admin/members` | ur | button | ڈیمو اکاؤنٹ شامل کریں | demo.add | 1 | 143x49 | PASS | exercised by a functional spec |
| EL-REG-165 | `/admin/members` | ur | button | رکن شامل کریں | mem.add | 1 | 116x47 | PASS | exercised by a functional spec |
| EL-REG-166 | `/admin/members` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-REG-167 | `/admin/members` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-REG-168 | `/admin/members` | ur | button | محفوظ کریں | reg.season.save | 1 | 75x49 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-REG-169 | `/admin/members` | ur | input:date | تجدید کا آغاز |  | 1 | 147x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-REG-170 | `/admin/members` | ur | input:search | تلاش |  | 1 | 970x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-REG-171 | `/admin/members` | ur | input:text | وجہ |  | 1 | 180x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-REG-172 | `/admin/members` | ur | link | MCCI-C-9001 | member.open | 1 | 108x44 | PASS | target answered 200 |
| EL-REG-173 | `/admin/members` | ur | link | MCCI-C-9002 | member.open | 1 | 111x44 | PASS | target answered 200 |
| EL-REG-174 | `/admin/members` | ur | link | MCCI-C-918470 | member.open | 1 | 125x44 | PASS | target answered 200 |
| EL-REG-175 | `/admin/members` | ur | link | MCCI-C-946465 | member.open | 1 | 128x44 | PASS | target answered 200 |
| EL-REG-176 | `/admin/members` | ur | link | MCCI-C-975169 | member.open | 1 | 122x44 | PASS | target answered 200 |
| EL-REG-177 | `/admin/members` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-178 | `/admin/members` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-179 | `/admin/members` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-180 | `/admin/members` | ur | link | ایسوسی ایٹ (0) | reg.show | 1 | 99x44 | PASS | target answered 200 |
| EL-REG-181 | `/admin/members` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-REG-182 | `/admin/members` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-183 | `/admin/members` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-184 | `/admin/members` | ur | link | بلیک لسٹ (0) | reg.show | 1 | 92x44 | PASS | target answered 200 |
| EL-REG-185 | `/admin/members` | ur | link | تاریخ موجود نہیں (0) | reg.show | 1 | 119x44 | PASS | target answered 200 |
| EL-REG-186 | `/admin/members` | ur | link | تبدیلی کے اقرار نامے | /ur/admin/changes | 1 | 137x52 | PASS | target answered 200 |
| EL-REG-187 | `/admin/members` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-188 | `/admin/members` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-189 | `/admin/members` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-190 | `/admin/members` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-191 | `/admin/members` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-192 | `/admin/members` | ur | link | ڈیٹا امپورٹ | /ur/admin/import | 1 | 99x52 | PASS | target answered 200 |
| EL-REG-193 | `/admin/members` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-194 | `/admin/members` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-195 | `/admin/members` | ur | link | زائد المیعاد (0) | reg.show | 1 | 94x44 | PASS | target answered 200 |
| EL-REG-196 | `/admin/members` | ur | link | سب (5) | reg.show | 1 | 72x44 | PASS | target answered 200 |
| EL-REG-197 | `/admin/members` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-198 | `/admin/members` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-199 | `/admin/members` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-200 | `/admin/members` | ur | link | فعال (5) | reg.show | 1 | 72x44 | PASS | target answered 200 |
| EL-REG-201 | `/admin/members` | ur | link | کارپوریٹ (5) | reg.show | 1 | 90x44 | PASS | target answered 200 |
| EL-REG-202 | `/admin/members` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-203 | `/admin/members` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-REG-204 | `/admin/members` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-REG-205 | `/admin/members` | ur | submit | تلاش کریں | reg.search | 1 | 98x49 | PASS | exercised by a functional spec |
| EL-MEM-001 | `/admin/mreview` | en | button | Light or dark theme | theme.toggle | 11 | 44x44 | PASS | exercised by a functional spec |
| EL-MEM-002 | `/admin/mreview` | en | button | Sign out | logout | 11 | 116x44 | PASS | exercised by a functional spec |
| EL-MEM-003 | `/admin/mreview` | en | link | Accounts | /admin/finance | 11 | 238x44 | PASS | target answered 200 |
| EL-MEM-004 | `/admin/mreview` | en | link | Application Review | /admin/mreview | 11 | 195x46 | PASS | target answered 200 |
| EL-MEM-005 | `/admin/mreview` | en | link | Ask MCCI AI | /admin/help | 11 | 238x44 | PASS | target answered 200 |
| EL-MEM-006 | `/admin/mreview` | en | link | Business Directory | /admin/business-directory | 11 | 238x44 | PASS | target answered 200 |
| EL-MEM-007 | `/admin/mreview` | en | link | Certificates | /admin/temp | 11 | 238x44 | PASS | target answered 200 |
| EL-MEM-008 | `/admin/mreview` | en | link | Committee Desk | /admin/committee | 11 | 177x46 | PASS | target answered 200 |
| EL-MEM-009 | `/admin/mreview` | en | link | Complaint Desk | /admin/complaints | 11 | 238x44 | PASS | target answered 200 |
| EL-MEM-010 | `/admin/mreview` | en | link | Content & Messaging | /admin/content | 11 | 238x44 | PASS | target answered 200 |
| EL-MEM-011 | `/admin/mreview` | en | link | Documents & QR | /admin/documents | 11 | 238x44 | PASS | target answered 200 |
| EL-MEM-012 | `/admin/mreview` | en | link | Events & Meetings | /admin/events | 11 | 238x44 | PASS | target answered 200 |
| EL-MEM-013 | `/admin/mreview` | en | link | MCCI Admin Secretariat Panel | /admin | 11 | 238x82 | PASS | target answered 200 |
| EL-MEM-014 | `/admin/mreview` | en | link | Members Register | /admin/members | 11 | 238x44 | PASS | target answered 200 |
| EL-MEM-015 | `/admin/mreview` | en | link | Membership Pipeline | /admin/requests | 11 | 238x44 | PASS | target answered 200 |
| EL-MEM-016 | `/admin/mreview` | en | link | Membership Pipeline | nav | 11 | 183x44 | PASS | target answered 200 |
| EL-MEM-017 | `/admin/mreview` | en | link | Payments | /admin/payments | 11 | 238x44 | PASS | target answered 200 |
| EL-MEM-018 | `/admin/mreview` | en | link | Reports & AI | /admin/reports | 11 | 238x44 | PASS | target answered 200 |
| EL-MEM-019 | `/admin/mreview` | en | link | Service Requests | /admin/applications | 11 | 238x44 | PASS | target answered 200 |
| EL-MEM-020 | `/admin/mreview` | en | link | Services & Integrations | /admin/services | 11 | 238x44 | PASS | target answered 200 |
| EL-MEM-021 | `/admin/mreview` | en | link | Settings | /admin/settings | 11 | 238x44 | PASS | target answered 200 |
| EL-MEM-022 | `/admin/mreview` | en | link | Skip to content | #main | 11 | 144x47 | PASS | in-page anchor |
| EL-MEM-023 | `/admin/mreview` | en | link | Staff & Audit | /admin/staff | 11 | 238x44 | PASS | target answered 200 |
| EL-MEM-024 | `/admin/mreview` | en | link | WhatsApp | /admin/whatsapp | 11 | 238x44 | PASS | target answered 200 |
| EL-MEM-025 | `/admin/mreview` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-MEM-026 | `/admin/mreview` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-MEM-027 | `/admin/mreview` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-MEM-028 | `/admin/mreview` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-MEM-029 | `/admin/mreview` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-MEM-030 | `/admin/mreview` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-MEM-031 | `/admin/mreview` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-MEM-032 | `/admin/mreview` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-MEM-033 | `/admin/mreview` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-MEM-034 | `/admin/mreview` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-MEM-035 | `/admin/mreview` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-MEM-036 | `/admin/mreview` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-MEM-037 | `/admin/mreview` | ur | link | درخواست کا جائزہ | /ur/admin/mreview | 1 | 121x52 | PASS | target answered 200 |
| EL-MEM-038 | `/admin/mreview` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-MEM-039 | `/admin/mreview` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-MEM-040 | `/admin/mreview` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-MEM-041 | `/admin/mreview` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-MEM-042 | `/admin/mreview` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-MEM-043 | `/admin/mreview` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-MEM-044 | `/admin/mreview` | ur | link | کمیٹی ڈیسک | /ur/admin/committee | 1 | 97x52 | PASS | target answered 200 |
| EL-MEM-045 | `/admin/mreview` | ur | link | ممبرشپ پائپ لائن | nav | 1 | 103x47 | PASS | target answered 200 |
| EL-MEM-046 | `/admin/mreview` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-MEM-047 | `/admin/mreview` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-MEM-048 | `/admin/mreview` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-CMS-067 | `/admin/notify` | en | button | Light or dark theme | theme.toggle | 8 | 44x44 | PASS | exercised by a functional spec |
| EL-CMS-068 | `/admin/notify` | en | button | Send a test of “Event registration” to your email | tpl.test | 4 | 110x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-CMS-069 | `/admin/notify` | en | button | Send a test of “Payment receipt received” to your email | tpl.test | 4 | 110x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-CMS-070 | `/admin/notify` | en | button | Send a test of “Payment verified” to your email | tpl.test | 4 | 110x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-CMS-071 | `/admin/notify` | en | button | Send a test of “Receipt not accepted” to your email | tpl.test | 4 | 110x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-CMS-072 | `/admin/notify` | en | button | Send a test of “Reply to a ticket” to your email | tpl.test | 4 | 110x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-CMS-073 | `/admin/notify` | en | button | Send a test of “Service letter issued” to your email | tpl.test | 4 | 110x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-CMS-074 | `/admin/notify` | en | button | Send a test of “Service request not approved” to your email | tpl.test | 4 | 110x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-CMS-075 | `/admin/notify` | en | button | Send a test of “Service request received” to your email | tpl.test | 4 | 110x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-CMS-076 | `/admin/notify` | en | button | Send a test of “Service request returned” to your email | tpl.test | 4 | 110x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-CMS-077 | `/admin/notify` | en | button | Send a test of “Temporary membership extended” to your email | tpl.test | 4 | 110x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-CMS-078 | `/admin/notify` | en | button | Send a test of “Temporary membership issued” to your email | tpl.test | 4 | 110x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-CMS-079 | `/admin/notify` | en | button | Send a test of “Ticket resolved” to your email | tpl.test | 4 | 110x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-CMS-080 | `/admin/notify` | en | button | Sign out | logout | 8 | 116x44 | PASS | exercised by a functional spec |
| EL-CMS-081 | `/admin/notify` | en | link | Accounts | /admin/finance | 8 | 238x44 | PASS | target answered 200 |
| EL-CMS-082 | `/admin/notify` | en | link | Ask MCCI AI | /admin/help | 8 | 238x44 | PASS | target answered 200 |
| EL-CMS-083 | `/admin/notify` | en | link | Business Directory | /admin/business-directory | 8 | 238x44 | PASS | target answered 200 |
| EL-CMS-084 | `/admin/notify` | en | link | Certificates | /admin/temp | 8 | 238x44 | PASS | target answered 200 |
| EL-CMS-085 | `/admin/notify` | en | link | Complaint Desk | /admin/complaints | 8 | 238x44 | PASS | target answered 200 |
| EL-CMS-086 | `/admin/notify` | en | link | Content & Messaging | /admin/content | 8 | 238x44 | PASS | target answered 200 |
| EL-CMS-087 | `/admin/notify` | en | link | Documents & QR | /admin/documents | 8 | 238x44 | PASS | target answered 200 |
| EL-CMS-088 | `/admin/notify` | en | link | Events & Meetings | /admin/events | 8 | 238x44 | PASS | target answered 200 |
| EL-CMS-089 | `/admin/notify` | en | link | MCCI Admin Secretariat Panel | /admin | 8 | 238x82 | PASS | target answered 200 |
| EL-CMS-090 | `/admin/notify` | en | link | Members Register | /admin/members | 8 | 238x44 | PASS | target answered 200 |
| EL-CMS-091 | `/admin/notify` | en | link | Membership Pipeline | /admin/requests | 8 | 238x44 | PASS | target answered 200 |
| EL-CMS-092 | `/admin/notify` | en | link | Notification Center | /admin/notify | 8 | 193x46 | PASS | target answered 200 |
| EL-CMS-093 | `/admin/notify` | en | link | Payments | /admin/payments | 8 | 238x44 | PASS | target answered 200 |
| EL-CMS-094 | `/admin/notify` | en | link | Reports & AI | /admin/reports | 8 | 238x44 | PASS | target answered 200 |
| EL-CMS-095 | `/admin/notify` | en | link | Service Requests | /admin/applications | 8 | 238x44 | PASS | target answered 200 |
| EL-CMS-096 | `/admin/notify` | en | link | Services & Integrations | /admin/services | 8 | 238x44 | PASS | target answered 200 |
| EL-CMS-097 | `/admin/notify` | en | link | Settings | /admin/settings | 8 | 238x44 | PASS | target answered 200 |
| EL-CMS-098 | `/admin/notify` | en | link | Skip to content | #main | 8 | 144x47 | PASS | in-page anchor |
| EL-CMS-099 | `/admin/notify` | en | link | Staff & Audit | /admin/staff | 8 | 238x44 | PASS | target answered 200 |
| EL-CMS-100 | `/admin/notify` | en | link | WhatsApp | /admin/whatsapp | 8 | 238x44 | PASS | target answered 200 |
| EL-CMS-101 | `/admin/notify` | ur | button | ”ادائیگی کی تصدیق“ کا ٹیسٹ اپنی ای میل پر بھیجیں | tpl.test | 1 | 92x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-CMS-102 | `/admin/notify` | ur | button | ”ادائیگی کی رسید موصول“ کا ٹیسٹ اپنی ای میل پر بھیجیں | tpl.test | 1 | 92x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-CMS-103 | `/admin/notify` | ur | button | ”تقریب کی رجسٹریشن“ کا ٹیسٹ اپنی ای میل پر بھیجیں | tpl.test | 1 | 92x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-CMS-104 | `/admin/notify` | ur | button | ”ٹکٹ حل“ کا ٹیسٹ اپنی ای میل پر بھیجیں | tpl.test | 1 | 92x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-CMS-105 | `/admin/notify` | ur | button | ”ٹکٹ کا جواب“ کا ٹیسٹ اپنی ای میل پر بھیجیں | tpl.test | 1 | 92x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-CMS-106 | `/admin/notify` | ur | button | ”رسید قبول نہیں“ کا ٹیسٹ اپنی ای میل پر بھیجیں | tpl.test | 1 | 92x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-CMS-107 | `/admin/notify` | ur | button | ”سروس خط جاری“ کا ٹیسٹ اپنی ای میل پر بھیجیں | tpl.test | 1 | 92x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-CMS-108 | `/admin/notify` | ur | button | ”سروس درخواست منظور نہیں“ کا ٹیسٹ اپنی ای میل پر بھیجیں | tpl.test | 1 | 92x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-CMS-109 | `/admin/notify` | ur | button | ”سروس درخواست موصول“ کا ٹیسٹ اپنی ای میل پر بھیجیں | tpl.test | 1 | 92x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-CMS-110 | `/admin/notify` | ur | button | ”سروس درخواست واپس“ کا ٹیسٹ اپنی ای میل پر بھیجیں | tpl.test | 1 | 92x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-CMS-111 | `/admin/notify` | ur | button | ”عارضی رکنیت جاری“ کا ٹیسٹ اپنی ای میل پر بھیجیں | tpl.test | 1 | 92x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-CMS-112 | `/admin/notify` | ur | button | ”عارضی رکنیت میں توسیع“ کا ٹیسٹ اپنی ای میل پر بھیجیں | tpl.test | 1 | 92x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-CMS-113 | `/admin/notify` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-CMS-114 | `/admin/notify` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-CMS-115 | `/admin/notify` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-CMS-116 | `/admin/notify` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-CMS-117 | `/admin/notify` | ur | link | اطلاعات مرکز | /ur/admin/notify | 1 | 108x52 | PASS | target answered 200 |
| EL-CMS-118 | `/admin/notify` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-CMS-119 | `/admin/notify` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-CMS-120 | `/admin/notify` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-CMS-121 | `/admin/notify` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-CMS-122 | `/admin/notify` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-CMS-123 | `/admin/notify` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-CMS-124 | `/admin/notify` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-CMS-125 | `/admin/notify` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-CMS-126 | `/admin/notify` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-CMS-127 | `/admin/notify` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-CMS-128 | `/admin/notify` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-CMS-129 | `/admin/notify` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-CMS-130 | `/admin/notify` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-CMS-131 | `/admin/notify` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-CMS-132 | `/admin/notify` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-CMS-133 | `/admin/notify` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-CMS-134 | `/admin/notify` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-071 | `/admin/payments` | en | button | Enter the bank account | settings.save | 1 | 172x44 | PASS | exercised by a functional spec |
| EL-FIN-072 | `/admin/payments` | en | button | Light or dark theme | theme.toggle | 7 | 44x44 | PASS | exercised by a functional spec |
| EL-FIN-073 | `/admin/payments` | en | button | Sign out | logout | 7 | 116x44 | PASS | exercised by a functional spec |
| EL-FIN-074 | `/admin/payments` | en | link | Accounts | /admin/finance | 7 | 238x44 | PASS | target answered 200 |
| EL-FIN-075 | `/admin/payments` | en | link | Admission · Rs. 0 | pay.category | 7 | 149x44 | PASS | target answered 200 |
| EL-FIN-076 | `/admin/payments` | en | link | All members | pay.class | 7 | 118x44 | PASS | target answered 200 |
| EL-FIN-077 | `/admin/payments` | en | link | All payments | pay.category | 7 | 122x44 | PASS | target answered 200 |
| EL-FIN-078 | `/admin/payments` | en | link | Ask MCCI AI | /admin/help | 7 | 238x44 | PASS | target answered 200 |
| EL-FIN-079 | `/admin/payments` | en | link | Associate | pay.class | 7 | 102x44 | PASS | target answered 200 |
| EL-FIN-080 | `/admin/payments` | en | link | Business Directory | /admin/business-directory | 7 | 238x44 | PASS | target answered 200 |
| EL-FIN-081 | `/admin/payments` | en | link | Certificates | /admin/temp | 7 | 238x44 | PASS | target answered 200 |
| EL-FIN-082 | `/admin/payments` | en | link | Complaint Desk | /admin/complaints | 7 | 238x44 | PASS | target answered 200 |
| EL-FIN-083 | `/admin/payments` | en | link | Content & Messaging | /admin/content | 7 | 238x44 | PASS | target answered 200 |
| EL-FIN-084 | `/admin/payments` | en | link | Corporate | pay.class | 7 | 105x44 | PASS | target answered 200 |
| EL-FIN-085 | `/admin/payments` | en | link | Documents & QR | /admin/documents | 7 | 238x44 | PASS | target answered 200 |
| EL-FIN-086 | `/admin/payments` | en | link | Events & Meetings | /admin/events | 7 | 238x44 | PASS | target answered 200 |
| EL-FIN-087 | `/admin/payments` | en | link | Extra cards · Rs. 0 | pay.category | 7 | 155x44 | PASS | target answered 200 |
| EL-FIN-088 | `/admin/payments` | en | link | MCCI Admin Secretariat Panel | /admin | 7 | 238x82 | PASS | target answered 200 |
| EL-FIN-089 | `/admin/payments` | en | link | Members Register | /admin/members | 7 | 238x44 | PASS | target answered 200 |
| EL-FIN-090 | `/admin/payments` | en | link | Membership Pipeline | /admin/requests | 7 | 238x44 | PASS | target answered 200 |
| EL-FIN-091 | `/admin/payments` | en | link | Payments | /admin/payments | 7 | 238x44 | PASS | target answered 200 |
| EL-FIN-092 | `/admin/payments` | en | link | Renewal · Rs. 0 | pay.category | 7 | 136x44 | PASS | target answered 200 |
| EL-FIN-093 | `/admin/payments` | en | link | Reports & AI | /admin/reports | 7 | 238x44 | PASS | target answered 200 |
| EL-FIN-094 | `/admin/payments` | en | link | Restoration · Rs. 0 | pay.category | 7 | 158x44 | PASS | target answered 200 |
| EL-FIN-095 | `/admin/payments` | en | link | Service Requests | /admin/applications | 7 | 238x44 | PASS | target answered 200 |
| EL-FIN-096 | `/admin/payments` | en | link | Services · Rs. 2,000 | pay.category | 7 | 170x44 | PASS | target answered 200 |
| EL-FIN-097 | `/admin/payments` | en | link | Services & Integrations | /admin/services | 7 | 238x44 | PASS | target answered 200 |
| EL-FIN-098 | `/admin/payments` | en | link | Settings | /admin/settings | 7 | 238x44 | PASS | target answered 200 |
| EL-FIN-099 | `/admin/payments` | en | link | Skip to content | #main | 7 | 144x47 | PASS | in-page anchor |
| EL-FIN-100 | `/admin/payments` | en | link | Staff & Audit | /admin/staff | 7 | 238x44 | PASS | target answered 200 |
| EL-FIN-101 | `/admin/payments` | en | link | Vouchers & receipts | nav | 7 | 203x44 | PASS | target answered 200 |
| EL-FIN-102 | `/admin/payments` | en | link | Vouchers & Receipts | /admin/psid | 7 | 205x46 | PASS | target answered 200 |
| EL-FIN-103 | `/admin/payments` | en | link | WhatsApp | /admin/whatsapp | 7 | 238x44 | PASS | target answered 200 |
| EL-FIN-104 | `/admin/payments` | ur | button | بینک اکاؤنٹ درج کریں | settings.save | 1 | 104x44 | PASS | exercised by a functional spec |
| EL-FIN-105 | `/admin/payments` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-FIN-106 | `/admin/payments` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-FIN-107 | `/admin/payments` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-108 | `/admin/payments` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-109 | `/admin/payments` | ur | link | اضافی کارڈ · Rs. 0 | pay.category | 1 | 114x44 | PASS | target answered 200 |
| EL-FIN-110 | `/admin/payments` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-111 | `/admin/payments` | ur | link | ایسوسی ایٹ | pay.class | 1 | 76x44 | PASS | target answered 200 |
| EL-FIN-112 | `/admin/payments` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-FIN-113 | `/admin/payments` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-114 | `/admin/payments` | ur | link | بحالی · Rs. 0 | pay.category | 1 | 94x44 | PASS | target answered 200 |
| EL-FIN-115 | `/admin/payments` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-116 | `/admin/payments` | ur | link | تجدید · Rs. 0 | pay.category | 1 | 98x44 | PASS | target answered 200 |
| EL-FIN-117 | `/admin/payments` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-118 | `/admin/payments` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-119 | `/admin/payments` | ur | link | تمام ادائیگیاں | pay.category | 1 | 81x44 | PASS | target answered 200 |
| EL-FIN-120 | `/admin/payments` | ur | link | تمام ممبران | pay.class | 1 | 75x44 | PASS | target answered 200 |
| EL-FIN-121 | `/admin/payments` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-122 | `/admin/payments` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-123 | `/admin/payments` | ur | link | داخلہ · Rs. 0 | pay.category | 1 | 97x44 | PASS | target answered 200 |
| EL-FIN-124 | `/admin/payments` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-125 | `/admin/payments` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-126 | `/admin/payments` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-127 | `/admin/payments` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-128 | `/admin/payments` | ur | link | سروسز · Rs. 2,000 | pay.category | 1 | 135x44 | PASS | target answered 200 |
| EL-FIN-129 | `/admin/payments` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-130 | `/admin/payments` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-131 | `/admin/payments` | ur | link | کارپوریٹ | pay.class | 1 | 68x44 | PASS | target answered 200 |
| EL-FIN-132 | `/admin/payments` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-133 | `/admin/payments` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-FIN-134 | `/admin/payments` | ur | link | واؤچر اور رسیدیں | /ur/admin/psid | 1 | 119x52 | PASS | target answered 200 |
| EL-FIN-135 | `/admin/payments` | ur | link | واؤچر اور رسیدیں | nav | 1 | 121x49 | PASS | target answered 200 |
| EL-FIN-136 | `/admin/payments` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-137 | `/admin/psid` | en | button | Cancel voucher | psid.cancel | 2 | 124x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-FIN-138 | `/admin/psid` | en | button | Light or dark theme | theme.toggle | 7 | 44x44 | PASS | exercised by a functional spec |
| EL-FIN-139 | `/admin/psid` | en | button | Paid at counter | psid.markpaid | 2 | 121x44 | PASS | exercised by a functional spec |
| EL-FIN-140 | `/admin/psid` | en | button | Sign out | logout | 7 | 116x44 | PASS | exercised by a functional spec |
| EL-FIN-141 | `/admin/psid` | en | link | Accounts | /admin/finance | 7 | 238x44 | PASS | target answered 200 |
| EL-FIN-142 | `/admin/psid` | en | link | Ask MCCI AI | /admin/help | 7 | 238x44 | PASS | target answered 200 |
| EL-FIN-143 | `/admin/psid` | en | link | Business Directory | /admin/business-directory | 7 | 238x44 | PASS | target answered 200 |
| EL-FIN-144 | `/admin/psid` | en | link | Certificates | /admin/temp | 7 | 238x44 | PASS | target answered 200 |
| EL-FIN-145 | `/admin/psid` | en | link | Complaint Desk | /admin/complaints | 7 | 238x44 | PASS | target answered 200 |
| EL-FIN-146 | `/admin/psid` | en | link | Content & Messaging | /admin/content | 7 | 238x44 | PASS | target answered 200 |
| EL-FIN-147 | `/admin/psid` | en | link | Documents & QR | /admin/documents | 7 | 238x44 | PASS | target answered 200 |
| EL-FIN-148 | `/admin/psid` | en | link | Events & Meetings | /admin/events | 7 | 238x44 | PASS | target answered 200 |
| EL-FIN-149 | `/admin/psid` | en | link | MCCI Admin Secretariat Panel | /admin | 7 | 238x82 | PASS | target answered 200 |
| EL-FIN-150 | `/admin/psid` | en | link | Members Register | /admin/members | 7 | 238x44 | PASS | target answered 200 |
| EL-FIN-151 | `/admin/psid` | en | link | Membership Pipeline | /admin/requests | 7 | 238x44 | PASS | target answered 200 |
| EL-FIN-152 | `/admin/psid` | en | link | Payments | /admin/payments | 7 | 238x44 | PASS | target answered 200 |
| EL-FIN-153 | `/admin/psid` | en | link | Reports & AI | /admin/reports | 7 | 238x44 | PASS | target answered 200 |
| EL-FIN-154 | `/admin/psid` | en | link | Service Requests | /admin/applications | 7 | 238x44 | PASS | target answered 200 |
| EL-FIN-155 | `/admin/psid` | en | link | Services & Integrations | /admin/services | 7 | 238x44 | PASS | target answered 200 |
| EL-FIN-156 | `/admin/psid` | en | link | Settings | /admin/settings | 7 | 238x44 | PASS | target answered 200 |
| EL-FIN-157 | `/admin/psid` | en | link | Skip to content | #main | 7 | 144x47 | PASS | in-page anchor |
| EL-FIN-158 | `/admin/psid` | en | link | Staff & Audit | /admin/staff | 7 | 238x44 | PASS | target answered 200 |
| EL-FIN-159 | `/admin/psid` | en | link | Vouchers & Receipts | /admin/psid | 7 | 205x46 | PASS | target answered 200 |
| EL-FIN-160 | `/admin/psid` | en | link | WhatsApp | /admin/whatsapp | 7 | 238x44 | PASS | target answered 200 |
| EL-FIN-161 | `/admin/psid` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-FIN-162 | `/admin/psid` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-FIN-163 | `/admin/psid` | ur | button | کاؤنٹر پر ادا | psid.markpaid | 1 | 63x44 | PASS | exercised by a functional spec |
| EL-FIN-164 | `/admin/psid` | ur | button | واؤچر منسوخ | psid.cancel | 1 | 67x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-FIN-165 | `/admin/psid` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-166 | `/admin/psid` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-167 | `/admin/psid` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-168 | `/admin/psid` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-FIN-169 | `/admin/psid` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-170 | `/admin/psid` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-171 | `/admin/psid` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-172 | `/admin/psid` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-173 | `/admin/psid` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-174 | `/admin/psid` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-175 | `/admin/psid` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-176 | `/admin/psid` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-177 | `/admin/psid` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-178 | `/admin/psid` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-179 | `/admin/psid` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-180 | `/admin/psid` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-181 | `/admin/psid` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-FIN-182 | `/admin/psid` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-FIN-183 | `/admin/psid` | ur | link | واؤچر اور رسیدیں | /ur/admin/psid | 1 | 119x52 | PASS | target answered 200 |
| EL-FIN-184 | `/admin/psid` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-059 | `/admin/queue` | en | button | Light or dark theme | theme.toggle | 12 | 44x44 | PASS | exercised by a functional spec |
| EL-ADMIN-060 | `/admin/queue` | en | button | Sign out | logout | 12 | 116x44 | PASS | exercised by a functional spec |
| EL-ADMIN-061 | `/admin/queue` | en | link | 126a69312128492ca38713295821d5dc · Ask MCCI AI — please help | queue.open | 4 | 315x42 | PASS | target answered 200 |
| EL-ADMIN-062 | `/admin/queue` | en | link | Accounts | /admin/finance | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-063 | `/admin/queue` | en | link | Ask MCCI AI | /admin/help | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-064 | `/admin/queue` | en | link | Business Directory | /admin/business-directory | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-065 | `/admin/queue` | en | link | Certificates | /admin/temp | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-066 | `/admin/queue` | en | link | Complaint Desk | /admin/complaints | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-067 | `/admin/queue` | en | link | Content & Messaging | /admin/content | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-068 | `/admin/queue` | en | link | Documents & QR | /admin/documents | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-069 | `/admin/queue` | en | link | Events & Meetings | /admin/events | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-070 | `/admin/queue` | en | link | MCCI Admin Secretariat Panel | /admin | 12 | 238x82 | PASS | target answered 200 |
| EL-ADMIN-071 | `/admin/queue` | en | link | MCCI-2026-M-0232 · Company A (applicant) | queue.open | 3 | 253x42 | PASS | target answered 200 |
| EL-ADMIN-072 | `/admin/queue` | en | link | Members Register | /admin/members | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-073 | `/admin/queue` | en | link | Membership Pipeline | /admin/requests | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-074 | `/admin/queue` | en | link | Payments | /admin/payments | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-075 | `/admin/queue` | en | link | Reports & AI | /admin/reports | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-076 | `/admin/queue` | en | link | Service Requests | /admin/applications | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-077 | `/admin/queue` | en | link | Services & Integrations | /admin/services | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-078 | `/admin/queue` | en | link | Settings | /admin/settings | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-079 | `/admin/queue` | en | link | Skip to content | #main | 12 | 144x47 | PASS | in-page anchor |
| EL-ADMIN-080 | `/admin/queue` | en | link | Staff & Audit | /admin/staff | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-081 | `/admin/queue` | en | link | WhatsApp | /admin/whatsapp | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-082 | `/admin/queue` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-ADMIN-083 | `/admin/queue` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-ADMIN-084 | `/admin/queue` | ur | link | 126a69312128492ca38713295821d5dc · Ask MCCI AI — please help | queue.open | 1 | 315x48 | PASS | target answered 200 |
| EL-ADMIN-085 | `/admin/queue` | ur | link | MCCI-2026-M-0232 · Company A (applicant) | queue.open | 1 | 253x48 | PASS | target answered 200 |
| EL-ADMIN-086 | `/admin/queue` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-087 | `/admin/queue` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-088 | `/admin/queue` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-089 | `/admin/queue` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-ADMIN-090 | `/admin/queue` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-091 | `/admin/queue` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-092 | `/admin/queue` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-093 | `/admin/queue` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-094 | `/admin/queue` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-095 | `/admin/queue` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-096 | `/admin/queue` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-097 | `/admin/queue` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-098 | `/admin/queue` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-099 | `/admin/queue` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-100 | `/admin/queue` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-101 | `/admin/queue` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-102 | `/admin/queue` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-103 | `/admin/queue` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-ADMIN-104 | `/admin/queue` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-REP-073 | `/admin/reports` | en | button | Light or dark theme | theme.toggle | 8 | 44x44 | PASS | exercised by a functional spec |
| EL-REP-074 | `/admin/reports` | en | button | Sign out | logout | 8 | 116x44 | PASS | exercised by a functional spec |
| EL-REP-075 | `/admin/reports` | en | input:date | Election schedule announced on |  | 5 | 204x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-REP-076 | `/admin/reports` | en | input:date | From |  | 8 | 133x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-REP-077 | `/admin/reports` | en | input:date | To |  | 8 | 133x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-REP-078 | `/admin/reports` | en | link | Accounts | /admin/finance | 8 | 238x44 | PASS | target answered 200 |
| EL-REP-079 | `/admin/reports` | en | link | Accounts | rep.pillar | 8 | 99x44 | PASS | target answered 200 |
| EL-REP-080 | `/admin/reports` | en | link | AI Insights | /admin/ai | 8 | 129x46 | PASS | target answered 200 |
| EL-REP-081 | `/admin/reports` | en | link | All classes | voter.class | 5 | 104x44 | PASS | target answered 200 |
| EL-REP-082 | `/admin/reports` | en | link | Ask MCCI AI | /admin/help | 8 | 238x44 | PASS | target answered 200 |
| EL-REP-083 | `/admin/reports` | en | link | Associate | voter.class | 5 | 102x44 | PASS | target answered 200 |
| EL-REP-084 | `/admin/reports` | en | link | Business Directory | /admin/business-directory | 8 | 238x44 | PASS | target answered 200 |
| EL-REP-085 | `/admin/reports` | en | link | Certificates | /admin/temp | 8 | 238x44 | PASS | target answered 200 |
| EL-REP-086 | `/admin/reports` | en | link | Complaint Desk | /admin/complaints | 8 | 238x44 | PASS | target answered 200 |
| EL-REP-087 | `/admin/reports` | en | link | Content & Messaging | /admin/content | 8 | 238x44 | PASS | target answered 200 |
| EL-REP-088 | `/admin/reports` | en | link | Corporate | voter.class | 5 | 105x44 | PASS | target answered 200 |
| EL-REP-089 | `/admin/reports` | en | link | Documents & QR | /admin/documents | 8 | 238x44 | PASS | target answered 200 |
| EL-REP-090 | `/admin/reports` | en | link | Download CSV | rep.csv | 8 | 166x44 | PARTIAL | download or sign-out link, not requested |
| EL-REP-091 | `/admin/reports` | en | link | Download the list | voter.export | 2 | 166x44 | PARTIAL | download or sign-out link, not requested |
| EL-REP-092 | `/admin/reports` | en | link | Eligible | voter.result | 5 | 84x44 | PASS | target answered 200 |
| EL-REP-093 | `/admin/reports` | en | link | Events & Meetings | /admin/events | 8 | 238x44 | PASS | target answered 200 |
| EL-REP-094 | `/admin/reports` | en | link | Everyone | voter.result | 5 | 98x44 | PASS | target answered 200 |
| EL-REP-095 | `/admin/reports` | en | link | MCCI Admin Secretariat Panel | /admin | 8 | 238x82 | PASS | target answered 200 |
| EL-REP-096 | `/admin/reports` | en | link | MCCI-C-9001 | member.open | 5 | 108x44 | PASS | target answered 200 |
| EL-REP-097 | `/admin/reports` | en | link | MCCI-C-9002 | member.open | 5 | 111x44 | PASS | target answered 200 |
| EL-REP-098 | `/admin/reports` | en | link | MCCI-C-918470 | member.open | 5 | 125x44 | PASS | target answered 200 |
| EL-REP-099 | `/admin/reports` | en | link | MCCI-C-946465 | member.open | 5 | 128x44 | PASS | target answered 200 |
| EL-REP-100 | `/admin/reports` | en | link | MCCI-C-975169 | member.open | 5 | 122x44 | PASS | target answered 200 |
| EL-REP-101 | `/admin/reports` | en | link | Members Register | /admin/members | 8 | 238x44 | PASS | target answered 200 |
| EL-REP-102 | `/admin/reports` | en | link | Membership | rep.pillar | 8 | 120x44 | PASS | target answered 200 |
| EL-REP-103 | `/admin/reports` | en | link | Membership Pipeline | /admin/requests | 8 | 238x44 | PASS | target answered 200 |
| EL-REP-104 | `/admin/reports` | en | link | Not eligible | voter.result | 5 | 111x44 | PASS | target answered 200 |
| EL-REP-105 | `/admin/reports` | en | link | Payments | /admin/payments | 8 | 238x44 | PASS | target answered 200 |
| EL-REP-106 | `/admin/reports` | en | link | Reports & AI | /admin/reports | 8 | 238x44 | PASS | target answered 200 |
| EL-REP-107 | `/admin/reports` | en | link | Service Requests | /admin/applications | 8 | 238x44 | PASS | target answered 200 |
| EL-REP-108 | `/admin/reports` | en | link | Services | rep.pillar | 8 | 93x44 | PASS | target answered 200 |
| EL-REP-109 | `/admin/reports` | en | link | Services & Integrations | /admin/services | 8 | 238x44 | PASS | target answered 200 |
| EL-REP-110 | `/admin/reports` | en | link | Settings | /admin/settings | 8 | 238x44 | PASS | target answered 200 |
| EL-REP-111 | `/admin/reports` | en | link | Skip to content | #main | 8 | 144x47 | PASS | in-page anchor |
| EL-REP-112 | `/admin/reports` | en | link | Staff & Audit | /admin/staff | 8 | 238x44 | PASS | target answered 200 |
| EL-REP-113 | `/admin/reports` | en | link | WhatsApp | /admin/whatsapp | 8 | 238x44 | PASS | target answered 200 |
| EL-REP-114 | `/admin/reports` | en | submit | Make the list | voter.apply | 5 | 123x44 | PASS | exercised by a functional spec |
| EL-REP-115 | `/admin/reports` | en | submit | Show | rep.apply | 8 | 73x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-REP-116 | `/admin/reports` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-REP-117 | `/admin/reports` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-REP-118 | `/admin/reports` | ur | input:date | انتخابی شیڈول کے اعلان کی تاریخ |  | 1 | 147x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-REP-119 | `/admin/reports` | ur | input:date | تک |  | 1 | 133x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-REP-120 | `/admin/reports` | ur | input:date | سے |  | 1 | 133x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-REP-121 | `/admin/reports` | ur | link | MCCI-C-9001 | member.open | 1 | 108x44 | PASS | target answered 200 |
| EL-REP-122 | `/admin/reports` | ur | link | MCCI-C-9002 | member.open | 1 | 111x44 | PASS | target answered 200 |
| EL-REP-123 | `/admin/reports` | ur | link | MCCI-C-918470 | member.open | 1 | 125x44 | PASS | target answered 200 |
| EL-REP-124 | `/admin/reports` | ur | link | MCCI-C-946465 | member.open | 1 | 128x44 | PASS | target answered 200 |
| EL-REP-125 | `/admin/reports` | ur | link | MCCI-C-975169 | member.open | 1 | 122x44 | PASS | target answered 200 |
| EL-REP-126 | `/admin/reports` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-REP-127 | `/admin/reports` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-REP-128 | `/admin/reports` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-REP-129 | `/admin/reports` | ur | link | اکاؤنٹس | rep.pillar | 1 | 62x44 | PASS | target answered 200 |
| EL-REP-130 | `/admin/reports` | ur | link | اہل | voter.result | 1 | 47x44 | PASS | target answered 200 |
| EL-REP-131 | `/admin/reports` | ur | link | ایسوسی ایٹ | voter.class | 1 | 76x44 | PASS | target answered 200 |
| EL-REP-132 | `/admin/reports` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-REP-133 | `/admin/reports` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-REP-134 | `/admin/reports` | ur | link | اے آئی جائزہ | /ur/admin/ai | 1 | 109x52 | PASS | target answered 200 |
| EL-REP-135 | `/admin/reports` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-REP-136 | `/admin/reports` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-REP-137 | `/admin/reports` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-REP-138 | `/admin/reports` | ur | link | تمام اقسام | voter.class | 1 | 69x44 | PASS | target answered 200 |
| EL-REP-139 | `/admin/reports` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-REP-140 | `/admin/reports` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-REP-141 | `/admin/reports` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-REP-142 | `/admin/reports` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-REP-143 | `/admin/reports` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-REP-144 | `/admin/reports` | ur | link | سب | voter.result | 1 | 50x44 | PASS | target answered 200 |
| EL-REP-145 | `/admin/reports` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-REP-146 | `/admin/reports` | ur | link | سروسز | rep.pillar | 1 | 57x44 | PASS | target answered 200 |
| EL-REP-147 | `/admin/reports` | ur | link | سی ایس وی ڈاؤن لوڈ | rep.csv | 1 | 137x49 | PARTIAL | download or sign-out link, not requested |
| EL-REP-148 | `/admin/reports` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-REP-149 | `/admin/reports` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-REP-150 | `/admin/reports` | ur | link | غیر اہل | voter.result | 1 | 61x44 | PASS | target answered 200 |
| EL-REP-151 | `/admin/reports` | ur | link | فہرست ڈاؤن لوڈ کریں | voter.export | 1 | 129x45 | PARTIAL | download or sign-out link, not requested |
| EL-REP-152 | `/admin/reports` | ur | link | کارپوریٹ | voter.class | 1 | 68x44 | PASS | target answered 200 |
| EL-REP-153 | `/admin/reports` | ur | link | ممبرشپ | rep.pillar | 1 | 64x44 | PASS | target answered 200 |
| EL-REP-154 | `/admin/reports` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-REP-155 | `/admin/reports` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-REP-156 | `/admin/reports` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-REP-157 | `/admin/reports` | ur | submit | دکھائیں | rep.apply | 1 | 60x49 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-REP-158 | `/admin/reports` | ur | submit | فہرست بنائیں | voter.apply | 1 | 81x49 | PASS | exercised by a functional spec |
| EL-MEM-049 | `/admin/requests` | en | button | Light or dark theme | theme.toggle | 11 | 44x44 | PASS | exercised by a functional spec |
| EL-MEM-050 | `/admin/requests` | en | button | Sign out | logout | 11 | 116x44 | PASS | exercised by a functional spec |
| EL-MEM-051 | `/admin/requests` | en | input:text | Search applications… |  | 11 | 1080x45 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-MEM-052 | `/admin/requests` | en | link | Accounts | /admin/finance | 11 | 238x44 | PASS | target answered 200 |
| EL-MEM-053 | `/admin/requests` | en | link | Application Review | /admin/mreview | 11 | 195x46 | PASS | target answered 200 |
| EL-MEM-054 | `/admin/requests` | en | link | Ask MCCI AI | /admin/help | 11 | 238x44 | PASS | target answered 200 |
| EL-MEM-055 | `/admin/requests` | en | link | Business Directory | /admin/business-directory | 11 | 238x44 | PASS | target answered 200 |
| EL-MEM-056 | `/admin/requests` | en | link | Certificates | /admin/temp | 11 | 238x44 | PASS | target answered 200 |
| EL-MEM-057 | `/admin/requests` | en | link | Committee desk | nav | 7 | 178x44 | PASS | target answered 200 |
| EL-MEM-058 | `/admin/requests` | en | link | Committee Desk | /admin/committee | 11 | 177x46 | PASS | target answered 200 |
| EL-MEM-059 | `/admin/requests` | en | link | Complaint Desk | /admin/complaints | 11 | 238x44 | PASS | target answered 200 |
| EL-MEM-060 | `/admin/requests` | en | link | Content & Messaging | /admin/content | 11 | 238x44 | PASS | target answered 200 |
| EL-MEM-061 | `/admin/requests` | en | link | Documents & QR | /admin/documents | 11 | 238x44 | PASS | target answered 200 |
| EL-MEM-062 | `/admin/requests` | en | link | Events & Meetings | /admin/events | 11 | 238x44 | PASS | target answered 200 |
| EL-MEM-063 | `/admin/requests` | en | link | MCCI Admin Secretariat Panel | /admin | 11 | 238x82 | PASS | target answered 200 |
| EL-MEM-064 | `/admin/requests` | en | link | MCCI-2026-M-0232 | adm.app.open | 11 | 142x108 | PASS | target answered 200 |
| EL-MEM-065 | `/admin/requests` | en | link | Members Register | /admin/members | 11 | 238x44 | PASS | target answered 200 |
| EL-MEM-066 | `/admin/requests` | en | link | Membership Pipeline | /admin/requests | 11 | 238x44 | PASS | target answered 200 |
| EL-MEM-067 | `/admin/requests` | en | link | Payments | /admin/payments | 11 | 238x44 | PASS | target answered 200 |
| EL-MEM-068 | `/admin/requests` | en | link | Reports & AI | /admin/reports | 11 | 238x44 | PASS | target answered 200 |
| EL-MEM-069 | `/admin/requests` | en | link | Service Requests | /admin/applications | 11 | 238x44 | PASS | target answered 200 |
| EL-MEM-070 | `/admin/requests` | en | link | Services & Integrations | /admin/services | 11 | 238x44 | PASS | target answered 200 |
| EL-MEM-071 | `/admin/requests` | en | link | Settings | /admin/settings | 11 | 238x44 | PASS | target answered 200 |
| EL-MEM-072 | `/admin/requests` | en | link | Skip to content | #main | 11 | 144x47 | PASS | in-page anchor |
| EL-MEM-073 | `/admin/requests` | en | link | Staff & Audit | /admin/staff | 11 | 238x44 | PASS | target answered 200 |
| EL-MEM-074 | `/admin/requests` | en | link | WhatsApp | /admin/whatsapp | 11 | 238x44 | PASS | target answered 200 |
| EL-MEM-075 | `/admin/requests` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-MEM-076 | `/admin/requests` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-MEM-077 | `/admin/requests` | ur | input:text | درخواستیں تلاش کریں… |  | 1 | 1080x51 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-MEM-078 | `/admin/requests` | ur | link | MCCI-2026-M-0232 | adm.app.open | 1 | 142x120 | PASS | target answered 200 |
| EL-MEM-079 | `/admin/requests` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-MEM-080 | `/admin/requests` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-MEM-081 | `/admin/requests` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-MEM-082 | `/admin/requests` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-MEM-083 | `/admin/requests` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-MEM-084 | `/admin/requests` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-MEM-085 | `/admin/requests` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-MEM-086 | `/admin/requests` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-MEM-087 | `/admin/requests` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-MEM-088 | `/admin/requests` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-MEM-089 | `/admin/requests` | ur | link | درخواست کا جائزہ | /ur/admin/mreview | 1 | 121x52 | PASS | target answered 200 |
| EL-MEM-090 | `/admin/requests` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-MEM-091 | `/admin/requests` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-MEM-092 | `/admin/requests` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-MEM-093 | `/admin/requests` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-MEM-094 | `/admin/requests` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-MEM-095 | `/admin/requests` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-MEM-096 | `/admin/requests` | ur | link | کمیٹی ڈیسک | /ur/admin/committee | 1 | 97x52 | PASS | target answered 200 |
| EL-MEM-097 | `/admin/requests` | ur | link | کمیٹی ڈیسک | nav | 1 | 99x49 | PASS | target answered 200 |
| EL-MEM-098 | `/admin/requests` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-MEM-099 | `/admin/requests` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-MEM-100 | `/admin/requests` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-107 | `/admin/review/letter` | en | button | Light or dark theme | theme.toggle | 12 | 44x44 | PASS | exercised by a functional spec |
| EL-SVC-108 | `/admin/review/letter` | en | button | Sign out | logout | 12 | 116x44 | PASS | exercised by a functional spec |
| EL-SVC-109 | `/admin/review/letter` | en | link | Accounts | /admin/finance | 12 | 238x44 | PASS | target answered 200 |
| EL-SVC-110 | `/admin/review/letter` | en | link | Ask MCCI AI | /admin/help | 12 | 238x44 | PASS | target answered 200 |
| EL-SVC-111 | `/admin/review/letter` | en | link | Back | nav | 12 | 69x44 | PASS | target answered 200 |
| EL-SVC-112 | `/admin/review/letter` | en | link | Business Directory | /admin/business-directory | 12 | 238x44 | PASS | target answered 200 |
| EL-SVC-113 | `/admin/review/letter` | en | link | Certificates | /admin/temp | 12 | 238x44 | PASS | target answered 200 |
| EL-SVC-114 | `/admin/review/letter` | en | link | Complaint Desk | /admin/complaints | 12 | 238x44 | PASS | target answered 200 |
| EL-SVC-115 | `/admin/review/letter` | en | link | Content & Messaging | /admin/content | 12 | 238x44 | PASS | target answered 200 |
| EL-SVC-116 | `/admin/review/letter` | en | link | Documents & QR | /admin/documents | 12 | 238x44 | PASS | target answered 200 |
| EL-SVC-117 | `/admin/review/letter` | en | link | Events & Meetings | /admin/events | 12 | 238x44 | PASS | target answered 200 |
| EL-SVC-118 | `/admin/review/letter` | en | link | MCCI Admin Secretariat Panel | /admin | 12 | 238x82 | PASS | target answered 200 |
| EL-SVC-119 | `/admin/review/letter` | en | link | Members Register | /admin/members | 12 | 238x44 | PASS | target answered 200 |
| EL-SVC-120 | `/admin/review/letter` | en | link | Membership Pipeline | /admin/requests | 12 | 238x44 | PASS | target answered 200 |
| EL-SVC-121 | `/admin/review/letter` | en | link | Payments | /admin/payments | 12 | 238x44 | PASS | target answered 200 |
| EL-SVC-122 | `/admin/review/letter` | en | link | Reports & AI | /admin/reports | 12 | 238x44 | PASS | target answered 200 |
| EL-SVC-123 | `/admin/review/letter` | en | link | Service Requests | /admin/applications | 12 | 238x44 | PASS | target answered 200 |
| EL-SVC-124 | `/admin/review/letter` | en | link | Services & Integrations | /admin/services | 12 | 238x44 | PASS | target answered 200 |
| EL-SVC-125 | `/admin/review/letter` | en | link | Settings | /admin/settings | 12 | 238x44 | PASS | target answered 200 |
| EL-SVC-126 | `/admin/review/letter` | en | link | Skip to content | #main | 12 | 144x47 | PASS | in-page anchor |
| EL-SVC-127 | `/admin/review/letter` | en | link | Staff & Audit | /admin/staff | 12 | 238x44 | PASS | target answered 200 |
| EL-SVC-128 | `/admin/review/letter` | en | link | WhatsApp | /admin/whatsapp | 12 | 238x44 | PASS | target answered 200 |
| EL-SVC-129 | `/admin/review/letter` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-SVC-130 | `/admin/review/letter` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-SVC-131 | `/admin/review/letter` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-132 | `/admin/review/letter` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-133 | `/admin/review/letter` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-134 | `/admin/review/letter` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-SVC-135 | `/admin/review/letter` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-136 | `/admin/review/letter` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-137 | `/admin/review/letter` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-138 | `/admin/review/letter` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-139 | `/admin/review/letter` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-140 | `/admin/review/letter` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-141 | `/admin/review/letter` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-142 | `/admin/review/letter` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-143 | `/admin/review/letter` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-144 | `/admin/review/letter` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-145 | `/admin/review/letter` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-146 | `/admin/review/letter` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-147 | `/admin/review/letter` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-148 | `/admin/review/letter` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-SVC-149 | `/admin/review/letter` | ur | link | واپس | nav | 1 | 52x49 | PASS | target answered 200 |
| EL-SVC-150 | `/admin/review/letter` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-151 | `/admin/review` | en | button | Light or dark theme | theme.toggle | 7 | 44x44 | PASS | exercised by a functional spec |
| EL-SVC-152 | `/admin/review` | en | button | Message member | svc.msg | 3 | 186x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SVC-153 | `/admin/review` | en | button | Not approve | svc.reject | 3 | 145x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SVC-154 | `/admin/review` | en | button | Sign out | logout | 7 | 116x44 | PASS | exercised by a functional spec |
| EL-SVC-155 | `/admin/review` | en | link | Accounts | /admin/finance | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-156 | `/admin/review` | en | link | Ask MCCI AI | /admin/help | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-157 | `/admin/review` | en | link | Business Directory | /admin/business-directory | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-158 | `/admin/review` | en | link | Certificates | /admin/temp | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-159 | `/admin/review` | en | link | Complaint Desk | /admin/complaints | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-160 | `/admin/review` | en | link | Content & Messaging | /admin/content | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-161 | `/admin/review` | en | link | Documents & QR | /admin/documents | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-162 | `/admin/review` | en | link | Events & Meetings | /admin/events | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-163 | `/admin/review` | en | link | MCCI Admin Secretariat Panel | /admin | 7 | 238x82 | PASS | target answered 200 |
| EL-SVC-164 | `/admin/review` | en | link | Members Register | /admin/members | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-165 | `/admin/review` | en | link | Membership Pipeline | /admin/requests | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-166 | `/admin/review` | en | link | Payments | /admin/payments | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-167 | `/admin/review` | en | link | Reports & AI | /admin/reports | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-168 | `/admin/review` | en | link | Review Desk | /admin/review | 7 | 147x46 | PASS | target answered 200 |
| EL-SVC-169 | `/admin/review` | en | link | Service Requests | /admin/applications | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-170 | `/admin/review` | en | link | Services & Integrations | /admin/services | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-171 | `/admin/review` | en | link | Settings | /admin/settings | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-172 | `/admin/review` | en | link | Signing | /admin/approvals | 7 | 109x46 | PASS | target answered 200 |
| EL-SVC-173 | `/admin/review` | en | link | Skip to content | #main | 7 | 144x47 | PASS | in-page anchor |
| EL-SVC-174 | `/admin/review` | en | link | SLA Monitor | /admin/sla | 7 | 143x46 | PASS | target answered 200 |
| EL-SVC-175 | `/admin/review` | en | link | Staff & Audit | /admin/staff | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-176 | `/admin/review` | en | link | WhatsApp | /admin/whatsapp | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-177 | `/admin/review` | ur | button | رکن کو پیغام | svc.msg | 1 | 103x49 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SVC-178 | `/admin/review` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-SVC-179 | `/admin/review` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-SVC-180 | `/admin/review` | ur | button | منظور نہ کریں | svc.reject | 1 | 106x49 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SVC-181 | `/admin/review` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-182 | `/admin/review` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-183 | `/admin/review` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-184 | `/admin/review` | ur | link | ایس ایل اے مانیٹر | /ur/admin/sla | 1 | 126x52 | PASS | target answered 200 |
| EL-SVC-185 | `/admin/review` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-SVC-186 | `/admin/review` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-187 | `/admin/review` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-188 | `/admin/review` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-189 | `/admin/review` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-190 | `/admin/review` | ur | link | جائزہ ڈیسک | /ur/admin/review | 1 | 98x52 | PASS | target answered 200 |
| EL-SVC-191 | `/admin/review` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-192 | `/admin/review` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-193 | `/admin/review` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-194 | `/admin/review` | ur | link | دستخط | /ur/admin/approvals | 1 | 74x52 | PASS | target answered 200 |
| EL-SVC-195 | `/admin/review` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-196 | `/admin/review` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-197 | `/admin/review` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-198 | `/admin/review` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-199 | `/admin/review` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-200 | `/admin/review` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-201 | `/admin/review` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-SVC-202 | `/admin/review` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-105 | `/admin/search` | en | button | Light or dark theme | theme.toggle | 12 | 44x44 | PASS | exercised by a functional spec |
| EL-ADMIN-106 | `/admin/search` | en | button | Sign out | logout | 12 | 116x44 | PASS | exercised by a functional spec |
| EL-ADMIN-107 | `/admin/search` | en | input:search | Search for |  | 12 | 961x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ADMIN-108 | `/admin/search` | en | link | Accounts | /admin/finance | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-109 | `/admin/search` | en | link | Ask MCCI AI | /admin/help | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-110 | `/admin/search` | en | link | Business Directory | /admin/business-directory | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-111 | `/admin/search` | en | link | Certificates | /admin/temp | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-112 | `/admin/search` | en | link | Complaint Desk | /admin/complaints | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-113 | `/admin/search` | en | link | Content & Messaging | /admin/content | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-114 | `/admin/search` | en | link | Documents & QR | /admin/documents | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-115 | `/admin/search` | en | link | Events & Meetings | /admin/events | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-116 | `/admin/search` | en | link | MCCI Admin Secretariat Panel | /admin | 12 | 238x82 | PASS | target answered 200 |
| EL-ADMIN-117 | `/admin/search` | en | link | Members Register | /admin/members | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-118 | `/admin/search` | en | link | Membership Pipeline | /admin/requests | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-119 | `/admin/search` | en | link | Payments | /admin/payments | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-120 | `/admin/search` | en | link | Reports & AI | /admin/reports | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-121 | `/admin/search` | en | link | Service Requests | /admin/applications | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-122 | `/admin/search` | en | link | Services & Integrations | /admin/services | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-123 | `/admin/search` | en | link | Settings | /admin/settings | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-124 | `/admin/search` | en | link | Skip to content | #main | 12 | 144x47 | PASS | in-page anchor |
| EL-ADMIN-125 | `/admin/search` | en | link | Staff & Audit | /admin/staff | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-126 | `/admin/search` | en | link | WhatsApp | /admin/whatsapp | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-127 | `/admin/search` | en | submit | Search | search.go | 12 | 107x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ADMIN-128 | `/admin/search` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-ADMIN-129 | `/admin/search` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-ADMIN-130 | `/admin/search` | ur | input:search | تلاش کریں |  | 1 | 991x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ADMIN-131 | `/admin/search` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-132 | `/admin/search` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-133 | `/admin/search` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-134 | `/admin/search` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-ADMIN-135 | `/admin/search` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-136 | `/admin/search` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-137 | `/admin/search` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-138 | `/admin/search` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-139 | `/admin/search` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-140 | `/admin/search` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-141 | `/admin/search` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-142 | `/admin/search` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-143 | `/admin/search` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-144 | `/admin/search` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-145 | `/admin/search` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-146 | `/admin/search` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-147 | `/admin/search` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-148 | `/admin/search` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-ADMIN-149 | `/admin/search` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-150 | `/admin/search` | ur | submit | تلاش | search.go | 1 | 77x49 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-047 | `/admin/services` | en | button | Edit Certificate of Origin | svcset.edit | 8 | 42x44 | PARTIAL | disabled: Changed by platform administrators |
| EL-PLAT-048 | `/admin/services` | en | button | Edit Document Attestation | svcset.edit | 8 | 42x44 | PARTIAL | disabled: Changed by platform administrators |
| EL-PLAT-049 | `/admin/services` | en | button | Edit E-BIL | svcset.edit | 8 | 42x44 | PARTIAL | disabled: Changed by platform administrators |
| EL-PLAT-050 | `/admin/services` | en | button | Edit Free Samples Letter | svcset.edit | 8 | 42x44 | PARTIAL | disabled: Changed by platform administrators |
| EL-PLAT-051 | `/admin/services` | en | button | Edit Recommendatory Letter | svcset.edit | 8 | 42x44 | PARTIAL | disabled: Changed by platform administrators |
| EL-PLAT-052 | `/admin/services` | en | button | Edit Visa Guarantee (China) | svcset.edit | 8 | 42x44 | PARTIAL | disabled: Changed by platform administrators |
| EL-PLAT-053 | `/admin/services` | en | button | Edit Visa Recommendation | svcset.edit | 8 | 42x44 | PARTIAL | disabled: Changed by platform administrators |
| EL-PLAT-054 | `/admin/services` | en | button | Light or dark theme | theme.toggle | 8 | 44x44 | PASS | exercised by a functional spec |
| EL-PLAT-055 | `/admin/services` | en | button | Sign out | logout | 8 | 116x44 | PASS | exercised by a functional spec |
| EL-PLAT-056 | `/admin/services` | en | link | Accounts | /admin/finance | 8 | 238x44 | PASS | target answered 200 |
| EL-PLAT-057 | `/admin/services` | en | link | Ask MCCI AI | /admin/help | 8 | 238x44 | PASS | target answered 200 |
| EL-PLAT-058 | `/admin/services` | en | link | Business Directory | /admin/business-directory | 8 | 238x44 | PASS | target answered 200 |
| EL-PLAT-059 | `/admin/services` | en | link | Certificates | /admin/temp | 8 | 238x44 | PASS | target answered 200 |
| EL-PLAT-060 | `/admin/services` | en | link | Complaint Desk | /admin/complaints | 8 | 238x44 | PASS | target answered 200 |
| EL-PLAT-061 | `/admin/services` | en | link | Content & Messaging | /admin/content | 8 | 238x44 | PASS | target answered 200 |
| EL-PLAT-062 | `/admin/services` | en | link | Documents & QR | /admin/documents | 8 | 238x44 | PASS | target answered 200 |
| EL-PLAT-063 | `/admin/services` | en | link | Events & Meetings | /admin/events | 8 | 238x44 | PASS | target answered 200 |
| EL-PLAT-064 | `/admin/services` | en | link | Integrations | /admin/integrations | 8 | 143x46 | PASS | target answered 200 |
| EL-PLAT-065 | `/admin/services` | en | link | MCCI Admin Secretariat Panel | /admin | 8 | 238x82 | PASS | target answered 200 |
| EL-PLAT-066 | `/admin/services` | en | link | Members Register | /admin/members | 8 | 238x44 | PASS | target answered 200 |
| EL-PLAT-067 | `/admin/services` | en | link | Membership Pipeline | /admin/requests | 8 | 238x44 | PASS | target answered 200 |
| EL-PLAT-068 | `/admin/services` | en | link | Payments | /admin/payments | 8 | 238x44 | PASS | target answered 200 |
| EL-PLAT-069 | `/admin/services` | en | link | Reports & AI | /admin/reports | 8 | 238x44 | PASS | target answered 200 |
| EL-PLAT-070 | `/admin/services` | en | link | Service Requests | /admin/applications | 8 | 238x44 | PASS | target answered 200 |
| EL-PLAT-071 | `/admin/services` | en | link | Services & Integrations | /admin/services | 8 | 238x44 | PASS | target answered 200 |
| EL-PLAT-072 | `/admin/services` | en | link | Settings | /admin/settings | 8 | 238x44 | PASS | target answered 200 |
| EL-PLAT-073 | `/admin/services` | en | link | Skip to content | #main | 8 | 144x47 | PASS | in-page anchor |
| EL-PLAT-074 | `/admin/services` | en | link | Staff & Audit | /admin/staff | 8 | 238x44 | PASS | target answered 200 |
| EL-PLAT-075 | `/admin/services` | en | link | WhatsApp | /admin/whatsapp | 8 | 238x44 | PASS | target answered 200 |
| EL-PLAT-076 | `/admin/services` | ur | button | Certificate of Origin میں ترمیم | svcset.edit | 1 | 42x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-077 | `/admin/services` | ur | button | Document Attestation میں ترمیم | svcset.edit | 1 | 42x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-078 | `/admin/services` | ur | button | E-BIL میں ترمیم | svcset.edit | 1 | 42x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-079 | `/admin/services` | ur | button | Free Samples Letter میں ترمیم | svcset.edit | 1 | 42x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-080 | `/admin/services` | ur | button | Recommendatory Letter میں ترمیم | svcset.edit | 1 | 42x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-081 | `/admin/services` | ur | button | Visa Guarantee (China) میں ترمیم | svcset.edit | 1 | 42x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-082 | `/admin/services` | ur | button | Visa Recommendation میں ترمیم | svcset.edit | 1 | 42x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-083 | `/admin/services` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-PLAT-084 | `/admin/services` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-PLAT-085 | `/admin/services` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-086 | `/admin/services` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-087 | `/admin/services` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-088 | `/admin/services` | ur | link | انٹیگریشنز | /ur/admin/integrations | 1 | 88x52 | PASS | target answered 200 |
| EL-PLAT-089 | `/admin/services` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-PLAT-090 | `/admin/services` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-091 | `/admin/services` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-092 | `/admin/services` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-093 | `/admin/services` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-094 | `/admin/services` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-095 | `/admin/services` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-096 | `/admin/services` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-097 | `/admin/services` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-098 | `/admin/services` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-099 | `/admin/services` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-100 | `/admin/services` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-101 | `/admin/services` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-102 | `/admin/services` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-103 | `/admin/services` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-PLAT-104 | `/admin/services` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-105 | `/admin/settings` | en | button | Light or dark theme | theme.toggle | 3 | 44x44 | PASS | exercised by a functional spec |
| EL-PLAT-106 | `/admin/settings` | en | button | Sign out | logout | 3 | 116x44 | PASS | exercised by a functional spec |
| EL-PLAT-107 | `/admin/settings` | en | input:checkbox | A proprietorship must add a company stamp |  | 3 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-108 | `/admin/settings` | en | input:checkbox | Ask for a one-time email code when approvingStronger proof of who approved |  | 3 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-109 | `/admin/settings` | en | input:checkbox | Endorser must be of the same membership classCorporate ↔ Corporate, Associate ↔ Associate |  | 3 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-110 | `/admin/settings` | en | input:checkbox | Re-use the membership number of a declined applicationOff: the number stays reserved and i |  | 3 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-111 | `/admin/settings` | en | input:checkbox | Show members of the same sector firstHelps the applicant find someone who knows the trade |  | 3 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-112 | `/admin/settings` | en | input:email | Email |  | 3 | 250x45 | PASS | exercised by a functional spec |
| EL-PLAT-113 | `/admin/settings` | en | input:number | Associate · Admission |  | 3 | 250x45 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-114 | `/admin/settings` | en | input:number | Associate · Annual subscription |  | 3 | 250x45 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-115 | `/admin/settings` | en | input:number | Associate · Card |  | 3 | 250x45 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-116 | `/admin/settings` | en | input:number | Certificate QR: right edge (share of width) |  | 3 | 250x45 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-117 | `/admin/settings` | en | input:number | Certificate QR: size (share of width)Measured on the sample certificate; applies to scans  |  | 3 | 250x45 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-118 | `/admin/settings` | en | input:number | Certificate QR: top (share of height) |  | 3 | 250x45 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-119 | `/admin/settings` | en | input:number | Certificate scan: confidence below which a field is checked by hand (%)Nothing is ever sav |  | 3 | 250x45 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-120 | `/admin/settings` | en | input:number | Corporate · Admission |  | 3 | 250x45 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-121 | `/admin/settings` | en | input:number | Corporate · Annual subscription |  | 3 | 250x45 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-122 | `/admin/settings` | en | input:number | Corporate · Card |  | 3 | 250x45 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-123 | `/admin/settings` | en | input:number | Days to pay a voucher |  | 3 | 250x45 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-124 | `/admin/settings` | en | input:number | Days to respond |  | 3 | 250x45 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-125 | `/admin/settings` | en | input:number | Endorsements per member per year |  | 3 | 250x45 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-126 | `/admin/settings` | en | input:number | Extra card (partner / director) |  | 3 | 250x45 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-127 | `/admin/settings` | en | input:number | Membership process (working days) |  | 3 | 250x45 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-128 | `/admin/settings` | en | input:number | Reminder on day |  | 3 | 250x45 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-129 | `/admin/settings` | en | input:number | Service reply time (hours) |  | 3 | 250x45 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-130 | `/admin/settings` | en | input:number | Women Entrepreneur · Admission |  | 3 | 250x45 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-131 | `/admin/settings` | en | input:number | Women Entrepreneur · Annual subscription |  | 3 | 250x45 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-132 | `/admin/settings` | en | input:number | Women Entrepreneur · Card |  | 3 | 250x45 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-133 | `/admin/settings` | en | input:text | Address |  | 3 | 511x45 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-134 | `/admin/settings` | en | input:text | Fax |  | 3 | 250x45 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-135 | `/admin/settings` | en | input:text | Name |  | 3 | 511x45 | PASS | exercised by a functional spec |
| EL-PLAT-136 | `/admin/settings` | en | input:text | Reason for the change (for the audit log) |  | 2 | 511x45 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-137 | `/admin/settings` | en | input:text | Telephone |  | 3 | 250x45 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-138 | `/admin/settings` | en | input:text | Website |  | 3 | 250x45 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-139 | `/admin/settings` | en | link | Accounts | /admin/finance | 3 | 238x44 | PASS | target answered 200 |
| EL-PLAT-140 | `/admin/settings` | en | link | Ask MCCI AI | /admin/help | 3 | 238x44 | PASS | target answered 200 |
| EL-PLAT-141 | `/admin/settings` | en | link | Business Directory | /admin/business-directory | 3 | 238x44 | PASS | target answered 200 |
| EL-PLAT-142 | `/admin/settings` | en | link | Certificates | /admin/temp | 3 | 238x44 | PASS | target answered 200 |
| EL-PLAT-143 | `/admin/settings` | en | link | Complaint Desk | /admin/complaints | 3 | 238x44 | PASS | target answered 200 |
| EL-PLAT-144 | `/admin/settings` | en | link | Content & Messaging | /admin/content | 3 | 238x44 | PASS | target answered 200 |
| EL-PLAT-145 | `/admin/settings` | en | link | Documents & QR | /admin/documents | 3 | 238x44 | PASS | target answered 200 |
| EL-PLAT-146 | `/admin/settings` | en | link | Events & Meetings | /admin/events | 3 | 238x44 | PASS | target answered 200 |
| EL-PLAT-147 | `/admin/settings` | en | link | MCCI Admin Secretariat Panel | /admin | 3 | 238x82 | PASS | target answered 200 |
| EL-PLAT-148 | `/admin/settings` | en | link | Members Register | /admin/members | 3 | 238x44 | PASS | target answered 200 |
| EL-PLAT-149 | `/admin/settings` | en | link | Membership Pipeline | /admin/requests | 3 | 238x44 | PASS | target answered 200 |
| EL-PLAT-150 | `/admin/settings` | en | link | Open Payments | nav | 3 | 149x44 | PASS | target answered 200 |
| EL-PLAT-151 | `/admin/settings` | en | link | Payments | /admin/payments | 3 | 238x44 | PASS | target answered 200 |
| EL-PLAT-152 | `/admin/settings` | en | link | Reports & AI | /admin/reports | 3 | 238x44 | PASS | target answered 200 |
| EL-PLAT-153 | `/admin/settings` | en | link | Service Requests | /admin/applications | 3 | 238x44 | PASS | target answered 200 |
| EL-PLAT-154 | `/admin/settings` | en | link | Services & Integrations | /admin/services | 3 | 238x44 | PASS | target answered 200 |
| EL-PLAT-155 | `/admin/settings` | en | link | Settings | /admin/settings | 3 | 238x44 | PASS | target answered 200 |
| EL-PLAT-156 | `/admin/settings` | en | link | Skip to content | #main | 3 | 144x47 | PASS | in-page anchor |
| EL-PLAT-157 | `/admin/settings` | en | link | Staff & Audit | /admin/staff | 3 | 238x44 | PASS | target answered 200 |
| EL-PLAT-158 | `/admin/settings` | en | link | WhatsApp | /admin/whatsapp | 3 | 238x44 | PASS | target answered 200 |
| EL-PLAT-159 | `/admin/settings` | en | submit | Save | settings.save | 2 | 90x44 | PASS | exercised by a functional spec |
| EL-PLAT-160 | `/admin/settings` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-PLAT-161 | `/admin/settings` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-PLAT-162 | `/admin/settings` | ur | input:checkbox | اسی شعبے کے ارکان پہلے دکھائیںدرخواست دہندہ کو کاروبار جاننے والا ڈھونڈنے میں مدد |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-163 | `/admin/settings` | ur | input:checkbox | تائید کنندہ اسی رکنیت کلاس کا ہوکارپوریٹ ↔ کارپوریٹ، ایسوسی ایٹ ↔ ایسوسی ایٹ |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-164 | `/admin/settings` | ur | input:checkbox | مسترد درخواست کا رکنیت نمبر دوبارہ استعمال کریںبند: نمبر محفوظ رہتا ہے اور دوبارہ نہیں دیا |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-165 | `/admin/settings` | ur | input:checkbox | منظوری پر ای میل کوڈ مانگیںمنظوری دینے والے کا مضبوط ثبوت |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-166 | `/admin/settings` | ur | input:checkbox | واحد ملکیت پر کمپنی کی مہر لازمی |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-167 | `/admin/settings` | ur | input:email | ای میل |  | 1 | 250x51 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-168 | `/admin/settings` | ur | input:number | اضافی کارڈ (شراکت دار / ڈائریکٹر) |  | 1 | 250x51 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-169 | `/admin/settings` | ur | input:number | ایسوسی ایٹ · داخلہ |  | 1 | 250x51 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-170 | `/admin/settings` | ur | input:number | ایسوسی ایٹ · سالانہ چندہ |  | 1 | 250x51 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-171 | `/admin/settings` | ur | input:number | ایسوسی ایٹ · کارڈ |  | 1 | 250x51 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-172 | `/admin/settings` | ur | input:number | جواب کے دن |  | 1 | 250x51 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-173 | `/admin/settings` | ur | input:number | خاتون کاروباری · داخلہ |  | 1 | 250x51 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-174 | `/admin/settings` | ur | input:number | خاتون کاروباری · سالانہ چندہ |  | 1 | 250x51 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-175 | `/admin/settings` | ur | input:number | خاتون کاروباری · کارڈ |  | 1 | 250x51 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-176 | `/admin/settings` | ur | input:number | خدمت کا جواب (گھنٹے) |  | 1 | 250x51 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-177 | `/admin/settings` | ur | input:number | رکنیت کی کارروائی (کام کے دن) |  | 1 | 250x51 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-178 | `/admin/settings` | ur | input:number | سرٹیفکیٹ اسکین: اس اعتماد سے کم پر خانہ ہاتھ سے جانچا جائے (%)کسی شخص کی تصدیق کے بغیر کچھ |  | 1 | 250x51 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-179 | `/admin/settings` | ur | input:number | سرٹیفکیٹ کیو آر: اوپر (اونچائی کا حصہ) |  | 1 | 250x51 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-180 | `/admin/settings` | ur | input:number | سرٹیفکیٹ کیو آر: دائیں کنارہ (چوڑائی کا حصہ) |  | 1 | 250x51 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-181 | `/admin/settings` | ur | input:number | سرٹیفکیٹ کیو آر: سائز (چوڑائی کا حصہ)نمونہ سرٹیفکیٹ پر ناپا گیا؛ اب سے مہر لگنے والے اسکین |  | 1 | 250x51 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-182 | `/admin/settings` | ur | input:number | فی رکن سالانہ تائیدیں |  | 1 | 250x51 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-183 | `/admin/settings` | ur | input:number | کارپوریٹ · داخلہ |  | 1 | 250x51 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-184 | `/admin/settings` | ur | input:number | کارپوریٹ · سالانہ چندہ |  | 1 | 250x51 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-185 | `/admin/settings` | ur | input:number | کارپوریٹ · کارڈ |  | 1 | 250x51 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-186 | `/admin/settings` | ur | input:number | واؤچر ادا کرنے کے دن |  | 1 | 250x51 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-187 | `/admin/settings` | ur | input:number | یاد دہانی کا دن |  | 1 | 250x51 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-188 | `/admin/settings` | ur | input:text | پتہ |  | 1 | 511x51 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-189 | `/admin/settings` | ur | input:text | تبدیلی کی وجہ (آڈٹ لاگ کے لیے) |  | 1 | 511x51 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-190 | `/admin/settings` | ur | input:text | ٹیلی فون |  | 1 | 250x51 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-191 | `/admin/settings` | ur | input:text | فیکس |  | 1 | 250x51 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-192 | `/admin/settings` | ur | input:text | نام |  | 1 | 511x51 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-193 | `/admin/settings` | ur | input:text | ویب سائٹ |  | 1 | 250x51 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PLAT-194 | `/admin/settings` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-195 | `/admin/settings` | ur | link | ادائیگیاں کھولیں | nav | 1 | 92x49 | PASS | target answered 200 |
| EL-PLAT-196 | `/admin/settings` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-197 | `/admin/settings` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-198 | `/admin/settings` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-PLAT-199 | `/admin/settings` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-200 | `/admin/settings` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-201 | `/admin/settings` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-202 | `/admin/settings` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-203 | `/admin/settings` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-204 | `/admin/settings` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-205 | `/admin/settings` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-206 | `/admin/settings` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-207 | `/admin/settings` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-208 | `/admin/settings` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-209 | `/admin/settings` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-210 | `/admin/settings` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-211 | `/admin/settings` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-212 | `/admin/settings` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-PLAT-213 | `/admin/settings` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-PLAT-214 | `/admin/settings` | ur | submit | محفوظ کریں | settings.save | 1 | 97x47 | PASS | exercised by a functional spec |
| EL-SVC-203 | `/admin/sla` | en | button | Light or dark theme | theme.toggle | 7 | 44x44 | PASS | exercised by a functional spec |
| EL-SVC-204 | `/admin/sla` | en | button | Sign out | logout | 7 | 116x44 | PASS | exercised by a functional spec |
| EL-SVC-205 | `/admin/sla` | en | button | SLA rules | sla.rules | 7 | 120x44 | PARTIAL | disabled: Changed by platform administrators |
| EL-SVC-206 | `/admin/sla` | en | link | Accounts | /admin/finance | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-207 | `/admin/sla` | en | link | Ask MCCI AI | /admin/help | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-208 | `/admin/sla` | en | link | Business Directory | /admin/business-directory | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-209 | `/admin/sla` | en | link | Certificates | /admin/temp | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-210 | `/admin/sla` | en | link | Complaint Desk | /admin/complaints | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-211 | `/admin/sla` | en | link | Content & Messaging | /admin/content | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-212 | `/admin/sla` | en | link | Documents & QR | /admin/documents | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-213 | `/admin/sla` | en | link | Events & Meetings | /admin/events | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-214 | `/admin/sla` | en | link | MCCI Admin Secretariat Panel | /admin | 7 | 238x82 | PASS | target answered 200 |
| EL-SVC-215 | `/admin/sla` | en | link | MCCI-2026-10483 | svc.open | 7 | 142x44 | PASS | target answered 200 |
| EL-SVC-216 | `/admin/sla` | en | link | Members Register | /admin/members | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-217 | `/admin/sla` | en | link | Membership Pipeline | /admin/requests | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-218 | `/admin/sla` | en | link | Payments | /admin/payments | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-219 | `/admin/sla` | en | link | Reports & AI | /admin/reports | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-220 | `/admin/sla` | en | link | Review Desk | /admin/review | 7 | 147x46 | PASS | target answered 200 |
| EL-SVC-221 | `/admin/sla` | en | link | Service Requests | /admin/applications | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-222 | `/admin/sla` | en | link | Services & Integrations | /admin/services | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-223 | `/admin/sla` | en | link | Settings | /admin/settings | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-224 | `/admin/sla` | en | link | Signing | /admin/approvals | 7 | 109x46 | PASS | target answered 200 |
| EL-SVC-225 | `/admin/sla` | en | link | Skip to content | #main | 7 | 144x47 | PASS | in-page anchor |
| EL-SVC-226 | `/admin/sla` | en | link | SLA Monitor | /admin/sla | 7 | 143x46 | PASS | target answered 200 |
| EL-SVC-227 | `/admin/sla` | en | link | Staff & Audit | /admin/staff | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-228 | `/admin/sla` | en | link | WhatsApp | /admin/whatsapp | 7 | 238x44 | PASS | target answered 200 |
| EL-SVC-229 | `/admin/sla` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-SVC-230 | `/admin/sla` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-SVC-231 | `/admin/sla` | ur | button | وقت کے اصول | sla.rules | 1 | 114x47 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SVC-232 | `/admin/sla` | ur | link | MCCI-2026-10483 | svc.open | 1 | 142x44 | PASS | target answered 200 |
| EL-SVC-233 | `/admin/sla` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-234 | `/admin/sla` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-235 | `/admin/sla` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-236 | `/admin/sla` | ur | link | ایس ایل اے مانیٹر | /ur/admin/sla | 1 | 126x52 | PASS | target answered 200 |
| EL-SVC-237 | `/admin/sla` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-SVC-238 | `/admin/sla` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-239 | `/admin/sla` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-240 | `/admin/sla` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-241 | `/admin/sla` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-242 | `/admin/sla` | ur | link | جائزہ ڈیسک | /ur/admin/review | 1 | 98x52 | PASS | target answered 200 |
| EL-SVC-243 | `/admin/sla` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-244 | `/admin/sla` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-245 | `/admin/sla` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-246 | `/admin/sla` | ur | link | دستخط | /ur/admin/approvals | 1 | 74x52 | PASS | target answered 200 |
| EL-SVC-247 | `/admin/sla` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-248 | `/admin/sla` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-249 | `/admin/sla` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-250 | `/admin/sla` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-251 | `/admin/sla` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-252 | `/admin/sla` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-SVC-253 | `/admin/sla` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-SVC-254 | `/admin/sla` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-STAFF-075 | `/admin/staff` | en | button | Acceptance Staff — Auditor (read-only) | staff.edit | 3 | 252x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-076 | `/admin/staff` | en | button | Acceptance Staff — Committee Secretary | staff.edit | 1 | 252x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-077 | `/admin/staff` | en | button | Acceptance Staff — Deputy Secretary — Membership | staff.edit | 1 | 250x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-078 | `/admin/staff` | en | button | Acceptance Staff — Membership Committee Member | staff.edit | 3 | 252x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-079 | `/admin/staff` | en | button | Accounts Officer | staff.edit | 3 | 116x44 | PASS | exercised by a functional spec |
| EL-STAFF-080 | `/admin/staff` | en | button | Accounts Officer · Accounts: Edit | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-081 | `/admin/staff` | en | button | Accounts Officer · Business directory: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-082 | `/admin/staff` | en | button | Accounts Officer · Certificates: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-083 | `/admin/staff` | en | button | Accounts Officer · Change declarations: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-084 | `/admin/staff` | en | button | Accounts Officer · Committee decisions: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-085 | `/admin/staff` | en | button | Accounts Officer · Dashboard: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-086 | `/admin/staff` | en | button | Accounts Officer · Documents & QR: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-087 | `/admin/staff` | en | button | Accounts Officer · Events, complaints & content: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-088 | `/admin/staff` | en | button | Accounts Officer · Members register: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-089 | `/admin/staff` | en | button | Accounts Officer · Membership applications: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-090 | `/admin/staff` | en | button | Accounts Officer · Outreach & consent: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-091 | `/admin/staff` | en | button | Accounts Officer · Payments & vouchers: Approve | perm.cycle | 3 | 67x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-092 | `/admin/staff` | en | button | Accounts Officer · Reports & AI: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-093 | `/admin/staff` | en | button | Accounts Officer · Service requests & signing: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-094 | `/admin/staff` | en | button | Accounts Officer · Services setup & settings: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-095 | `/admin/staff` | en | button | Accounts Officer · Staff & audit: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-096 | `/admin/staff` | en | button | Accounts Officer · Voter list: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-097 | `/admin/staff` | en | button | Add designation | perm.designation | 1 | 150x44 | PASS | exercised by a functional spec |
| EL-STAFF-098 | `/admin/staff` | en | button | Auditor | staff.edit | 3 | 50x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-099 | `/admin/staff` | en | button | Auditor (read-only) · Accounts: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-100 | `/admin/staff` | en | button | Auditor (read-only) · Business directory: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-101 | `/admin/staff` | en | button | Auditor (read-only) · Certificates: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-102 | `/admin/staff` | en | button | Auditor (read-only) · Change declarations: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-103 | `/admin/staff` | en | button | Auditor (read-only) · Committee decisions: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-104 | `/admin/staff` | en | button | Auditor (read-only) · Dashboard: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-105 | `/admin/staff` | en | button | Auditor (read-only) · Documents & QR: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-106 | `/admin/staff` | en | button | Auditor (read-only) · Events, complaints & content: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-107 | `/admin/staff` | en | button | Auditor (read-only) · Members register: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-108 | `/admin/staff` | en | button | Auditor (read-only) · Membership applications: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-109 | `/admin/staff` | en | button | Auditor (read-only) · Outreach & consent: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-110 | `/admin/staff` | en | button | Auditor (read-only) · Payments & vouchers: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-111 | `/admin/staff` | en | button | Auditor (read-only) · Reports & AI: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-112 | `/admin/staff` | en | button | Auditor (read-only) · Service requests & signing: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-113 | `/admin/staff` | en | button | Auditor (read-only) · Services setup & settings: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-114 | `/admin/staff` | en | button | Auditor (read-only) · Staff & audit: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-115 | `/admin/staff` | en | button | Auditor (read-only) · Voter list: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-116 | `/admin/staff` | en | button | Certificate of Origin | perm.service.pick | 1 | 169x44 | PASS | exercised by a functional spec |
| EL-STAFF-117 | `/admin/staff` | en | button | Committee Secretary | staff.edit | 3 | 146x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-118 | `/admin/staff` | en | button | Committee Secretary · Accounts: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-119 | `/admin/staff` | en | button | Committee Secretary · Business directory: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-120 | `/admin/staff` | en | button | Committee Secretary · Certificates: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-121 | `/admin/staff` | en | button | Committee Secretary · Change declarations: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-122 | `/admin/staff` | en | button | Committee Secretary · Committee decisions: Approve | perm.cycle | 3 | 67x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-123 | `/admin/staff` | en | button | Committee Secretary · Dashboard: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-124 | `/admin/staff` | en | button | Committee Secretary · Documents & QR: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-125 | `/admin/staff` | en | button | Committee Secretary · Events, complaints & content: Edit | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-126 | `/admin/staff` | en | button | Committee Secretary · Members register: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-127 | `/admin/staff` | en | button | Committee Secretary · Membership applications: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-128 | `/admin/staff` | en | button | Committee Secretary · Outreach & consent: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-129 | `/admin/staff` | en | button | Committee Secretary · Payments & vouchers: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-130 | `/admin/staff` | en | button | Committee Secretary · Reports & AI: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-131 | `/admin/staff` | en | button | Committee Secretary · Service requests & signing: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-132 | `/admin/staff` | en | button | Committee Secretary · Services setup & settings: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-133 | `/admin/staff` | en | button | Committee Secretary · Staff & audit: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-134 | `/admin/staff` | en | button | Committee Secretary · Voter list: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-135 | `/admin/staff` | en | button | Demo Accounts Officer | staff.edit | 3 | 159x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-136 | `/admin/staff` | en | button | Demo Committee Convener | staff.edit | 3 | 189x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-137 | `/admin/staff` | en | button | Demo IT Convener | staff.edit | 3 | 123x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-138 | `/admin/staff` | en | button | Demo Membership Officer | staff.edit | 3 | 179x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-139 | `/admin/staff` | en | button | Demo President | staff.edit | 3 | 109x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-140 | `/admin/staff` | en | button | Deputy Secretary — Membership · Accounts: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-141 | `/admin/staff` | en | button | Deputy Secretary — Membership · Business directory: Approve | perm.cycle | 3 | 67x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-142 | `/admin/staff` | en | button | Deputy Secretary — Membership · Certificates: Approve | perm.cycle | 3 | 67x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-143 | `/admin/staff` | en | button | Deputy Secretary — Membership · Change declarations: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-144 | `/admin/staff` | en | button | Deputy Secretary — Membership · Committee decisions: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-145 | `/admin/staff` | en | button | Deputy Secretary — Membership · Dashboard: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-146 | `/admin/staff` | en | button | Deputy Secretary — Membership · Documents & QR: Edit | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-147 | `/admin/staff` | en | button | Deputy Secretary — Membership · Events, complaints & content: Edit | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-148 | `/admin/staff` | en | button | Deputy Secretary — Membership · Members register: Approve | perm.cycle | 3 | 67x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-149 | `/admin/staff` | en | button | Deputy Secretary — Membership · Membership applications: Approve | perm.cycle | 3 | 67x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-150 | `/admin/staff` | en | button | Deputy Secretary — Membership · Outreach & consent: Approve | perm.cycle | 3 | 67x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-151 | `/admin/staff` | en | button | Deputy Secretary — Membership · Payments & vouchers: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-152 | `/admin/staff` | en | button | Deputy Secretary — Membership · Reports & AI: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-153 | `/admin/staff` | en | button | Deputy Secretary — Membership · Service requests & signing: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-154 | `/admin/staff` | en | button | Deputy Secretary — Membership · Services setup & settings: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-155 | `/admin/staff` | en | button | Deputy Secretary — Membership · Staff & audit: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-156 | `/admin/staff` | en | button | Deputy Secretary — Membership · Voter list: Edit | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-157 | `/admin/staff` | en | button | Document Attestation | perm.service.pick | 1 | 186x44 | PASS | exercised by a functional spec |
| EL-STAFF-158 | `/admin/staff` | en | button | E-BIL | perm.service.pick | 1 | 72x44 | PASS | exercised by a functional spec |
| EL-STAFF-159 | `/admin/staff` | en | button | E2E Convener 5a407e56 | staff.edit | 3 | 165x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-160 | `/admin/staff` | en | button | E2E Convener adf6afb6 | staff.edit | 3 | 159x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-161 | `/admin/staff` | en | button | E2E Convener b88952ae | staff.edit | 3 | 165x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-162 | `/admin/staff` | en | button | E2E IT Convener 5a407e56 | staff.edit | 3 | 179x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-163 | `/admin/staff` | en | button | E2E IT Convener adf6afb6 | staff.edit | 3 | 173x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-164 | `/admin/staff` | en | button | E2E IT Convener b88952ae | staff.edit | 3 | 179x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-165 | `/admin/staff` | en | button | E2E Officer 5a407e56 | staff.edit | 3 | 148x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-166 | `/admin/staff` | en | button | E2E Officer adf6afb6 | staff.edit | 3 | 142x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-167 | `/admin/staff` | en | button | E2E Officer b88952ae | staff.edit | 3 | 148x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-168 | `/admin/staff` | en | button | E2E President 5a407e56 | staff.edit | 3 | 164x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-169 | `/admin/staff` | en | button | E2E President adf6afb6 | staff.edit | 3 | 158x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-170 | `/admin/staff` | en | button | E2E President b88952ae | staff.edit | 3 | 164x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-171 | `/admin/staff` | en | button | E2E Secretary 5a407e56 | staff.edit | 3 | 166x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-172 | `/admin/staff` | en | button | E2E Secretary adf6afb6 | staff.edit | 3 | 160x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-173 | `/admin/staff` | en | button | E2E Secretary b88952ae | staff.edit | 3 | 166x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-174 | `/admin/staff` | en | button | Export CSV | staff.export | 3 | 140x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-175 | `/admin/staff` | en | button | Free Samples Letter | perm.service.pick | 1 | 169x44 | PASS | exercised by a functional spec |
| EL-STAFF-176 | `/admin/staff` | en | button | Front Desk / Data Entry · Accounts: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-177 | `/admin/staff` | en | button | Front Desk / Data Entry · Business directory: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-178 | `/admin/staff` | en | button | Front Desk / Data Entry · Certificates: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-179 | `/admin/staff` | en | button | Front Desk / Data Entry · Change declarations: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-180 | `/admin/staff` | en | button | Front Desk / Data Entry · Committee decisions: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-181 | `/admin/staff` | en | button | Front Desk / Data Entry · Dashboard: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-182 | `/admin/staff` | en | button | Front Desk / Data Entry · Documents & QR: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-183 | `/admin/staff` | en | button | Front Desk / Data Entry · Events, complaints & content: Edit | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-184 | `/admin/staff` | en | button | Front Desk / Data Entry · Members register: Edit | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-185 | `/admin/staff` | en | button | Front Desk / Data Entry · Membership applications: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-186 | `/admin/staff` | en | button | Front Desk / Data Entry · Outreach & consent: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-187 | `/admin/staff` | en | button | Front Desk / Data Entry · Payments & vouchers: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-188 | `/admin/staff` | en | button | Front Desk / Data Entry · Reports & AI: No access | perm.cycle | 3 | 64x32 | PASS | exercised by a functional spec |
| EL-STAFF-189 | `/admin/staff` | en | button | Front Desk / Data Entry · Service requests & signing: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-190 | `/admin/staff` | en | button | Front Desk / Data Entry · Services setup & settings: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-191 | `/admin/staff` | en | button | Front Desk / Data Entry · Staff & audit: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-192 | `/admin/staff` | en | button | Front Desk / Data Entry · Voter list: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-193 | `/admin/staff` | en | button | Inactive Officer | staff.edit | 3 | 105x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-194 | `/admin/staff` | en | button | Invite staff by email | staff.invite | 3 | 195x44 | PASS | exercised by a functional spec |
| EL-STAFF-195 | `/admin/staff` | en | button | IT Convener · Accounts: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-196 | `/admin/staff` | en | button | IT Convener · Business directory: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-197 | `/admin/staff` | en | button | IT Convener · Certificates: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-198 | `/admin/staff` | en | button | IT Convener · Change declarations: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-199 | `/admin/staff` | en | button | IT Convener · Committee decisions: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-200 | `/admin/staff` | en | button | IT Convener · Dashboard: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-201 | `/admin/staff` | en | button | IT Convener · Documents & QR: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-202 | `/admin/staff` | en | button | IT Convener · Events, complaints & content: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-203 | `/admin/staff` | en | button | IT Convener · Members register: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-204 | `/admin/staff` | en | button | IT Convener · Membership applications: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-205 | `/admin/staff` | en | button | IT Convener · Outreach & consent: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-206 | `/admin/staff` | en | button | IT Convener · Payments & vouchers: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-207 | `/admin/staff` | en | button | IT Convener · Reports & AI: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-208 | `/admin/staff` | en | button | IT Convener · Service requests & signing: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-209 | `/admin/staff` | en | button | IT Convener · Services setup & settings: Approve | perm.cycle | 3 | 67x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-210 | `/admin/staff` | en | button | IT Convener · Staff & audit: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-211 | `/admin/staff` | en | button | IT Convener · Voter list: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-212 | `/admin/staff` | en | button | Light or dark theme | theme.toggle | 3 | 44x44 | PASS | exercised by a functional spec |
| EL-STAFF-213 | `/admin/staff` | en | button | Membership Committee Convener · Accounts: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-214 | `/admin/staff` | en | button | Membership Committee Convener · Business directory: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-215 | `/admin/staff` | en | button | Membership Committee Convener · Certificates: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-216 | `/admin/staff` | en | button | Membership Committee Convener · Change declarations: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-217 | `/admin/staff` | en | button | Membership Committee Convener · Committee decisions: Approve | perm.cycle | 3 | 67x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-218 | `/admin/staff` | en | button | Membership Committee Convener · Dashboard: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-219 | `/admin/staff` | en | button | Membership Committee Convener · Documents & QR: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-220 | `/admin/staff` | en | button | Membership Committee Convener · Events, complaints & content: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-221 | `/admin/staff` | en | button | Membership Committee Convener · Members register: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-222 | `/admin/staff` | en | button | Membership Committee Convener · Membership applications: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-223 | `/admin/staff` | en | button | Membership Committee Convener · Outreach & consent: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-224 | `/admin/staff` | en | button | Membership Committee Convener · Payments & vouchers: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-225 | `/admin/staff` | en | button | Membership Committee Convener · Reports & AI: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-226 | `/admin/staff` | en | button | Membership Committee Convener · Service requests & signing: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-227 | `/admin/staff` | en | button | Membership Committee Convener · Services setup & settings: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-228 | `/admin/staff` | en | button | Membership Committee Convener · Staff & audit: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-229 | `/admin/staff` | en | button | Membership Committee Convener · Voter list: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-230 | `/admin/staff` | en | button | Membership Committee Member · Accounts: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-231 | `/admin/staff` | en | button | Membership Committee Member · Business directory: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-232 | `/admin/staff` | en | button | Membership Committee Member · Certificates: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-233 | `/admin/staff` | en | button | Membership Committee Member · Change declarations: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-234 | `/admin/staff` | en | button | Membership Committee Member · Committee decisions: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-235 | `/admin/staff` | en | button | Membership Committee Member · Dashboard: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-236 | `/admin/staff` | en | button | Membership Committee Member · Documents & QR: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-237 | `/admin/staff` | en | button | Membership Committee Member · Events, complaints & content: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-238 | `/admin/staff` | en | button | Membership Committee Member · Members register: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-239 | `/admin/staff` | en | button | Membership Committee Member · Membership applications: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-240 | `/admin/staff` | en | button | Membership Committee Member · Outreach & consent: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-241 | `/admin/staff` | en | button | Membership Committee Member · Payments & vouchers: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-242 | `/admin/staff` | en | button | Membership Committee Member · Reports & AI: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-243 | `/admin/staff` | en | button | Membership Committee Member · Service requests & signing: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-244 | `/admin/staff` | en | button | Membership Committee Member · Services setup & settings: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-245 | `/admin/staff` | en | button | Membership Committee Member · Staff & audit: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-246 | `/admin/staff` | en | button | Membership Committee Member · Voter list: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-247 | `/admin/staff` | en | button | Membership Officer | staff.edit | 3 | 136x44 | PASS | exercised by a functional spec |
| EL-STAFF-248 | `/admin/staff` | en | button | Membership Officer · Accounts: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-249 | `/admin/staff` | en | button | Membership Officer · Business directory: Edit | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-250 | `/admin/staff` | en | button | Membership Officer · Certificates: Edit | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-251 | `/admin/staff` | en | button | Membership Officer · Change declarations: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-252 | `/admin/staff` | en | button | Membership Officer · Committee decisions: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-253 | `/admin/staff` | en | button | Membership Officer · Dashboard: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-254 | `/admin/staff` | en | button | Membership Officer · Documents & QR: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-255 | `/admin/staff` | en | button | Membership Officer · Events, complaints & content: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-256 | `/admin/staff` | en | button | Membership Officer · Members register: Edit | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-257 | `/admin/staff` | en | button | Membership Officer · Membership applications: Edit | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-258 | `/admin/staff` | en | button | Membership Officer · Outreach & consent: Edit | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-259 | `/admin/staff` | en | button | Membership Officer · Payments & vouchers: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-260 | `/admin/staff` | en | button | Membership Officer · Reports & AI: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-261 | `/admin/staff` | en | button | Membership Officer · Service requests & signing: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-262 | `/admin/staff` | en | button | Membership Officer · Services setup & settings: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-263 | `/admin/staff` | en | button | Membership Officer · Staff & audit: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-264 | `/admin/staff` | en | button | Membership Officer · Voter list: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-265 | `/admin/staff` | en | button | President | staff.edit | 3 | 65x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-266 | `/admin/staff` | en | button | President (Signatory) · Accounts: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-267 | `/admin/staff` | en | button | President (Signatory) · Business directory: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-268 | `/admin/staff` | en | button | President (Signatory) · Certificates: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-269 | `/admin/staff` | en | button | President (Signatory) · Change declarations: Approve | perm.cycle | 3 | 67x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-270 | `/admin/staff` | en | button | President (Signatory) · Committee decisions: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-271 | `/admin/staff` | en | button | President (Signatory) · Dashboard: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-272 | `/admin/staff` | en | button | President (Signatory) · Documents & QR: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-273 | `/admin/staff` | en | button | President (Signatory) · Events, complaints & content: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-274 | `/admin/staff` | en | button | President (Signatory) · Members register: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-275 | `/admin/staff` | en | button | President (Signatory) · Membership applications: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-276 | `/admin/staff` | en | button | President (Signatory) · Outreach & consent: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-277 | `/admin/staff` | en | button | President (Signatory) · Payments & vouchers: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-278 | `/admin/staff` | en | button | President (Signatory) · Reports & AI: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-279 | `/admin/staff` | en | button | President (Signatory) · Service requests & signing: Approve | perm.cycle | 3 | 67x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-280 | `/admin/staff` | en | button | President (Signatory) · Services setup & settings: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-281 | `/admin/staff` | en | button | President (Signatory) · Staff & audit: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-282 | `/admin/staff` | en | button | President (Signatory) · Voter list: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-283 | `/admin/staff` | en | button | Recommendatory Letter | perm.service.pick | 1 | 201x44 | PASS | exercised by a functional spec |
| EL-STAFF-284 | `/admin/staff` | en | button | Reset to defaults | perm.reset | 1 | 180x44 | PASS | exercised by a functional spec |
| EL-STAFF-285 | `/admin/staff` | en | button | Save | perm.save | 1 | 66x44 | PASS | exercised by a functional spec |
| EL-STAFF-286 | `/admin/staff` | en | button | Save access | perm.person | 1 | 120x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-287 | `/admin/staff` | en | button | Save officers | perm.service | 1 | 125x44 | PASS | exercised by a functional spec |
| EL-STAFF-288 | `/admin/staff` | en | button | Secretary General · Accounts: Approve | perm.cycle | 3 | 67x32 | PARTIAL | disabled: Secretary General always keeps full control |
| EL-STAFF-289 | `/admin/staff` | en | button | Secretary General · Business directory: Approve | perm.cycle | 3 | 67x32 | PARTIAL | disabled: Secretary General always keeps full control |
| EL-STAFF-290 | `/admin/staff` | en | button | Secretary General · Certificates: Approve | perm.cycle | 3 | 67x32 | PARTIAL | disabled: Secretary General always keeps full control |
| EL-STAFF-291 | `/admin/staff` | en | button | Secretary General · Change declarations: Approve | perm.cycle | 3 | 67x32 | PARTIAL | disabled: Secretary General always keeps full control |
| EL-STAFF-292 | `/admin/staff` | en | button | Secretary General · Committee decisions: Approve | perm.cycle | 3 | 67x32 | PARTIAL | disabled: Secretary General always keeps full control |
| EL-STAFF-293 | `/admin/staff` | en | button | Secretary General · Dashboard: Approve | perm.cycle | 3 | 67x32 | PARTIAL | disabled: Secretary General always keeps full control |
| EL-STAFF-294 | `/admin/staff` | en | button | Secretary General · Documents & QR: Approve | perm.cycle | 3 | 67x32 | PARTIAL | disabled: Secretary General always keeps full control |
| EL-STAFF-295 | `/admin/staff` | en | button | Secretary General · Events, complaints & content: Approve | perm.cycle | 3 | 67x32 | PARTIAL | disabled: Secretary General always keeps full control |
| EL-STAFF-296 | `/admin/staff` | en | button | Secretary General · Members register: Approve | perm.cycle | 3 | 67x32 | PARTIAL | disabled: Secretary General always keeps full control |
| EL-STAFF-297 | `/admin/staff` | en | button | Secretary General · Membership applications: Approve | perm.cycle | 3 | 67x32 | PARTIAL | disabled: Secretary General always keeps full control |
| EL-STAFF-298 | `/admin/staff` | en | button | Secretary General · Outreach & consent: Approve | perm.cycle | 3 | 67x32 | PARTIAL | disabled: Secretary General always keeps full control |
| EL-STAFF-299 | `/admin/staff` | en | button | Secretary General · Payments & vouchers: Approve | perm.cycle | 3 | 67x32 | PARTIAL | disabled: Secretary General always keeps full control |
| EL-STAFF-300 | `/admin/staff` | en | button | Secretary General · Reports & AI: Approve | perm.cycle | 3 | 67x32 | PARTIAL | disabled: Secretary General always keeps full control |
| EL-STAFF-301 | `/admin/staff` | en | button | Secretary General · Service requests & signing: Approve | perm.cycle | 3 | 67x32 | PARTIAL | disabled: Secretary General always keeps full control |
| EL-STAFF-302 | `/admin/staff` | en | button | Secretary General · Services setup & settings: Approve | perm.cycle | 3 | 67x32 | PARTIAL | disabled: Secretary General always keeps full control |
| EL-STAFF-303 | `/admin/staff` | en | button | Secretary General · Staff & audit: Approve | perm.cycle | 3 | 67x32 | PASS | exercised by a functional spec |
| EL-STAFF-304 | `/admin/staff` | en | button | Secretary General · Voter list: Approve | perm.cycle | 3 | 67x32 | PARTIAL | disabled: Secretary General always keeps full control |
| EL-STAFF-305 | `/admin/staff` | en | button | Services Officer | staff.edit | 3 | 109x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-306 | `/admin/staff` | en | button | Services Officer · Accounts: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-307 | `/admin/staff` | en | button | Services Officer · Business directory: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-308 | `/admin/staff` | en | button | Services Officer · Certificates: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-309 | `/admin/staff` | en | button | Services Officer · Change declarations: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-310 | `/admin/staff` | en | button | Services Officer · Committee decisions: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-311 | `/admin/staff` | en | button | Services Officer · Dashboard: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-312 | `/admin/staff` | en | button | Services Officer · Documents & QR: Edit | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-313 | `/admin/staff` | en | button | Services Officer · Events, complaints & content: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-314 | `/admin/staff` | en | button | Services Officer · Members register: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-315 | `/admin/staff` | en | button | Services Officer · Membership applications: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-316 | `/admin/staff` | en | button | Services Officer · Outreach & consent: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-317 | `/admin/staff` | en | button | Services Officer · Payments & vouchers: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-318 | `/admin/staff` | en | button | Services Officer · Reports & AI: View | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-319 | `/admin/staff` | en | button | Services Officer · Service requests & signing: Edit | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-320 | `/admin/staff` | en | button | Services Officer · Services setup & settings: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-321 | `/admin/staff` | en | button | Services Officer · Staff & audit: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-322 | `/admin/staff` | en | button | Services Officer · Voter list: No access | perm.cycle | 3 | 64x32 | PARTIAL | disabled: You can view this screen. Changes need “Approve” on Staff & audit. |
| EL-STAFF-323 | `/admin/staff` | en | button | SG | staff.edit | 3 | 44x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-324 | `/admin/staff` | en | button | Show password | password.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-STAFF-325 | `/admin/staff` | en | button | Sign out | logout | 3 | 116x44 | PASS | exercised by a functional spec |
| EL-STAFF-326 | `/admin/staff` | en | button | Sort by Designation | table.sort | 3 | 91x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-327 | `/admin/staff` | en | button | Sort by Email | table.sort | 3 | 51x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-328 | `/admin/staff` | en | button | Sort by Last active | table.sort | 3 | 84x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-329 | `/admin/staff` | en | button | Sort by Name | table.sort | 3 | 54x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-330 | `/admin/staff` | en | button | Sort by Seniority | table.sort | 3 | 73x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-331 | `/admin/staff` | en | button | Sort by Status | table.sort | 3 | 57x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-332 | `/admin/staff` | en | button | Undo | perm.undo | 1 | 72x44 | PASS | exercised by a functional spec |
| EL-STAFF-333 | `/admin/staff` | en | button | Visa Guarantee (China) | perm.service.pick | 1 | 190x44 | PASS | exercised by a functional spec |
| EL-STAFF-334 | `/admin/staff` | en | button | Visa Recommendation | perm.service.pick | 1 | 187x44 | PASS | exercised by a functional spec |
| EL-STAFF-335 | `/admin/staff` | en | input:checkbox | Acceptance Staff — Auditor (read-only) · Auditor (read-only) |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-336 | `/admin/staff` | en | input:checkbox | Acceptance Staff — Committee Secretary · Committee Secretary |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-337 | `/admin/staff` | en | input:checkbox | Acceptance Staff — Membership Committee Member · Membership Committee Member |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-338 | `/admin/staff` | en | input:checkbox | Accounts Officer · Accounts Officer |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-339 | `/admin/staff` | en | input:checkbox | Auditor · Auditor (read-only) |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-340 | `/admin/staff` | en | input:checkbox | Committee Secretary · Committee Secretary |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-341 | `/admin/staff` | en | input:checkbox | E2E Convener 5a407e56 · Membership Committee Convener |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-342 | `/admin/staff` | en | input:checkbox | E2E Convener adf6afb6 · Membership Committee Convener |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-343 | `/admin/staff` | en | input:checkbox | E2E Convener b88952ae · Membership Committee Convener |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-344 | `/admin/staff` | en | input:checkbox | E2E IT Convener 5a407e56 · IT Convener |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-345 | `/admin/staff` | en | input:checkbox | E2E IT Convener adf6afb6 · IT Convener |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-346 | `/admin/staff` | en | input:checkbox | E2E IT Convener b88952ae · IT Convener |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-347 | `/admin/staff` | en | input:checkbox | E2E Officer 5a407e56 · Membership Officer |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-348 | `/admin/staff` | en | input:checkbox | E2E Officer adf6afb6 · Membership Officer |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-349 | `/admin/staff` | en | input:checkbox | E2E Officer b88952ae · Membership Officer |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-350 | `/admin/staff` | en | input:checkbox | E2E President 5a407e56 · President (Signatory) |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-351 | `/admin/staff` | en | input:checkbox | E2E President adf6afb6 · President (Signatory) |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-352 | `/admin/staff` | en | input:checkbox | E2E President b88952ae · President (Signatory) |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-353 | `/admin/staff` | en | input:checkbox | Membership Officer · Membership Officer |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-354 | `/admin/staff` | en | input:checkbox | President · President (Signatory) |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-355 | `/admin/staff` | en | input:checkbox | Services Officer · Services Officer |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-356 | `/admin/staff` | en | input:password | Your password |  | 1 | 532x44 | PASS | exercised by a functional spec |
| EL-STAFF-357 | `/admin/staff` | en | input:search | Search staff… |  | 3 | 936x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-358 | `/admin/staff` | en | input:text | Designation |  | 1 | 532x44 | PASS | exercised by a functional spec |
| EL-STAFF-359 | `/admin/staff` | en | input:text | Reason |  | 1 | 532x44 | PASS | exercised by a functional spec |
| EL-STAFF-360 | `/admin/staff` | en | link | Accounts | /admin/finance | 3 | 238x44 | PASS | target answered 200 |
| EL-STAFF-361 | `/admin/staff` | en | link | Ask MCCI AI | /admin/help | 3 | 238x44 | PASS | target answered 200 |
| EL-STAFF-362 | `/admin/staff` | en | link | Audit Trail | /admin/audit | 3 | 125x46 | PASS | target answered 200 |
| EL-STAFF-363 | `/admin/staff` | en | link | Business Directory | /admin/business-directory | 3 | 238x44 | PASS | target answered 200 |
| EL-STAFF-364 | `/admin/staff` | en | link | Certificates | /admin/temp | 3 | 238x44 | PASS | target answered 200 |
| EL-STAFF-365 | `/admin/staff` | en | link | Complaint Desk | /admin/complaints | 3 | 238x44 | PASS | target answered 200 |
| EL-STAFF-366 | `/admin/staff` | en | link | Content & Messaging | /admin/content | 3 | 238x44 | PASS | target answered 200 |
| EL-STAFF-367 | `/admin/staff` | en | link | Documents & QR | /admin/documents | 3 | 238x44 | PASS | target answered 200 |
| EL-STAFF-368 | `/admin/staff` | en | link | Events & Meetings | /admin/events | 3 | 238x44 | PASS | target answered 200 |
| EL-STAFF-369 | `/admin/staff` | en | link | MCCI Admin Secretariat Panel | /admin | 3 | 238x82 | PASS | target answered 200 |
| EL-STAFF-370 | `/admin/staff` | en | link | Members Register | /admin/members | 3 | 238x44 | PASS | target answered 200 |
| EL-STAFF-371 | `/admin/staff` | en | link | Membership Pipeline | /admin/requests | 3 | 238x44 | PASS | target answered 200 |
| EL-STAFF-372 | `/admin/staff` | en | link | Payments | /admin/payments | 3 | 238x44 | PASS | target answered 200 |
| EL-STAFF-373 | `/admin/staff` | en | link | Reports & AI | /admin/reports | 3 | 238x44 | PASS | target answered 200 |
| EL-STAFF-374 | `/admin/staff` | en | link | Service Requests | /admin/applications | 3 | 238x44 | PASS | target answered 200 |
| EL-STAFF-375 | `/admin/staff` | en | link | Services & Integrations | /admin/services | 3 | 238x44 | PASS | target answered 200 |
| EL-STAFF-376 | `/admin/staff` | en | link | Settings | /admin/settings | 3 | 238x44 | PASS | target answered 200 |
| EL-STAFF-377 | `/admin/staff` | en | link | Skip to content | #main | 3 | 144x47 | PASS | in-page anchor |
| EL-STAFF-378 | `/admin/staff` | en | link | Staff & Audit | /admin/staff | 3 | 238x44 | PASS | target answered 200 |
| EL-STAFF-379 | `/admin/staff` | en | link | WhatsApp | /admin/whatsapp | 3 | 238x44 | PASS | target answered 200 |
| EL-STAFF-380 | `/admin/staff` | en | select | AccessAs their designationNo accessViewEditApprove |  | 1 | 532x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-381 | `/admin/staff` | en | select | PersonE2E President 5a407e56 · President (Signatory)E2E President adf6afb6 · President (Si |  | 1 | 532x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-382 | `/admin/staff` | en | select | SectionDashboardMembership applicationsCommittee decisionsCertificatesMembers registerServ |  | 1 | 532x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-383 | `/admin/staff` | en | select | SeniorityL1L2L3L4 |  | 1 | 532x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-384 | `/admin/staff` | en | select | Start with the limits ofNo accessPresident (Signatory)IT ConvenerDeputy Secretary — Member |  | 1 | 532x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-385 | `/admin/staff` | en | select | StatusAll statusesActiveDisabled |  | 3 | 126x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-386 | `/admin/staff` | ur | button | Acceptance Staff — Auditor (read-only) | staff.edit | 1 | 268x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-387 | `/admin/staff` | ur | button | Acceptance Staff — Deputy Secretary — Membership | staff.edit | 1 | 283x53 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-388 | `/admin/staff` | ur | button | Acceptance Staff — Membership Committee Member | staff.edit | 1 | 283x53 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-389 | `/admin/staff` | ur | button | Accounts Officer | staff.edit | 1 | 116x44 | PASS | exercised by a functional spec |
| EL-STAFF-390 | `/admin/staff` | ur | button | Accounts Officer · ادائیگیاں اور واؤچر: منظوری | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-391 | `/admin/staff` | ur | button | Accounts Officer · اراکین کا رجسٹر: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-392 | `/admin/staff` | ur | button | Accounts Officer · اکاؤنٹس: ترمیم | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-393 | `/admin/staff` | ur | button | Accounts Officer · بزنس ڈائریکٹری: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-394 | `/admin/staff` | ur | button | Accounts Officer · تبدیلی کے اقرار نامے: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-395 | `/admin/staff` | ur | button | Accounts Officer · تقریبات، شکایات اور مواد: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-396 | `/admin/staff` | ur | button | Accounts Officer · دستاویزات اور QR کوڈ: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-397 | `/admin/staff` | ur | button | Accounts Officer · ڈیش بورڈ: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-398 | `/admin/staff` | ur | button | Accounts Officer · رابطہ کاری اور رضامندی: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-399 | `/admin/staff` | ur | button | Accounts Officer · رپورٹس اور مصنوعی ذہانت: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-400 | `/admin/staff` | ur | button | Accounts Officer · رکنیت کی درخواستیں: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-401 | `/admin/staff` | ur | button | Accounts Officer · سرٹیفکیٹس: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-402 | `/admin/staff` | ur | button | Accounts Officer · سروس درخواستیں اور دستخط: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-403 | `/admin/staff` | ur | button | Accounts Officer · سروسز کی ترتیب اور سیٹنگز: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-404 | `/admin/staff` | ur | button | Accounts Officer · عملہ اور آڈٹ: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-405 | `/admin/staff` | ur | button | Accounts Officer · کمیٹی کے فیصلے: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-406 | `/admin/staff` | ur | button | Accounts Officer · ووٹر لسٹ: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-407 | `/admin/staff` | ur | button | Auditor | staff.edit | 1 | 50x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-408 | `/admin/staff` | ur | button | Auditor (read-only) · ادائیگیاں اور واؤچر: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-409 | `/admin/staff` | ur | button | Auditor (read-only) · اراکین کا رجسٹر: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-410 | `/admin/staff` | ur | button | Auditor (read-only) · اکاؤنٹس: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-411 | `/admin/staff` | ur | button | Auditor (read-only) · بزنس ڈائریکٹری: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-412 | `/admin/staff` | ur | button | Auditor (read-only) · تبدیلی کے اقرار نامے: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-413 | `/admin/staff` | ur | button | Auditor (read-only) · تقریبات، شکایات اور مواد: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-414 | `/admin/staff` | ur | button | Auditor (read-only) · دستاویزات اور QR کوڈ: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-415 | `/admin/staff` | ur | button | Auditor (read-only) · ڈیش بورڈ: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-416 | `/admin/staff` | ur | button | Auditor (read-only) · رابطہ کاری اور رضامندی: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-417 | `/admin/staff` | ur | button | Auditor (read-only) · رپورٹس اور مصنوعی ذہانت: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-418 | `/admin/staff` | ur | button | Auditor (read-only) · رکنیت کی درخواستیں: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-419 | `/admin/staff` | ur | button | Auditor (read-only) · سرٹیفکیٹس: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-420 | `/admin/staff` | ur | button | Auditor (read-only) · سروس درخواستیں اور دستخط: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-421 | `/admin/staff` | ur | button | Auditor (read-only) · سروسز کی ترتیب اور سیٹنگز: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-422 | `/admin/staff` | ur | button | Auditor (read-only) · عملہ اور آڈٹ: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-423 | `/admin/staff` | ur | button | Auditor (read-only) · کمیٹی کے فیصلے: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-424 | `/admin/staff` | ur | button | Auditor (read-only) · ووٹر لسٹ: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-425 | `/admin/staff` | ur | button | Certificate of Origin | perm.service.pick | 1 | 169x44 | PASS | exercised by a functional spec |
| EL-STAFF-426 | `/admin/staff` | ur | button | Committee Secretary | staff.edit | 1 | 146x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-427 | `/admin/staff` | ur | button | Committee Secretary · ادائیگیاں اور واؤچر: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-428 | `/admin/staff` | ur | button | Committee Secretary · اراکین کا رجسٹر: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-429 | `/admin/staff` | ur | button | Committee Secretary · اکاؤنٹس: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-430 | `/admin/staff` | ur | button | Committee Secretary · بزنس ڈائریکٹری: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-431 | `/admin/staff` | ur | button | Committee Secretary · تبدیلی کے اقرار نامے: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-432 | `/admin/staff` | ur | button | Committee Secretary · تقریبات، شکایات اور مواد: ترمیم | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-433 | `/admin/staff` | ur | button | Committee Secretary · دستاویزات اور QR کوڈ: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-434 | `/admin/staff` | ur | button | Committee Secretary · ڈیش بورڈ: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-435 | `/admin/staff` | ur | button | Committee Secretary · رابطہ کاری اور رضامندی: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-436 | `/admin/staff` | ur | button | Committee Secretary · رپورٹس اور مصنوعی ذہانت: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-437 | `/admin/staff` | ur | button | Committee Secretary · رکنیت کی درخواستیں: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-438 | `/admin/staff` | ur | button | Committee Secretary · سرٹیفکیٹس: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-439 | `/admin/staff` | ur | button | Committee Secretary · سروس درخواستیں اور دستخط: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-440 | `/admin/staff` | ur | button | Committee Secretary · سروسز کی ترتیب اور سیٹنگز: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-441 | `/admin/staff` | ur | button | Committee Secretary · عملہ اور آڈٹ: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-442 | `/admin/staff` | ur | button | Committee Secretary · کمیٹی کے فیصلے: منظوری | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-443 | `/admin/staff` | ur | button | Committee Secretary · ووٹر لسٹ: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-444 | `/admin/staff` | ur | button | CSV ڈاؤن لوڈ کریں | staff.export | 1 | 146x49 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-445 | `/admin/staff` | ur | button | Demo Accounts Officer | staff.edit | 1 | 159x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-446 | `/admin/staff` | ur | button | Demo Committee Convener | staff.edit | 1 | 189x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-447 | `/admin/staff` | ur | button | Demo IT Convener | staff.edit | 1 | 123x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-448 | `/admin/staff` | ur | button | Demo Membership Officer | staff.edit | 1 | 179x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-449 | `/admin/staff` | ur | button | Demo President | staff.edit | 1 | 109x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-450 | `/admin/staff` | ur | button | Deputy Secretary — Membership · ادائیگیاں اور واؤچر: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-451 | `/admin/staff` | ur | button | Deputy Secretary — Membership · اراکین کا رجسٹر: منظوری | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-452 | `/admin/staff` | ur | button | Deputy Secretary — Membership · اکاؤنٹس: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-453 | `/admin/staff` | ur | button | Deputy Secretary — Membership · بزنس ڈائریکٹری: منظوری | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-454 | `/admin/staff` | ur | button | Deputy Secretary — Membership · تبدیلی کے اقرار نامے: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-455 | `/admin/staff` | ur | button | Deputy Secretary — Membership · تقریبات، شکایات اور مواد: ترمیم | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-456 | `/admin/staff` | ur | button | Deputy Secretary — Membership · دستاویزات اور QR کوڈ: ترمیم | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-457 | `/admin/staff` | ur | button | Deputy Secretary — Membership · ڈیش بورڈ: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-458 | `/admin/staff` | ur | button | Deputy Secretary — Membership · رابطہ کاری اور رضامندی: منظوری | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-459 | `/admin/staff` | ur | button | Deputy Secretary — Membership · رپورٹس اور مصنوعی ذہانت: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-460 | `/admin/staff` | ur | button | Deputy Secretary — Membership · رکنیت کی درخواستیں: منظوری | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-461 | `/admin/staff` | ur | button | Deputy Secretary — Membership · سرٹیفکیٹس: منظوری | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-462 | `/admin/staff` | ur | button | Deputy Secretary — Membership · سروس درخواستیں اور دستخط: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-463 | `/admin/staff` | ur | button | Deputy Secretary — Membership · سروسز کی ترتیب اور سیٹنگز: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-464 | `/admin/staff` | ur | button | Deputy Secretary — Membership · عملہ اور آڈٹ: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-465 | `/admin/staff` | ur | button | Deputy Secretary — Membership · کمیٹی کے فیصلے: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-466 | `/admin/staff` | ur | button | Deputy Secretary — Membership · ووٹر لسٹ: ترمیم | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-467 | `/admin/staff` | ur | button | Document Attestation | perm.service.pick | 1 | 186x44 | PASS | exercised by a functional spec |
| EL-STAFF-468 | `/admin/staff` | ur | button | E-BIL | perm.service.pick | 1 | 72x44 | PASS | exercised by a functional spec |
| EL-STAFF-469 | `/admin/staff` | ur | button | E2E Convener 5a407e56 | staff.edit | 1 | 165x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-470 | `/admin/staff` | ur | button | E2E Convener adf6afb6 | staff.edit | 1 | 159x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-471 | `/admin/staff` | ur | button | E2E Convener b88952ae | staff.edit | 1 | 165x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-472 | `/admin/staff` | ur | button | E2E IT Convener 5a407e56 | staff.edit | 1 | 179x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-473 | `/admin/staff` | ur | button | E2E IT Convener adf6afb6 | staff.edit | 1 | 173x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-474 | `/admin/staff` | ur | button | E2E IT Convener b88952ae | staff.edit | 1 | 179x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-475 | `/admin/staff` | ur | button | E2E Officer 5a407e56 | staff.edit | 1 | 148x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-476 | `/admin/staff` | ur | button | E2E Officer adf6afb6 | staff.edit | 1 | 142x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-477 | `/admin/staff` | ur | button | E2E Officer b88952ae | staff.edit | 1 | 148x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-478 | `/admin/staff` | ur | button | E2E President 5a407e56 | staff.edit | 1 | 164x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-479 | `/admin/staff` | ur | button | E2E President adf6afb6 | staff.edit | 1 | 158x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-480 | `/admin/staff` | ur | button | E2E President b88952ae | staff.edit | 1 | 164x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-481 | `/admin/staff` | ur | button | E2E Secretary 5a407e56 | staff.edit | 1 | 166x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-482 | `/admin/staff` | ur | button | E2E Secretary adf6afb6 | staff.edit | 1 | 160x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-483 | `/admin/staff` | ur | button | E2E Secretary b88952ae | staff.edit | 1 | 166x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-484 | `/admin/staff` | ur | button | Free Samples Letter | perm.service.pick | 1 | 169x44 | PASS | exercised by a functional spec |
| EL-STAFF-485 | `/admin/staff` | ur | button | Front Desk / Data Entry · ادائیگیاں اور واؤچر: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-486 | `/admin/staff` | ur | button | Front Desk / Data Entry · اراکین کا رجسٹر: ترمیم | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-487 | `/admin/staff` | ur | button | Front Desk / Data Entry · اکاؤنٹس: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-488 | `/admin/staff` | ur | button | Front Desk / Data Entry · بزنس ڈائریکٹری: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-489 | `/admin/staff` | ur | button | Front Desk / Data Entry · تبدیلی کے اقرار نامے: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-490 | `/admin/staff` | ur | button | Front Desk / Data Entry · تقریبات، شکایات اور مواد: ترمیم | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-491 | `/admin/staff` | ur | button | Front Desk / Data Entry · دستاویزات اور QR کوڈ: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-492 | `/admin/staff` | ur | button | Front Desk / Data Entry · ڈیش بورڈ: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-493 | `/admin/staff` | ur | button | Front Desk / Data Entry · رابطہ کاری اور رضامندی: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-494 | `/admin/staff` | ur | button | Front Desk / Data Entry · رپورٹس اور مصنوعی ذہانت: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-495 | `/admin/staff` | ur | button | Front Desk / Data Entry · رکنیت کی درخواستیں: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-496 | `/admin/staff` | ur | button | Front Desk / Data Entry · سرٹیفکیٹس: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-497 | `/admin/staff` | ur | button | Front Desk / Data Entry · سروس درخواستیں اور دستخط: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-498 | `/admin/staff` | ur | button | Front Desk / Data Entry · سروسز کی ترتیب اور سیٹنگز: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-499 | `/admin/staff` | ur | button | Front Desk / Data Entry · عملہ اور آڈٹ: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-500 | `/admin/staff` | ur | button | Front Desk / Data Entry · کمیٹی کے فیصلے: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-501 | `/admin/staff` | ur | button | Front Desk / Data Entry · ووٹر لسٹ: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-502 | `/admin/staff` | ur | button | Inactive Officer | staff.edit | 1 | 105x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-503 | `/admin/staff` | ur | button | IT Convener · ادائیگیاں اور واؤچر: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-504 | `/admin/staff` | ur | button | IT Convener · اراکین کا رجسٹر: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-505 | `/admin/staff` | ur | button | IT Convener · اکاؤنٹس: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-506 | `/admin/staff` | ur | button | IT Convener · بزنس ڈائریکٹری: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-507 | `/admin/staff` | ur | button | IT Convener · تبدیلی کے اقرار نامے: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-508 | `/admin/staff` | ur | button | IT Convener · تقریبات، شکایات اور مواد: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-509 | `/admin/staff` | ur | button | IT Convener · دستاویزات اور QR کوڈ: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-510 | `/admin/staff` | ur | button | IT Convener · ڈیش بورڈ: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-511 | `/admin/staff` | ur | button | IT Convener · رابطہ کاری اور رضامندی: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-512 | `/admin/staff` | ur | button | IT Convener · رپورٹس اور مصنوعی ذہانت: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-513 | `/admin/staff` | ur | button | IT Convener · رکنیت کی درخواستیں: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-514 | `/admin/staff` | ur | button | IT Convener · سرٹیفکیٹس: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-515 | `/admin/staff` | ur | button | IT Convener · سروس درخواستیں اور دستخط: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-516 | `/admin/staff` | ur | button | IT Convener · سروسز کی ترتیب اور سیٹنگز: منظوری | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-517 | `/admin/staff` | ur | button | IT Convener · عملہ اور آڈٹ: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-518 | `/admin/staff` | ur | button | IT Convener · کمیٹی کے فیصلے: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-519 | `/admin/staff` | ur | button | IT Convener · ووٹر لسٹ: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-520 | `/admin/staff` | ur | button | Membership Committee Convener · ادائیگیاں اور واؤچر: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-521 | `/admin/staff` | ur | button | Membership Committee Convener · اراکین کا رجسٹر: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-522 | `/admin/staff` | ur | button | Membership Committee Convener · اکاؤنٹس: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-523 | `/admin/staff` | ur | button | Membership Committee Convener · بزنس ڈائریکٹری: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-524 | `/admin/staff` | ur | button | Membership Committee Convener · تبدیلی کے اقرار نامے: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-525 | `/admin/staff` | ur | button | Membership Committee Convener · تقریبات، شکایات اور مواد: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-526 | `/admin/staff` | ur | button | Membership Committee Convener · دستاویزات اور QR کوڈ: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-527 | `/admin/staff` | ur | button | Membership Committee Convener · ڈیش بورڈ: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-528 | `/admin/staff` | ur | button | Membership Committee Convener · رابطہ کاری اور رضامندی: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-529 | `/admin/staff` | ur | button | Membership Committee Convener · رپورٹس اور مصنوعی ذہانت: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-530 | `/admin/staff` | ur | button | Membership Committee Convener · رکنیت کی درخواستیں: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-531 | `/admin/staff` | ur | button | Membership Committee Convener · سرٹیفکیٹس: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-532 | `/admin/staff` | ur | button | Membership Committee Convener · سروس درخواستیں اور دستخط: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-533 | `/admin/staff` | ur | button | Membership Committee Convener · سروسز کی ترتیب اور سیٹنگز: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-534 | `/admin/staff` | ur | button | Membership Committee Convener · عملہ اور آڈٹ: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-535 | `/admin/staff` | ur | button | Membership Committee Convener · کمیٹی کے فیصلے: منظوری | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-536 | `/admin/staff` | ur | button | Membership Committee Convener · ووٹر لسٹ: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-537 | `/admin/staff` | ur | button | Membership Committee Member · ادائیگیاں اور واؤچر: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-538 | `/admin/staff` | ur | button | Membership Committee Member · اراکین کا رجسٹر: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-539 | `/admin/staff` | ur | button | Membership Committee Member · اکاؤنٹس: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-540 | `/admin/staff` | ur | button | Membership Committee Member · بزنس ڈائریکٹری: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-541 | `/admin/staff` | ur | button | Membership Committee Member · تبدیلی کے اقرار نامے: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-542 | `/admin/staff` | ur | button | Membership Committee Member · تقریبات، شکایات اور مواد: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-543 | `/admin/staff` | ur | button | Membership Committee Member · دستاویزات اور QR کوڈ: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-544 | `/admin/staff` | ur | button | Membership Committee Member · ڈیش بورڈ: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-545 | `/admin/staff` | ur | button | Membership Committee Member · رابطہ کاری اور رضامندی: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-546 | `/admin/staff` | ur | button | Membership Committee Member · رپورٹس اور مصنوعی ذہانت: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-547 | `/admin/staff` | ur | button | Membership Committee Member · رکنیت کی درخواستیں: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-548 | `/admin/staff` | ur | button | Membership Committee Member · سرٹیفکیٹس: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-549 | `/admin/staff` | ur | button | Membership Committee Member · سروس درخواستیں اور دستخط: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-550 | `/admin/staff` | ur | button | Membership Committee Member · سروسز کی ترتیب اور سیٹنگز: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-551 | `/admin/staff` | ur | button | Membership Committee Member · عملہ اور آڈٹ: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-552 | `/admin/staff` | ur | button | Membership Committee Member · کمیٹی کے فیصلے: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-553 | `/admin/staff` | ur | button | Membership Committee Member · ووٹر لسٹ: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-554 | `/admin/staff` | ur | button | Membership Officer | staff.edit | 1 | 136x44 | PASS | exercised by a functional spec |
| EL-STAFF-555 | `/admin/staff` | ur | button | Membership Officer · ادائیگیاں اور واؤچر: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-556 | `/admin/staff` | ur | button | Membership Officer · اراکین کا رجسٹر: ترمیم | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-557 | `/admin/staff` | ur | button | Membership Officer · اکاؤنٹس: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-558 | `/admin/staff` | ur | button | Membership Officer · بزنس ڈائریکٹری: ترمیم | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-559 | `/admin/staff` | ur | button | Membership Officer · تبدیلی کے اقرار نامے: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-560 | `/admin/staff` | ur | button | Membership Officer · تقریبات، شکایات اور مواد: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-561 | `/admin/staff` | ur | button | Membership Officer · دستاویزات اور QR کوڈ: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-562 | `/admin/staff` | ur | button | Membership Officer · ڈیش بورڈ: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-563 | `/admin/staff` | ur | button | Membership Officer · رابطہ کاری اور رضامندی: ترمیم | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-564 | `/admin/staff` | ur | button | Membership Officer · رپورٹس اور مصنوعی ذہانت: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-565 | `/admin/staff` | ur | button | Membership Officer · رکنیت کی درخواستیں: ترمیم | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-566 | `/admin/staff` | ur | button | Membership Officer · سرٹیفکیٹس: ترمیم | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-567 | `/admin/staff` | ur | button | Membership Officer · سروس درخواستیں اور دستخط: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-568 | `/admin/staff` | ur | button | Membership Officer · سروسز کی ترتیب اور سیٹنگز: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-569 | `/admin/staff` | ur | button | Membership Officer · عملہ اور آڈٹ: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-570 | `/admin/staff` | ur | button | Membership Officer · کمیٹی کے فیصلے: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-571 | `/admin/staff` | ur | button | Membership Officer · ووٹر لسٹ: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-572 | `/admin/staff` | ur | button | President | staff.edit | 1 | 65x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-573 | `/admin/staff` | ur | button | President (Signatory) · ادائیگیاں اور واؤچر: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-574 | `/admin/staff` | ur | button | President (Signatory) · اراکین کا رجسٹر: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-575 | `/admin/staff` | ur | button | President (Signatory) · اکاؤنٹس: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-576 | `/admin/staff` | ur | button | President (Signatory) · بزنس ڈائریکٹری: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-577 | `/admin/staff` | ur | button | President (Signatory) · تبدیلی کے اقرار نامے: منظوری | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-578 | `/admin/staff` | ur | button | President (Signatory) · تقریبات، شکایات اور مواد: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-579 | `/admin/staff` | ur | button | President (Signatory) · دستاویزات اور QR کوڈ: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-580 | `/admin/staff` | ur | button | President (Signatory) · ڈیش بورڈ: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-581 | `/admin/staff` | ur | button | President (Signatory) · رابطہ کاری اور رضامندی: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-582 | `/admin/staff` | ur | button | President (Signatory) · رپورٹس اور مصنوعی ذہانت: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-583 | `/admin/staff` | ur | button | President (Signatory) · رکنیت کی درخواستیں: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-584 | `/admin/staff` | ur | button | President (Signatory) · سرٹیفکیٹس: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-585 | `/admin/staff` | ur | button | President (Signatory) · سروس درخواستیں اور دستخط: منظوری | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-586 | `/admin/staff` | ur | button | President (Signatory) · سروسز کی ترتیب اور سیٹنگز: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-587 | `/admin/staff` | ur | button | President (Signatory) · عملہ اور آڈٹ: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-588 | `/admin/staff` | ur | button | President (Signatory) · کمیٹی کے فیصلے: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-589 | `/admin/staff` | ur | button | President (Signatory) · ووٹر لسٹ: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-590 | `/admin/staff` | ur | button | Recommendatory Letter | perm.service.pick | 1 | 201x44 | PASS | exercised by a functional spec |
| EL-STAFF-591 | `/admin/staff` | ur | button | Secretary General · ادائیگیاں اور واؤچر: منظوری | perm.cycle | 1 | 64x34 | PARTIAL | disabled: سیکرٹری جنرل کا مکمل اختیار ہمیشہ برقرار رہتا ہے |
| EL-STAFF-592 | `/admin/staff` | ur | button | Secretary General · اراکین کا رجسٹر: منظوری | perm.cycle | 1 | 64x34 | PARTIAL | disabled: سیکرٹری جنرل کا مکمل اختیار ہمیشہ برقرار رہتا ہے |
| EL-STAFF-593 | `/admin/staff` | ur | button | Secretary General · اکاؤنٹس: منظوری | perm.cycle | 1 | 64x34 | PARTIAL | disabled: سیکرٹری جنرل کا مکمل اختیار ہمیشہ برقرار رہتا ہے |
| EL-STAFF-594 | `/admin/staff` | ur | button | Secretary General · بزنس ڈائریکٹری: منظوری | perm.cycle | 1 | 64x34 | PARTIAL | disabled: سیکرٹری جنرل کا مکمل اختیار ہمیشہ برقرار رہتا ہے |
| EL-STAFF-595 | `/admin/staff` | ur | button | Secretary General · تبدیلی کے اقرار نامے: منظوری | perm.cycle | 1 | 64x34 | PARTIAL | disabled: سیکرٹری جنرل کا مکمل اختیار ہمیشہ برقرار رہتا ہے |
| EL-STAFF-596 | `/admin/staff` | ur | button | Secretary General · تقریبات، شکایات اور مواد: منظوری | perm.cycle | 1 | 64x34 | PARTIAL | disabled: سیکرٹری جنرل کا مکمل اختیار ہمیشہ برقرار رہتا ہے |
| EL-STAFF-597 | `/admin/staff` | ur | button | Secretary General · دستاویزات اور QR کوڈ: منظوری | perm.cycle | 1 | 64x34 | PARTIAL | disabled: سیکرٹری جنرل کا مکمل اختیار ہمیشہ برقرار رہتا ہے |
| EL-STAFF-598 | `/admin/staff` | ur | button | Secretary General · ڈیش بورڈ: منظوری | perm.cycle | 1 | 64x34 | PARTIAL | disabled: سیکرٹری جنرل کا مکمل اختیار ہمیشہ برقرار رہتا ہے |
| EL-STAFF-599 | `/admin/staff` | ur | button | Secretary General · رابطہ کاری اور رضامندی: منظوری | perm.cycle | 1 | 64x34 | PARTIAL | disabled: سیکرٹری جنرل کا مکمل اختیار ہمیشہ برقرار رہتا ہے |
| EL-STAFF-600 | `/admin/staff` | ur | button | Secretary General · رپورٹس اور مصنوعی ذہانت: منظوری | perm.cycle | 1 | 64x34 | PARTIAL | disabled: سیکرٹری جنرل کا مکمل اختیار ہمیشہ برقرار رہتا ہے |
| EL-STAFF-601 | `/admin/staff` | ur | button | Secretary General · رکنیت کی درخواستیں: منظوری | perm.cycle | 1 | 64x34 | PARTIAL | disabled: سیکرٹری جنرل کا مکمل اختیار ہمیشہ برقرار رہتا ہے |
| EL-STAFF-602 | `/admin/staff` | ur | button | Secretary General · سرٹیفکیٹس: منظوری | perm.cycle | 1 | 64x34 | PARTIAL | disabled: سیکرٹری جنرل کا مکمل اختیار ہمیشہ برقرار رہتا ہے |
| EL-STAFF-603 | `/admin/staff` | ur | button | Secretary General · سروس درخواستیں اور دستخط: منظوری | perm.cycle | 1 | 64x34 | PARTIAL | disabled: سیکرٹری جنرل کا مکمل اختیار ہمیشہ برقرار رہتا ہے |
| EL-STAFF-604 | `/admin/staff` | ur | button | Secretary General · سروسز کی ترتیب اور سیٹنگز: منظوری | perm.cycle | 1 | 64x34 | PARTIAL | disabled: سیکرٹری جنرل کا مکمل اختیار ہمیشہ برقرار رہتا ہے |
| EL-STAFF-605 | `/admin/staff` | ur | button | Secretary General · عملہ اور آڈٹ: منظوری | perm.cycle | 1 | 64x34 | PARTIAL | disabled: سیکرٹری جنرل کا مکمل اختیار ہمیشہ برقرار رہتا ہے |
| EL-STAFF-606 | `/admin/staff` | ur | button | Secretary General · کمیٹی کے فیصلے: منظوری | perm.cycle | 1 | 64x34 | PARTIAL | disabled: سیکرٹری جنرل کا مکمل اختیار ہمیشہ برقرار رہتا ہے |
| EL-STAFF-607 | `/admin/staff` | ur | button | Secretary General · ووٹر لسٹ: منظوری | perm.cycle | 1 | 64x34 | PARTIAL | disabled: سیکرٹری جنرل کا مکمل اختیار ہمیشہ برقرار رہتا ہے |
| EL-STAFF-608 | `/admin/staff` | ur | button | Services Officer | staff.edit | 1 | 109x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-609 | `/admin/staff` | ur | button | Services Officer · ادائیگیاں اور واؤچر: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-610 | `/admin/staff` | ur | button | Services Officer · اراکین کا رجسٹر: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-611 | `/admin/staff` | ur | button | Services Officer · اکاؤنٹس: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-612 | `/admin/staff` | ur | button | Services Officer · بزنس ڈائریکٹری: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-613 | `/admin/staff` | ur | button | Services Officer · تبدیلی کے اقرار نامے: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-614 | `/admin/staff` | ur | button | Services Officer · تقریبات، شکایات اور مواد: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-615 | `/admin/staff` | ur | button | Services Officer · دستاویزات اور QR کوڈ: ترمیم | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-616 | `/admin/staff` | ur | button | Services Officer · ڈیش بورڈ: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-617 | `/admin/staff` | ur | button | Services Officer · رابطہ کاری اور رضامندی: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-618 | `/admin/staff` | ur | button | Services Officer · رپورٹس اور مصنوعی ذہانت: دیکھنا | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-619 | `/admin/staff` | ur | button | Services Officer · رکنیت کی درخواستیں: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-620 | `/admin/staff` | ur | button | Services Officer · سرٹیفکیٹس: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-621 | `/admin/staff` | ur | button | Services Officer · سروس درخواستیں اور دستخط: ترمیم | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-622 | `/admin/staff` | ur | button | Services Officer · سروسز کی ترتیب اور سیٹنگز: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-623 | `/admin/staff` | ur | button | Services Officer · عملہ اور آڈٹ: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-624 | `/admin/staff` | ur | button | Services Officer · کمیٹی کے فیصلے: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-625 | `/admin/staff` | ur | button | Services Officer · ووٹر لسٹ: رسائی نہیں | perm.cycle | 1 | 64x34 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-626 | `/admin/staff` | ur | button | SG | staff.edit | 1 | 44x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-627 | `/admin/staff` | ur | button | Visa Guarantee (China) | perm.service.pick | 1 | 190x44 | PASS | exercised by a functional spec |
| EL-STAFF-628 | `/admin/staff` | ur | button | Visa Recommendation | perm.service.pick | 1 | 187x44 | PASS | exercised by a functional spec |
| EL-STAFF-629 | `/admin/staff` | ur | button | آخری سرگرمی کے لحاظ سے ترتیب | table.sort | 1 | 59x48 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-630 | `/admin/staff` | ur | button | افسران محفوظ کریں | perm.service | 1 | 103x47 | PASS | exercised by a functional spec |
| EL-STAFF-631 | `/admin/staff` | ur | button | ای میل کے لحاظ سے ترتیب | table.sort | 1 | 44x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-632 | `/admin/staff` | ur | button | پاس ورڈ دکھائیں | password.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-STAFF-633 | `/admin/staff` | ur | button | حیثیت کے لحاظ سے ترتیب | table.sort | 1 | 44x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-634 | `/admin/staff` | ur | button | رسائی محفوظ کریں | perm.person | 1 | 97x47 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-635 | `/admin/staff` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-STAFF-636 | `/admin/staff` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-STAFF-637 | `/admin/staff` | ur | button | سینیارٹی کے لحاظ سے ترتیب | table.sort | 1 | 44x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-638 | `/admin/staff` | ur | button | طے شدہ حدود بحال کریں | perm.reset | 1 | 154x49 | PASS | exercised by a functional spec |
| EL-STAFF-639 | `/admin/staff` | ur | button | عملے کو ای میل سے مدعو کریں | staff.invite | 1 | 171x47 | PASS | exercised by a functional spec |
| EL-STAFF-640 | `/admin/staff` | ur | button | عہدہ شامل کریں | perm.designation | 1 | 93x47 | PASS | exercised by a functional spec |
| EL-STAFF-641 | `/admin/staff` | ur | button | عہدہ کے لحاظ سے ترتیب | table.sort | 1 | 44x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-642 | `/admin/staff` | ur | button | محفوظ کریں | perm.save | 1 | 73x49 | PASS | exercised by a functional spec |
| EL-STAFF-643 | `/admin/staff` | ur | button | نام کے لحاظ سے ترتیب | table.sort | 1 | 44x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-644 | `/admin/staff` | ur | button | واپس | perm.undo | 1 | 52x49 | PASS | exercised by a functional spec |
| EL-STAFF-645 | `/admin/staff` | ur | input:checkbox | Acceptance Staff — Auditor (read-only) · Auditor (read-only) |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-646 | `/admin/staff` | ur | input:checkbox | Acceptance Staff — Deputy Secretary — Membership · Deputy Secretary — Membership |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-647 | `/admin/staff` | ur | input:checkbox | Acceptance Staff — Membership Committee Member · Membership Committee Member |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-648 | `/admin/staff` | ur | input:checkbox | Accounts Officer · Accounts Officer |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-649 | `/admin/staff` | ur | input:checkbox | Auditor · Auditor (read-only) |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-650 | `/admin/staff` | ur | input:checkbox | Committee Secretary · Committee Secretary |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-651 | `/admin/staff` | ur | input:checkbox | E2E Convener 5a407e56 · Membership Committee Convener |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-652 | `/admin/staff` | ur | input:checkbox | E2E Convener adf6afb6 · Membership Committee Convener |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-653 | `/admin/staff` | ur | input:checkbox | E2E Convener b88952ae · Membership Committee Convener |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-654 | `/admin/staff` | ur | input:checkbox | E2E IT Convener 5a407e56 · IT Convener |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-655 | `/admin/staff` | ur | input:checkbox | E2E IT Convener adf6afb6 · IT Convener |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-656 | `/admin/staff` | ur | input:checkbox | E2E IT Convener b88952ae · IT Convener |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-657 | `/admin/staff` | ur | input:checkbox | E2E Officer 5a407e56 · Membership Officer |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-658 | `/admin/staff` | ur | input:checkbox | E2E Officer adf6afb6 · Membership Officer |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-659 | `/admin/staff` | ur | input:checkbox | E2E Officer b88952ae · Membership Officer |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-660 | `/admin/staff` | ur | input:checkbox | E2E President 5a407e56 · President (Signatory) |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-661 | `/admin/staff` | ur | input:checkbox | E2E President adf6afb6 · President (Signatory) |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-662 | `/admin/staff` | ur | input:checkbox | E2E President b88952ae · President (Signatory) |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-663 | `/admin/staff` | ur | input:checkbox | Membership Officer · Membership Officer |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-664 | `/admin/staff` | ur | input:checkbox | President · President (Signatory) |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-665 | `/admin/staff` | ur | input:checkbox | Services Officer · Services Officer |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-666 | `/admin/staff` | ur | input:password | آپ کا پاس ورڈ |  | 1 | 532x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-667 | `/admin/staff` | ur | input:search | عملہ تلاش کریں… |  | 1 | 970x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-668 | `/admin/staff` | ur | input:text | عہدہ |  | 1 | 532x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-669 | `/admin/staff` | ur | input:text | وجہ |  | 1 | 532x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-670 | `/admin/staff` | ur | link | آڈٹ ریکارڈ | /ur/admin/audit | 1 | 98x52 | PASS | target answered 200 |
| EL-STAFF-671 | `/admin/staff` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-STAFF-672 | `/admin/staff` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-STAFF-673 | `/admin/staff` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-STAFF-674 | `/admin/staff` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-STAFF-675 | `/admin/staff` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-STAFF-676 | `/admin/staff` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-STAFF-677 | `/admin/staff` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-STAFF-678 | `/admin/staff` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-STAFF-679 | `/admin/staff` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-STAFF-680 | `/admin/staff` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-STAFF-681 | `/admin/staff` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-STAFF-682 | `/admin/staff` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-STAFF-683 | `/admin/staff` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-STAFF-684 | `/admin/staff` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-STAFF-685 | `/admin/staff` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-STAFF-686 | `/admin/staff` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-STAFF-687 | `/admin/staff` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-STAFF-688 | `/admin/staff` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-STAFF-689 | `/admin/staff` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-STAFF-690 | `/admin/staff` | ur | select | ان کی حدود سے شروع کریںکوئی رسائی نہیںPresident (Signatory)IT ConvenerDeputy Secretary — M |  | 1 | 532x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-691 | `/admin/staff` | ur | select | حیثیتتمام حیثیتیںفعالغیر فعال |  | 1 | 92x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-692 | `/admin/staff` | ur | select | رسائیعہدے کے مطابقرسائی نہیںدیکھناترمیممنظوری |  | 1 | 532x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-693 | `/admin/staff` | ur | select | سیکشنڈیش بورڈرکنیت کی درخواستیںکمیٹی کے فیصلےسرٹیفکیٹساراکین کا رجسٹرسروس درخواستیں اور دس |  | 1 | 532x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-694 | `/admin/staff` | ur | select | سینیارٹیL1L2L3L4 |  | 1 | 532x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-STAFF-695 | `/admin/staff` | ur | select | فردE2E President 5a407e56 · President (Signatory)E2E President adf6afb6 · President (Signa |  | 1 | 532x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-CERT-001 | `/admin/temp` | en | button | Light or dark theme | theme.toggle | 7 | 44x44 | PASS | exercised by a functional spec |
| EL-CERT-002 | `/admin/temp` | en | button | Printing & Receiving |  | 7 | 200x46 | PARTIAL | disabled: Being built — milestone M6b |
| EL-CERT-003 | `/admin/temp` | en | button | Serial Register |  | 7 | 158x46 | PARTIAL | disabled: Being built — milestone M6b |
| EL-CERT-004 | `/admin/temp` | en | button | Sign out | logout | 7 | 116x44 | PASS | exercised by a functional spec |
| EL-CERT-005 | `/admin/temp` | en | link | Accounts | /admin/finance | 7 | 238x44 | PASS | target answered 200 |
| EL-CERT-006 | `/admin/temp` | en | link | Ask MCCI AI | /admin/help | 7 | 238x44 | PASS | target answered 200 |
| EL-CERT-007 | `/admin/temp` | en | link | Business Directory | /admin/business-directory | 7 | 238x44 | PASS | target answered 200 |
| EL-CERT-008 | `/admin/temp` | en | link | Certificates | /admin/temp | 7 | 238x44 | PASS | target answered 200 |
| EL-CERT-009 | `/admin/temp` | en | link | Complaint Desk | /admin/complaints | 7 | 238x44 | PASS | target answered 200 |
| EL-CERT-010 | `/admin/temp` | en | link | Content & Messaging | /admin/content | 7 | 238x44 | PASS | target answered 200 |
| EL-CERT-011 | `/admin/temp` | en | link | Documents & QR | /admin/documents | 7 | 238x44 | PASS | target answered 200 |
| EL-CERT-012 | `/admin/temp` | en | link | Events & Meetings | /admin/events | 7 | 238x44 | PASS | target answered 200 |
| EL-CERT-013 | `/admin/temp` | en | link | MCCI Admin Secretariat Panel | /admin | 7 | 238x82 | PASS | target answered 200 |
| EL-CERT-014 | `/admin/temp` | en | link | Members Register | /admin/members | 7 | 238x44 | PASS | target answered 200 |
| EL-CERT-015 | `/admin/temp` | en | link | Membership Pipeline | /admin/requests | 7 | 238x44 | PASS | target answered 200 |
| EL-CERT-016 | `/admin/temp` | en | link | Payments | /admin/payments | 7 | 238x44 | PASS | target answered 200 |
| EL-CERT-017 | `/admin/temp` | en | link | QR registry | nav | 7 | 140x44 | PASS | target answered 200 |
| EL-CERT-018 | `/admin/temp` | en | link | Reports & AI | /admin/reports | 7 | 238x44 | PASS | target answered 200 |
| EL-CERT-019 | `/admin/temp` | en | link | Service Requests | /admin/applications | 7 | 238x44 | PASS | target answered 200 |
| EL-CERT-020 | `/admin/temp` | en | link | Services & Integrations | /admin/services | 7 | 238x44 | PASS | target answered 200 |
| EL-CERT-021 | `/admin/temp` | en | link | Settings | /admin/settings | 7 | 238x44 | PASS | target answered 200 |
| EL-CERT-022 | `/admin/temp` | en | link | Skip to content | #main | 7 | 144x47 | PASS | in-page anchor |
| EL-CERT-023 | `/admin/temp` | en | link | Staff & Audit | /admin/staff | 7 | 238x44 | PASS | target answered 200 |
| EL-CERT-024 | `/admin/temp` | en | link | WhatsApp | /admin/whatsapp | 7 | 238x44 | PASS | target answered 200 |
| EL-CERT-025 | `/admin/temp` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-CERT-026 | `/admin/temp` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-CERT-027 | `/admin/temp` | ur | button | سیریل رجسٹر |  | 1 | 104x52 | PARTIAL | disabled: تیاری میں — مرحلہ M6b |
| EL-CERT-028 | `/admin/temp` | ur | button | طباعت اور وصولی |  | 1 | 120x52 | PARTIAL | disabled: تیاری میں — مرحلہ M6b |
| EL-CERT-029 | `/admin/temp` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-CERT-030 | `/admin/temp` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-CERT-031 | `/admin/temp` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-CERT-032 | `/admin/temp` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-CERT-033 | `/admin/temp` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-CERT-034 | `/admin/temp` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-CERT-035 | `/admin/temp` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-CERT-036 | `/admin/temp` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-CERT-037 | `/admin/temp` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-CERT-038 | `/admin/temp` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-CERT-039 | `/admin/temp` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-CERT-040 | `/admin/temp` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-CERT-041 | `/admin/temp` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-CERT-042 | `/admin/temp` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-CERT-043 | `/admin/temp` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-CERT-044 | `/admin/temp` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-CERT-045 | `/admin/temp` | ur | link | کیو آر رجسٹر | nav | 1 | 106x49 | PASS | target answered 200 |
| EL-CERT-046 | `/admin/temp` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-CERT-047 | `/admin/temp` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-CERT-048 | `/admin/temp` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-001 | `/admin/whatsapp/campaigns/history` | en | button | Light or dark theme | theme.toggle | 5 | 44x44 | PASS | exercised by a functional spec |
| EL-WHATSAPP-002 | `/admin/whatsapp/campaigns/history` | en | button | Sign out | logout | 5 | 116x44 | PASS | exercised by a functional spec |
| EL-WHATSAPP-003 | `/admin/whatsapp/campaigns/history` | en | link | Accounts | /admin/finance | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-004 | `/admin/whatsapp/campaigns/history` | en | link | Ask MCCI AI | /admin/help | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-005 | `/admin/whatsapp/campaigns/history` | en | link | Business Directory | /admin/business-directory | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-006 | `/admin/whatsapp/campaigns/history` | en | link | Campaign History | /admin/whatsapp/campaigns/history | 5 | 185x46 | PASS | target answered 200 |
| EL-WHATSAPP-007 | `/admin/whatsapp/campaigns/history` | en | link | Campaigns | /admin/whatsapp/campaigns | 5 | 137x46 | PASS | target answered 200 |
| EL-WHATSAPP-008 | `/admin/whatsapp/campaigns/history` | en | link | Certificates | /admin/temp | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-009 | `/admin/whatsapp/campaigns/history` | en | link | Complaint Desk | /admin/complaints | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-010 | `/admin/whatsapp/campaigns/history` | en | link | Consent | /admin/whatsapp/consent | 5 | 116x46 | PASS | target answered 200 |
| EL-WHATSAPP-011 | `/admin/whatsapp/campaigns/history` | en | link | Content & Messaging | /admin/content | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-012 | `/admin/whatsapp/campaigns/history` | en | link | Documents & QR | /admin/documents | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-013 | `/admin/whatsapp/campaigns/history` | en | link | Events & Meetings | /admin/events | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-014 | `/admin/whatsapp/campaigns/history` | en | link | Inbox | /admin/whatsapp/inbox | 5 | 95x46 | PASS | target answered 200 |
| EL-WHATSAPP-015 | `/admin/whatsapp/campaigns/history` | en | link | MCCI Admin Secretariat Panel | /admin | 5 | 238x82 | PASS | target answered 200 |
| EL-WHATSAPP-016 | `/admin/whatsapp/campaigns/history` | en | link | Members Register | /admin/members | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-017 | `/admin/whatsapp/campaigns/history` | en | link | Membership Pipeline | /admin/requests | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-018 | `/admin/whatsapp/campaigns/history` | en | link | New Message | /admin/whatsapp/campaigns/new | 5 | 156x46 | PASS | target answered 200 |
| EL-WHATSAPP-019 | `/admin/whatsapp/campaigns/history` | en | link | Payments | /admin/payments | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-020 | `/admin/whatsapp/campaigns/history` | en | link | Readiness | /admin/whatsapp/readiness | 5 | 129x46 | PASS | target answered 200 |
| EL-WHATSAPP-021 | `/admin/whatsapp/campaigns/history` | en | link | Reports & AI | /admin/reports | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-022 | `/admin/whatsapp/campaigns/history` | en | link | Segments | /admin/business-directory/segments | 5 | 129x46 | PASS | target answered 200 |
| EL-WHATSAPP-023 | `/admin/whatsapp/campaigns/history` | en | link | Service Requests | /admin/applications | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-024 | `/admin/whatsapp/campaigns/history` | en | link | Services & Integrations | /admin/services | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-025 | `/admin/whatsapp/campaigns/history` | en | link | Settings | /admin/settings | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-026 | `/admin/whatsapp/campaigns/history` | en | link | Settings | /admin/whatsapp/settings | 5 | 115x46 | PASS | target answered 200 |
| EL-WHATSAPP-027 | `/admin/whatsapp/campaigns/history` | en | link | Skip to content | #main | 5 | 144x47 | PASS | in-page anchor |
| EL-WHATSAPP-028 | `/admin/whatsapp/campaigns/history` | en | link | Staff & Audit | /admin/staff | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-029 | `/admin/whatsapp/campaigns/history` | en | link | Templates | /admin/whatsapp/templates | 5 | 130x46 | PASS | target answered 200 |
| EL-WHATSAPP-030 | `/admin/whatsapp/campaigns/history` | en | link | WhatsApp | /admin/whatsapp | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-031 | `/admin/whatsapp/campaigns/history` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-WHATSAPP-032 | `/admin/whatsapp/campaigns/history` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-WHATSAPP-033 | `/admin/whatsapp/campaigns/history` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-034 | `/admin/whatsapp/campaigns/history` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-035 | `/admin/whatsapp/campaigns/history` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-036 | `/admin/whatsapp/campaigns/history` | ur | link | ان باکس | /ur/admin/whatsapp/inbox | 1 | 88x52 | PASS | target answered 200 |
| EL-WHATSAPP-037 | `/admin/whatsapp/campaigns/history` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-WHATSAPP-038 | `/admin/whatsapp/campaigns/history` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-039 | `/admin/whatsapp/campaigns/history` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-040 | `/admin/whatsapp/campaigns/history` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-041 | `/admin/whatsapp/campaigns/history` | ur | link | ترتیبات | /ur/admin/whatsapp/settings | 1 | 82x52 | PASS | target answered 200 |
| EL-WHATSAPP-042 | `/admin/whatsapp/campaigns/history` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-043 | `/admin/whatsapp/campaigns/history` | ur | link | تیاری | /ur/admin/whatsapp/readiness | 1 | 74x52 | PASS | target answered 200 |
| EL-WHATSAPP-044 | `/admin/whatsapp/campaigns/history` | ur | link | ٹیمپلیٹس | /ur/admin/whatsapp/templates | 1 | 88x52 | PASS | target answered 200 |
| EL-WHATSAPP-045 | `/admin/whatsapp/campaigns/history` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-046 | `/admin/whatsapp/campaigns/history` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-047 | `/admin/whatsapp/campaigns/history` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-048 | `/admin/whatsapp/campaigns/history` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-049 | `/admin/whatsapp/campaigns/history` | ur | link | رضامندی | /ur/admin/whatsapp/consent | 1 | 91x52 | PASS | target answered 200 |
| EL-WHATSAPP-050 | `/admin/whatsapp/campaigns/history` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-051 | `/admin/whatsapp/campaigns/history` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-052 | `/admin/whatsapp/campaigns/history` | ur | link | سیگمنٹس | /ur/admin/business-directory/segments | 1 | 86x52 | PASS | target answered 200 |
| EL-WHATSAPP-053 | `/admin/whatsapp/campaigns/history` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-054 | `/admin/whatsapp/campaigns/history` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-055 | `/admin/whatsapp/campaigns/history` | ur | link | مہمات | /ur/admin/whatsapp/campaigns | 1 | 79x52 | PASS | target answered 200 |
| EL-WHATSAPP-056 | `/admin/whatsapp/campaigns/history` | ur | link | مہمات کی تاریخ | /ur/admin/whatsapp/campaigns/history | 1 | 115x52 | PASS | target answered 200 |
| EL-WHATSAPP-057 | `/admin/whatsapp/campaigns/history` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-058 | `/admin/whatsapp/campaigns/history` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-WHATSAPP-059 | `/admin/whatsapp/campaigns/history` | ur | link | نیا پیغام | /ur/admin/whatsapp/campaigns/new | 1 | 82x52 | PASS | target answered 200 |
| EL-WHATSAPP-060 | `/admin/whatsapp/campaigns/history` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-061 | `/admin/whatsapp/campaigns/new` | en | button | Check the audience | wa.master.audience | 3 | 175x44 | PASS | exercised by a functional spec |
| EL-WHATSAPP-062 | `/admin/whatsapp/campaigns/new` | en | button | Create draft | wa.master.create | 3 | 143x44 | PASS | exercised by a functional spec |
| EL-WHATSAPP-063 | `/admin/whatsapp/campaigns/new` | en | button | Light or dark theme | theme.toggle | 3 | 44x44 | PASS | exercised by a functional spec |
| EL-WHATSAPP-064 | `/admin/whatsapp/campaigns/new` | en | button | Sign out | logout | 3 | 116x44 | PASS | exercised by a functional spec |
| EL-WHATSAPP-065 | `/admin/whatsapp/campaigns/new` | en | disclosure | More detailed filters | wa.advanced | 3 | 1080x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-066 | `/admin/whatsapp/campaigns/new` | en | input:radio | Approved template |  | 3 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-067 | `/admin/whatsapp/campaigns/new` | en | input:radio | English |  | 3 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-068 | `/admin/whatsapp/campaigns/new` | en | input:radio | Everyone matching the filters above |  | 3 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-069 | `/admin/whatsapp/campaigns/new` | en | input:radio | Free text |  | 3 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-070 | `/admin/whatsapp/campaigns/new` | en | input:radio | MCCI master template |  | 3 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-071 | `/admin/whatsapp/campaigns/new` | en | input:radio | Nothing selected in the directory |  | 3 | 20x20 | PARTIAL | disabled: Nothing selected in the directory |
| EL-WHATSAPP-072 | `/admin/whatsapp/campaigns/new` | en | input:radio | Urdu |  | 3 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-073 | `/admin/whatsapp/campaigns/new` | en | input:text | Information or registration link |  | 3 | 1080x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-074 | `/admin/whatsapp/campaigns/new` | en | input:text | Name |  | 3 | 535x44 | PASS | exercised by a functional spec |
| EL-WHATSAPP-075 | `/admin/whatsapp/campaigns/new` | en | input:text | Purpose |  | 3 | 535x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-076 | `/admin/whatsapp/campaigns/new` | en | input:text | Subject |  | 3 | 172x44 | PASS | exercised by a functional spec |
| EL-WHATSAPP-077 | `/admin/whatsapp/campaigns/new` | en | input:text | Summary |  | 3 | 1080x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-078 | `/admin/whatsapp/campaigns/new` | en | link | Accounts | /admin/finance | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-079 | `/admin/whatsapp/campaigns/new` | en | link | Any | wa.tab | 3 | 60x44 | PASS | target answered 200 |
| EL-WHATSAPP-080 | `/admin/whatsapp/campaigns/new` | en | link | Ask MCCI AI | /admin/help | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-081 | `/admin/whatsapp/campaigns/new` | en | link | Associate | wa.tab | 3 | 102x44 | PASS | target answered 200 |
| EL-WHATSAPP-082 | `/admin/whatsapp/campaigns/new` | en | link | Business Directory | /admin/business-directory | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-083 | `/admin/whatsapp/campaigns/new` | en | link | Campaign History | /admin/whatsapp/campaigns/history | 3 | 185x46 | PASS | target answered 200 |
| EL-WHATSAPP-084 | `/admin/whatsapp/campaigns/new` | en | link | Campaigns | /admin/whatsapp/campaigns | 3 | 137x46 | PASS | target answered 200 |
| EL-WHATSAPP-085 | `/admin/whatsapp/campaigns/new` | en | link | Certificates | /admin/temp | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-086 | `/admin/whatsapp/campaigns/new` | en | link | Clear all | wa.tabs.clear | 3 | 77x44 | PASS | target answered 200 |
| EL-WHATSAPP-087 | `/admin/whatsapp/campaigns/new` | en | link | Complaint Desk | /admin/complaints | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-088 | `/admin/whatsapp/campaigns/new` | en | link | Consent | /admin/whatsapp/consent | 3 | 116x46 | PASS | target answered 200 |
| EL-WHATSAPP-089 | `/admin/whatsapp/campaigns/new` | en | link | Content & Messaging | /admin/content | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-090 | `/admin/whatsapp/campaigns/new` | en | link | Corporate | wa.tab | 3 | 105x44 | PASS | target answered 200 |
| EL-WHATSAPP-091 | `/admin/whatsapp/campaigns/new` | en | link | Current | wa.tab | 3 | 86x44 | PASS | target answered 200 |
| EL-WHATSAPP-092 | `/admin/whatsapp/campaigns/new` | en | link | Documents & QR | /admin/documents | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-093 | `/admin/whatsapp/campaigns/new` | en | link | Due soon | wa.tab | 3 | 97x44 | PASS | target answered 200 |
| EL-WHATSAPP-094 | `/admin/whatsapp/campaigns/new` | en | link | Events & Meetings | /admin/events | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-095 | `/admin/whatsapp/campaigns/new` | en | link | Granted | wa.tab | 3 | 91x44 | PASS | target answered 200 |
| EL-WHATSAPP-096 | `/admin/whatsapp/campaigns/new` | en | link | Inbox | /admin/whatsapp/inbox | 3 | 95x46 | PASS | target answered 200 |
| EL-WHATSAPP-097 | `/admin/whatsapp/campaigns/new` | en | link | Lapsed | wa.tab | 3 | 84x44 | PASS | target answered 200 |
| EL-WHATSAPP-098 | `/admin/whatsapp/campaigns/new` | en | link | Manufacturing | wa.tab | 3 | 134x44 | PASS | target answered 200 |
| EL-WHATSAPP-099 | `/admin/whatsapp/campaigns/new` | en | link | MCCI Admin Secretariat Panel | /admin | 3 | 238x82 | PASS | target answered 200 |
| EL-WHATSAPP-100 | `/admin/whatsapp/campaigns/new` | en | link | Members Register | /admin/members | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-101 | `/admin/whatsapp/campaigns/new` | en | link | Membership Pipeline | /admin/requests | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-102 | `/admin/whatsapp/campaigns/new` | en | link | New Message | /admin/whatsapp/campaigns/new | 3 | 156x46 | PASS | target answered 200 |
| EL-WHATSAPP-103 | `/admin/whatsapp/campaigns/new` | en | link | Non-manufacturing | wa.tab | 3 | 170x44 | PASS | target answered 200 |
| EL-WHATSAPP-104 | `/admin/whatsapp/campaigns/new` | en | link | Not recorded | wa.tab | 3 | 126x44 | PASS | target answered 200 |
| EL-WHATSAPP-105 | `/admin/whatsapp/campaigns/new` | en | link | Payments | /admin/payments | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-106 | `/admin/whatsapp/campaigns/new` | en | link | Readiness | /admin/whatsapp/readiness | 3 | 129x46 | PASS | target answered 200 |
| EL-WHATSAPP-107 | `/admin/whatsapp/campaigns/new` | en | link | Reports & AI | /admin/reports | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-108 | `/admin/whatsapp/campaigns/new` | en | link | Segments | /admin/business-directory/segments | 3 | 129x46 | PASS | target answered 200 |
| EL-WHATSAPP-109 | `/admin/whatsapp/campaigns/new` | en | link | Service Requests | /admin/applications | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-110 | `/admin/whatsapp/campaigns/new` | en | link | Services & Integrations | /admin/services | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-111 | `/admin/whatsapp/campaigns/new` | en | link | Settings | /admin/settings | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-112 | `/admin/whatsapp/campaigns/new` | en | link | Settings | /admin/whatsapp/settings | 3 | 115x46 | PASS | target answered 200 |
| EL-WHATSAPP-113 | `/admin/whatsapp/campaigns/new` | en | link | Skip to content | #main | 3 | 144x47 | PASS | in-page anchor |
| EL-WHATSAPP-114 | `/admin/whatsapp/campaigns/new` | en | link | Staff & Audit | /admin/staff | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-115 | `/admin/whatsapp/campaigns/new` | en | link | Templates | /admin/whatsapp/templates | 3 | 130x46 | PASS | target answered 200 |
| EL-WHATSAPP-116 | `/admin/whatsapp/campaigns/new` | en | link | WhatsApp | /admin/whatsapp | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-117 | `/admin/whatsapp/campaigns/new` | en | select | TemplateOfficial MCCI announcementsMembership and administrative updatesEvents and invitat |  | 3 | 172x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-118 | `/admin/whatsapp/campaigns/new` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-WHATSAPP-119 | `/admin/whatsapp/campaigns/new` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-WHATSAPP-120 | `/admin/whatsapp/campaigns/new` | ur | button | سامعین دیکھیں | wa.master.audience | 1 | 99x47 | PASS | exercised by a functional spec |
| EL-WHATSAPP-121 | `/admin/whatsapp/campaigns/new` | ur | button | مسودہ بنائیں | wa.master.create | 1 | 97x47 | PASS | exercised by a functional spec |
| EL-WHATSAPP-122 | `/admin/whatsapp/campaigns/new` | ur | disclosure | مزید تفصیلی فلٹر | wa.advanced | 1 | 1080x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-123 | `/admin/whatsapp/campaigns/new` | ur | input:radio | آزاد متن |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-124 | `/admin/whatsapp/campaigns/new` | ur | input:radio | اردو |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-125 | `/admin/whatsapp/campaigns/new` | ur | input:radio | انگریزی |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-126 | `/admin/whatsapp/campaigns/new` | ur | input:radio | اوپر کے فلٹر سے مطابقت رکھنے والے سب |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-127 | `/admin/whatsapp/campaigns/new` | ur | input:radio | ایم سی سی آئی ماسٹر سانچہ |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-128 | `/admin/whatsapp/campaigns/new` | ur | input:radio | ڈائریکٹری میں کچھ منتخب نہیں |  | 1 | 20x20 | PARTIAL | disabled: ڈائریکٹری میں کچھ منتخب نہیں |
| EL-WHATSAPP-129 | `/admin/whatsapp/campaigns/new` | ur | input:radio | منظور شدہ ٹیمپلیٹ |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-130 | `/admin/whatsapp/campaigns/new` | ur | input:text | خلاصہ |  | 1 | 1080x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-131 | `/admin/whatsapp/campaigns/new` | ur | input:text | معلومات یا رجسٹریشن کا لنک |  | 1 | 1080x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-132 | `/admin/whatsapp/campaigns/new` | ur | input:text | مقصد |  | 1 | 535x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-133 | `/admin/whatsapp/campaigns/new` | ur | input:text | موضوع |  | 1 | 172x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-134 | `/admin/whatsapp/campaigns/new` | ur | input:text | نام |  | 1 | 535x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-135 | `/admin/whatsapp/campaigns/new` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-136 | `/admin/whatsapp/campaigns/new` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-137 | `/admin/whatsapp/campaigns/new` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-138 | `/admin/whatsapp/campaigns/new` | ur | link | ان باکس | /ur/admin/whatsapp/inbox | 1 | 88x52 | PASS | target answered 200 |
| EL-WHATSAPP-139 | `/admin/whatsapp/campaigns/new` | ur | link | ایسوسی ایٹ | wa.tab | 1 | 76x44 | PASS | target answered 200 |
| EL-WHATSAPP-140 | `/admin/whatsapp/campaigns/new` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-WHATSAPP-141 | `/admin/whatsapp/campaigns/new` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-142 | `/admin/whatsapp/campaigns/new` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-143 | `/admin/whatsapp/campaigns/new` | ur | link | تجدید قریب | wa.tab | 1 | 78x44 | PASS | target answered 200 |
| EL-WHATSAPP-144 | `/admin/whatsapp/campaigns/new` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-145 | `/admin/whatsapp/campaigns/new` | ur | link | ترتیبات | /ur/admin/whatsapp/settings | 1 | 82x52 | PASS | target answered 200 |
| EL-WHATSAPP-146 | `/admin/whatsapp/campaigns/new` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-147 | `/admin/whatsapp/campaigns/new` | ur | link | تیاری | /ur/admin/whatsapp/readiness | 1 | 74x52 | PASS | target answered 200 |
| EL-WHATSAPP-148 | `/admin/whatsapp/campaigns/new` | ur | link | ٹیمپلیٹس | /ur/admin/whatsapp/templates | 1 | 88x52 | PASS | target answered 200 |
| EL-WHATSAPP-149 | `/admin/whatsapp/campaigns/new` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-150 | `/admin/whatsapp/campaigns/new` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-151 | `/admin/whatsapp/campaigns/new` | ur | link | درج نہیں | wa.tab | 1 | 69x44 | PASS | target answered 200 |
| EL-WHATSAPP-152 | `/admin/whatsapp/campaigns/new` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-153 | `/admin/whatsapp/campaigns/new` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-154 | `/admin/whatsapp/campaigns/new` | ur | link | رضامندی | /ur/admin/whatsapp/consent | 1 | 91x52 | PASS | target answered 200 |
| EL-WHATSAPP-155 | `/admin/whatsapp/campaigns/new` | ur | link | رضامندی دی گئی | wa.tab | 1 | 94x44 | PASS | target answered 200 |
| EL-WHATSAPP-156 | `/admin/whatsapp/campaigns/new` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-157 | `/admin/whatsapp/campaigns/new` | ur | link | سب صاف کریں | wa.tabs.clear | 1 | 82x44 | PASS | target answered 200 |
| EL-WHATSAPP-158 | `/admin/whatsapp/campaigns/new` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-159 | `/admin/whatsapp/campaigns/new` | ur | link | سیگمنٹس | /ur/admin/business-directory/segments | 1 | 86x52 | PASS | target answered 200 |
| EL-WHATSAPP-160 | `/admin/whatsapp/campaigns/new` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-161 | `/admin/whatsapp/campaigns/new` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-162 | `/admin/whatsapp/campaigns/new` | ur | link | غیر مینوفیکچرنگ | wa.tab | 1 | 90x44 | PASS | target answered 200 |
| EL-WHATSAPP-163 | `/admin/whatsapp/campaigns/new` | ur | link | کارپوریٹ | wa.tab | 1 | 68x44 | PASS | target answered 200 |
| EL-WHATSAPP-164 | `/admin/whatsapp/campaigns/new` | ur | link | کوئی بھی | wa.tab | 1 | 63x44 | PASS | target answered 200 |
| EL-WHATSAPP-165 | `/admin/whatsapp/campaigns/new` | ur | link | مہمات | /ur/admin/whatsapp/campaigns | 1 | 79x52 | PASS | target answered 200 |
| EL-WHATSAPP-166 | `/admin/whatsapp/campaigns/new` | ur | link | مہمات کی تاریخ | /ur/admin/whatsapp/campaigns/history | 1 | 115x52 | PASS | target answered 200 |
| EL-WHATSAPP-167 | `/admin/whatsapp/campaigns/new` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-168 | `/admin/whatsapp/campaigns/new` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-WHATSAPP-169 | `/admin/whatsapp/campaigns/new` | ur | link | موجودہ | wa.tab | 1 | 58x44 | PASS | target answered 200 |
| EL-WHATSAPP-170 | `/admin/whatsapp/campaigns/new` | ur | link | میعاد گزر چکی | wa.tab | 1 | 81x44 | PASS | target answered 200 |
| EL-WHATSAPP-171 | `/admin/whatsapp/campaigns/new` | ur | link | مینوفیکچرنگ | wa.tab | 1 | 76x44 | PASS | target answered 200 |
| EL-WHATSAPP-172 | `/admin/whatsapp/campaigns/new` | ur | link | نیا پیغام | /ur/admin/whatsapp/campaigns/new | 1 | 82x52 | PASS | target answered 200 |
| EL-WHATSAPP-173 | `/admin/whatsapp/campaigns/new` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-174 | `/admin/whatsapp/campaigns/new` | ur | select | سانچہایم سی سی آئی کے سرکاری اعلاناترکنیت اور انتظامی اطلاعاتتقریبات اور دعوت نامےکاروباری |  | 1 | 172x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-175 | `/admin/whatsapp/campaigns/view` | en | button | Light or dark theme | theme.toggle | 5 | 44x44 | PASS | exercised by a functional spec |
| EL-WHATSAPP-176 | `/admin/whatsapp/campaigns/view` | en | button | Sign out | logout | 5 | 116x44 | PASS | exercised by a functional spec |
| EL-WHATSAPP-177 | `/admin/whatsapp/campaigns/view` | en | link | Accounts | /admin/finance | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-178 | `/admin/whatsapp/campaigns/view` | en | link | Ask MCCI AI | /admin/help | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-179 | `/admin/whatsapp/campaigns/view` | en | link | Back to campaigns | wa.back | 5 | 171x44 | PASS | target answered 200 |
| EL-WHATSAPP-180 | `/admin/whatsapp/campaigns/view` | en | link | Business Directory | /admin/business-directory | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-181 | `/admin/whatsapp/campaigns/view` | en | link | Certificates | /admin/temp | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-182 | `/admin/whatsapp/campaigns/view` | en | link | Complaint Desk | /admin/complaints | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-183 | `/admin/whatsapp/campaigns/view` | en | link | Content & Messaging | /admin/content | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-184 | `/admin/whatsapp/campaigns/view` | en | link | Documents & QR | /admin/documents | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-185 | `/admin/whatsapp/campaigns/view` | en | link | Events & Meetings | /admin/events | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-186 | `/admin/whatsapp/campaigns/view` | en | link | MCCI Admin Secretariat Panel | /admin | 5 | 238x82 | PASS | target answered 200 |
| EL-WHATSAPP-187 | `/admin/whatsapp/campaigns/view` | en | link | Members Register | /admin/members | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-188 | `/admin/whatsapp/campaigns/view` | en | link | Membership Pipeline | /admin/requests | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-189 | `/admin/whatsapp/campaigns/view` | en | link | Payments | /admin/payments | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-190 | `/admin/whatsapp/campaigns/view` | en | link | Reports & AI | /admin/reports | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-191 | `/admin/whatsapp/campaigns/view` | en | link | Service Requests | /admin/applications | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-192 | `/admin/whatsapp/campaigns/view` | en | link | Services & Integrations | /admin/services | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-193 | `/admin/whatsapp/campaigns/view` | en | link | Settings | /admin/settings | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-194 | `/admin/whatsapp/campaigns/view` | en | link | Skip to content | #main | 5 | 144x47 | PASS | in-page anchor |
| EL-WHATSAPP-195 | `/admin/whatsapp/campaigns/view` | en | link | Staff & Audit | /admin/staff | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-196 | `/admin/whatsapp/campaigns/view` | en | link | WhatsApp | /admin/whatsapp | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-197 | `/admin/whatsapp/campaigns/view` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-WHATSAPP-198 | `/admin/whatsapp/campaigns/view` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-WHATSAPP-199 | `/admin/whatsapp/campaigns/view` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-200 | `/admin/whatsapp/campaigns/view` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-201 | `/admin/whatsapp/campaigns/view` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-202 | `/admin/whatsapp/campaigns/view` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-WHATSAPP-203 | `/admin/whatsapp/campaigns/view` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-204 | `/admin/whatsapp/campaigns/view` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-205 | `/admin/whatsapp/campaigns/view` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-206 | `/admin/whatsapp/campaigns/view` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-207 | `/admin/whatsapp/campaigns/view` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-208 | `/admin/whatsapp/campaigns/view` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-209 | `/admin/whatsapp/campaigns/view` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-210 | `/admin/whatsapp/campaigns/view` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-211 | `/admin/whatsapp/campaigns/view` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-212 | `/admin/whatsapp/campaigns/view` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-213 | `/admin/whatsapp/campaigns/view` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-214 | `/admin/whatsapp/campaigns/view` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-215 | `/admin/whatsapp/campaigns/view` | ur | link | مہمات پر واپس | wa.back | 1 | 90x49 | PASS | target answered 200 |
| EL-WHATSAPP-216 | `/admin/whatsapp/campaigns/view` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-217 | `/admin/whatsapp/campaigns/view` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-WHATSAPP-218 | `/admin/whatsapp/campaigns/view` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-219 | `/admin/whatsapp/campaigns` | en | button | Light or dark theme | theme.toggle | 5 | 44x44 | PASS | exercised by a functional spec |
| EL-WHATSAPP-220 | `/admin/whatsapp/campaigns` | en | button | Sign out | logout | 5 | 116x44 | PASS | exercised by a functional spec |
| EL-WHATSAPP-221 | `/admin/whatsapp/campaigns` | en | link | Accounts | /admin/finance | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-222 | `/admin/whatsapp/campaigns` | en | link | Ask MCCI AI | /admin/help | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-223 | `/admin/whatsapp/campaigns` | en | link | Business Directory | /admin/business-directory | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-224 | `/admin/whatsapp/campaigns` | en | link | Campaign History | /admin/whatsapp/campaigns/history | 5 | 185x46 | PASS | target answered 200 |
| EL-WHATSAPP-225 | `/admin/whatsapp/campaigns` | en | link | Campaigns | /admin/whatsapp/campaigns | 5 | 137x46 | PASS | target answered 200 |
| EL-WHATSAPP-226 | `/admin/whatsapp/campaigns` | en | link | Certificates | /admin/temp | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-227 | `/admin/whatsapp/campaigns` | en | link | Complaint Desk | /admin/complaints | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-228 | `/admin/whatsapp/campaigns` | en | link | Consent | /admin/whatsapp/consent | 5 | 116x46 | PASS | target answered 200 |
| EL-WHATSAPP-229 | `/admin/whatsapp/campaigns` | en | link | Content & Messaging | /admin/content | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-230 | `/admin/whatsapp/campaigns` | en | link | Documents & QR | /admin/documents | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-231 | `/admin/whatsapp/campaigns` | en | link | Events & Meetings | /admin/events | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-232 | `/admin/whatsapp/campaigns` | en | link | Inbox | /admin/whatsapp/inbox | 5 | 95x46 | PASS | target answered 200 |
| EL-WHATSAPP-233 | `/admin/whatsapp/campaigns` | en | link | MCCI Admin Secretariat Panel | /admin | 5 | 238x82 | PASS | target answered 200 |
| EL-WHATSAPP-234 | `/admin/whatsapp/campaigns` | en | link | Members Register | /admin/members | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-235 | `/admin/whatsapp/campaigns` | en | link | Membership Pipeline | /admin/requests | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-236 | `/admin/whatsapp/campaigns` | en | link | New campaign | wa.campaign.new | 3 | 163x44 | PASS | target answered 200 |
| EL-WHATSAPP-237 | `/admin/whatsapp/campaigns` | en | link | New Message | /admin/whatsapp/campaigns/new | 5 | 156x46 | PASS | target answered 200 |
| EL-WHATSAPP-238 | `/admin/whatsapp/campaigns` | en | link | Payments | /admin/payments | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-239 | `/admin/whatsapp/campaigns` | en | link | Readiness | /admin/whatsapp/readiness | 5 | 129x46 | PASS | target answered 200 |
| EL-WHATSAPP-240 | `/admin/whatsapp/campaigns` | en | link | Reports & AI | /admin/reports | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-241 | `/admin/whatsapp/campaigns` | en | link | Segments | /admin/business-directory/segments | 5 | 129x46 | PASS | target answered 200 |
| EL-WHATSAPP-242 | `/admin/whatsapp/campaigns` | en | link | Service Requests | /admin/applications | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-243 | `/admin/whatsapp/campaigns` | en | link | Services & Integrations | /admin/services | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-244 | `/admin/whatsapp/campaigns` | en | link | Settings | /admin/settings | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-245 | `/admin/whatsapp/campaigns` | en | link | Settings | /admin/whatsapp/settings | 5 | 115x46 | PASS | target answered 200 |
| EL-WHATSAPP-246 | `/admin/whatsapp/campaigns` | en | link | Skip to content | #main | 5 | 144x47 | PASS | in-page anchor |
| EL-WHATSAPP-247 | `/admin/whatsapp/campaigns` | en | link | Staff & Audit | /admin/staff | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-248 | `/admin/whatsapp/campaigns` | en | link | Templates | /admin/whatsapp/templates | 5 | 130x46 | PASS | target answered 200 |
| EL-WHATSAPP-249 | `/admin/whatsapp/campaigns` | en | link | WhatsApp | /admin/whatsapp | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-250 | `/admin/whatsapp/campaigns` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-WHATSAPP-251 | `/admin/whatsapp/campaigns` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-WHATSAPP-252 | `/admin/whatsapp/campaigns` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-253 | `/admin/whatsapp/campaigns` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-254 | `/admin/whatsapp/campaigns` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-255 | `/admin/whatsapp/campaigns` | ur | link | ان باکس | /ur/admin/whatsapp/inbox | 1 | 88x52 | PASS | target answered 200 |
| EL-WHATSAPP-256 | `/admin/whatsapp/campaigns` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-WHATSAPP-257 | `/admin/whatsapp/campaigns` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-258 | `/admin/whatsapp/campaigns` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-259 | `/admin/whatsapp/campaigns` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-260 | `/admin/whatsapp/campaigns` | ur | link | ترتیبات | /ur/admin/whatsapp/settings | 1 | 82x52 | PASS | target answered 200 |
| EL-WHATSAPP-261 | `/admin/whatsapp/campaigns` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-262 | `/admin/whatsapp/campaigns` | ur | link | تیاری | /ur/admin/whatsapp/readiness | 1 | 74x52 | PASS | target answered 200 |
| EL-WHATSAPP-263 | `/admin/whatsapp/campaigns` | ur | link | ٹیمپلیٹس | /ur/admin/whatsapp/templates | 1 | 88x52 | PASS | target answered 200 |
| EL-WHATSAPP-264 | `/admin/whatsapp/campaigns` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-265 | `/admin/whatsapp/campaigns` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-266 | `/admin/whatsapp/campaigns` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-267 | `/admin/whatsapp/campaigns` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-268 | `/admin/whatsapp/campaigns` | ur | link | رضامندی | /ur/admin/whatsapp/consent | 1 | 91x52 | PASS | target answered 200 |
| EL-WHATSAPP-269 | `/admin/whatsapp/campaigns` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-270 | `/admin/whatsapp/campaigns` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-271 | `/admin/whatsapp/campaigns` | ur | link | سیگمنٹس | /ur/admin/business-directory/segments | 1 | 86x52 | PASS | target answered 200 |
| EL-WHATSAPP-272 | `/admin/whatsapp/campaigns` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-273 | `/admin/whatsapp/campaigns` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-274 | `/admin/whatsapp/campaigns` | ur | link | مہمات | /ur/admin/whatsapp/campaigns | 1 | 79x52 | PASS | target answered 200 |
| EL-WHATSAPP-275 | `/admin/whatsapp/campaigns` | ur | link | مہمات کی تاریخ | /ur/admin/whatsapp/campaigns/history | 1 | 115x52 | PASS | target answered 200 |
| EL-WHATSAPP-276 | `/admin/whatsapp/campaigns` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-277 | `/admin/whatsapp/campaigns` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-WHATSAPP-278 | `/admin/whatsapp/campaigns` | ur | link | نئی مہم | wa.campaign.new | 1 | 79x47 | PASS | target answered 200 |
| EL-WHATSAPP-279 | `/admin/whatsapp/campaigns` | ur | link | نیا پیغام | /ur/admin/whatsapp/campaigns/new | 1 | 82x52 | PASS | target answered 200 |
| EL-WHATSAPP-280 | `/admin/whatsapp/campaigns` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-281 | `/admin/whatsapp/consent` | en | button | Light or dark theme | theme.toggle | 3 | 44x44 | PASS | exercised by a functional spec |
| EL-WHATSAPP-282 | `/admin/whatsapp/consent` | en | button | Sign out | logout | 3 | 116x44 | PASS | exercised by a functional spec |
| EL-WHATSAPP-283 | `/admin/whatsapp/consent` | en | link | Accounts | /admin/finance | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-284 | `/admin/whatsapp/consent` | en | link | Ask MCCI AI | /admin/help | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-285 | `/admin/whatsapp/consent` | en | link | Business Directory | /admin/business-directory | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-286 | `/admin/whatsapp/consent` | en | link | Campaign History | /admin/whatsapp/campaigns/history | 3 | 185x46 | PASS | target answered 200 |
| EL-WHATSAPP-287 | `/admin/whatsapp/consent` | en | link | Campaigns | /admin/whatsapp/campaigns | 3 | 137x46 | PASS | target answered 200 |
| EL-WHATSAPP-288 | `/admin/whatsapp/consent` | en | link | Certificates | /admin/temp | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-289 | `/admin/whatsapp/consent` | en | link | Complaint Desk | /admin/complaints | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-290 | `/admin/whatsapp/consent` | en | link | Consent | /admin/whatsapp/consent | 3 | 116x46 | PASS | target answered 200 |
| EL-WHATSAPP-291 | `/admin/whatsapp/consent` | en | link | Content & Messaging | /admin/content | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-292 | `/admin/whatsapp/consent` | en | link | Documents & QR | /admin/documents | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-293 | `/admin/whatsapp/consent` | en | link | Events & Meetings | /admin/events | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-294 | `/admin/whatsapp/consent` | en | link | Inbox | /admin/whatsapp/inbox | 3 | 95x46 | PASS | target answered 200 |
| EL-WHATSAPP-295 | `/admin/whatsapp/consent` | en | link | MCCI Admin Secretariat Panel | /admin | 3 | 238x82 | PASS | target answered 200 |
| EL-WHATSAPP-296 | `/admin/whatsapp/consent` | en | link | Members Register | /admin/members | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-297 | `/admin/whatsapp/consent` | en | link | Membership Pipeline | /admin/requests | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-298 | `/admin/whatsapp/consent` | en | link | New Message | /admin/whatsapp/campaigns/new | 3 | 156x46 | PASS | target answered 200 |
| EL-WHATSAPP-299 | `/admin/whatsapp/consent` | en | link | Payments | /admin/payments | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-300 | `/admin/whatsapp/consent` | en | link | Readiness | /admin/whatsapp/readiness | 3 | 129x46 | PASS | target answered 200 |
| EL-WHATSAPP-301 | `/admin/whatsapp/consent` | en | link | Reports & AI | /admin/reports | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-302 | `/admin/whatsapp/consent` | en | link | Segments | /admin/business-directory/segments | 3 | 129x46 | PASS | target answered 200 |
| EL-WHATSAPP-303 | `/admin/whatsapp/consent` | en | link | Service Requests | /admin/applications | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-304 | `/admin/whatsapp/consent` | en | link | Services & Integrations | /admin/services | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-305 | `/admin/whatsapp/consent` | en | link | Settings | /admin/settings | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-306 | `/admin/whatsapp/consent` | en | link | Settings | /admin/whatsapp/settings | 3 | 115x46 | PASS | target answered 200 |
| EL-WHATSAPP-307 | `/admin/whatsapp/consent` | en | link | Skip to content | #main | 3 | 144x47 | PASS | in-page anchor |
| EL-WHATSAPP-308 | `/admin/whatsapp/consent` | en | link | Staff & Audit | /admin/staff | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-309 | `/admin/whatsapp/consent` | en | link | Templates | /admin/whatsapp/templates | 3 | 130x46 | PASS | target answered 200 |
| EL-WHATSAPP-310 | `/admin/whatsapp/consent` | en | link | WhatsApp | /admin/whatsapp | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-311 | `/admin/whatsapp/consent` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-WHATSAPP-312 | `/admin/whatsapp/consent` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-WHATSAPP-313 | `/admin/whatsapp/consent` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-314 | `/admin/whatsapp/consent` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-315 | `/admin/whatsapp/consent` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-316 | `/admin/whatsapp/consent` | ur | link | ان باکس | /ur/admin/whatsapp/inbox | 1 | 88x52 | PASS | target answered 200 |
| EL-WHATSAPP-317 | `/admin/whatsapp/consent` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-WHATSAPP-318 | `/admin/whatsapp/consent` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-319 | `/admin/whatsapp/consent` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-320 | `/admin/whatsapp/consent` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-321 | `/admin/whatsapp/consent` | ur | link | ترتیبات | /ur/admin/whatsapp/settings | 1 | 82x52 | PASS | target answered 200 |
| EL-WHATSAPP-322 | `/admin/whatsapp/consent` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-323 | `/admin/whatsapp/consent` | ur | link | تیاری | /ur/admin/whatsapp/readiness | 1 | 74x52 | PASS | target answered 200 |
| EL-WHATSAPP-324 | `/admin/whatsapp/consent` | ur | link | ٹیمپلیٹس | /ur/admin/whatsapp/templates | 1 | 88x52 | PASS | target answered 200 |
| EL-WHATSAPP-325 | `/admin/whatsapp/consent` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-326 | `/admin/whatsapp/consent` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-327 | `/admin/whatsapp/consent` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-328 | `/admin/whatsapp/consent` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-329 | `/admin/whatsapp/consent` | ur | link | رضامندی | /ur/admin/whatsapp/consent | 1 | 91x52 | PASS | target answered 200 |
| EL-WHATSAPP-330 | `/admin/whatsapp/consent` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-331 | `/admin/whatsapp/consent` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-332 | `/admin/whatsapp/consent` | ur | link | سیگمنٹس | /ur/admin/business-directory/segments | 1 | 86x52 | PASS | target answered 200 |
| EL-WHATSAPP-333 | `/admin/whatsapp/consent` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-334 | `/admin/whatsapp/consent` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-335 | `/admin/whatsapp/consent` | ur | link | مہمات | /ur/admin/whatsapp/campaigns | 1 | 79x52 | PASS | target answered 200 |
| EL-WHATSAPP-336 | `/admin/whatsapp/consent` | ur | link | مہمات کی تاریخ | /ur/admin/whatsapp/campaigns/history | 1 | 115x52 | PASS | target answered 200 |
| EL-WHATSAPP-337 | `/admin/whatsapp/consent` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-338 | `/admin/whatsapp/consent` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-WHATSAPP-339 | `/admin/whatsapp/consent` | ur | link | نیا پیغام | /ur/admin/whatsapp/campaigns/new | 1 | 82x52 | PASS | target answered 200 |
| EL-WHATSAPP-340 | `/admin/whatsapp/consent` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-341 | `/admin/whatsapp/inbox` | en | button | Apply | wa.inbox.search | 3 | 64x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-342 | `/admin/whatsapp/inbox` | en | button | Light or dark theme | theme.toggle | 3 | 44x44 | PASS | exercised by a functional spec |
| EL-WHATSAPP-343 | `/admin/whatsapp/inbox` | en | button | Sign out | logout | 3 | 116x44 | PASS | exercised by a functional spec |
| EL-WHATSAPP-344 | `/admin/whatsapp/inbox` | en | input:search | Search by number or name |  | 3 | 180x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-345 | `/admin/whatsapp/inbox` | en | link | Accounts | /admin/finance | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-346 | `/admin/whatsapp/inbox` | en | link | Ask MCCI AI | /admin/help | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-347 | `/admin/whatsapp/inbox` | en | link | Business Directory | /admin/business-directory | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-348 | `/admin/whatsapp/inbox` | en | link | Campaign History | /admin/whatsapp/campaigns/history | 3 | 185x46 | PASS | target answered 200 |
| EL-WHATSAPP-349 | `/admin/whatsapp/inbox` | en | link | Campaigns | /admin/whatsapp/campaigns | 3 | 137x46 | PASS | target answered 200 |
| EL-WHATSAPP-350 | `/admin/whatsapp/inbox` | en | link | Certificates | /admin/temp | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-351 | `/admin/whatsapp/inbox` | en | link | Complaint Desk | /admin/complaints | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-352 | `/admin/whatsapp/inbox` | en | link | Consent | /admin/whatsapp/consent | 3 | 116x46 | PASS | target answered 200 |
| EL-WHATSAPP-353 | `/admin/whatsapp/inbox` | en | link | Content & Messaging | /admin/content | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-354 | `/admin/whatsapp/inbox` | en | link | Documents & QR | /admin/documents | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-355 | `/admin/whatsapp/inbox` | en | link | Events & Meetings | /admin/events | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-356 | `/admin/whatsapp/inbox` | en | link | Inbox | /admin/whatsapp/inbox | 3 | 95x46 | PASS | target answered 200 |
| EL-WHATSAPP-357 | `/admin/whatsapp/inbox` | en | link | MCCI Admin Secretariat Panel | /admin | 3 | 238x82 | PASS | target answered 200 |
| EL-WHATSAPP-358 | `/admin/whatsapp/inbox` | en | link | Members Register | /admin/members | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-359 | `/admin/whatsapp/inbox` | en | link | Membership Pipeline | /admin/requests | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-360 | `/admin/whatsapp/inbox` | en | link | New Message | /admin/whatsapp/campaigns/new | 3 | 156x46 | PASS | target answered 200 |
| EL-WHATSAPP-361 | `/admin/whatsapp/inbox` | en | link | Payments | /admin/payments | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-362 | `/admin/whatsapp/inbox` | en | link | Readiness | /admin/whatsapp/readiness | 3 | 129x46 | PASS | target answered 200 |
| EL-WHATSAPP-363 | `/admin/whatsapp/inbox` | en | link | Reports & AI | /admin/reports | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-364 | `/admin/whatsapp/inbox` | en | link | Segments | /admin/business-directory/segments | 3 | 129x46 | PASS | target answered 200 |
| EL-WHATSAPP-365 | `/admin/whatsapp/inbox` | en | link | Service Requests | /admin/applications | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-366 | `/admin/whatsapp/inbox` | en | link | Services & Integrations | /admin/services | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-367 | `/admin/whatsapp/inbox` | en | link | Settings | /admin/settings | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-368 | `/admin/whatsapp/inbox` | en | link | Settings | /admin/whatsapp/settings | 3 | 115x46 | PASS | target answered 200 |
| EL-WHATSAPP-369 | `/admin/whatsapp/inbox` | en | link | Skip to content | #main | 3 | 144x47 | PASS | in-page anchor |
| EL-WHATSAPP-370 | `/admin/whatsapp/inbox` | en | link | Staff & Audit | /admin/staff | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-371 | `/admin/whatsapp/inbox` | en | link | Templates | /admin/whatsapp/templates | 3 | 130x46 | PASS | target answered 200 |
| EL-WHATSAPP-372 | `/admin/whatsapp/inbox` | en | link | WhatsApp | /admin/whatsapp | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-373 | `/admin/whatsapp/inbox` | en | select | ShowAllOpenPendingResolvedUnmatched numbers |  | 3 | 175x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-374 | `/admin/whatsapp/inbox` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-WHATSAPP-375 | `/admin/whatsapp/inbox` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-WHATSAPP-376 | `/admin/whatsapp/inbox` | ur | button | لگائیں | wa.inbox.search | 1 | 44x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-377 | `/admin/whatsapp/inbox` | ur | input:search | نمبر یا نام سے تلاش کریں |  | 1 | 180x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-378 | `/admin/whatsapp/inbox` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-379 | `/admin/whatsapp/inbox` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-380 | `/admin/whatsapp/inbox` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-381 | `/admin/whatsapp/inbox` | ur | link | ان باکس | /ur/admin/whatsapp/inbox | 1 | 88x52 | PASS | target answered 200 |
| EL-WHATSAPP-382 | `/admin/whatsapp/inbox` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-WHATSAPP-383 | `/admin/whatsapp/inbox` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-384 | `/admin/whatsapp/inbox` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-385 | `/admin/whatsapp/inbox` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-386 | `/admin/whatsapp/inbox` | ur | link | ترتیبات | /ur/admin/whatsapp/settings | 1 | 82x52 | PASS | target answered 200 |
| EL-WHATSAPP-387 | `/admin/whatsapp/inbox` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-388 | `/admin/whatsapp/inbox` | ur | link | تیاری | /ur/admin/whatsapp/readiness | 1 | 74x52 | PASS | target answered 200 |
| EL-WHATSAPP-389 | `/admin/whatsapp/inbox` | ur | link | ٹیمپلیٹس | /ur/admin/whatsapp/templates | 1 | 88x52 | PASS | target answered 200 |
| EL-WHATSAPP-390 | `/admin/whatsapp/inbox` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-391 | `/admin/whatsapp/inbox` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-392 | `/admin/whatsapp/inbox` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-393 | `/admin/whatsapp/inbox` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-394 | `/admin/whatsapp/inbox` | ur | link | رضامندی | /ur/admin/whatsapp/consent | 1 | 91x52 | PASS | target answered 200 |
| EL-WHATSAPP-395 | `/admin/whatsapp/inbox` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-396 | `/admin/whatsapp/inbox` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-397 | `/admin/whatsapp/inbox` | ur | link | سیگمنٹس | /ur/admin/business-directory/segments | 1 | 86x52 | PASS | target answered 200 |
| EL-WHATSAPP-398 | `/admin/whatsapp/inbox` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-399 | `/admin/whatsapp/inbox` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-400 | `/admin/whatsapp/inbox` | ur | link | مہمات | /ur/admin/whatsapp/campaigns | 1 | 79x52 | PASS | target answered 200 |
| EL-WHATSAPP-401 | `/admin/whatsapp/inbox` | ur | link | مہمات کی تاریخ | /ur/admin/whatsapp/campaigns/history | 1 | 115x52 | PASS | target answered 200 |
| EL-WHATSAPP-402 | `/admin/whatsapp/inbox` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-403 | `/admin/whatsapp/inbox` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-WHATSAPP-404 | `/admin/whatsapp/inbox` | ur | link | نیا پیغام | /ur/admin/whatsapp/campaigns/new | 1 | 82x52 | PASS | target answered 200 |
| EL-WHATSAPP-405 | `/admin/whatsapp/inbox` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-406 | `/admin/whatsapp/inbox` | ur | select | دکھائیںتمامکھلیزیرِ التواحل شدہغیر مطابق نمبر |  | 1 | 90x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-407 | `/admin/whatsapp/readiness` | en | button | Confirm | wa.quota.confirm | 1 | 112x44 | PASS | exercised by a functional spec |
| EL-WHATSAPP-408 | `/admin/whatsapp/readiness` | en | button | Light or dark theme | theme.toggle | 5 | 44x44 | PASS | exercised by a functional spec |
| EL-WHATSAPP-409 | `/admin/whatsapp/readiness` | en | button | Sign out | logout | 5 | 116x44 | PASS | exercised by a functional spec |
| EL-WHATSAPP-410 | `/admin/whatsapp/readiness` | en | input:number | Ask to confirm again after (days) |  | 1 | 532x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-411 | `/admin/whatsapp/readiness` | en | input:number | Recipients reached from other numbers in 24 hours |  | 1 | 532x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-412 | `/admin/whatsapp/readiness` | en | input:number | Unique recipients per rolling 24 hours |  | 1 | 532x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-413 | `/admin/whatsapp/readiness` | en | input:text | Messaging tier |  | 1 | 532x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-414 | `/admin/whatsapp/readiness` | en | input:text | Note |  | 1 | 1080x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-415 | `/admin/whatsapp/readiness` | en | link | Accounts | /admin/finance | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-416 | `/admin/whatsapp/readiness` | en | link | Ask MCCI AI | /admin/help | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-417 | `/admin/whatsapp/readiness` | en | link | Business Directory | /admin/business-directory | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-418 | `/admin/whatsapp/readiness` | en | link | Campaign History | /admin/whatsapp/campaigns/history | 5 | 185x46 | PASS | target answered 200 |
| EL-WHATSAPP-419 | `/admin/whatsapp/readiness` | en | link | Campaigns | /admin/whatsapp/campaigns | 5 | 137x46 | PASS | target answered 200 |
| EL-WHATSAPP-420 | `/admin/whatsapp/readiness` | en | link | Certificates | /admin/temp | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-421 | `/admin/whatsapp/readiness` | en | link | Complaint Desk | /admin/complaints | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-422 | `/admin/whatsapp/readiness` | en | link | Consent | /admin/whatsapp/consent | 5 | 116x46 | PASS | target answered 200 |
| EL-WHATSAPP-423 | `/admin/whatsapp/readiness` | en | link | Content & Messaging | /admin/content | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-424 | `/admin/whatsapp/readiness` | en | link | Documents & QR | /admin/documents | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-425 | `/admin/whatsapp/readiness` | en | link | Events & Meetings | /admin/events | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-426 | `/admin/whatsapp/readiness` | en | link | Inbox | /admin/whatsapp/inbox | 5 | 95x46 | PASS | target answered 200 |
| EL-WHATSAPP-427 | `/admin/whatsapp/readiness` | en | link | MCCI Admin Secretariat Panel | /admin | 5 | 238x82 | PASS | target answered 200 |
| EL-WHATSAPP-428 | `/admin/whatsapp/readiness` | en | link | Members Register | /admin/members | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-429 | `/admin/whatsapp/readiness` | en | link | Membership Pipeline | /admin/requests | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-430 | `/admin/whatsapp/readiness` | en | link | New Message | /admin/whatsapp/campaigns/new | 5 | 156x46 | PASS | target answered 200 |
| EL-WHATSAPP-431 | `/admin/whatsapp/readiness` | en | link | Payments | /admin/payments | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-432 | `/admin/whatsapp/readiness` | en | link | Readiness | /admin/whatsapp/readiness | 5 | 129x46 | PASS | target answered 200 |
| EL-WHATSAPP-433 | `/admin/whatsapp/readiness` | en | link | Reports & AI | /admin/reports | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-434 | `/admin/whatsapp/readiness` | en | link | Segments | /admin/business-directory/segments | 5 | 129x46 | PASS | target answered 200 |
| EL-WHATSAPP-435 | `/admin/whatsapp/readiness` | en | link | Service Requests | /admin/applications | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-436 | `/admin/whatsapp/readiness` | en | link | Services & Integrations | /admin/services | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-437 | `/admin/whatsapp/readiness` | en | link | Settings | /admin/settings | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-438 | `/admin/whatsapp/readiness` | en | link | Settings | /admin/whatsapp/settings | 5 | 115x46 | PASS | target answered 200 |
| EL-WHATSAPP-439 | `/admin/whatsapp/readiness` | en | link | Skip to content | #main | 5 | 144x47 | PASS | in-page anchor |
| EL-WHATSAPP-440 | `/admin/whatsapp/readiness` | en | link | Staff & Audit | /admin/staff | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-441 | `/admin/whatsapp/readiness` | en | link | Templates | /admin/whatsapp/templates | 5 | 130x46 | PASS | target answered 200 |
| EL-WHATSAPP-442 | `/admin/whatsapp/readiness` | en | link | WhatsApp | /admin/whatsapp | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-443 | `/admin/whatsapp/readiness` | en | select | Business VerificationNot knownNot completedUnder reviewVerified |  | 1 | 532x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-444 | `/admin/whatsapp/readiness` | en | select | Phone number qualityNot knownHighMediumLow |  | 1 | 532x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-445 | `/admin/whatsapp/readiness` | en | select | SourceConfirmed by an administrator from WhatsApp ManagerConfirmed by Meta Support |  | 1 | 532x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-446 | `/admin/whatsapp/readiness` | en | select | Template qualityNot knownHighMediumLow |  | 1 | 532x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-447 | `/admin/whatsapp/readiness` | ur | button | تصدیق کریں | wa.quota.confirm | 1 | 101x47 | PASS | exercised by a functional spec |
| EL-WHATSAPP-448 | `/admin/whatsapp/readiness` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-WHATSAPP-449 | `/admin/whatsapp/readiness` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-WHATSAPP-450 | `/admin/whatsapp/readiness` | ur | input:number | 24 گھنٹوں میں دوسرے نمبروں سے رابطہ |  | 1 | 532x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-451 | `/admin/whatsapp/readiness` | ur | input:number | دوبارہ تصدیق کب مانگی جائے (دن) |  | 1 | 532x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-452 | `/admin/whatsapp/readiness` | ur | input:number | ہر 24 گھنٹوں میں منفرد وصول کنندگان |  | 1 | 532x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-453 | `/admin/whatsapp/readiness` | ur | input:text | پیغام رسانی کا درجہ |  | 1 | 532x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-454 | `/admin/whatsapp/readiness` | ur | input:text | نوٹ |  | 1 | 1080x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-455 | `/admin/whatsapp/readiness` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-456 | `/admin/whatsapp/readiness` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-457 | `/admin/whatsapp/readiness` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-458 | `/admin/whatsapp/readiness` | ur | link | ان باکس | /ur/admin/whatsapp/inbox | 1 | 88x52 | PASS | target answered 200 |
| EL-WHATSAPP-459 | `/admin/whatsapp/readiness` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-WHATSAPP-460 | `/admin/whatsapp/readiness` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-461 | `/admin/whatsapp/readiness` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-462 | `/admin/whatsapp/readiness` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-463 | `/admin/whatsapp/readiness` | ur | link | ترتیبات | /ur/admin/whatsapp/settings | 1 | 82x52 | PASS | target answered 200 |
| EL-WHATSAPP-464 | `/admin/whatsapp/readiness` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-465 | `/admin/whatsapp/readiness` | ur | link | تیاری | /ur/admin/whatsapp/readiness | 1 | 74x52 | PASS | target answered 200 |
| EL-WHATSAPP-466 | `/admin/whatsapp/readiness` | ur | link | ٹیمپلیٹس | /ur/admin/whatsapp/templates | 1 | 88x52 | PASS | target answered 200 |
| EL-WHATSAPP-467 | `/admin/whatsapp/readiness` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-468 | `/admin/whatsapp/readiness` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-469 | `/admin/whatsapp/readiness` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-470 | `/admin/whatsapp/readiness` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-471 | `/admin/whatsapp/readiness` | ur | link | رضامندی | /ur/admin/whatsapp/consent | 1 | 91x52 | PASS | target answered 200 |
| EL-WHATSAPP-472 | `/admin/whatsapp/readiness` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-473 | `/admin/whatsapp/readiness` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-474 | `/admin/whatsapp/readiness` | ur | link | سیگمنٹس | /ur/admin/business-directory/segments | 1 | 86x52 | PASS | target answered 200 |
| EL-WHATSAPP-475 | `/admin/whatsapp/readiness` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-476 | `/admin/whatsapp/readiness` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-477 | `/admin/whatsapp/readiness` | ur | link | مہمات | /ur/admin/whatsapp/campaigns | 1 | 79x52 | PASS | target answered 200 |
| EL-WHATSAPP-478 | `/admin/whatsapp/readiness` | ur | link | مہمات کی تاریخ | /ur/admin/whatsapp/campaigns/history | 1 | 115x52 | PASS | target answered 200 |
| EL-WHATSAPP-479 | `/admin/whatsapp/readiness` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-480 | `/admin/whatsapp/readiness` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-WHATSAPP-481 | `/admin/whatsapp/readiness` | ur | link | نیا پیغام | /ur/admin/whatsapp/campaigns/new | 1 | 82x52 | PASS | target answered 200 |
| EL-WHATSAPP-482 | `/admin/whatsapp/readiness` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-483 | `/admin/whatsapp/readiness` | ur | select | بزنس ویریفکیشنمعلوم نہیںمکمل نہیںزیرِ جائزہتصدیق شدہ |  | 1 | 532x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-484 | `/admin/whatsapp/readiness` | ur | select | ذریعہواٹس ایپ مینیجر سے منتظم کی تصدیقمیٹا سپورٹ کی تصدیق |  | 1 | 532x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-485 | `/admin/whatsapp/readiness` | ur | select | سانچوں کا معیارمعلوم نہیںاعلیٰدرمیانہکم |  | 1 | 532x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-486 | `/admin/whatsapp/readiness` | ur | select | فون نمبر کا معیارمعلوم نہیںاعلیٰدرمیانہکم |  | 1 | 532x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-487 | `/admin/whatsapp/settings` | en | button | Light or dark theme | theme.toggle | 3 | 44x44 | PASS | exercised by a functional spec |
| EL-WHATSAPP-488 | `/admin/whatsapp/settings` | en | button | Save settings | wa.settings.save | 2 | 151x44 | PASS | exercised by a functional spec |
| EL-WHATSAPP-489 | `/admin/whatsapp/settings` | en | button | Sign out | logout | 3 | 116x44 | PASS | exercised by a functional spec |
| EL-WHATSAPP-490 | `/admin/whatsapp/settings` | en | button | Test connection | wa.test | 2 | 169x44 | PASS | exercised by a functional spec |
| EL-WHATSAPP-491 | `/admin/whatsapp/settings` | en | input:checkbox | Allow messages to be sent |  | 2 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-492 | `/admin/whatsapp/settings` | en | input:checkbox | Offer WhatsApp consent to members in the portal |  | 2 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-493 | `/admin/whatsapp/settings` | en | input:number | Audience size needing approval |  | 2 | 532x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-494 | `/admin/whatsapp/settings` | en | input:number | Customers per 24 hours (Meta's limit for this number) |  | 2 | 532x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-495 | `/admin/whatsapp/settings` | en | input:number | Largest campaign |  | 2 | 532x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-496 | `/admin/whatsapp/settings` | en | input:number | Messages per minute |  | 2 | 532x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-497 | `/admin/whatsapp/settings` | en | input:text | Consent wording version |  | 2 | 532x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-498 | `/admin/whatsapp/settings` | en | link | Accounts | /admin/finance | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-499 | `/admin/whatsapp/settings` | en | link | Ask MCCI AI | /admin/help | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-500 | `/admin/whatsapp/settings` | en | link | Business Directory | /admin/business-directory | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-501 | `/admin/whatsapp/settings` | en | link | Campaign History | /admin/whatsapp/campaigns/history | 3 | 185x46 | PASS | target answered 200 |
| EL-WHATSAPP-502 | `/admin/whatsapp/settings` | en | link | Campaigns | /admin/whatsapp/campaigns | 3 | 137x46 | PASS | target answered 200 |
| EL-WHATSAPP-503 | `/admin/whatsapp/settings` | en | link | Certificates | /admin/temp | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-504 | `/admin/whatsapp/settings` | en | link | Complaint Desk | /admin/complaints | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-505 | `/admin/whatsapp/settings` | en | link | Consent | /admin/whatsapp/consent | 3 | 116x46 | PASS | target answered 200 |
| EL-WHATSAPP-506 | `/admin/whatsapp/settings` | en | link | Content & Messaging | /admin/content | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-507 | `/admin/whatsapp/settings` | en | link | Documents & QR | /admin/documents | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-508 | `/admin/whatsapp/settings` | en | link | Events & Meetings | /admin/events | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-509 | `/admin/whatsapp/settings` | en | link | Inbox | /admin/whatsapp/inbox | 3 | 95x46 | PASS | target answered 200 |
| EL-WHATSAPP-510 | `/admin/whatsapp/settings` | en | link | MCCI Admin Secretariat Panel | /admin | 3 | 238x82 | PASS | target answered 200 |
| EL-WHATSAPP-511 | `/admin/whatsapp/settings` | en | link | Members Register | /admin/members | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-512 | `/admin/whatsapp/settings` | en | link | Membership Pipeline | /admin/requests | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-513 | `/admin/whatsapp/settings` | en | link | New Message | /admin/whatsapp/campaigns/new | 3 | 156x46 | PASS | target answered 200 |
| EL-WHATSAPP-514 | `/admin/whatsapp/settings` | en | link | Payments | /admin/payments | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-515 | `/admin/whatsapp/settings` | en | link | Readiness | /admin/whatsapp/readiness | 3 | 129x46 | PASS | target answered 200 |
| EL-WHATSAPP-516 | `/admin/whatsapp/settings` | en | link | Reports & AI | /admin/reports | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-517 | `/admin/whatsapp/settings` | en | link | Segments | /admin/business-directory/segments | 3 | 129x46 | PASS | target answered 200 |
| EL-WHATSAPP-518 | `/admin/whatsapp/settings` | en | link | Service Requests | /admin/applications | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-519 | `/admin/whatsapp/settings` | en | link | Services & Integrations | /admin/services | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-520 | `/admin/whatsapp/settings` | en | link | Settings | /admin/settings | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-521 | `/admin/whatsapp/settings` | en | link | Settings | /admin/whatsapp/settings | 3 | 115x46 | PASS | target answered 200 |
| EL-WHATSAPP-522 | `/admin/whatsapp/settings` | en | link | Skip to content | #main | 3 | 144x47 | PASS | in-page anchor |
| EL-WHATSAPP-523 | `/admin/whatsapp/settings` | en | link | Staff & Audit | /admin/staff | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-524 | `/admin/whatsapp/settings` | en | link | Templates | /admin/whatsapp/templates | 3 | 130x46 | PASS | target answered 200 |
| EL-WHATSAPP-525 | `/admin/whatsapp/settings` | en | link | WhatsApp | /admin/whatsapp | 3 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-526 | `/admin/whatsapp/settings` | ur | button | ترتیبات محفوظ کریں | wa.settings.save | 1 | 127x47 | PASS | exercised by a functional spec |
| EL-WHATSAPP-527 | `/admin/whatsapp/settings` | ur | button | رابطہ جانچیں | wa.test | 1 | 98x47 | PASS | exercised by a functional spec |
| EL-WHATSAPP-528 | `/admin/whatsapp/settings` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-WHATSAPP-529 | `/admin/whatsapp/settings` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-WHATSAPP-530 | `/admin/whatsapp/settings` | ur | input:checkbox | پورٹل میں اراکین کو واٹس ایپ رضامندی پیش کریں |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-531 | `/admin/whatsapp/settings` | ur | input:checkbox | پیغامات بھیجنے کی اجازت دیں |  | 1 | 20x20 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-532 | `/admin/whatsapp/settings` | ur | input:number | 24 گھنٹوں میں صارفین (اس نمبر کے لیے میٹا کی حد) |  | 1 | 532x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-533 | `/admin/whatsapp/settings` | ur | input:number | پیغامات فی منٹ |  | 1 | 532x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-534 | `/admin/whatsapp/settings` | ur | input:number | سب سے بڑی مہم |  | 1 | 532x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-535 | `/admin/whatsapp/settings` | ur | input:number | منظوری درکار سامعین کی تعداد |  | 1 | 532x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-536 | `/admin/whatsapp/settings` | ur | input:text | رضامندی کی عبارت کا ورژن |  | 1 | 532x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-537 | `/admin/whatsapp/settings` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-538 | `/admin/whatsapp/settings` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-539 | `/admin/whatsapp/settings` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-540 | `/admin/whatsapp/settings` | ur | link | ان باکس | /ur/admin/whatsapp/inbox | 1 | 88x52 | PASS | target answered 200 |
| EL-WHATSAPP-541 | `/admin/whatsapp/settings` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-WHATSAPP-542 | `/admin/whatsapp/settings` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-543 | `/admin/whatsapp/settings` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-544 | `/admin/whatsapp/settings` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-545 | `/admin/whatsapp/settings` | ur | link | ترتیبات | /ur/admin/whatsapp/settings | 1 | 82x52 | PASS | target answered 200 |
| EL-WHATSAPP-546 | `/admin/whatsapp/settings` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-547 | `/admin/whatsapp/settings` | ur | link | تیاری | /ur/admin/whatsapp/readiness | 1 | 74x52 | PASS | target answered 200 |
| EL-WHATSAPP-548 | `/admin/whatsapp/settings` | ur | link | ٹیمپلیٹس | /ur/admin/whatsapp/templates | 1 | 88x52 | PASS | target answered 200 |
| EL-WHATSAPP-549 | `/admin/whatsapp/settings` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-550 | `/admin/whatsapp/settings` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-551 | `/admin/whatsapp/settings` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-552 | `/admin/whatsapp/settings` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-553 | `/admin/whatsapp/settings` | ur | link | رضامندی | /ur/admin/whatsapp/consent | 1 | 91x52 | PASS | target answered 200 |
| EL-WHATSAPP-554 | `/admin/whatsapp/settings` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-555 | `/admin/whatsapp/settings` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-556 | `/admin/whatsapp/settings` | ur | link | سیگمنٹس | /ur/admin/business-directory/segments | 1 | 86x52 | PASS | target answered 200 |
| EL-WHATSAPP-557 | `/admin/whatsapp/settings` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-558 | `/admin/whatsapp/settings` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-559 | `/admin/whatsapp/settings` | ur | link | مہمات | /ur/admin/whatsapp/campaigns | 1 | 79x52 | PASS | target answered 200 |
| EL-WHATSAPP-560 | `/admin/whatsapp/settings` | ur | link | مہمات کی تاریخ | /ur/admin/whatsapp/campaigns/history | 1 | 115x52 | PASS | target answered 200 |
| EL-WHATSAPP-561 | `/admin/whatsapp/settings` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-562 | `/admin/whatsapp/settings` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-WHATSAPP-563 | `/admin/whatsapp/settings` | ur | link | نیا پیغام | /ur/admin/whatsapp/campaigns/new | 1 | 82x52 | PASS | target answered 200 |
| EL-WHATSAPP-564 | `/admin/whatsapp/settings` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-565 | `/admin/whatsapp/templates` | en | button | Light or dark theme | theme.toggle | 5 | 44x44 | PASS | exercised by a functional spec |
| EL-WHATSAPP-566 | `/admin/whatsapp/templates` | en | button | Save this version | wa.master.save | 2 | 154x44 | PASS | exercised by a functional spec |
| EL-WHATSAPP-567 | `/admin/whatsapp/templates` | en | button | Sign out | logout | 5 | 116x44 | PASS | exercised by a functional spec |
| EL-WHATSAPP-568 | `/admin/whatsapp/templates` | en | button | Synchronise | wa.templates.sync | 3 | 143x44 | PASS | exercised by a functional spec |
| EL-WHATSAPP-569 | `/admin/whatsapp/templates` | en | disclosure | What to submit to Meta | wa.master.submission | 5 | 1080x23 | PASS | exercised by a functional spec |
| EL-WHATSAPP-570 | `/admin/whatsapp/templates` | en | input:text | Footer |  | 2 | 1080x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-571 | `/admin/whatsapp/templates` | en | input:text | Header |  | 2 | 1080x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-572 | `/admin/whatsapp/templates` | en | link | Accounts | /admin/finance | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-573 | `/admin/whatsapp/templates` | en | link | Ask MCCI AI | /admin/help | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-574 | `/admin/whatsapp/templates` | en | link | Business Directory | /admin/business-directory | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-575 | `/admin/whatsapp/templates` | en | link | Campaign History | /admin/whatsapp/campaigns/history | 5 | 185x46 | PASS | target answered 200 |
| EL-WHATSAPP-576 | `/admin/whatsapp/templates` | en | link | Campaigns | /admin/whatsapp/campaigns | 5 | 137x46 | PASS | target answered 200 |
| EL-WHATSAPP-577 | `/admin/whatsapp/templates` | en | link | Certificates | /admin/temp | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-578 | `/admin/whatsapp/templates` | en | link | Complaint Desk | /admin/complaints | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-579 | `/admin/whatsapp/templates` | en | link | Consent | /admin/whatsapp/consent | 5 | 116x46 | PASS | target answered 200 |
| EL-WHATSAPP-580 | `/admin/whatsapp/templates` | en | link | Content & Messaging | /admin/content | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-581 | `/admin/whatsapp/templates` | en | link | Documents & QR | /admin/documents | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-582 | `/admin/whatsapp/templates` | en | link | Events & Meetings | /admin/events | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-583 | `/admin/whatsapp/templates` | en | link | Inbox | /admin/whatsapp/inbox | 5 | 95x46 | PASS | target answered 200 |
| EL-WHATSAPP-584 | `/admin/whatsapp/templates` | en | link | MCCI Admin Secretariat Panel | /admin | 5 | 238x82 | PASS | target answered 200 |
| EL-WHATSAPP-585 | `/admin/whatsapp/templates` | en | link | Members Register | /admin/members | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-586 | `/admin/whatsapp/templates` | en | link | Membership Pipeline | /admin/requests | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-587 | `/admin/whatsapp/templates` | en | link | New Message | /admin/whatsapp/campaigns/new | 5 | 156x46 | PASS | target answered 200 |
| EL-WHATSAPP-588 | `/admin/whatsapp/templates` | en | link | Payments | /admin/payments | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-589 | `/admin/whatsapp/templates` | en | link | Readiness | /admin/whatsapp/readiness | 5 | 129x46 | PASS | target answered 200 |
| EL-WHATSAPP-590 | `/admin/whatsapp/templates` | en | link | Reports & AI | /admin/reports | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-591 | `/admin/whatsapp/templates` | en | link | Segments | /admin/business-directory/segments | 5 | 129x46 | PASS | target answered 200 |
| EL-WHATSAPP-592 | `/admin/whatsapp/templates` | en | link | Service Requests | /admin/applications | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-593 | `/admin/whatsapp/templates` | en | link | Services & Integrations | /admin/services | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-594 | `/admin/whatsapp/templates` | en | link | Settings | /admin/settings | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-595 | `/admin/whatsapp/templates` | en | link | Settings | /admin/whatsapp/settings | 5 | 115x46 | PASS | target answered 200 |
| EL-WHATSAPP-596 | `/admin/whatsapp/templates` | en | link | Skip to content | #main | 5 | 144x47 | PASS | in-page anchor |
| EL-WHATSAPP-597 | `/admin/whatsapp/templates` | en | link | Staff & Audit | /admin/staff | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-598 | `/admin/whatsapp/templates` | en | link | Templates | /admin/whatsapp/templates | 5 | 130x46 | PASS | target answered 200 |
| EL-WHATSAPP-599 | `/admin/whatsapp/templates` | en | link | WhatsApp | /admin/whatsapp | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-600 | `/admin/whatsapp/templates` | en | textarea | BodyDear {{1}}, The Multan Chamber of Commerce & Industry is pleased to invite {{2}} to th |  | 2 | 1080x194 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-601 | `/admin/whatsapp/templates` | en | textarea | BodyDear {{1}}, The Multan Chamber of Commerce & Industry issues the following announcemen |  | 2 | 1080x194 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-602 | `/admin/whatsapp/templates` | en | textarea | BodyDear {{1}}, The Multan Chamber of Commerce & Industry shares an opportunity that may i |  | 2 | 1080x194 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-603 | `/admin/whatsapp/templates` | en | textarea | BodyDear {{1}}, This is an update on the membership of {{2}} (Membership No. {{3}}) with t |  | 2 | 1080x194 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-604 | `/admin/whatsapp/templates` | en | textarea | Bodyمحترم {{1}}، ایوانِ تجارت و صنعت ملتان {{2}} کو درج ذیل تقریب میں شرکت کی دعوت دیتا ہے |  | 2 | 1080x194 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-605 | `/admin/whatsapp/templates` | en | textarea | Bodyمحترم {{1}}، ایوانِ تجارت و صنعت ملتان {{2}} کے لیے درج ذیل اعلان جاری کر رہا ہے۔ موضو |  | 2 | 1080x194 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-606 | `/admin/whatsapp/templates` | en | textarea | Bodyمحترم {{1}}، ایوانِ تجارت و صنعت ملتان ایک ایسا موقع پیش کر رہا ہے جو {{2}} کے لیے مفی |  | 2 | 1080x194 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-607 | `/admin/whatsapp/templates` | en | textarea | Bodyمحترم {{1}}، ایوانِ تجارت و صنعت ملتان میں {{2}} (رکنیت نمبر {{3}}) کی رکنیت کے بارے م |  | 2 | 1080x194 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-608 | `/admin/whatsapp/templates` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-WHATSAPP-609 | `/admin/whatsapp/templates` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-WHATSAPP-610 | `/admin/whatsapp/templates` | ur | button | ہم آہنگ کریں | wa.templates.sync | 1 | 111x47 | PASS | exercised by a functional spec |
| EL-WHATSAPP-611 | `/admin/whatsapp/templates` | ur | button | یہ نسخہ محفوظ کریں | wa.master.save | 1 | 110x44 | PASS | exercised by a functional spec |
| EL-WHATSAPP-612 | `/admin/whatsapp/templates` | ur | disclosure | میٹا کو کیا جمع کرانا ہے | wa.master.submission | 1 | 1080x29 | PASS | exercised by a functional spec |
| EL-WHATSAPP-613 | `/admin/whatsapp/templates` | ur | input:text | فوٹر |  | 1 | 1080x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-614 | `/admin/whatsapp/templates` | ur | input:text | ہیڈر |  | 1 | 1080x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-615 | `/admin/whatsapp/templates` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-616 | `/admin/whatsapp/templates` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-617 | `/admin/whatsapp/templates` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-618 | `/admin/whatsapp/templates` | ur | link | ان باکس | /ur/admin/whatsapp/inbox | 1 | 88x52 | PASS | target answered 200 |
| EL-WHATSAPP-619 | `/admin/whatsapp/templates` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-WHATSAPP-620 | `/admin/whatsapp/templates` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-621 | `/admin/whatsapp/templates` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-622 | `/admin/whatsapp/templates` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-623 | `/admin/whatsapp/templates` | ur | link | ترتیبات | /ur/admin/whatsapp/settings | 1 | 82x52 | PASS | target answered 200 |
| EL-WHATSAPP-624 | `/admin/whatsapp/templates` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-625 | `/admin/whatsapp/templates` | ur | link | تیاری | /ur/admin/whatsapp/readiness | 1 | 74x52 | PASS | target answered 200 |
| EL-WHATSAPP-626 | `/admin/whatsapp/templates` | ur | link | ٹیمپلیٹس | /ur/admin/whatsapp/templates | 1 | 88x52 | PASS | target answered 200 |
| EL-WHATSAPP-627 | `/admin/whatsapp/templates` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-628 | `/admin/whatsapp/templates` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-629 | `/admin/whatsapp/templates` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-630 | `/admin/whatsapp/templates` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-631 | `/admin/whatsapp/templates` | ur | link | رضامندی | /ur/admin/whatsapp/consent | 1 | 91x52 | PASS | target answered 200 |
| EL-WHATSAPP-632 | `/admin/whatsapp/templates` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-633 | `/admin/whatsapp/templates` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-634 | `/admin/whatsapp/templates` | ur | link | سیگمنٹس | /ur/admin/business-directory/segments | 1 | 86x52 | PASS | target answered 200 |
| EL-WHATSAPP-635 | `/admin/whatsapp/templates` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-636 | `/admin/whatsapp/templates` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-637 | `/admin/whatsapp/templates` | ur | link | مہمات | /ur/admin/whatsapp/campaigns | 1 | 79x52 | PASS | target answered 200 |
| EL-WHATSAPP-638 | `/admin/whatsapp/templates` | ur | link | مہمات کی تاریخ | /ur/admin/whatsapp/campaigns/history | 1 | 115x52 | PASS | target answered 200 |
| EL-WHATSAPP-639 | `/admin/whatsapp/templates` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-640 | `/admin/whatsapp/templates` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-WHATSAPP-641 | `/admin/whatsapp/templates` | ur | link | نیا پیغام | /ur/admin/whatsapp/campaigns/new | 1 | 82x52 | PASS | target answered 200 |
| EL-WHATSAPP-642 | `/admin/whatsapp/templates` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-643 | `/admin/whatsapp/templates` | ur | textarea | باڈیDear {{1}}, The Multan Chamber of Commerce & Industry is pleased to invite {{2}} to th |  | 1 | 1080x240 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-644 | `/admin/whatsapp/templates` | ur | textarea | باڈیDear {{1}}, The Multan Chamber of Commerce & Industry issues the following announcemen |  | 1 | 1080x240 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-645 | `/admin/whatsapp/templates` | ur | textarea | باڈیDear {{1}}, The Multan Chamber of Commerce & Industry shares an opportunity that may i |  | 1 | 1080x240 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-646 | `/admin/whatsapp/templates` | ur | textarea | باڈیDear {{1}}, This is an update on the membership of {{2}} (Membership No. {{3}}) with t |  | 1 | 1080x240 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-647 | `/admin/whatsapp/templates` | ur | textarea | باڈیمحترم {{1}}، ایوانِ تجارت و صنعت ملتان {{2}} کو درج ذیل تقریب میں شرکت کی دعوت دیتا ہے |  | 1 | 1080x240 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-648 | `/admin/whatsapp/templates` | ur | textarea | باڈیمحترم {{1}}، ایوانِ تجارت و صنعت ملتان {{2}} کے لیے درج ذیل اعلان جاری کر رہا ہے۔ موضو |  | 1 | 1080x240 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-649 | `/admin/whatsapp/templates` | ur | textarea | باڈیمحترم {{1}}، ایوانِ تجارت و صنعت ملتان ایک ایسا موقع پیش کر رہا ہے جو {{2}} کے لیے مفی |  | 1 | 1080x240 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-650 | `/admin/whatsapp/templates` | ur | textarea | باڈیمحترم {{1}}، ایوانِ تجارت و صنعت ملتان میں {{2}} (رکنیت نمبر {{3}}) کی رکنیت کے بارے م |  | 1 | 1080x240 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-WHATSAPP-651 | `/admin/whatsapp` | en | button | Light or dark theme | theme.toggle | 5 | 44x44 | PASS | exercised by a functional spec |
| EL-WHATSAPP-652 | `/admin/whatsapp` | en | button | Sign out | logout | 5 | 116x44 | PASS | exercised by a functional spec |
| EL-WHATSAPP-653 | `/admin/whatsapp` | en | link | Accounts | /admin/finance | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-654 | `/admin/whatsapp` | en | link | Ask MCCI AI | /admin/help | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-655 | `/admin/whatsapp` | en | link | Business Directory | /admin/business-directory | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-656 | `/admin/whatsapp` | en | link | Campaign History | /admin/whatsapp/campaigns/history | 5 | 185x46 | PASS | target answered 200 |
| EL-WHATSAPP-657 | `/admin/whatsapp` | en | link | Campaigns | /admin/whatsapp/campaigns | 5 | 137x46 | PASS | target answered 200 |
| EL-WHATSAPP-658 | `/admin/whatsapp` | en | link | Campaigns | wa.open.campaigns | 5 | 139x44 | PASS | target answered 200 |
| EL-WHATSAPP-659 | `/admin/whatsapp` | en | link | Certificates | /admin/temp | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-660 | `/admin/whatsapp` | en | link | Complaint Desk | /admin/complaints | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-661 | `/admin/whatsapp` | en | link | Consent | /admin/whatsapp/consent | 5 | 116x46 | PASS | target answered 200 |
| EL-WHATSAPP-662 | `/admin/whatsapp` | en | link | Consent | wa.open.consent | 5 | 118x44 | PASS | target answered 200 |
| EL-WHATSAPP-663 | `/admin/whatsapp` | en | link | Content & Messaging | /admin/content | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-664 | `/admin/whatsapp` | en | link | Documents & QR | /admin/documents | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-665 | `/admin/whatsapp` | en | link | Events & Meetings | /admin/events | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-666 | `/admin/whatsapp` | en | link | Inbox | /admin/whatsapp/inbox | 5 | 95x46 | PASS | target answered 200 |
| EL-WHATSAPP-667 | `/admin/whatsapp` | en | link | Inbox (0 received) | wa.open.inbox | 5 | 189x44 | PASS | target answered 200 |
| EL-WHATSAPP-668 | `/admin/whatsapp` | en | link | MCCI Admin Secretariat Panel | /admin | 5 | 238x82 | PASS | target answered 200 |
| EL-WHATSAPP-669 | `/admin/whatsapp` | en | link | Members Register | /admin/members | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-670 | `/admin/whatsapp` | en | link | Membership Pipeline | /admin/requests | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-671 | `/admin/whatsapp` | en | link | New Message | /admin/whatsapp/campaigns/new | 5 | 156x46 | PASS | target answered 200 |
| EL-WHATSAPP-672 | `/admin/whatsapp` | en | link | Payments | /admin/payments | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-673 | `/admin/whatsapp` | en | link | Readiness | /admin/whatsapp/readiness | 5 | 129x46 | PASS | target answered 200 |
| EL-WHATSAPP-674 | `/admin/whatsapp` | en | link | Reports & AI | /admin/reports | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-675 | `/admin/whatsapp` | en | link | Segments | /admin/business-directory/segments | 5 | 129x46 | PASS | target answered 200 |
| EL-WHATSAPP-676 | `/admin/whatsapp` | en | link | Segments | wa.open.segments | 5 | 131x44 | PASS | target answered 200 |
| EL-WHATSAPP-677 | `/admin/whatsapp` | en | link | Service Requests | /admin/applications | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-678 | `/admin/whatsapp` | en | link | Services & Integrations | /admin/services | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-679 | `/admin/whatsapp` | en | link | Settings | /admin/settings | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-680 | `/admin/whatsapp` | en | link | Settings | /admin/whatsapp/settings | 5 | 115x46 | PASS | target answered 200 |
| EL-WHATSAPP-681 | `/admin/whatsapp` | en | link | Settings | wa.open.settings | 5 | 117x44 | PASS | target answered 200 |
| EL-WHATSAPP-682 | `/admin/whatsapp` | en | link | Skip to content | #main | 5 | 144x47 | PASS | in-page anchor |
| EL-WHATSAPP-683 | `/admin/whatsapp` | en | link | Staff & Audit | /admin/staff | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-684 | `/admin/whatsapp` | en | link | Templates | /admin/whatsapp/templates | 5 | 130x46 | PASS | target answered 200 |
| EL-WHATSAPP-685 | `/admin/whatsapp` | en | link | Templates | wa.open.templates | 5 | 132x44 | PASS | target answered 200 |
| EL-WHATSAPP-686 | `/admin/whatsapp` | en | link | WhatsApp | /admin/whatsapp | 5 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-687 | `/admin/whatsapp` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-WHATSAPP-688 | `/admin/whatsapp` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-WHATSAPP-689 | `/admin/whatsapp` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-690 | `/admin/whatsapp` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-691 | `/admin/whatsapp` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-692 | `/admin/whatsapp` | ur | link | ان باکس | /ur/admin/whatsapp/inbox | 1 | 88x52 | PASS | target answered 200 |
| EL-WHATSAPP-693 | `/admin/whatsapp` | ur | link | ان باکس (0 موصول) | wa.open.inbox | 1 | 147x49 | PASS | target answered 200 |
| EL-WHATSAPP-694 | `/admin/whatsapp` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-WHATSAPP-695 | `/admin/whatsapp` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-696 | `/admin/whatsapp` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-697 | `/admin/whatsapp` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-698 | `/admin/whatsapp` | ur | link | ترتیبات | /ur/admin/whatsapp/settings | 1 | 82x52 | PASS | target answered 200 |
| EL-WHATSAPP-699 | `/admin/whatsapp` | ur | link | ترتیبات | wa.open.settings | 1 | 84x49 | PASS | target answered 200 |
| EL-WHATSAPP-700 | `/admin/whatsapp` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-701 | `/admin/whatsapp` | ur | link | تیاری | /ur/admin/whatsapp/readiness | 1 | 74x52 | PASS | target answered 200 |
| EL-WHATSAPP-702 | `/admin/whatsapp` | ur | link | ٹیمپلیٹس | /ur/admin/whatsapp/templates | 1 | 88x52 | PASS | target answered 200 |
| EL-WHATSAPP-703 | `/admin/whatsapp` | ur | link | ٹیمپلیٹس | wa.open.templates | 1 | 90x49 | PASS | target answered 200 |
| EL-WHATSAPP-704 | `/admin/whatsapp` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-705 | `/admin/whatsapp` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-706 | `/admin/whatsapp` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-707 | `/admin/whatsapp` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-708 | `/admin/whatsapp` | ur | link | رضامندی | /ur/admin/whatsapp/consent | 1 | 91x52 | PASS | target answered 200 |
| EL-WHATSAPP-709 | `/admin/whatsapp` | ur | link | رضامندی | wa.open.consent | 1 | 93x49 | PASS | target answered 200 |
| EL-WHATSAPP-710 | `/admin/whatsapp` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-711 | `/admin/whatsapp` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-712 | `/admin/whatsapp` | ur | link | سیگمنٹس | /ur/admin/business-directory/segments | 1 | 86x52 | PASS | target answered 200 |
| EL-WHATSAPP-713 | `/admin/whatsapp` | ur | link | سیگمنٹس | wa.open.segments | 1 | 88x49 | PASS | target answered 200 |
| EL-WHATSAPP-714 | `/admin/whatsapp` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-715 | `/admin/whatsapp` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-716 | `/admin/whatsapp` | ur | link | مہمات | /ur/admin/whatsapp/campaigns | 1 | 79x52 | PASS | target answered 200 |
| EL-WHATSAPP-717 | `/admin/whatsapp` | ur | link | مہمات | wa.open.campaigns | 1 | 81x49 | PASS | target answered 200 |
| EL-WHATSAPP-718 | `/admin/whatsapp` | ur | link | مہمات کی تاریخ | /ur/admin/whatsapp/campaigns/history | 1 | 115x52 | PASS | target answered 200 |
| EL-WHATSAPP-719 | `/admin/whatsapp` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-WHATSAPP-720 | `/admin/whatsapp` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-WHATSAPP-721 | `/admin/whatsapp` | ur | link | نیا پیغام | /ur/admin/whatsapp/campaigns/new | 1 | 82x52 | PASS | target answered 200 |
| EL-WHATSAPP-722 | `/admin/whatsapp` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-151 | `/admin` | en | button | Light or dark theme | theme.toggle | 12 | 44x44 | PASS | exercised by a functional spec |
| EL-ADMIN-152 | `/admin` | en | button | Sign out | logout | 12 | 116x44 | PASS | exercised by a functional spec |
| EL-ADMIN-153 | `/admin` | en | link | 1 application(s) to review Membership Pipeline | nav | 11 | 511x65 | PASS | target answered 200 |
| EL-ADMIN-154 | `/admin` | en | link | Accounts | /admin/finance | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-155 | `/admin` | en | link | Ask MCCI AI | /admin/help | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-156 | `/admin` | en | link | Business Directory | /admin/business-directory | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-157 | `/admin` | en | link | Certificates | /admin/temp | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-158 | `/admin` | en | link | Complaint Desk | /admin/complaints | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-159 | `/admin` | en | link | Content & Messaging | /admin/content | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-160 | `/admin` | en | link | Documents & QR | /admin/documents | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-161 | `/admin` | en | link | Events & Meetings | /admin/events | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-162 | `/admin` | en | link | MCCI Admin Secretariat Panel | /admin | 12 | 238x82 | PASS | target answered 200 |
| EL-ADMIN-163 | `/admin` | en | link | Members Register | /admin/members | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-164 | `/admin` | en | link | Membership Pipeline | /admin/requests | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-165 | `/admin` | en | link | Payments | /admin/payments | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-166 | `/admin` | en | link | Reports & AI | /admin/reports | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-167 | `/admin` | en | link | Service Requests | /admin/applications | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-168 | `/admin` | en | link | Services & Integrations | /admin/services | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-169 | `/admin` | en | link | Settings | /admin/settings | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-170 | `/admin` | en | link | Skip to content | #main | 12 | 144x47 | PASS | in-page anchor |
| EL-ADMIN-171 | `/admin` | en | link | Staff & Audit | /admin/staff | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-172 | `/admin` | en | link | WhatsApp | /admin/whatsapp | 12 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-173 | `/admin` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-ADMIN-174 | `/admin` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-ADMIN-175 | `/admin` | ur | link | 1 درخواستیں جائزہ طلب ممبرشپ پائپ لائن | nav | 1 | 511x77 | PASS | target answered 200 |
| EL-ADMIN-176 | `/admin` | ur | link | ادائیگیاں | /ur/admin/payments | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-177 | `/admin` | ur | link | اراکین کا رجسٹر | /ur/admin/members | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-178 | `/admin` | ur | link | اکاؤنٹس | /ur/admin/finance | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-179 | `/admin` | ur | link | ایم سی سی آئی ایڈمن سیکریٹریٹ پینل | /ur/admin | 1 | 238x99 | PASS | target answered 200 |
| EL-ADMIN-180 | `/admin` | ur | link | ایم سی سی آئی اے آئی سے پوچھیں | /ur/admin/help | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-181 | `/admin` | ur | link | بزنس ڈائریکٹری | /ur/admin/business-directory | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-182 | `/admin` | ur | link | ترتیبات | /ur/admin/settings | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-183 | `/admin` | ur | link | تقریبات اور اجلاس | /ur/admin/events | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-184 | `/admin` | ur | link | خدمات اور انٹیگریشنز | /ur/admin/services | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-185 | `/admin` | ur | link | خدمات کی درخواستیں | /ur/admin/applications | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-186 | `/admin` | ur | link | دستاویزات اور کیو آر | /ur/admin/documents | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-187 | `/admin` | ur | link | رپورٹس اور اے آئی | /ur/admin/reports | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-188 | `/admin` | ur | link | رکنیت کی پائپ لائن | /ur/admin/requests | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-189 | `/admin` | ur | link | سرٹیفکیٹس | /ur/admin/temp | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-190 | `/admin` | ur | link | شکایات ڈیسک | /ur/admin/complaints | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-191 | `/admin` | ur | link | عملہ اور آڈٹ | /ur/admin/staff | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-192 | `/admin` | ur | link | مواد اور پیغامات | /ur/admin/content | 1 | 238x44 | PASS | target answered 200 |
| EL-ADMIN-193 | `/admin` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-ADMIN-194 | `/admin` | ur | link | واٹس ایپ | /ur/admin/whatsapp | 1 | 238x44 | PASS | target answered 200 |
| EL-SITE-045 | `/contact` | en | button | Change language to Urdu | lang.toggle | 2 | 82x44 | PASS | exercised by a functional spec |
| EL-SITE-046 | `/contact` | en | button | Pause the news ticker | ticker.pause | 2 | 44x37 | PASS | exercised by a functional spec |
| EL-SITE-047 | `/contact` | en | input:text | Member ID (optional) |  | 2 | 256x45 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-048 | `/contact` | en | input:text | Mobile / email |  | 2 | 256x45 | PASS | exercised by a functional spec |
| EL-SITE-049 | `/contact` | en | input:text | Name |  | 2 | 256x45 | PASS | exercised by a functional spec |
| EL-SITE-050 | `/contact` | en | input:text | Subject |  | 2 | 256x45 | PASS | exercised by a functional spec |
| EL-SITE-051 | `/contact` | en | link | About | /about | 2 | 68x38 | PASS | target answered 200 |
| EL-SITE-052 | `/contact` | en | link | All news and notifications | ticker.all | 2 | 95x37 | PASS | target answered 200 |
| EL-SITE-053 | `/contact` | en | link | Call | help.call | 2 | 84x44 | PARTIAL | external / file link (not requested) |
| EL-SITE-054 | `/contact` | en | link | Certificate of Origin | /service?s=co | 2 | 245x31 | PASS | target answered 200 |
| EL-SITE-055 | `/contact` | en | link | Contact | /contact | 2 | 82x38 | PASS | target answered 200 |
| EL-SITE-056 | `/contact` | en | link | Directory | /directory | 2 | 90x38 | PASS | target answered 200 |
| EL-SITE-057 | `/contact` | en | link | E-BIL | /service?s=ebil | 2 | 245x31 | PASS | target answered 200 |
| EL-SITE-058 | `/contact` | en | link | Email | help.email | 2 | 95x44 | PARTIAL | external / file link (not requested) |
| EL-SITE-059 | `/contact` | en | link | Home | nav | 2 | 44x44 | PASS | target answered 200 |
| EL-SITE-060 | `/contact` | en | link | Map | help.visit | 2 | 88x44 | PARTIAL | external / file link (not requested) |
| EL-SITE-061 | `/contact` | en | link | MCCI Digital Chamber ایوانِ تجارت و صنعت ملتان | / | 2 | 157x59 | PASS | target answered 200 |
| EL-SITE-062 | `/contact` | en | link | Member Login | /login | 2 | 160x44 | PASS | target answered 200 |
| EL-SITE-063 | `/contact` | en | link | Membership | /membership | 2 | 112x38 | PASS | target answered 200 |
| EL-SITE-064 | `/contact` | en | link | News | /news | 2 | 63x38 | PASS | target answered 200 |
| EL-SITE-065 | `/contact` | en | link | NEWS Chamber news c36f7d | ticker.post | 2 | 194x38 | PASS | target answered 200 |
| EL-SITE-066 | `/contact` | en | link | NEWS Chamber news d098e0 | ticker.post | 2 | 201x38 | PASS | target answered 200 |
| EL-SITE-067 | `/contact` | en | link | Resources | /resources | 2 | 98x38 | PASS | target answered 200 |
| EL-SITE-068 | `/contact` | en | link | Services | /services | 2 | 84x38 | PASS | target answered 200 |
| EL-SITE-069 | `/contact` | en | link | Skip to content | #main | 2 | 144x47 | PASS | in-page anchor |
| EL-SITE-070 | `/contact` | en | link | Track | /track | 2 | 61x38 | PASS | target answered 200 |
| EL-SITE-071 | `/contact` | en | link | Verify | /verify | 2 | 65x38 | PASS | target answered 200 |
| EL-SITE-072 | `/contact` | en | link | Visa letters | /service?s=visa | 2 | 245x31 | PASS | target answered 200 |
| EL-SITE-073 | `/contact` | en | submit | Send message | contact.send | 2 | 161x44 | PASS | exercised by a functional spec |
| EL-SITE-074 | `/contact` | en | tab | Complaint desk | tab | 2 | 149x44 | PASS | exercised by a functional spec |
| EL-SITE-075 | `/contact` | en | tab | Contact | tab | 2 | 94x44 | PASS | exercised by a functional spec |
| EL-SITE-076 | `/contact` | en | textarea | Message |  | 2 | 524x112 | PASS | exercised by a functional spec |
| EL-SITE-077 | `/contact` | ur | button | خبروں کی پٹی روکیں | ticker.pause | 1 | 44x37 | PASS | exercised by a functional spec |
| EL-SITE-078 | `/contact` | ur | button | زبان انگریزی میں بدلیں | lang.toggle | 1 | 82x44 | PASS | exercised by a functional spec |
| EL-SITE-079 | `/contact` | ur | input:text | ممبر آئی ڈی (اختیاری) |  | 1 | 256x51 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-080 | `/contact` | ur | input:text | موبائل / ای میل |  | 1 | 256x51 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-081 | `/contact` | ur | input:text | موضوع |  | 1 | 256x51 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-082 | `/contact` | ur | input:text | نام |  | 1 | 256x51 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-083 | `/contact` | ur | link | ای میل | help.email | 1 | 87x49 | PARTIAL | external / file link (not requested) |
| EL-SITE-084 | `/contact` | ur | link | ای-بِل | /ur/service?s=ebil | 1 | 245x37 | PASS | target answered 200 |
| EL-SITE-085 | `/contact` | ur | link | ایم سی سی آئی ڈیجیٹل چیمبر ایوانِ تجارت و صنعت ملتان | /ur | 1 | 157x79 | PASS | target answered 200 |
| EL-SITE-086 | `/contact` | ur | link | تصدیق | /ur/verify | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-087 | `/contact` | ur | link | تعارف | /ur/about | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-088 | `/contact` | ur | link | تمام خبریں اور اعلانات | ticker.all | 1 | 89x37 | PASS | target answered 200 |
| EL-SITE-089 | `/contact` | ur | link | ٹریک | /ur/track | 1 | 45x38 | PASS | target answered 200 |
| EL-SITE-090 | `/contact` | ur | link | خبر Chamber news c36f7d | ticker.post | 1 | 169x38 | PASS | target answered 200 |
| EL-SITE-091 | `/contact` | ur | link | خبر Chamber news d098e0 | ticker.post | 1 | 174x38 | PASS | target answered 200 |
| EL-SITE-092 | `/contact` | ur | link | خبریں | /ur/news | 1 | 45x38 | PASS | target answered 200 |
| EL-SITE-093 | `/contact` | ur | link | خدمات | /ur/services | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-094 | `/contact` | ur | link | ڈائریکٹری | /ur/directory | 1 | 59x38 | PASS | target answered 200 |
| EL-SITE-095 | `/contact` | ur | link | رابطہ | /ur/contact | 1 | 41x38 | PASS | target answered 200 |
| EL-SITE-096 | `/contact` | ur | link | رکنیت | /ur/membership | 1 | 46x38 | PASS | target answered 200 |
| EL-SITE-097 | `/contact` | ur | link | سرٹیفکیٹ آف اوریجن | /ur/service?s=co | 1 | 245x37 | PASS | target answered 200 |
| EL-SITE-098 | `/contact` | ur | link | فون کریں | help.call | 1 | 94x49 | PARTIAL | external / file link (not requested) |
| EL-SITE-099 | `/contact` | ur | link | ممبر لاگ اِن | /ur/login | 1 | 106x44 | PASS | target answered 200 |
| EL-SITE-100 | `/contact` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-SITE-101 | `/contact` | ur | link | نقشہ | help.visit | 1 | 72x49 | PARTIAL | external / file link (not requested) |
| EL-SITE-102 | `/contact` | ur | link | ہوم | nav | 1 | 44x44 | PASS | target answered 200 |
| EL-SITE-103 | `/contact` | ur | link | وسائل | /ur/resources | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-104 | `/contact` | ur | link | ویزا لیٹر | /ur/service?s=visa | 1 | 245x37 | PASS | target answered 200 |
| EL-SITE-105 | `/contact` | ur | submit | پیغام بھیجیں | contact.send | 1 | 97x47 | PASS | exercised by a functional spec |
| EL-SITE-106 | `/contact` | ur | tab | رابطہ | tab | 1 | 51x47 | PASS | exercised by a functional spec |
| EL-SITE-107 | `/contact` | ur | tab | شکایت ڈیسک | tab | 1 | 84x47 | PASS | exercised by a functional spec |
| EL-SITE-108 | `/contact` | ur | textarea | پیغام |  | 1 | 524x136 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-109 | `/directory` | en | button | Change language to Urdu | lang.toggle | 2 | 82x44 | PASS | exercised by a functional spec |
| EL-SITE-110 | `/directory` | en | button | Pause the news ticker | ticker.pause | 2 | 44x37 | PASS | exercised by a functional spec |
| EL-SITE-111 | `/directory` | en | button | View Company E (endorser) | dir.view | 2 | 163x44 | PASS | exercised by a functional spec |
| EL-SITE-112 | `/directory` | en | button | View E2E 5a407e56 Traders | dir.view | 2 | 160x44 | PASS | exercised by a functional spec |
| EL-SITE-113 | `/directory` | en | button | View E2E adf6afb6 Traders | dir.view | 2 | 154x44 | PASS | exercised by a functional spec |
| EL-SITE-114 | `/directory` | en | button | View E2E b88952ae Traders | dir.view | 2 | 160x44 | PASS | exercised by a functional spec |
| EL-SITE-115 | `/directory` | en | input:search | Search company or sector | dir.search | 2 | 942x45 | PASS | exercised by a functional spec |
| EL-SITE-116 | `/directory` | en | link | About | /about | 2 | 68x38 | PASS | target answered 200 |
| EL-SITE-117 | `/directory` | en | link | All news and notifications | ticker.all | 2 | 95x37 | PASS | target answered 200 |
| EL-SITE-118 | `/directory` | en | link | Certificate of Origin | /service?s=co | 2 | 245x31 | PASS | target answered 200 |
| EL-SITE-119 | `/directory` | en | link | Contact | /contact | 2 | 82x38 | PASS | target answered 200 |
| EL-SITE-120 | `/directory` | en | link | Directory | /directory | 2 | 90x38 | PASS | target answered 200 |
| EL-SITE-121 | `/directory` | en | link | E-BIL | /service?s=ebil | 2 | 245x31 | PASS | target answered 200 |
| EL-SITE-122 | `/directory` | en | link | Home | nav | 2 | 44x44 | PASS | target answered 200 |
| EL-SITE-123 | `/directory` | en | link | MCCI Digital Chamber ایوانِ تجارت و صنعت ملتان | / | 2 | 157x59 | PASS | target answered 200 |
| EL-SITE-124 | `/directory` | en | link | Member Login | /login | 2 | 160x44 | PASS | target answered 200 |
| EL-SITE-125 | `/directory` | en | link | Membership | /membership | 2 | 112x38 | PASS | target answered 200 |
| EL-SITE-126 | `/directory` | en | link | News | /news | 2 | 63x38 | PASS | target answered 200 |
| EL-SITE-127 | `/directory` | en | link | NEWS Chamber news c36f7d | ticker.post | 2 | 194x38 | PASS | target answered 200 |
| EL-SITE-128 | `/directory` | en | link | NEWS Chamber news d098e0 | ticker.post | 2 | 201x38 | PASS | target answered 200 |
| EL-SITE-129 | `/directory` | en | link | Resources | /resources | 2 | 98x38 | PASS | target answered 200 |
| EL-SITE-130 | `/directory` | en | link | Services | /services | 2 | 84x38 | PASS | target answered 200 |
| EL-SITE-131 | `/directory` | en | link | Skip to content | #main | 2 | 144x47 | PASS | in-page anchor |
| EL-SITE-132 | `/directory` | en | link | Track | /track | 2 | 61x38 | PASS | target answered 200 |
| EL-SITE-133 | `/directory` | en | link | Verify | /verify | 2 | 65x38 | PASS | target answered 200 |
| EL-SITE-134 | `/directory` | en | link | Visa letters | /service?s=visa | 2 | 245x31 | PASS | target answered 200 |
| EL-SITE-135 | `/directory` | en | select | ClassAll classesCorporateAssociate | dir.filter | 2 | 156x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-136 | `/directory` | ur | button | Company E (endorser) دیکھیں | dir.view | 1 | 163x44 | PASS | exercised by a functional spec |
| EL-SITE-137 | `/directory` | ur | button | E2E 5a407e56 Traders دیکھیں | dir.view | 1 | 160x44 | PASS | exercised by a functional spec |
| EL-SITE-138 | `/directory` | ur | button | E2E adf6afb6 Traders دیکھیں | dir.view | 1 | 154x44 | PASS | exercised by a functional spec |
| EL-SITE-139 | `/directory` | ur | button | E2E b88952ae Traders دیکھیں | dir.view | 1 | 160x44 | PASS | exercised by a functional spec |
| EL-SITE-140 | `/directory` | ur | button | خبروں کی پٹی روکیں | ticker.pause | 1 | 44x37 | PASS | exercised by a functional spec |
| EL-SITE-141 | `/directory` | ur | button | زبان انگریزی میں بدلیں | lang.toggle | 1 | 82x44 | PASS | exercised by a functional spec |
| EL-SITE-142 | `/directory` | ur | input:search | کمپنی یا شعبہ تلاش کریں | dir.search | 1 | 990x51 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-143 | `/directory` | ur | link | ای-بِل | /ur/service?s=ebil | 1 | 245x37 | PASS | target answered 200 |
| EL-SITE-144 | `/directory` | ur | link | ایم سی سی آئی ڈیجیٹل چیمبر ایوانِ تجارت و صنعت ملتان | /ur | 1 | 157x79 | PASS | target answered 200 |
| EL-SITE-145 | `/directory` | ur | link | تصدیق | /ur/verify | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-146 | `/directory` | ur | link | تعارف | /ur/about | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-147 | `/directory` | ur | link | تمام خبریں اور اعلانات | ticker.all | 1 | 89x37 | PASS | target answered 200 |
| EL-SITE-148 | `/directory` | ur | link | ٹریک | /ur/track | 1 | 45x38 | PASS | target answered 200 |
| EL-SITE-149 | `/directory` | ur | link | خبر Chamber news c36f7d | ticker.post | 1 | 169x38 | PASS | target answered 200 |
| EL-SITE-150 | `/directory` | ur | link | خبر Chamber news d098e0 | ticker.post | 1 | 174x38 | PASS | target answered 200 |
| EL-SITE-151 | `/directory` | ur | link | خبریں | /ur/news | 1 | 45x38 | PASS | target answered 200 |
| EL-SITE-152 | `/directory` | ur | link | خدمات | /ur/services | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-153 | `/directory` | ur | link | ڈائریکٹری | /ur/directory | 1 | 59x38 | PASS | target answered 200 |
| EL-SITE-154 | `/directory` | ur | link | رابطہ | /ur/contact | 1 | 41x38 | PASS | target answered 200 |
| EL-SITE-155 | `/directory` | ur | link | رکنیت | /ur/membership | 1 | 46x38 | PASS | target answered 200 |
| EL-SITE-156 | `/directory` | ur | link | سرٹیفکیٹ آف اوریجن | /ur/service?s=co | 1 | 245x37 | PASS | target answered 200 |
| EL-SITE-157 | `/directory` | ur | link | ممبر لاگ اِن | /ur/login | 1 | 106x44 | PASS | target answered 200 |
| EL-SITE-158 | `/directory` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-SITE-159 | `/directory` | ur | link | ہوم | nav | 1 | 44x44 | PASS | target answered 200 |
| EL-SITE-160 | `/directory` | ur | link | وسائل | /ur/resources | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-161 | `/directory` | ur | link | ویزا لیٹر | /ur/service?s=visa | 1 | 245x37 | PASS | target answered 200 |
| EL-SITE-162 | `/directory` | ur | select | کلاستمام کلاسیںکارپوریٹایسوسی ایٹ | dir.filter | 1 | 108x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-163 | `/` | en | button | Change language to Urdu | lang.toggle | 2 | 102x44 | PASS | exercised by a functional spec |
| EL-SITE-164 | `/` | en | button | Next slide | slider.next | 2 | 46x46 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-165 | `/` | en | button | Pause the news ticker | ticker.pause | 2 | 44x37 | PASS | exercised by a functional spec |
| EL-SITE-166 | `/` | en | button | Previous slide | slider.prev | 2 | 46x46 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-167 | `/` | en | input:radio | Complaint |  | 2 | 13x13 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-168 | `/` | en | input:radio | Suggestion |  | 2 | 13x13 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-169 | `/` | en | input:text | Document code |  | 2 | 557x52 | PASS | exercised by a functional spec |
| EL-SITE-170 | `/` | en | input:text | Membership no. (optional) |  | 2 | 305x47 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-171 | `/` | en | input:text | Mobile or email |  | 2 | 623x47 | PASS | exercised by a functional spec |
| EL-SITE-172 | `/` | en | input:text | Your name |  | 2 | 305x47 | PASS | exercised by a functional spec |
| EL-SITE-173 | `/` | en | link | 061-4517087 | tel:+92614517087 | 2 | 88x21 | PARTIAL | external / file link (not requested) |
| EL-SITE-174 | `/` | en | link | 061-4543530 | tel:+92614543530 | 2 | 93x21 | PARTIAL | external / file link (not requested) |
| EL-SITE-175 | `/` | en | link | 3 Nov 2026 Chamber news c36f7d | post.view | 2 | 337x380 | PASS | target answered 200 |
| EL-SITE-176 | `/` | en | link | 6 Nov 2026 Chamber news d098e0 | post.view | 2 | 539x380 | PASS | target answered 200 |
| EL-SITE-177 | `/` | en | link | About | #about | 2 | 78x40 | PASS | in-page anchor |
| EL-SITE-178 | `/` | en | link | Adera Labs | https://www.aderalabs.com | 2 | 72x19 | PARTIAL | external / file link (not requested) |
| EL-SITE-179 | `/` | en | link | Advocacy & policy Budget proposals and members' concerns taken to the federal and Punjab g | /about | 2 | 404x303 | PASS | target answered 200 |
| EL-SITE-180 | `/` | en | link | All news | nav | 2 | 89x26 | PASS | target answered 200 |
| EL-SITE-181 | `/` | en | link | All news and notifications | ticker.all | 2 | 95x37 | PASS | target answered 200 |
| EL-SITE-182 | `/` | en | link | Become a member Apply online in minutes | register.start | 2 | 197x185 | PASS | target answered 200 |
| EL-SITE-183 | `/` | en | link | CN Visa Guarantee (China) For obtaining a Chinese business visa Apply | /service?s=guar | 2 | 300x234 | PASS | target answered 200 |
| EL-SITE-184 | `/` | en | link | CO Certificate of Origin Attestation of C.O. for every shipment Apply | /service?s=co | 2 | 300x234 | PASS | target answered 200 |
| EL-SITE-185 | `/` | en | link | Complaints & Suggestions Tell us how we can do better | #complaints | 2 | 197x185 | PASS | in-page anchor |
| EL-SITE-186 | `/` | en | link | Contact | #contact | 2 | 93x40 | PASS | in-page anchor |
| EL-SITE-187 | `/` | en | link | Contact | /contact | 2 | 226x26 | PASS | target answered 200 |
| EL-SITE-188 | `/` | en | link | DA Document Attestation Certificates, financial reports, MoUs Apply | /service?s=att | 2 | 300x234 | PASS | target answered 200 |
| EL-SITE-189 | `/` | en | link | Digital services Certificates, letters and attestation, issued online and verified by QR. | /services | 2 | 404x303 | PASS | target answered 200 |
| EL-SITE-190 | `/` | en | link | EB E-BIL Electronic Business Invitation Letter Apply | /service?s=ebil | 2 | 300x234 | PASS | target answered 200 |
| EL-SITE-191 | `/` | en | link | Executive Committee 2026-28 | /about#leadership | 2 | 263x26 | PASS | target answered 200 |
| EL-SITE-192 | `/` | en | link | Find a member Business directory | nav | 2 | 197x185 | PASS | target answered 200 |
| EL-SITE-193 | `/` | en | link | FS Free Samples Letter Carry commercial samples abroad Apply | /service?s=sample | 2 | 300x234 | PASS | target answered 200 |
| EL-SITE-194 | `/` | en | link | info@mcci.org.pk | mailto:info@mcci.org.pk | 2 | 122x21 | PARTIAL | external / file link (not requested) |
| EL-SITE-195 | `/` | en | link | Live Desk | #live | 2 | 83x40 | PASS | in-page anchor |
| EL-SITE-196 | `/` | en | link | Member Login | nav | 2 | 136x44 | PASS | target answered 200 |
| EL-SITE-197 | `/` | en | link | Membership | #join | 2 | 121x40 | PASS | in-page anchor |
| EL-SITE-198 | `/` | en | link | News & Notifications | #news | 2 | 163x40 | PASS | in-page anchor |
| EL-SITE-199 | `/` | en | link | NEWS Chamber news c36f7d | ticker.post | 2 | 194x38 | PASS | target answered 200 |
| EL-SITE-200 | `/` | en | link | NEWS Chamber news d098e0 | ticker.post | 2 | 201x38 | PASS | target answered 200 |
| EL-SITE-201 | `/` | en | link | Open the Live Board | nav | 2 | 198x32 | PASS | target answered 200 |
| EL-SITE-202 | `/` | en | link | Requirements | nav | 2 | 150x48 | PASS | target answered 200 |
| EL-SITE-203 | `/` | en | link | RL Recommendatory Letter Membership and company profile letters Apply | /service?s=other | 2 | 300x234 | PASS | target answered 200 |
| EL-SITE-204 | `/` | en | link | Services | #services | 2 | 95x40 | PASS | in-page anchor |
| EL-SITE-205 | `/` | en | link | Skip to content | #main | 2 | 144x47 | PASS | in-page anchor |
| EL-SITE-206 | `/` | en | link | The Multan Chamber of Commerce & Industry, home | #top | 2 | 233x50 | PASS | in-page anchor |
| EL-SITE-207 | `/` | en | link | Track a token See where your request is | nav | 2 | 197x185 | PASS | target answered 200 |
| EL-SITE-208 | `/` | en | link | Trade promotion Delegations, exhibitions and visits by foreign missions that open new mark | /news | 2 | 404x303 | PASS | target answered 200 |
| EL-SITE-209 | `/` | en | link | Verify a document | /verify | 2 | 226x26 | PASS | target answered 200 |
| EL-SITE-210 | `/` | en | link | Verify a document Scan or type the code | #verify | 2 | 197x185 | PASS | in-page anchor |
| EL-SITE-211 | `/` | en | link | VR Visa Recommendation Letters for business travel abroad Apply | /service?s=visa | 2 | 300x234 | PASS | target answered 200 |
| EL-SITE-212 | `/` | en | link | Women entrepreneurs A reduced membership fee, mentoring and a seat at the table. | /membership | 2 | 404x303 | PASS | target answered 200 |
| EL-SITE-213 | `/` | en | submit | Send to the Secretariat | contact.send | 2 | 218x45 | PASS | exercised by a functional spec |
| EL-SITE-214 | `/` | en | submit | Verify | verify.go | 2 | 89x52 | PASS | exercised by a functional spec |
| EL-SITE-215 | `/` | en | tab | Slide 1 | slider.go | 2 | 38x22 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-216 | `/` | en | tab | Slide 2 | slider.go | 2 | 38x22 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-217 | `/` | en | tab | Slide 3 | slider.go | 2 | 38x22 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-218 | `/` | en | tab | Slide 4 | slider.go | 2 | 38x22 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-219 | `/` | en | tab | Slide 5 | slider.go | 2 | 38x22 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-220 | `/` | en | tab | Slide 6 | slider.go | 2 | 38x22 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-221 | `/` | en | textarea | Your message |  | 2 | 623x110 | PASS | exercised by a functional spec |
| EL-AUTH-001 | `/invite/acceptance-token-does-not-exist` | en | button | Change language to Urdu | lang.toggle | 2 | 102x44 | PASS | exercised by a functional spec |
| EL-AUTH-002 | `/invite/acceptance-token-does-not-exist` | en | link | Back to website | nav | 2 | 135x24 | PASS | target answered 200 |
| EL-AUTH-003 | `/invite/acceptance-token-does-not-exist` | en | link | Skip to content | #main | 2 | 144x47 | PASS | in-page anchor |
| EL-AUTH-004 | `/invite/acceptance-token-does-not-exist` | ur | button | زبان انگریزی میں بدلیں | lang.toggle | 1 | 102x47 | PASS | exercised by a functional spec |
| EL-AUTH-005 | `/invite/acceptance-token-does-not-exist` | ur | link | مواد پر جائیں | #main | 1 | 88x57 | PASS | in-page anchor |
| EL-AUTH-006 | `/invite/acceptance-token-does-not-exist` | ur | link | ویب سائٹ پر واپس | nav | 1 | 113x33 | PASS | target answered 200 |
| EL-SITE-222 | `/live` | en | button | Change language to Urdu | lang.toggle | 2 | 82x44 | PASS | exercised by a functional spec |
| EL-SITE-223 | `/live` | en | button | Pause the news ticker | ticker.pause | 2 | 44x37 | PASS | exercised by a functional spec |
| EL-SITE-224 | `/live` | en | link | About | /about | 2 | 68x38 | PASS | target answered 200 |
| EL-SITE-225 | `/live` | en | link | All news and notifications | ticker.all | 2 | 95x37 | PASS | target answered 200 |
| EL-SITE-226 | `/live` | en | link | Certificate of Origin | /service?s=co | 2 | 245x31 | PASS | target answered 200 |
| EL-SITE-227 | `/live` | en | link | Contact | /contact | 2 | 82x38 | PASS | target answered 200 |
| EL-SITE-228 | `/live` | en | link | Directory | /directory | 2 | 90x38 | PASS | target answered 200 |
| EL-SITE-229 | `/live` | en | link | E-BIL | /service?s=ebil | 2 | 245x31 | PASS | target answered 200 |
| EL-SITE-230 | `/live` | en | link | Home | nav | 2 | 44x44 | PASS | target answered 200 |
| EL-SITE-231 | `/live` | en | link | MCCI Digital Chamber ایوانِ تجارت و صنعت ملتان | / | 2 | 157x59 | PASS | target answered 200 |
| EL-SITE-232 | `/live` | en | link | Member Login | /login | 2 | 160x44 | PASS | target answered 200 |
| EL-SITE-233 | `/live` | en | link | Membership | /membership | 2 | 112x38 | PASS | target answered 200 |
| EL-SITE-234 | `/live` | en | link | News | /news | 2 | 63x38 | PASS | target answered 200 |
| EL-SITE-235 | `/live` | en | link | NEWS Chamber news c36f7d | ticker.post | 2 | 194x38 | PASS | target answered 200 |
| EL-SITE-236 | `/live` | en | link | NEWS Chamber news d098e0 | ticker.post | 2 | 201x38 | PASS | target answered 200 |
| EL-SITE-237 | `/live` | en | link | Resources | /resources | 2 | 98x38 | PASS | target answered 200 |
| EL-SITE-238 | `/live` | en | link | Services | /services | 2 | 84x38 | PASS | target answered 200 |
| EL-SITE-239 | `/live` | en | link | Skip to content | #main | 2 | 144x47 | PASS | in-page anchor |
| EL-SITE-240 | `/live` | en | link | Track | /track | 2 | 61x38 | PASS | target answered 200 |
| EL-SITE-241 | `/live` | en | link | Verify | /verify | 2 | 65x38 | PASS | target answered 200 |
| EL-SITE-242 | `/live` | en | link | Visa letters | /service?s=visa | 2 | 245x31 | PASS | target answered 200 |
| EL-SITE-243 | `/live` | ur | button | خبروں کی پٹی روکیں | ticker.pause | 1 | 44x37 | PASS | exercised by a functional spec |
| EL-SITE-244 | `/live` | ur | button | زبان انگریزی میں بدلیں | lang.toggle | 1 | 82x44 | PASS | exercised by a functional spec |
| EL-SITE-245 | `/live` | ur | link | ای-بِل | /ur/service?s=ebil | 1 | 245x37 | PASS | target answered 200 |
| EL-SITE-246 | `/live` | ur | link | ایم سی سی آئی ڈیجیٹل چیمبر ایوانِ تجارت و صنعت ملتان | /ur | 1 | 157x79 | PASS | target answered 200 |
| EL-SITE-247 | `/live` | ur | link | تصدیق | /ur/verify | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-248 | `/live` | ur | link | تعارف | /ur/about | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-249 | `/live` | ur | link | تمام خبریں اور اعلانات | ticker.all | 1 | 89x37 | PASS | target answered 200 |
| EL-SITE-250 | `/live` | ur | link | ٹریک | /ur/track | 1 | 45x38 | PASS | target answered 200 |
| EL-SITE-251 | `/live` | ur | link | خبر Chamber news c36f7d | ticker.post | 1 | 169x38 | PASS | target answered 200 |
| EL-SITE-252 | `/live` | ur | link | خبر Chamber news d098e0 | ticker.post | 1 | 174x38 | PASS | target answered 200 |
| EL-SITE-253 | `/live` | ur | link | خبریں | /ur/news | 1 | 45x38 | PASS | target answered 200 |
| EL-SITE-254 | `/live` | ur | link | خدمات | /ur/services | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-255 | `/live` | ur | link | ڈائریکٹری | /ur/directory | 1 | 59x38 | PASS | target answered 200 |
| EL-SITE-256 | `/live` | ur | link | رابطہ | /ur/contact | 1 | 41x38 | PASS | target answered 200 |
| EL-SITE-257 | `/live` | ur | link | رکنیت | /ur/membership | 1 | 46x38 | PASS | target answered 200 |
| EL-SITE-258 | `/live` | ur | link | سرٹیفکیٹ آف اوریجن | /ur/service?s=co | 1 | 245x37 | PASS | target answered 200 |
| EL-SITE-259 | `/live` | ur | link | ممبر لاگ اِن | /ur/login | 1 | 106x44 | PASS | target answered 200 |
| EL-SITE-260 | `/live` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-SITE-261 | `/live` | ur | link | ہوم | nav | 1 | 44x44 | PASS | target answered 200 |
| EL-SITE-262 | `/live` | ur | link | وسائل | /ur/resources | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-263 | `/live` | ur | link | ویزا لیٹر | /ur/service?s=visa | 1 | 245x37 | PASS | target answered 200 |
| EL-AUTH-007 | `/login/forgot` | en | button | Change language to Urdu | lang.toggle | 2 | 102x44 | PASS | exercised by a functional spec |
| EL-AUTH-008 | `/login/forgot` | en | button | Email me a reset link | auth.reset.request | 2 | 195x45 | PASS | exercised by a functional spec |
| EL-AUTH-009 | `/login/forgot` | en | input:email | Email |  | 2 | 460x50 | PASS | exercised by a functional spec |
| EL-AUTH-010 | `/login/forgot` | en | link | Back to login | /login | 2 | 460x44 | PASS | target answered 200 |
| EL-AUTH-011 | `/login/forgot` | en | link | Back to website | nav | 2 | 135x24 | PASS | target answered 200 |
| EL-AUTH-012 | `/login/forgot` | en | link | Skip to content | #main | 2 | 144x47 | PASS | in-page anchor |
| EL-AUTH-013 | `/login/forgot` | ur | button | ری سیٹ لنک ای میل کریں | auth.reset.request | 1 | 175x53 | PASS | exercised by a functional spec |
| EL-AUTH-014 | `/login/forgot` | ur | button | زبان انگریزی میں بدلیں | lang.toggle | 1 | 102x47 | PASS | exercised by a functional spec |
| EL-AUTH-015 | `/login/forgot` | ur | input:email | ای میل |  | 1 | 460x51 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-AUTH-016 | `/login/forgot` | ur | link | لاگ اِن پر واپس جائیں | /ur/login | 1 | 460x44 | PASS | target answered 200 |
| EL-AUTH-017 | `/login/forgot` | ur | link | مواد پر جائیں | #main | 1 | 88x57 | PASS | in-page anchor |
| EL-AUTH-018 | `/login/forgot` | ur | link | ویب سائٹ پر واپس | nav | 1 | 113x33 | PASS | target answered 200 |
| EL-AUTH-019 | `/login/reset` | en | button | Change language to Urdu | lang.toggle | 1 | 102x44 | PASS | exercised by a functional spec |
| EL-AUTH-020 | `/login/reset` | en | button | Save password | auth.reset.save | 1 | 156x45 | PASS | exercised by a functional spec |
| EL-AUTH-021 | `/login/reset` | en | button | Show password | password.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-AUTH-022 | `/login/reset` | en | input:password | New password |  | 1 | 460x50 | PASS | exercised by a functional spec |
| EL-AUTH-023 | `/login/reset` | en | input:password | Repeat the new password |  | 1 | 460x50 | PASS | exercised by a functional spec |
| EL-AUTH-024 | `/login/reset` | en | link | Back to website | nav | 1 | 135x24 | PASS | target answered 200 |
| EL-AUTH-025 | `/login/reset` | en | link | Skip to content | #main | 1 | 144x47 | PASS | in-page anchor |
| EL-AUTH-026 | `/login` | en | button | Change language to Urdu | lang.toggle | 1 | 102x44 | PASS | exercised by a functional spec |
| EL-AUTH-027 | `/login` | en | button | Create an account | tab | 1 | 130x20 | PASS | exercised by a functional spec |
| EL-AUTH-028 | `/login` | en | button | Show password | password.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-AUTH-029 | `/login` | en | button | Sign in | login.member | 1 | 460x54 | PASS | exercised by a functional spec |
| EL-AUTH-030 | `/login` | en | button | Sign in with email code | login.otp | 1 | 460x54 | PASS | exercised by a functional spec |
| EL-AUTH-031 | `/login` | en | input:password | Password |  | 1 | 460x58 | PASS | exercised by a functional spec |
| EL-AUTH-032 | `/login` | en | input:text | Mobile, email or member ID |  | 1 | 460x58 | PASS | exercised by a functional spec |
| EL-AUTH-033 | `/login` | en | link | Back to website | nav | 1 | 135x24 | PASS | target answered 200 |
| EL-AUTH-034 | `/login` | en | link | Forgot password? | nav | 1 | 126x20 | PASS | target answered 200 |
| EL-AUTH-035 | `/login` | en | link | Skip to content | #main | 1 | 144x47 | PASS | in-page anchor |
| EL-AUTH-036 | `/login` | en | tab | Sign In | tab | 1 | 224x38 | PASS | exercised by a functional spec |
| EL-AUTH-037 | `/login` | en | tab | Sign Up | tab | 1 | 224x38 | PASS | exercised by a functional spec |
| EL-AUTH-038 | `/login` | ur | button | اکاؤنٹ بنائیں | tab | 1 | 57x29 | PASS | exercised by a functional spec |
| EL-AUTH-039 | `/login` | ur | button | ای میل کوڈ سے سائن اِن | login.otp | 1 | 460x57 | PASS | exercised by a functional spec |
| EL-AUTH-040 | `/login` | ur | button | پاس ورڈ دکھائیں | password.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-AUTH-041 | `/login` | ur | button | زبان انگریزی میں بدلیں | lang.toggle | 1 | 102x47 | PASS | exercised by a functional spec |
| EL-AUTH-042 | `/login` | ur | button | سائن اِن کریں | login.member | 1 | 460x55 | PASS | exercised by a functional spec |
| EL-AUTH-043 | `/login` | ur | input:password | پاس ورڈ |  | 1 | 460x58 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-AUTH-044 | `/login` | ur | input:text | موبائل، ای میل یا ممبر آئی ڈی |  | 1 | 460x58 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-AUTH-045 | `/login` | ur | link | پاس ورڈ بھول گئے؟ | nav | 1 | 85x29 | PASS | target answered 200 |
| EL-AUTH-046 | `/login` | ur | link | مواد پر جائیں | #main | 1 | 88x57 | PASS | in-page anchor |
| EL-AUTH-047 | `/login` | ur | link | ویب سائٹ پر واپس | nav | 1 | 113x33 | PASS | target answered 200 |
| EL-AUTH-048 | `/login` | ur | tab | سائن اَپ | tab | 1 | 224x48 | PASS | exercised by a functional spec |
| EL-AUTH-049 | `/login` | ur | tab | سائن اِن | tab | 1 | 224x48 | PASS | exercised by a functional spec |
| EL-SITE-264 | `/membership` | en | button | Change language to Urdu | lang.toggle | 2 | 82x44 | PASS | exercised by a functional spec |
| EL-SITE-265 | `/membership` | en | button | How much is the fee? · فیس کتنی ہے؟ | faq.toggle | 2 | 760x51 | PASS | exercised by a functional spec |
| EL-SITE-266 | `/membership` | en | button | I do not know a proposer · میں کسی تجویز کنندہ کو نہیں جانتا | faq.toggle | 2 | 760x51 | PASS | exercised by a functional spec |
| EL-SITE-267 | `/membership` | en | button | Pause the news ticker | ticker.pause | 2 | 44x37 | PASS | exercised by a functional spec |
| EL-SITE-268 | `/membership` | en | button | When does membership expire? · رکنیت کب ختم ہوتی ہے؟ | faq.toggle | 2 | 760x51 | PASS | exercised by a functional spec |
| EL-SITE-269 | `/membership` | en | button | When does my membership start? · میری رکنیت کب شروع ہوتی ہے؟ | faq.toggle | 2 | 760x51 | PASS | exercised by a functional spec |
| EL-SITE-270 | `/membership` | en | button | Which documents do I need? · کون سی دستاویزات چاہئیں؟ | faq.toggle | 2 | 760x51 | PASS | exercised by a functional spec |
| EL-SITE-271 | `/membership` | en | link | About | /about | 2 | 68x38 | PASS | target answered 200 |
| EL-SITE-272 | `/membership` | en | link | Active from fee verification As soon as MCCI Accounts verify your fee, your membership is  | nav | 2 | 371x237 | PASS | target answered 200 |
| EL-SITE-273 | `/membership` | en | link | All news and notifications | ticker.all | 2 | 95x37 | PASS | target answered 200 |
| EL-SITE-274 | `/membership` | en | link | Certificate of Origin | /service?s=co | 2 | 245x31 | PASS | target answered 200 |
| EL-SITE-275 | `/membership` | en | link | Contact | /contact | 2 | 82x38 | PASS | target answered 200 |
| EL-SITE-276 | `/membership` | en | link | Directory | /directory | 2 | 90x38 | PASS | target answered 200 |
| EL-SITE-277 | `/membership` | en | link | Download blank form | res.download | 2 | 188x44 | PASS | target answered 200 |
| EL-SITE-278 | `/membership` | en | link | E-BIL | /service?s=ebil | 2 | 245x31 | PASS | target answered 200 |
| EL-SITE-279 | `/membership` | en | link | Home | nav | 2 | 44x44 | PASS | target answered 200 |
| EL-SITE-280 | `/membership` | en | link | MCCI Digital Chamber ایوانِ تجارت و صنعت ملتان | / | 2 | 157x59 | PASS | target answered 200 |
| EL-SITE-281 | `/membership` | en | link | Member Login | /login | 2 | 160x44 | PASS | target answered 200 |
| EL-SITE-282 | `/membership` | en | link | Membership | /membership | 2 | 112x38 | PASS | target answered 200 |
| EL-SITE-283 | `/membership` | en | link | News | /news | 2 | 63x38 | PASS | target answered 200 |
| EL-SITE-284 | `/membership` | en | link | NEWS Chamber news c36f7d | ticker.post | 2 | 194x38 | PASS | target answered 200 |
| EL-SITE-285 | `/membership` | en | link | NEWS Chamber news d098e0 | ticker.post | 2 | 201x38 | PASS | target answered 200 |
| EL-SITE-286 | `/membership` | en | link | Resources | /resources | 2 | 98x38 | PASS | target answered 200 |
| EL-SITE-287 | `/membership` | en | link | Services | /services | 2 | 84x38 | PASS | target answered 200 |
| EL-SITE-288 | `/membership` | en | link | Skip to content | #main | 2 | 144x47 | PASS | in-page anchor |
| EL-SITE-289 | `/membership` | en | link | Start my application → | register.start | 2 | 198x44 | PASS | target answered 200 |
| EL-SITE-290 | `/membership` | en | link | Track | /track | 2 | 61x38 | PASS | target answered 200 |
| EL-SITE-291 | `/membership` | en | link | Verify | /verify | 2 | 65x38 | PASS | target answered 200 |
| EL-SITE-292 | `/membership` | en | link | Visa letters | /service?s=visa | 2 | 245x31 | PASS | target answered 200 |
| EL-SITE-293 | `/membership` | en | tab | LLP | pub.biz | 2 | 60x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-294 | `/membership` | en | tab | Ltd. / Pvt. Ltd Co. | pub.biz | 2 | 163x44 | PASS | exercised by a functional spec |
| EL-SITE-295 | `/membership` | en | tab | Multinational Co. | pub.biz | 2 | 158x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-296 | `/membership` | en | tab | Partnership / AOP | pub.biz | 2 | 164x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-297 | `/membership` | en | tab | Proprietorship | pub.biz | 2 | 140x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-298 | `/membership` | en | tab | Public Ltd. Co. | pub.biz | 2 | 141x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-299 | `/membership` | ur | button | خبروں کی پٹی روکیں | ticker.pause | 1 | 44x37 | PASS | exercised by a functional spec |
| EL-SITE-300 | `/membership` | ur | button | رکنیت کب ختم ہوتی ہے؟ · When does membership expire? | faq.toggle | 1 | 760x57 | PASS | exercised by a functional spec |
| EL-SITE-301 | `/membership` | ur | button | زبان انگریزی میں بدلیں | lang.toggle | 1 | 82x44 | PASS | exercised by a functional spec |
| EL-SITE-302 | `/membership` | ur | button | فیس کتنی ہے؟ · How much is the fee? | faq.toggle | 1 | 760x57 | PASS | exercised by a functional spec |
| EL-SITE-303 | `/membership` | ur | button | کون سی دستاویزات چاہئیں؟ · Which documents do I need? | faq.toggle | 1 | 760x57 | PASS | exercised by a functional spec |
| EL-SITE-304 | `/membership` | ur | button | میری رکنیت کب شروع ہوتی ہے؟ · When does my membership start? | faq.toggle | 1 | 760x57 | PASS | exercised by a functional spec |
| EL-SITE-305 | `/membership` | ur | button | میں کسی تجویز کنندہ کو نہیں جانتا · I do not know a proposer | faq.toggle | 1 | 760x57 | PASS | exercised by a functional spec |
| EL-SITE-306 | `/membership` | ur | link | ای-بِل | /ur/service?s=ebil | 1 | 245x37 | PASS | target answered 200 |
| EL-SITE-307 | `/membership` | ur | link | ایم سی سی آئی ڈیجیٹل چیمبر ایوانِ تجارت و صنعت ملتان | /ur | 1 | 157x79 | PASS | target answered 200 |
| EL-SITE-308 | `/membership` | ur | link | تصدیق | /ur/verify | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-309 | `/membership` | ur | link | تعارف | /ur/about | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-310 | `/membership` | ur | link | تمام خبریں اور اعلانات | ticker.all | 1 | 89x37 | PASS | target answered 200 |
| EL-SITE-311 | `/membership` | ur | link | ٹریک | /ur/track | 1 | 45x38 | PASS | target answered 200 |
| EL-SITE-312 | `/membership` | ur | link | خالی فارم ڈاؤن لوڈ کریں | res.download | 1 | 123x49 | PASS | target answered 200 |
| EL-SITE-313 | `/membership` | ur | link | خبر Chamber news c36f7d | ticker.post | 1 | 169x38 | PASS | target answered 200 |
| EL-SITE-314 | `/membership` | ur | link | خبر Chamber news d098e0 | ticker.post | 1 | 174x38 | PASS | target answered 200 |
| EL-SITE-315 | `/membership` | ur | link | خبریں | /ur/news | 1 | 45x38 | PASS | target answered 200 |
| EL-SITE-316 | `/membership` | ur | link | خدمات | /ur/services | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-317 | `/membership` | ur | link | ڈائریکٹری | /ur/directory | 1 | 59x38 | PASS | target answered 200 |
| EL-SITE-318 | `/membership` | ur | link | رابطہ | /ur/contact | 1 | 41x38 | PASS | target answered 200 |
| EL-SITE-319 | `/membership` | ur | link | رکنیت | /ur/membership | 1 | 46x38 | PASS | target answered 200 |
| EL-SITE-320 | `/membership` | ur | link | سرٹیفکیٹ آف اوریجن | /ur/service?s=co | 1 | 245x37 | PASS | target answered 200 |
| EL-SITE-321 | `/membership` | ur | link | فیس کی تصدیق سے فعال ایم سی سی آئی اکاؤنٹس کی تصدیق ہوتے ہی رکنیت فعال اور تمام خدمات کھلی | nav | 1 | 371x233 | PASS | target answered 200 |
| EL-SITE-322 | `/membership` | ur | link | ممبر لاگ اِن | /ur/login | 1 | 106x44 | PASS | target answered 200 |
| EL-SITE-323 | `/membership` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-SITE-324 | `/membership` | ur | link | میری درخواست شروع کریں → | register.start | 1 | 159x49 | PASS | target answered 200 |
| EL-SITE-325 | `/membership` | ur | link | ہوم | nav | 1 | 44x44 | PASS | target answered 200 |
| EL-SITE-326 | `/membership` | ur | link | وسائل | /ur/resources | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-327 | `/membership` | ur | link | ویزا لیٹر | /ur/service?s=visa | 1 | 245x37 | PASS | target answered 200 |
| EL-SITE-328 | `/membership` | ur | tab | ایل ایل پی | pub.biz | 1 | 77x47 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-329 | `/membership` | ur | tab | پبلک لمیٹڈ کمپنی | pub.biz | 1 | 93x47 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-330 | `/membership` | ur | tab | پرائیویٹ لمیٹڈ کمپنی | pub.biz | 1 | 109x47 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-331 | `/membership` | ur | tab | شراکت داری | pub.biz | 1 | 86x47 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-332 | `/membership` | ur | tab | ملٹی نیشنل کمپنی | pub.biz | 1 | 90x47 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-333 | `/membership` | ur | tab | واحد ملکیت | pub.biz | 1 | 76x47 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-334 | `/news` | en | button | 2027-01-01 | cal.day | 2 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-335 | `/news` | en | button | 2027-01-02 | cal.day | 2 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-336 | `/news` | en | button | 2027-01-03 | cal.day | 2 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-337 | `/news` | en | button | 2027-01-04 | cal.day | 2 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-338 | `/news` | en | button | 2027-01-05 | cal.day | 2 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-339 | `/news` | en | button | 2027-01-06 | cal.day | 2 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-340 | `/news` | en | button | 2027-01-07 | cal.day | 2 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-341 | `/news` | en | button | 2027-01-08 | cal.day | 2 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-342 | `/news` | en | button | 2027-01-09 | cal.day | 2 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-343 | `/news` | en | button | 2027-01-10 | cal.day | 2 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-344 | `/news` | en | button | 2027-01-11 | cal.day | 2 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-345 | `/news` | en | button | 2027-01-12 | cal.day | 2 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-346 | `/news` | en | button | 2027-01-13 | cal.day | 2 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-347 | `/news` | en | button | 2027-01-14 | cal.day | 2 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-348 | `/news` | en | button | 2027-01-15 · 2 Events | cal.day | 2 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-349 | `/news` | en | button | 2027-01-16 | cal.day | 2 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-350 | `/news` | en | button | 2027-01-17 | cal.day | 2 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-351 | `/news` | en | button | 2027-01-18 | cal.day | 2 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-352 | `/news` | en | button | 2027-01-19 | cal.day | 2 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-353 | `/news` | en | button | 2027-01-20 | cal.day | 2 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-354 | `/news` | en | button | 2027-01-21 | cal.day | 2 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-355 | `/news` | en | button | 2027-01-22 | cal.day | 2 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-356 | `/news` | en | button | 2027-01-23 | cal.day | 2 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-357 | `/news` | en | button | 2027-01-24 | cal.day | 2 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-358 | `/news` | en | button | 2027-01-25 | cal.day | 2 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-359 | `/news` | en | button | 2027-01-26 | cal.day | 2 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-360 | `/news` | en | button | 2027-01-27 | cal.day | 2 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-361 | `/news` | en | button | 2027-01-28 | cal.day | 2 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-362 | `/news` | en | button | 2027-01-29 | cal.day | 2 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-363 | `/news` | en | button | 2027-01-30 | cal.day | 2 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-364 | `/news` | en | button | 2027-01-31 | cal.day | 2 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-365 | `/news` | en | button | Change language to Urdu | lang.toggle | 2 | 82x44 | PASS | exercised by a functional spec |
| EL-SITE-366 | `/news` | en | button | Next month | cal.move | 2 | 48x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-367 | `/news` | en | button | Pause the news ticker | ticker.pause | 2 | 44x37 | PASS | exercised by a functional spec |
| EL-SITE-368 | `/news` | en | button | Previous month | cal.move | 2 | 48x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-369 | `/news` | en | link | About | /about | 2 | 68x38 | PASS | target answered 200 |
| EL-SITE-370 | `/news` | en | link | All | news.channel | 2 | 48x44 | PASS | target answered 200 |
| EL-SITE-371 | `/news` | en | link | All news and notifications | ticker.all | 2 | 95x37 | PASS | target answered 200 |
| EL-SITE-372 | `/news` | en | link | Certificate of Origin | /service?s=co | 2 | 245x31 | PASS | target answered 200 |
| EL-SITE-373 | `/news` | en | link | Chamber news c36f7d MCCI members can now apply online. News | post.view | 2 | 371x214 | PASS | target answered 200 |
| EL-SITE-374 | `/news` | en | link | Chamber news d098e0 MCCI members can now apply online. News | post.view | 2 | 371x214 | PASS | target answered 200 |
| EL-SITE-375 | `/news` | en | link | Circular | news.channel | 2 | 89x44 | PASS | target answered 200 |
| EL-SITE-376 | `/news` | en | link | Contact | /contact | 2 | 82x38 | PASS | target answered 200 |
| EL-SITE-377 | `/news` | en | link | Directory | /directory | 2 | 90x38 | PASS | target answered 200 |
| EL-SITE-378 | `/news` | en | link | E-BIL | /service?s=ebil | 2 | 245x31 | PASS | target answered 200 |
| EL-SITE-379 | `/news` | en | link | Event | news.channel | 2 | 74x44 | PASS | target answered 200 |
| EL-SITE-380 | `/news` | en | link | Home | nav | 2 | 44x44 | PASS | target answered 200 |
| EL-SITE-381 | `/news` | en | link | MCCI Digital Chamber ایوانِ تجارت و صنعت ملتان | / | 2 | 157x59 | PASS | target answered 200 |
| EL-SITE-382 | `/news` | en | link | Member Login | /login | 2 | 160x44 | PASS | target answered 200 |
| EL-SITE-383 | `/news` | en | link | Membership | /membership | 2 | 112x38 | PASS | target answered 200 |
| EL-SITE-384 | `/news` | en | link | News | /news | 2 | 63x38 | PASS | target answered 200 |
| EL-SITE-385 | `/news` | en | link | News | news.channel | 2 | 73x44 | PASS | target answered 200 |
| EL-SITE-386 | `/news` | en | link | NEWS Chamber news c36f7d | ticker.post | 2 | 194x38 | PASS | target answered 200 |
| EL-SITE-387 | `/news` | en | link | NEWS Chamber news d098e0 | ticker.post | 2 | 201x38 | PASS | target answered 200 |
| EL-SITE-388 | `/news` | en | link | Notice | news.channel | 2 | 81x44 | PASS | target answered 200 |
| EL-SITE-389 | `/news` | en | link | Resources | /resources | 2 | 98x38 | PASS | target answered 200 |
| EL-SITE-390 | `/news` | en | link | Services | /services | 2 | 84x38 | PASS | target answered 200 |
| EL-SITE-391 | `/news` | en | link | Skip to content | #main | 2 | 144x47 | PASS | in-page anchor |
| EL-SITE-392 | `/news` | en | link | Track | /track | 2 | 61x38 | PASS | target answered 200 |
| EL-SITE-393 | `/news` | en | link | Verify | /verify | 2 | 65x38 | PASS | target answered 200 |
| EL-SITE-394 | `/news` | en | link | Visa letters | /service?s=visa | 2 | 245x31 | PASS | target answered 200 |
| EL-SITE-395 | `/news` | ur | button | 2027-01-01 | cal.day | 1 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-396 | `/news` | ur | button | 2027-01-02 | cal.day | 1 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-397 | `/news` | ur | button | 2027-01-03 | cal.day | 1 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-398 | `/news` | ur | button | 2027-01-04 | cal.day | 1 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-399 | `/news` | ur | button | 2027-01-05 | cal.day | 1 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-400 | `/news` | ur | button | 2027-01-06 | cal.day | 1 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-401 | `/news` | ur | button | 2027-01-07 | cal.day | 1 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-402 | `/news` | ur | button | 2027-01-08 | cal.day | 1 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-403 | `/news` | ur | button | 2027-01-09 | cal.day | 1 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-404 | `/news` | ur | button | 2027-01-10 | cal.day | 1 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-405 | `/news` | ur | button | 2027-01-11 | cal.day | 1 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-406 | `/news` | ur | button | 2027-01-12 | cal.day | 1 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-407 | `/news` | ur | button | 2027-01-13 | cal.day | 1 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-408 | `/news` | ur | button | 2027-01-14 | cal.day | 1 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-409 | `/news` | ur | button | 2027-01-15 · 2 تقریبات | cal.day | 1 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-410 | `/news` | ur | button | 2027-01-16 | cal.day | 1 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-411 | `/news` | ur | button | 2027-01-17 | cal.day | 1 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-412 | `/news` | ur | button | 2027-01-18 | cal.day | 1 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-413 | `/news` | ur | button | 2027-01-19 | cal.day | 1 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-414 | `/news` | ur | button | 2027-01-20 | cal.day | 1 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-415 | `/news` | ur | button | 2027-01-21 | cal.day | 1 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-416 | `/news` | ur | button | 2027-01-22 | cal.day | 1 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-417 | `/news` | ur | button | 2027-01-23 | cal.day | 1 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-418 | `/news` | ur | button | 2027-01-24 | cal.day | 1 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-419 | `/news` | ur | button | 2027-01-25 | cal.day | 1 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-420 | `/news` | ur | button | 2027-01-26 | cal.day | 1 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-421 | `/news` | ur | button | 2027-01-27 | cal.day | 1 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-422 | `/news` | ur | button | 2027-01-28 | cal.day | 1 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-423 | `/news` | ur | button | 2027-01-29 | cal.day | 1 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-424 | `/news` | ur | button | 2027-01-30 | cal.day | 1 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-425 | `/news` | ur | button | 2027-01-31 | cal.day | 1 | 88x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-426 | `/news` | ur | button | اگلا مہینہ | cal.move | 1 | 48x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-427 | `/news` | ur | button | پچھلا مہینہ | cal.move | 1 | 48x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-428 | `/news` | ur | button | خبروں کی پٹی روکیں | ticker.pause | 1 | 44x37 | PASS | exercised by a functional spec |
| EL-SITE-429 | `/news` | ur | button | زبان انگریزی میں بدلیں | lang.toggle | 1 | 82x44 | PASS | exercised by a functional spec |
| EL-SITE-430 | `/news` | ur | link | Chamber news c36f7d MCCI members can now apply online. خبر | post.view | 1 | 371x233 | PASS | target answered 200 |
| EL-SITE-431 | `/news` | ur | link | Chamber news d098e0 MCCI members can now apply online. خبر | post.view | 1 | 371x233 | PASS | target answered 200 |
| EL-SITE-432 | `/news` | ur | link | ای-بِل | /ur/service?s=ebil | 1 | 245x37 | PASS | target answered 200 |
| EL-SITE-433 | `/news` | ur | link | ایم سی سی آئی ڈیجیٹل چیمبر ایوانِ تجارت و صنعت ملتان | /ur | 1 | 157x79 | PASS | target answered 200 |
| EL-SITE-434 | `/news` | ur | link | تصدیق | /ur/verify | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-435 | `/news` | ur | link | تعارف | /ur/about | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-436 | `/news` | ur | link | تقریب | news.channel | 1 | 60x49 | PASS | target answered 200 |
| EL-SITE-437 | `/news` | ur | link | تمام خبریں اور اعلانات | ticker.all | 1 | 89x37 | PASS | target answered 200 |
| EL-SITE-438 | `/news` | ur | link | ٹریک | /ur/track | 1 | 45x38 | PASS | target answered 200 |
| EL-SITE-439 | `/news` | ur | link | خبر | news.channel | 1 | 43x49 | PASS | target answered 200 |
| EL-SITE-440 | `/news` | ur | link | خبر Chamber news c36f7d | ticker.post | 1 | 169x38 | PASS | target answered 200 |
| EL-SITE-441 | `/news` | ur | link | خبر Chamber news d098e0 | ticker.post | 1 | 174x38 | PASS | target answered 200 |
| EL-SITE-442 | `/news` | ur | link | خبریں | /ur/news | 1 | 45x38 | PASS | target answered 200 |
| EL-SITE-443 | `/news` | ur | link | خدمات | /ur/services | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-444 | `/news` | ur | link | ڈائریکٹری | /ur/directory | 1 | 59x38 | PASS | target answered 200 |
| EL-SITE-445 | `/news` | ur | link | رابطہ | /ur/contact | 1 | 41x38 | PASS | target answered 200 |
| EL-SITE-446 | `/news` | ur | link | رکنیت | /ur/membership | 1 | 46x38 | PASS | target answered 200 |
| EL-SITE-447 | `/news` | ur | link | سب | news.channel | 1 | 48x49 | PASS | target answered 200 |
| EL-SITE-448 | `/news` | ur | link | سرٹیفکیٹ آف اوریجن | /ur/service?s=co | 1 | 245x37 | PASS | target answered 200 |
| EL-SITE-449 | `/news` | ur | link | سرکلر | news.channel | 1 | 53x49 | PASS | target answered 200 |
| EL-SITE-450 | `/news` | ur | link | ممبر لاگ اِن | /ur/login | 1 | 106x44 | PASS | target answered 200 |
| EL-SITE-451 | `/news` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-SITE-452 | `/news` | ur | link | نوٹس | news.channel | 1 | 52x49 | PASS | target answered 200 |
| EL-SITE-453 | `/news` | ur | link | ہوم | nav | 1 | 44x44 | PASS | target answered 200 |
| EL-SITE-454 | `/news` | ur | link | وسائل | /ur/resources | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-455 | `/news` | ur | link | ویزا لیٹر | /ur/service?s=visa | 1 | 245x37 | PASS | target answered 200 |
| EL-SVC-255 | `/portal/application/letter` | en | button | Change language to Urdu | lang.toggle | 4 | 44x44 | PASS | exercised by a functional spec |
| EL-SVC-256 | `/portal/application/letter` | en | button | Light or dark theme | theme.toggle | 4 | 44x44 | PASS | exercised by a functional spec |
| EL-SVC-257 | `/portal/application/letter` | en | button | Sign out | logout | 4 | 116x44 | PASS | exercised by a functional spec |
| EL-SVC-258 | `/portal/application/letter` | en | link | Back | nav | 4 | 69x44 | PASS | target answered 200 |
| EL-SVC-259 | `/portal/application/letter` | en | link | Company Profile کمپنی پروفائل | /portal/profile | 4 | 238x54 | PASS | target answered 200 |
| EL-SVC-260 | `/portal/application/letter` | en | link | Endorsement Requests تائید کی درخواستیں | /portal/endorse | 4 | 238x54 | PASS | target answered 200 |
| EL-SVC-261 | `/portal/application/letter` | en | link | Events & Trade تقریبات | /portal/events | 4 | 238x54 | PASS | target answered 200 |
| EL-SVC-262 | `/portal/application/letter` | en | link | Help & Support مدد اور رابطہ | /portal/support | 4 | 238x54 | PASS | target answered 200 |
| EL-SVC-263 | `/portal/application/letter` | en | link | MCCI Member Digital Chamber Portal | /portal | 4 | 238x82 | PASS | target answered 200 |
| EL-SVC-264 | `/portal/application/letter` | en | link | My Documents میری دستاویزات | /portal/documents | 4 | 238x54 | PASS | target answered 200 |
| EL-SVC-265 | `/portal/application/letter` | en | link | My Membership میری رکنیت | /portal/membership | 4 | 238x54 | PASS | target answered 200 |
| EL-SVC-266 | `/portal/application/letter` | en | link | Payments ادائیگیاں | /portal/payments | 4 | 238x54 | PASS | target answered 200 |
| EL-SVC-267 | `/portal/application/letter` | en | link | Request a Service خدمت کی درخواست | /portal/apply | 4 | 238x54 | PASS | target answered 200 |
| EL-SVC-268 | `/portal/application/letter` | en | link | Skip to content | #main | 4 | 144x47 | PASS | in-page anchor |
| EL-SVC-269 | `/portal/application/letter` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-SVC-270 | `/portal/application/letter` | ur | button | زبان انگریزی میں بدلیں | lang.toggle | 1 | 78x44 | PASS | exercised by a functional spec |
| EL-SVC-271 | `/portal/application/letter` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-SVC-272 | `/portal/application/letter` | ur | link | ادائیگیاں Payments | /ur/portal/payments | 1 | 238x52 | PASS | target answered 200 |
| EL-SVC-273 | `/portal/application/letter` | ur | link | ایم سی سی آئی ممبر ڈیجیٹل چیمبر پورٹل | /ur/portal | 1 | 238x99 | PASS | target answered 200 |
| EL-SVC-274 | `/portal/application/letter` | ur | link | تائید کی درخواستیں Endorsement Requests | /ur/portal/endorse | 1 | 238x52 | PASS | target answered 200 |
| EL-SVC-275 | `/portal/application/letter` | ur | link | تقریبات Events & Trade | /ur/portal/events | 1 | 238x52 | PASS | target answered 200 |
| EL-SVC-276 | `/portal/application/letter` | ur | link | خدمت کی درخواست Request a Service | /ur/portal/apply | 1 | 238x52 | PASS | target answered 200 |
| EL-SVC-277 | `/portal/application/letter` | ur | link | کمپنی پروفائل Company Profile | /ur/portal/profile | 1 | 238x52 | PASS | target answered 200 |
| EL-SVC-278 | `/portal/application/letter` | ur | link | مدد اور رابطہ Help & Support | /ur/portal/support | 1 | 238x52 | PASS | target answered 200 |
| EL-SVC-279 | `/portal/application/letter` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-SVC-280 | `/portal/application/letter` | ur | link | میری دستاویزات My Documents | /ur/portal/documents | 1 | 238x52 | PASS | target answered 200 |
| EL-SVC-281 | `/portal/application/letter` | ur | link | میری رکنیت My Membership | /ur/portal/membership | 1 | 238x52 | PASS | target answered 200 |
| EL-SVC-282 | `/portal/application/letter` | ur | link | واپس | nav | 1 | 52x49 | PASS | target answered 200 |
| EL-SVC-283 | `/portal/application` | en | button | Change language to Urdu | lang.toggle | 4 | 44x44 | PASS | exercised by a functional spec |
| EL-SVC-284 | `/portal/application` | en | button | Light or dark theme | theme.toggle | 4 | 44x44 | PASS | exercised by a functional spec |
| EL-SVC-285 | `/portal/application` | en | button | Sign out | logout | 4 | 116x44 | PASS | exercised by a functional spec |
| EL-SVC-286 | `/portal/application` | en | link | Company Profile کمپنی پروفائل | /portal/profile | 4 | 238x54 | PASS | target answered 200 |
| EL-SVC-287 | `/portal/application` | en | link | Endorsement Requests تائید کی درخواستیں | /portal/endorse | 4 | 238x54 | PASS | target answered 200 |
| EL-SVC-288 | `/portal/application` | en | link | Events & Trade تقریبات | /portal/events | 4 | 238x54 | PASS | target answered 200 |
| EL-SVC-289 | `/portal/application` | en | link | Help & Support مدد اور رابطہ | /portal/support | 4 | 238x54 | PASS | target answered 200 |
| EL-SVC-290 | `/portal/application` | en | link | MCCI Member Digital Chamber Portal | /portal | 4 | 238x82 | PASS | target answered 200 |
| EL-SVC-291 | `/portal/application` | en | link | My Documents میری دستاویزات | /portal/documents | 4 | 238x54 | PASS | target answered 200 |
| EL-SVC-292 | `/portal/application` | en | link | My Membership میری رکنیت | /portal/membership | 4 | 238x54 | PASS | target answered 200 |
| EL-SVC-293 | `/portal/application` | en | link | My requests | nav | 4 | 119x44 | PASS | target answered 200 |
| EL-SVC-294 | `/portal/application` | en | link | My requests میری درخواستیں | /portal/applications | 4 | 204x45 | PASS | target answered 200 |
| EL-SVC-295 | `/portal/application` | en | link | Payments ادائیگیاں | /portal/payments | 4 | 238x54 | PASS | target answered 200 |
| EL-SVC-296 | `/portal/application` | en | link | Request a Service خدمت کی درخواست | /portal/apply | 4 | 238x54 | PASS | target answered 200 |
| EL-SVC-297 | `/portal/application` | en | link | Request detail تفصیل | /portal/application | 4 | 188x45 | PASS | target answered 200 |
| EL-SVC-298 | `/portal/application` | en | link | Skip to content | #main | 4 | 144x47 | PASS | in-page anchor |
| EL-SVC-299 | `/portal/applications` | en | button | Change language to Urdu | lang.toggle | 4 | 44x44 | PASS | exercised by a functional spec |
| EL-SVC-300 | `/portal/applications` | en | button | Light or dark theme | theme.toggle | 4 | 44x44 | PASS | exercised by a functional spec |
| EL-SVC-301 | `/portal/applications` | en | button | Sign out | logout | 4 | 116x44 | PASS | exercised by a functional spec |
| EL-SVC-302 | `/portal/applications` | en | link | Company Profile کمپنی پروفائل | /portal/profile | 4 | 238x54 | PASS | target answered 200 |
| EL-SVC-303 | `/portal/applications` | en | link | Endorsement Requests تائید کی درخواستیں | /portal/endorse | 4 | 238x54 | PASS | target answered 200 |
| EL-SVC-304 | `/portal/applications` | en | link | Events & Trade تقریبات | /portal/events | 4 | 238x54 | PASS | target answered 200 |
| EL-SVC-305 | `/portal/applications` | en | link | Help & Support مدد اور رابطہ | /portal/support | 4 | 238x54 | PASS | target answered 200 |
| EL-SVC-306 | `/portal/applications` | en | link | MCCI Member Digital Chamber Portal | /portal | 4 | 238x82 | PASS | target answered 200 |
| EL-SVC-307 | `/portal/applications` | en | link | My Documents میری دستاویزات | /portal/documents | 4 | 238x54 | PASS | target answered 200 |
| EL-SVC-308 | `/portal/applications` | en | link | My Membership میری رکنیت | /portal/membership | 4 | 238x54 | PASS | target answered 200 |
| EL-SVC-309 | `/portal/applications` | en | link | My requests میری درخواستیں | /portal/applications | 4 | 204x45 | PASS | target answered 200 |
| EL-SVC-310 | `/portal/applications` | en | link | New request | nav | 4 | 147x44 | PASS | target answered 200 |
| EL-SVC-311 | `/portal/applications` | en | link | Payments ادائیگیاں | /portal/payments | 4 | 238x54 | PASS | target answered 200 |
| EL-SVC-312 | `/portal/applications` | en | link | Request a Service خدمت کی درخواست | /portal/apply | 4 | 238x54 | PASS | target answered 200 |
| EL-SVC-313 | `/portal/applications` | en | link | Request detail تفصیل | /portal/application | 4 | 188x45 | PASS | target answered 200 |
| EL-SVC-314 | `/portal/applications` | en | link | Skip to content | #main | 4 | 144x47 | PASS | in-page anchor |
| EL-SVC-315 | `/portal/applications` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-SVC-316 | `/portal/applications` | ur | button | زبان انگریزی میں بدلیں | lang.toggle | 1 | 78x44 | PASS | exercised by a functional spec |
| EL-SVC-317 | `/portal/applications` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-SVC-318 | `/portal/applications` | ur | link | ادائیگیاں Payments | /ur/portal/payments | 1 | 238x52 | PASS | target answered 200 |
| EL-SVC-319 | `/portal/applications` | ur | link | ایم سی سی آئی ممبر ڈیجیٹل چیمبر پورٹل | /ur/portal | 1 | 238x99 | PASS | target answered 200 |
| EL-SVC-320 | `/portal/applications` | ur | link | تائید کی درخواستیں Endorsement Requests | /ur/portal/endorse | 1 | 238x52 | PASS | target answered 200 |
| EL-SVC-321 | `/portal/applications` | ur | link | تفصیل Request detail | /ur/portal/application | 1 | 172x50 | PASS | target answered 200 |
| EL-SVC-322 | `/portal/applications` | ur | link | تقریبات Events & Trade | /ur/portal/events | 1 | 238x52 | PASS | target answered 200 |
| EL-SVC-323 | `/portal/applications` | ur | link | خدمت کی درخواست Request a Service | /ur/portal/apply | 1 | 238x52 | PASS | target answered 200 |
| EL-SVC-324 | `/portal/applications` | ur | link | کمپنی پروفائل Company Profile | /ur/portal/profile | 1 | 238x52 | PASS | target answered 200 |
| EL-SVC-325 | `/portal/applications` | ur | link | مدد اور رابطہ Help & Support | /ur/portal/support | 1 | 238x52 | PASS | target answered 200 |
| EL-SVC-326 | `/portal/applications` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-SVC-327 | `/portal/applications` | ur | link | میری درخواستیں My requests | /ur/portal/applications | 1 | 198x50 | PASS | target answered 200 |
| EL-SVC-328 | `/portal/applications` | ur | link | میری دستاویزات My Documents | /ur/portal/documents | 1 | 238x52 | PASS | target answered 200 |
| EL-SVC-329 | `/portal/applications` | ur | link | میری رکنیت My Membership | /ur/portal/membership | 1 | 238x52 | PASS | target answered 200 |
| EL-SVC-330 | `/portal/applications` | ur | link | نئی درخواست | nav | 1 | 105x47 | PASS | target answered 200 |
| EL-SVC-331 | `/portal/application` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-SVC-332 | `/portal/application` | ur | button | زبان انگریزی میں بدلیں | lang.toggle | 1 | 78x44 | PASS | exercised by a functional spec |
| EL-SVC-333 | `/portal/application` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-SVC-334 | `/portal/application` | ur | link | ادائیگیاں Payments | /ur/portal/payments | 1 | 238x52 | PASS | target answered 200 |
| EL-SVC-335 | `/portal/application` | ur | link | ایم سی سی آئی ممبر ڈیجیٹل چیمبر پورٹل | /ur/portal | 1 | 238x99 | PASS | target answered 200 |
| EL-SVC-336 | `/portal/application` | ur | link | تائید کی درخواستیں Endorsement Requests | /ur/portal/endorse | 1 | 238x52 | PASS | target answered 200 |
| EL-SVC-337 | `/portal/application` | ur | link | تفصیل Request detail | /ur/portal/application | 1 | 172x50 | PASS | target answered 200 |
| EL-SVC-338 | `/portal/application` | ur | link | تقریبات Events & Trade | /ur/portal/events | 1 | 238x52 | PASS | target answered 200 |
| EL-SVC-339 | `/portal/application` | ur | link | خدمت کی درخواست Request a Service | /ur/portal/apply | 1 | 238x52 | PASS | target answered 200 |
| EL-SVC-340 | `/portal/application` | ur | link | کمپنی پروفائل Company Profile | /ur/portal/profile | 1 | 238x52 | PASS | target answered 200 |
| EL-SVC-341 | `/portal/application` | ur | link | مدد اور رابطہ Help & Support | /ur/portal/support | 1 | 238x52 | PASS | target answered 200 |
| EL-SVC-342 | `/portal/application` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-SVC-343 | `/portal/application` | ur | link | میری درخواستیں | nav | 1 | 91x47 | PASS | target answered 200 |
| EL-SVC-344 | `/portal/application` | ur | link | میری درخواستیں My requests | /ur/portal/applications | 1 | 198x50 | PASS | target answered 200 |
| EL-SVC-345 | `/portal/application` | ur | link | میری دستاویزات My Documents | /ur/portal/documents | 1 | 238x52 | PASS | target answered 200 |
| EL-SVC-346 | `/portal/application` | ur | link | میری رکنیت My Membership | /ur/portal/membership | 1 | 238x52 | PASS | target answered 200 |
| EL-SVC-347 | `/portal/apply` | en | button | Change language to Urdu | lang.toggle | 4 | 44x44 | PASS | exercised by a functional spec |
| EL-SVC-348 | `/portal/apply` | en | button | Light or dark theme | theme.toggle | 4 | 44x44 | PASS | exercised by a functional spec |
| EL-SVC-349 | `/portal/apply` | en | button | Sign out | logout | 4 | 116x44 | PASS | exercised by a functional spec |
| EL-SVC-350 | `/portal/apply` | en | button | Start Certificate of Origin | svc.new | 4 | 270x199 | PASS | exercised by a functional spec |
| EL-SVC-351 | `/portal/apply` | en | button | Start Document Attestation | svc.new | 4 | 270x199 | PASS | exercised by a functional spec |
| EL-SVC-352 | `/portal/apply` | en | button | Start E-BIL | svc.new | 4 | 270x199 | PASS | exercised by a functional spec |
| EL-SVC-353 | `/portal/apply` | en | button | Start Free Samples Letter | svc.new | 4 | 270x199 | PASS | exercised by a functional spec |
| EL-SVC-354 | `/portal/apply` | en | button | Start Recommendatory Letter | svc.new | 4 | 270x199 | PASS | exercised by a functional spec |
| EL-SVC-355 | `/portal/apply` | en | button | Start Visa Guarantee (China) | svc.new | 4 | 270x199 | PASS | exercised by a functional spec |
| EL-SVC-356 | `/portal/apply` | en | button | Start Visa Recommendation | svc.new | 4 | 270x199 | PASS | exercised by a functional spec |
| EL-SVC-357 | `/portal/apply` | en | link | Company Profile کمپنی پروفائل | /portal/profile | 4 | 238x54 | PASS | target answered 200 |
| EL-SVC-358 | `/portal/apply` | en | link | Endorsement Requests تائید کی درخواستیں | /portal/endorse | 4 | 238x54 | PASS | target answered 200 |
| EL-SVC-359 | `/portal/apply` | en | link | Events & Trade تقریبات | /portal/events | 4 | 238x54 | PASS | target answered 200 |
| EL-SVC-360 | `/portal/apply` | en | link | Help & Support مدد اور رابطہ | /portal/support | 4 | 238x54 | PASS | target answered 200 |
| EL-SVC-361 | `/portal/apply` | en | link | MCCI Member Digital Chamber Portal | /portal | 4 | 238x82 | PASS | target answered 200 |
| EL-SVC-362 | `/portal/apply` | en | link | My Documents میری دستاویزات | /portal/documents | 4 | 238x54 | PASS | target answered 200 |
| EL-SVC-363 | `/portal/apply` | en | link | My membership | nav | 1 | 127x44 | PASS | target answered 200 |
| EL-SVC-364 | `/portal/apply` | en | link | My Membership میری رکنیت | /portal/membership | 4 | 238x54 | PASS | target answered 200 |
| EL-SVC-365 | `/portal/apply` | en | link | My requests میری درخواستیں | /portal/applications | 4 | 204x45 | PASS | target answered 200 |
| EL-SVC-366 | `/portal/apply` | en | link | Payments ادائیگیاں | /portal/payments | 4 | 238x54 | PASS | target answered 200 |
| EL-SVC-367 | `/portal/apply` | en | link | Request a Service خدمت کی درخواست | /portal/apply | 4 | 238x54 | PASS | target answered 200 |
| EL-SVC-368 | `/portal/apply` | en | link | Request detail تفصیل | /portal/application | 4 | 188x45 | PASS | target answered 200 |
| EL-SVC-369 | `/portal/apply` | en | link | Skip to content | #main | 4 | 144x47 | PASS | in-page anchor |
| EL-SVC-370 | `/portal/apply` | ur | button | Certificate of Origin شروع کریں | svc.new | 1 | 270x211 | PASS | exercised by a functional spec |
| EL-SVC-371 | `/portal/apply` | ur | button | Document Attestation شروع کریں | svc.new | 1 | 270x211 | PASS | exercised by a functional spec |
| EL-SVC-372 | `/portal/apply` | ur | button | E-BIL شروع کریں | svc.new | 1 | 270x211 | PASS | exercised by a functional spec |
| EL-SVC-373 | `/portal/apply` | ur | button | Free Samples Letter شروع کریں | svc.new | 1 | 270x211 | PASS | exercised by a functional spec |
| EL-SVC-374 | `/portal/apply` | ur | button | Recommendatory Letter شروع کریں | svc.new | 1 | 270x211 | PASS | exercised by a functional spec |
| EL-SVC-375 | `/portal/apply` | ur | button | Visa Guarantee (China) شروع کریں | svc.new | 1 | 270x211 | PASS | exercised by a functional spec |
| EL-SVC-376 | `/portal/apply` | ur | button | Visa Recommendation شروع کریں | svc.new | 1 | 270x211 | PASS | exercised by a functional spec |
| EL-SVC-377 | `/portal/apply` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-SVC-378 | `/portal/apply` | ur | button | زبان انگریزی میں بدلیں | lang.toggle | 1 | 78x44 | PASS | exercised by a functional spec |
| EL-SVC-379 | `/portal/apply` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-SVC-380 | `/portal/apply` | ur | link | ادائیگیاں Payments | /ur/portal/payments | 1 | 238x52 | PASS | target answered 200 |
| EL-SVC-381 | `/portal/apply` | ur | link | ایم سی سی آئی ممبر ڈیجیٹل چیمبر پورٹل | /ur/portal | 1 | 238x99 | PASS | target answered 200 |
| EL-SVC-382 | `/portal/apply` | ur | link | تائید کی درخواستیں Endorsement Requests | /ur/portal/endorse | 1 | 238x52 | PASS | target answered 200 |
| EL-SVC-383 | `/portal/apply` | ur | link | تفصیل Request detail | /ur/portal/application | 1 | 172x50 | PASS | target answered 200 |
| EL-SVC-384 | `/portal/apply` | ur | link | تقریبات Events & Trade | /ur/portal/events | 1 | 238x52 | PASS | target answered 200 |
| EL-SVC-385 | `/portal/apply` | ur | link | خدمت کی درخواست Request a Service | /ur/portal/apply | 1 | 238x52 | PASS | target answered 200 |
| EL-SVC-386 | `/portal/apply` | ur | link | کمپنی پروفائل Company Profile | /ur/portal/profile | 1 | 238x52 | PASS | target answered 200 |
| EL-SVC-387 | `/portal/apply` | ur | link | مدد اور رابطہ Help & Support | /ur/portal/support | 1 | 238x52 | PASS | target answered 200 |
| EL-SVC-388 | `/portal/apply` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-SVC-389 | `/portal/apply` | ur | link | میری درخواستیں My requests | /ur/portal/applications | 1 | 198x50 | PASS | target answered 200 |
| EL-SVC-390 | `/portal/apply` | ur | link | میری دستاویزات My Documents | /ur/portal/documents | 1 | 238x52 | PASS | target answered 200 |
| EL-SVC-391 | `/portal/apply` | ur | link | میری رکنیت My Membership | /ur/portal/membership | 1 | 238x52 | PASS | target answered 200 |
| EL-AI-001 | `/portal/assistant` | en | button | Change language to Urdu | lang.toggle | 4 | 44x44 | PASS | exercised by a functional spec |
| EL-AI-002 | `/portal/assistant` | en | button | Light or dark theme | theme.toggle | 4 | 44x44 | PASS | exercised by a functional spec |
| EL-AI-003 | `/portal/assistant` | en | button | Sign out | logout | 4 | 116x44 | PASS | exercised by a functional spec |
| EL-AI-004 | `/portal/assistant` | en | button | Talk to staff | ai.staff | 4 | 140x44 | PASS | exercised by a functional spec |
| EL-AI-005 | `/portal/assistant` | en | link | Ask AI اے آئی | /portal/assistant | 4 | 135x45 | PASS | target answered 200 |
| EL-AI-006 | `/portal/assistant` | en | link | Company Profile کمپنی پروفائل | /portal/profile | 4 | 238x54 | PASS | target answered 200 |
| EL-AI-007 | `/portal/assistant` | en | link | Endorsement Requests تائید کی درخواستیں | /portal/endorse | 4 | 238x54 | PASS | target answered 200 |
| EL-AI-008 | `/portal/assistant` | en | link | Events & Trade تقریبات | /portal/events | 4 | 238x54 | PASS | target answered 200 |
| EL-AI-009 | `/portal/assistant` | en | link | Help & Support مدد اور رابطہ | /portal/support | 4 | 238x54 | PASS | target answered 200 |
| EL-AI-010 | `/portal/assistant` | en | link | MCCI Member Digital Chamber Portal | /portal | 4 | 238x82 | PASS | target answered 200 |
| EL-AI-011 | `/portal/assistant` | en | link | Messages پیغامات | /portal/notifications | 4 | 159x45 | PASS | target answered 200 |
| EL-AI-012 | `/portal/assistant` | en | link | My Documents میری دستاویزات | /portal/documents | 4 | 238x54 | PASS | target answered 200 |
| EL-AI-013 | `/portal/assistant` | en | link | My Membership میری رکنیت | /portal/membership | 4 | 238x54 | PASS | target answered 200 |
| EL-AI-014 | `/portal/assistant` | en | link | Payments ادائیگیاں | /portal/payments | 4 | 238x54 | PASS | target answered 200 |
| EL-AI-015 | `/portal/assistant` | en | link | Request a Service خدمت کی درخواست | /portal/apply | 4 | 238x54 | PASS | target answered 200 |
| EL-AI-016 | `/portal/assistant` | en | link | Skip to content | #main | 4 | 144x47 | PASS | in-page anchor |
| EL-AI-017 | `/portal/assistant` | en | submit | Ask | ai.ask | 4 | 83x44 | PASS | exercised by a functional spec |
| EL-AI-018 | `/portal/assistant` | en | textarea | Ask about membership, fees, documents or your file… |  | 4 | 531x67 | PASS | exercised by a functional spec |
| EL-AI-019 | `/portal/assistant` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-AI-020 | `/portal/assistant` | ur | button | زبان انگریزی میں بدلیں | lang.toggle | 1 | 78x44 | PASS | exercised by a functional spec |
| EL-AI-021 | `/portal/assistant` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-AI-022 | `/portal/assistant` | ur | button | عملے سے بات کریں | ai.staff | 1 | 130x49 | PASS | exercised by a functional spec |
| EL-AI-023 | `/portal/assistant` | ur | link | ادائیگیاں Payments | /ur/portal/payments | 1 | 238x52 | PASS | target answered 200 |
| EL-AI-024 | `/portal/assistant` | ur | link | ایم سی سی آئی ممبر ڈیجیٹل چیمبر پورٹل | /ur/portal | 1 | 238x99 | PASS | target answered 200 |
| EL-AI-025 | `/portal/assistant` | ur | link | اے آئی Ask AI | /ur/portal/assistant | 1 | 132x50 | PASS | target answered 200 |
| EL-AI-026 | `/portal/assistant` | ur | link | پیغامات Messages | /ur/portal/notifications | 1 | 149x50 | PASS | target answered 200 |
| EL-AI-027 | `/portal/assistant` | ur | link | تائید کی درخواستیں Endorsement Requests | /ur/portal/endorse | 1 | 238x52 | PASS | target answered 200 |
| EL-AI-028 | `/portal/assistant` | ur | link | تقریبات Events & Trade | /ur/portal/events | 1 | 238x52 | PASS | target answered 200 |
| EL-AI-029 | `/portal/assistant` | ur | link | خدمت کی درخواست Request a Service | /ur/portal/apply | 1 | 238x52 | PASS | target answered 200 |
| EL-AI-030 | `/portal/assistant` | ur | link | کمپنی پروفائل Company Profile | /ur/portal/profile | 1 | 238x52 | PASS | target answered 200 |
| EL-AI-031 | `/portal/assistant` | ur | link | مدد اور رابطہ Help & Support | /ur/portal/support | 1 | 238x52 | PASS | target answered 200 |
| EL-AI-032 | `/portal/assistant` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-AI-033 | `/portal/assistant` | ur | link | میری دستاویزات My Documents | /ur/portal/documents | 1 | 238x52 | PASS | target answered 200 |
| EL-AI-034 | `/portal/assistant` | ur | link | میری رکنیت My Membership | /ur/portal/membership | 1 | 238x52 | PASS | target answered 200 |
| EL-AI-035 | `/portal/assistant` | ur | submit | پوچھیں | ai.ask | 1 | 82x49 | PASS | exercised by a functional spec |
| EL-AI-036 | `/portal/assistant` | ur | textarea | رکنیت، فیس، دستاویزات یا اپنی فائل کے بارے میں پوچھیں… |  | 1 | 532x79 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-DOC-047 | `/portal/documents` | en | button | Change language to Urdu | lang.toggle | 4 | 44x44 | PASS | exercised by a functional spec |
| EL-DOC-048 | `/portal/documents` | en | button | Light or dark theme | theme.toggle | 4 | 44x44 | PASS | exercised by a functional spec |
| EL-DOC-049 | `/portal/documents` | en | button | Sign out | logout | 4 | 116x44 | PASS | exercised by a functional spec |
| EL-DOC-050 | `/portal/documents` | en | link | Company Profile کمپنی پروفائل | /portal/profile | 4 | 238x54 | PASS | target answered 200 |
| EL-DOC-051 | `/portal/documents` | en | link | Endorsement Requests تائید کی درخواستیں | /portal/endorse | 4 | 238x54 | PASS | target answered 200 |
| EL-DOC-052 | `/portal/documents` | en | link | Events & Trade تقریبات | /portal/events | 4 | 238x54 | PASS | target answered 200 |
| EL-DOC-053 | `/portal/documents` | en | link | Help & Support مدد اور رابطہ | /portal/support | 4 | 238x54 | PASS | target answered 200 |
| EL-DOC-054 | `/portal/documents` | en | link | MCCI Member Digital Chamber Portal | /portal | 4 | 238x82 | PASS | target answered 200 |
| EL-DOC-055 | `/portal/documents` | en | link | My Documents میری دستاویزات | /portal/documents | 4 | 238x54 | PASS | target answered 200 |
| EL-DOC-056 | `/portal/documents` | en | link | My Membership میری رکنیت | /portal/membership | 4 | 238x54 | PASS | target answered 200 |
| EL-DOC-057 | `/portal/documents` | en | link | Payments ادائیگیاں | /portal/payments | 4 | 238x54 | PASS | target answered 200 |
| EL-DOC-058 | `/portal/documents` | en | link | Request a Service خدمت کی درخواست | /portal/apply | 4 | 238x54 | PASS | target answered 200 |
| EL-DOC-059 | `/portal/documents` | en | link | Skip to content | #main | 4 | 144x47 | PASS | in-page anchor |
| EL-DOC-060 | `/portal/documents` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-DOC-061 | `/portal/documents` | ur | button | زبان انگریزی میں بدلیں | lang.toggle | 1 | 78x44 | PASS | exercised by a functional spec |
| EL-DOC-062 | `/portal/documents` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-DOC-063 | `/portal/documents` | ur | link | ادائیگیاں Payments | /ur/portal/payments | 1 | 238x52 | PASS | target answered 200 |
| EL-DOC-064 | `/portal/documents` | ur | link | ایم سی سی آئی ممبر ڈیجیٹل چیمبر پورٹل | /ur/portal | 1 | 238x99 | PASS | target answered 200 |
| EL-DOC-065 | `/portal/documents` | ur | link | تائید کی درخواستیں Endorsement Requests | /ur/portal/endorse | 1 | 238x52 | PASS | target answered 200 |
| EL-DOC-066 | `/portal/documents` | ur | link | تقریبات Events & Trade | /ur/portal/events | 1 | 238x52 | PASS | target answered 200 |
| EL-DOC-067 | `/portal/documents` | ur | link | خدمت کی درخواست Request a Service | /ur/portal/apply | 1 | 238x52 | PASS | target answered 200 |
| EL-DOC-068 | `/portal/documents` | ur | link | کمپنی پروفائل Company Profile | /ur/portal/profile | 1 | 238x52 | PASS | target answered 200 |
| EL-DOC-069 | `/portal/documents` | ur | link | مدد اور رابطہ Help & Support | /ur/portal/support | 1 | 238x52 | PASS | target answered 200 |
| EL-DOC-070 | `/portal/documents` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-DOC-071 | `/portal/documents` | ur | link | میری دستاویزات My Documents | /ur/portal/documents | 1 | 238x52 | PASS | target answered 200 |
| EL-DOC-072 | `/portal/documents` | ur | link | میری رکنیت My Membership | /ur/portal/membership | 1 | 238x52 | PASS | target answered 200 |
| EL-END-001 | `/portal/endorse` | en | button | Change language to Urdu | lang.toggle | 4 | 44x44 | PASS | exercised by a functional spec |
| EL-END-002 | `/portal/endorse` | en | button | Light or dark theme | theme.toggle | 4 | 44x44 | PASS | exercised by a functional spec |
| EL-END-003 | `/portal/endorse` | en | button | Sign out | logout | 4 | 116x44 | PASS | exercised by a functional spec |
| EL-END-004 | `/portal/endorse` | en | link | Company Profile کمپنی پروفائل | /portal/profile | 4 | 238x54 | PASS | target answered 200 |
| EL-END-005 | `/portal/endorse` | en | link | Endorsement Requests تائید کی درخواستیں | /portal/endorse | 4 | 238x54 | PASS | target answered 200 |
| EL-END-006 | `/portal/endorse` | en | link | Events & Trade تقریبات | /portal/events | 4 | 238x54 | PASS | target answered 200 |
| EL-END-007 | `/portal/endorse` | en | link | Help & Support مدد اور رابطہ | /portal/support | 4 | 238x54 | PASS | target answered 200 |
| EL-END-008 | `/portal/endorse` | en | link | MCCI Member Digital Chamber Portal | /portal | 4 | 238x82 | PASS | target answered 200 |
| EL-END-009 | `/portal/endorse` | en | link | My Documents میری دستاویزات | /portal/documents | 4 | 238x54 | PASS | target answered 200 |
| EL-END-010 | `/portal/endorse` | en | link | My Membership میری رکنیت | /portal/membership | 4 | 238x54 | PASS | target answered 200 |
| EL-END-011 | `/portal/endorse` | en | link | Payments ادائیگیاں | /portal/payments | 4 | 238x54 | PASS | target answered 200 |
| EL-END-012 | `/portal/endorse` | en | link | Request a Service خدمت کی درخواست | /portal/apply | 4 | 238x54 | PASS | target answered 200 |
| EL-END-013 | `/portal/endorse` | en | link | Skip to content | #main | 4 | 144x47 | PASS | in-page anchor |
| EL-END-014 | `/portal/endorse` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-END-015 | `/portal/endorse` | ur | button | زبان انگریزی میں بدلیں | lang.toggle | 1 | 78x44 | PASS | exercised by a functional spec |
| EL-END-016 | `/portal/endorse` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-END-017 | `/portal/endorse` | ur | link | ادائیگیاں Payments | /ur/portal/payments | 1 | 238x52 | PASS | target answered 200 |
| EL-END-018 | `/portal/endorse` | ur | link | ایم سی سی آئی ممبر ڈیجیٹل چیمبر پورٹل | /ur/portal | 1 | 238x99 | PASS | target answered 200 |
| EL-END-019 | `/portal/endorse` | ur | link | تائید کی درخواستیں Endorsement Requests | /ur/portal/endorse | 1 | 238x52 | PASS | target answered 200 |
| EL-END-020 | `/portal/endorse` | ur | link | تقریبات Events & Trade | /ur/portal/events | 1 | 238x52 | PASS | target answered 200 |
| EL-END-021 | `/portal/endorse` | ur | link | خدمت کی درخواست Request a Service | /ur/portal/apply | 1 | 238x52 | PASS | target answered 200 |
| EL-END-022 | `/portal/endorse` | ur | link | کمپنی پروفائل Company Profile | /ur/portal/profile | 1 | 238x52 | PASS | target answered 200 |
| EL-END-023 | `/portal/endorse` | ur | link | مدد اور رابطہ Help & Support | /ur/portal/support | 1 | 238x52 | PASS | target answered 200 |
| EL-END-024 | `/portal/endorse` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-END-025 | `/portal/endorse` | ur | link | میری دستاویزات My Documents | /ur/portal/documents | 1 | 238x52 | PASS | target answered 200 |
| EL-END-026 | `/portal/endorse` | ur | link | میری رکنیت My Membership | /ur/portal/membership | 1 | 238x52 | PASS | target answered 200 |
| EL-ENG-167 | `/portal/events` | en | button | 2027-01-01 | cal.day | 4 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-168 | `/portal/events` | en | button | 2027-01-02 | cal.day | 4 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-169 | `/portal/events` | en | button | 2027-01-03 | cal.day | 4 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-170 | `/portal/events` | en | button | 2027-01-04 | cal.day | 4 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-171 | `/portal/events` | en | button | 2027-01-05 | cal.day | 4 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-172 | `/portal/events` | en | button | 2027-01-06 | cal.day | 4 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-173 | `/portal/events` | en | button | 2027-01-07 | cal.day | 4 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-174 | `/portal/events` | en | button | 2027-01-08 | cal.day | 4 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-175 | `/portal/events` | en | button | 2027-01-09 | cal.day | 4 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-176 | `/portal/events` | en | button | 2027-01-10 | cal.day | 4 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-177 | `/portal/events` | en | button | 2027-01-11 | cal.day | 4 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-178 | `/portal/events` | en | button | 2027-01-12 | cal.day | 4 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-179 | `/portal/events` | en | button | 2027-01-13 | cal.day | 4 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-180 | `/portal/events` | en | button | 2027-01-14 | cal.day | 4 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-181 | `/portal/events` | en | button | 2027-01-15 · 2 Events | cal.day | 4 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-182 | `/portal/events` | en | button | 2027-01-16 | cal.day | 4 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-183 | `/portal/events` | en | button | 2027-01-17 | cal.day | 4 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-184 | `/portal/events` | en | button | 2027-01-18 | cal.day | 4 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-185 | `/portal/events` | en | button | 2027-01-19 | cal.day | 4 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-186 | `/portal/events` | en | button | 2027-01-20 | cal.day | 4 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-187 | `/portal/events` | en | button | 2027-01-21 | cal.day | 4 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-188 | `/portal/events` | en | button | 2027-01-22 | cal.day | 4 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-189 | `/portal/events` | en | button | 2027-01-23 | cal.day | 4 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-190 | `/portal/events` | en | button | 2027-01-24 | cal.day | 4 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-191 | `/portal/events` | en | button | 2027-01-25 | cal.day | 4 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-192 | `/portal/events` | en | button | 2027-01-26 | cal.day | 4 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-193 | `/portal/events` | en | button | 2027-01-27 | cal.day | 4 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-194 | `/portal/events` | en | button | 2027-01-28 | cal.day | 4 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-195 | `/portal/events` | en | button | 2027-01-29 | cal.day | 4 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-196 | `/portal/events` | en | button | 2027-01-30 | cal.day | 4 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-197 | `/portal/events` | en | button | 2027-01-31 | cal.day | 4 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-198 | `/portal/events` | en | button | Change language to Urdu | lang.toggle | 4 | 44x44 | PASS | exercised by a functional spec |
| EL-ENG-199 | `/portal/events` | en | button | Light or dark theme | theme.toggle | 4 | 44x44 | PASS | exercised by a functional spec |
| EL-ENG-200 | `/portal/events` | en | button | Next month | cal.move | 4 | 48x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-201 | `/portal/events` | en | button | Previous month | cal.move | 4 | 48x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-202 | `/portal/events` | en | button | Register for Export clinic c36f7d | event.reg | 3 | 77x44 | PASS | exercised by a functional spec |
| EL-ENG-203 | `/portal/events` | en | button | Register for Export clinic d098e0 | event.reg | 3 | 77x44 | PASS | exercised by a functional spec |
| EL-ENG-204 | `/portal/events` | en | button | Sign out | logout | 4 | 116x44 | PASS | exercised by a functional spec |
| EL-ENG-205 | `/portal/events` | en | link | Company Profile کمپنی پروفائل | /portal/profile | 4 | 238x54 | PASS | target answered 200 |
| EL-ENG-206 | `/portal/events` | en | link | Endorsement Requests تائید کی درخواستیں | /portal/endorse | 4 | 238x54 | PASS | target answered 200 |
| EL-ENG-207 | `/portal/events` | en | link | Events & Trade تقریبات | /portal/events | 4 | 238x54 | PASS | target answered 200 |
| EL-ENG-208 | `/portal/events` | en | link | Help & Support مدد اور رابطہ | /portal/support | 4 | 238x54 | PASS | target answered 200 |
| EL-ENG-209 | `/portal/events` | en | link | MCCI Member Digital Chamber Portal | /portal | 4 | 238x82 | PASS | target answered 200 |
| EL-ENG-210 | `/portal/events` | en | link | My Documents میری دستاویزات | /portal/documents | 4 | 238x54 | PASS | target answered 200 |
| EL-ENG-211 | `/portal/events` | en | link | My Membership میری رکنیت | /portal/membership | 4 | 238x54 | PASS | target answered 200 |
| EL-ENG-212 | `/portal/events` | en | link | Payments ادائیگیاں | /portal/payments | 4 | 238x54 | PASS | target answered 200 |
| EL-ENG-213 | `/portal/events` | en | link | Request a Service خدمت کی درخواست | /portal/apply | 4 | 238x54 | PASS | target answered 200 |
| EL-ENG-214 | `/portal/events` | en | link | Skip to content | #main | 4 | 144x47 | PASS | in-page anchor |
| EL-ENG-215 | `/portal/events` | en | link | Trade opportunities تجارتی مواقع | /portal/opportunities | 4 | 247x45 | PASS | target answered 200 |
| EL-ENG-216 | `/portal/events` | ur | button | 2027-01-01 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-217 | `/portal/events` | ur | button | 2027-01-02 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-218 | `/portal/events` | ur | button | 2027-01-03 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-219 | `/portal/events` | ur | button | 2027-01-04 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-220 | `/portal/events` | ur | button | 2027-01-05 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-221 | `/portal/events` | ur | button | 2027-01-06 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-222 | `/portal/events` | ur | button | 2027-01-07 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-223 | `/portal/events` | ur | button | 2027-01-08 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-224 | `/portal/events` | ur | button | 2027-01-09 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-225 | `/portal/events` | ur | button | 2027-01-10 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-226 | `/portal/events` | ur | button | 2027-01-11 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-227 | `/portal/events` | ur | button | 2027-01-12 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-228 | `/portal/events` | ur | button | 2027-01-13 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-229 | `/portal/events` | ur | button | 2027-01-14 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-230 | `/portal/events` | ur | button | 2027-01-15 · 2 تقریبات | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-231 | `/portal/events` | ur | button | 2027-01-16 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-232 | `/portal/events` | ur | button | 2027-01-17 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-233 | `/portal/events` | ur | button | 2027-01-18 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-234 | `/portal/events` | ur | button | 2027-01-19 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-235 | `/portal/events` | ur | button | 2027-01-20 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-236 | `/portal/events` | ur | button | 2027-01-21 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-237 | `/portal/events` | ur | button | 2027-01-22 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-238 | `/portal/events` | ur | button | 2027-01-23 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-239 | `/portal/events` | ur | button | 2027-01-24 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-240 | `/portal/events` | ur | button | 2027-01-25 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-241 | `/portal/events` | ur | button | 2027-01-26 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-242 | `/portal/events` | ur | button | 2027-01-27 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-243 | `/portal/events` | ur | button | 2027-01-28 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-244 | `/portal/events` | ur | button | 2027-01-29 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-245 | `/portal/events` | ur | button | 2027-01-30 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-246 | `/portal/events` | ur | button | 2027-01-31 | cal.day | 1 | 151x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-247 | `/portal/events` | ur | button | Export clinic c36f7d کے لیے رجسٹر کریں | event.reg | 1 | 63x44 | PASS | exercised by a functional spec |
| EL-ENG-248 | `/portal/events` | ur | button | Export clinic d098e0 کے لیے رجسٹر کریں | event.reg | 1 | 63x44 | PASS | exercised by a functional spec |
| EL-ENG-249 | `/portal/events` | ur | button | اگلا مہینہ | cal.move | 1 | 48x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-250 | `/portal/events` | ur | button | پچھلا مہینہ | cal.move | 1 | 48x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-251 | `/portal/events` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-ENG-252 | `/portal/events` | ur | button | زبان انگریزی میں بدلیں | lang.toggle | 1 | 78x44 | PASS | exercised by a functional spec |
| EL-ENG-253 | `/portal/events` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-ENG-254 | `/portal/events` | ur | link | ادائیگیاں Payments | /ur/portal/payments | 1 | 238x52 | PASS | target answered 200 |
| EL-ENG-255 | `/portal/events` | ur | link | ایم سی سی آئی ممبر ڈیجیٹل چیمبر پورٹل | /ur/portal | 1 | 238x99 | PASS | target answered 200 |
| EL-ENG-256 | `/portal/events` | ur | link | تائید کی درخواستیں Endorsement Requests | /ur/portal/endorse | 1 | 238x52 | PASS | target answered 200 |
| EL-ENG-257 | `/portal/events` | ur | link | تجارتی مواقع Trade opportunities | /ur/portal/opportunities | 1 | 227x50 | PASS | target answered 200 |
| EL-ENG-258 | `/portal/events` | ur | link | تقریبات Events & Trade | /ur/portal/events | 1 | 238x52 | PASS | target answered 200 |
| EL-ENG-259 | `/portal/events` | ur | link | خدمت کی درخواست Request a Service | /ur/portal/apply | 1 | 238x52 | PASS | target answered 200 |
| EL-ENG-260 | `/portal/events` | ur | link | کمپنی پروفائل Company Profile | /ur/portal/profile | 1 | 238x52 | PASS | target answered 200 |
| EL-ENG-261 | `/portal/events` | ur | link | مدد اور رابطہ Help & Support | /ur/portal/support | 1 | 238x52 | PASS | target answered 200 |
| EL-ENG-262 | `/portal/events` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-ENG-263 | `/portal/events` | ur | link | میری دستاویزات My Documents | /ur/portal/documents | 1 | 238x52 | PASS | target answered 200 |
| EL-ENG-264 | `/portal/events` | ur | link | میری رکنیت My Membership | /ur/portal/membership | 1 | 238x52 | PASS | target answered 200 |
| EL-MEM-101 | `/portal/form` | en | button | Change language to Urdu | lang.toggle | 4 | 44x44 | PASS | exercised by a functional spec |
| EL-MEM-102 | `/portal/form` | en | button | Light or dark theme | theme.toggle | 4 | 44x44 | PASS | exercised by a functional spec |
| EL-MEM-103 | `/portal/form` | en | button | Print / save PDF | doc.print | 4 | 167x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-MEM-104 | `/portal/form` | en | button | Sign out | logout | 4 | 116x44 | PASS | exercised by a functional spec |
| EL-MEM-105 | `/portal/form` | en | link | Application form درخواست فارم | /portal/join | 4 | 233x45 | PASS | target answered 200 |
| EL-MEM-106 | `/portal/form` | en | link | Company Profile کمپنی پروفائل | /portal/profile | 4 | 238x54 | PASS | target answered 200 |
| EL-MEM-107 | `/portal/form` | en | link | Endorsement Requests تائید کی درخواستیں | /portal/endorse | 4 | 238x54 | PASS | target answered 200 |
| EL-MEM-108 | `/portal/form` | en | link | Events & Trade تقریبات | /portal/events | 4 | 238x54 | PASS | target answered 200 |
| EL-MEM-109 | `/portal/form` | en | link | Help & Support مدد اور رابطہ | /portal/support | 4 | 238x54 | PASS | target answered 200 |
| EL-MEM-110 | `/portal/form` | en | link | MCCI Member Digital Chamber Portal | /portal | 4 | 238x82 | PASS | target answered 200 |
| EL-MEM-111 | `/portal/form` | en | link | My Documents میری دستاویزات | /portal/documents | 4 | 238x54 | PASS | target answered 200 |
| EL-MEM-112 | `/portal/form` | en | link | My Membership میری رکنیت | /portal/membership | 4 | 238x54 | PASS | target answered 200 |
| EL-MEM-113 | `/portal/form` | en | link | Official form سرکاری فارم | /portal/form | 4 | 194x45 | PASS | target answered 200 |
| EL-MEM-114 | `/portal/form` | en | link | Payments ادائیگیاں | /portal/payments | 4 | 238x54 | PASS | target answered 200 |
| EL-MEM-115 | `/portal/form` | en | link | Request a Service خدمت کی درخواست | /portal/apply | 4 | 238x54 | PASS | target answered 200 |
| EL-MEM-116 | `/portal/form` | en | link | Skip to content | #main | 4 | 144x47 | PASS | in-page anchor |
| EL-MEM-117 | `/portal/form` | en | link | Track پیش رفت | /portal/mtrack | 4 | 134x45 | PASS | target answered 200 |
| EL-MEM-118 | `/portal/form` | ur | button | پرنٹ / پی ڈی ایف محفوظ کریں | doc.print | 1 | 179x47 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-MEM-119 | `/portal/form` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-MEM-120 | `/portal/form` | ur | button | زبان انگریزی میں بدلیں | lang.toggle | 1 | 78x44 | PASS | exercised by a functional spec |
| EL-MEM-121 | `/portal/form` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-MEM-122 | `/portal/form` | ur | link | ادائیگیاں Payments | /ur/portal/payments | 1 | 238x52 | PASS | target answered 200 |
| EL-MEM-123 | `/portal/form` | ur | link | ایم سی سی آئی ممبر ڈیجیٹل چیمبر پورٹل | /ur/portal | 1 | 238x99 | PASS | target answered 200 |
| EL-MEM-124 | `/portal/form` | ur | link | پیش رفت Track | /ur/portal/mtrack | 1 | 133x50 | PASS | target answered 200 |
| EL-MEM-125 | `/portal/form` | ur | link | تائید کی درخواستیں Endorsement Requests | /ur/portal/endorse | 1 | 238x52 | PASS | target answered 200 |
| EL-MEM-126 | `/portal/form` | ur | link | تقریبات Events & Trade | /ur/portal/events | 1 | 238x52 | PASS | target answered 200 |
| EL-MEM-127 | `/portal/form` | ur | link | خدمت کی درخواست Request a Service | /ur/portal/apply | 1 | 238x52 | PASS | target answered 200 |
| EL-MEM-128 | `/portal/form` | ur | link | درخواست فارم Application form | /ur/portal/join | 1 | 219x50 | PASS | target answered 200 |
| EL-MEM-129 | `/portal/form` | ur | link | سرکاری فارم Official form | /ur/portal/form | 1 | 185x50 | PASS | target answered 200 |
| EL-MEM-130 | `/portal/form` | ur | link | کمپنی پروفائل Company Profile | /ur/portal/profile | 1 | 238x52 | PASS | target answered 200 |
| EL-MEM-131 | `/portal/form` | ur | link | مدد اور رابطہ Help & Support | /ur/portal/support | 1 | 238x52 | PASS | target answered 200 |
| EL-MEM-132 | `/portal/form` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-MEM-133 | `/portal/form` | ur | link | میری دستاویزات My Documents | /ur/portal/documents | 1 | 238x52 | PASS | target answered 200 |
| EL-MEM-134 | `/portal/form` | ur | link | میری رکنیت My Membership | /ur/portal/membership | 1 | 238x52 | PASS | target answered 200 |
| EL-MEM-135 | `/portal/join` | en | button | Change language to Urdu | lang.toggle | 4 | 44x44 | PASS | exercised by a functional spec |
| EL-MEM-136 | `/portal/join` | en | button | Light or dark theme | theme.toggle | 4 | 44x44 | PASS | exercised by a functional spec |
| EL-MEM-137 | `/portal/join` | en | button | Sign out | logout | 4 | 116x44 | PASS | exercised by a functional spec |
| EL-MEM-138 | `/portal/join` | en | link | Application form درخواست فارم | /portal/join | 4 | 233x45 | PASS | target answered 200 |
| EL-MEM-139 | `/portal/join` | en | link | Company Profile کمپنی پروفائل | /portal/profile | 4 | 238x54 | PASS | target answered 200 |
| EL-MEM-140 | `/portal/join` | en | link | Endorsement Requests تائید کی درخواستیں | /portal/endorse | 4 | 238x54 | PASS | target answered 200 |
| EL-MEM-141 | `/portal/join` | en | link | Events & Trade تقریبات | /portal/events | 4 | 238x54 | PASS | target answered 200 |
| EL-MEM-142 | `/portal/join` | en | link | Help & Support مدد اور رابطہ | /portal/support | 4 | 238x54 | PASS | target answered 200 |
| EL-MEM-143 | `/portal/join` | en | link | MCCI Member Digital Chamber Portal | /portal | 4 | 238x82 | PASS | target answered 200 |
| EL-MEM-144 | `/portal/join` | en | link | My Documents میری دستاویزات | /portal/documents | 4 | 238x54 | PASS | target answered 200 |
| EL-MEM-145 | `/portal/join` | en | link | My Membership میری رکنیت | /portal/membership | 4 | 238x54 | PASS | target answered 200 |
| EL-MEM-146 | `/portal/join` | en | link | Official form سرکاری فارم | /portal/form | 4 | 194x45 | PASS | target answered 200 |
| EL-MEM-147 | `/portal/join` | en | link | Payments ادائیگیاں | /portal/payments | 4 | 238x54 | PASS | target answered 200 |
| EL-MEM-148 | `/portal/join` | en | link | Request a Service خدمت کی درخواست | /portal/apply | 4 | 238x54 | PASS | target answered 200 |
| EL-MEM-149 | `/portal/join` | en | link | Skip to content | #main | 4 | 144x47 | PASS | in-page anchor |
| EL-MEM-150 | `/portal/join` | en | link | Track پیش رفت | /portal/mtrack | 4 | 134x45 | PASS | target answered 200 |
| EL-MEM-151 | `/portal/join` | en | submit | Start my application درخواست شروع کریں | register.start | 4 | 224x70 | PASS | exercised by a functional spec |
| EL-MEM-152 | `/portal/join` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-MEM-153 | `/portal/join` | ur | button | زبان انگریزی میں بدلیں | lang.toggle | 1 | 78x44 | PASS | exercised by a functional spec |
| EL-MEM-154 | `/portal/join` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-MEM-155 | `/portal/join` | ur | link | ادائیگیاں Payments | /ur/portal/payments | 1 | 238x52 | PASS | target answered 200 |
| EL-MEM-156 | `/portal/join` | ur | link | ایم سی سی آئی ممبر ڈیجیٹل چیمبر پورٹل | /ur/portal | 1 | 238x99 | PASS | target answered 200 |
| EL-MEM-157 | `/portal/join` | ur | link | پیش رفت Track | /ur/portal/mtrack | 1 | 133x50 | PASS | target answered 200 |
| EL-MEM-158 | `/portal/join` | ur | link | تائید کی درخواستیں Endorsement Requests | /ur/portal/endorse | 1 | 238x52 | PASS | target answered 200 |
| EL-MEM-159 | `/portal/join` | ur | link | تقریبات Events & Trade | /ur/portal/events | 1 | 238x52 | PASS | target answered 200 |
| EL-MEM-160 | `/portal/join` | ur | link | خدمت کی درخواست Request a Service | /ur/portal/apply | 1 | 238x52 | PASS | target answered 200 |
| EL-MEM-161 | `/portal/join` | ur | link | درخواست فارم Application form | /ur/portal/join | 1 | 219x50 | PASS | target answered 200 |
| EL-MEM-162 | `/portal/join` | ur | link | سرکاری فارم Official form | /ur/portal/form | 1 | 185x50 | PASS | target answered 200 |
| EL-MEM-163 | `/portal/join` | ur | link | کمپنی پروفائل Company Profile | /ur/portal/profile | 1 | 238x52 | PASS | target answered 200 |
| EL-MEM-164 | `/portal/join` | ur | link | مدد اور رابطہ Help & Support | /ur/portal/support | 1 | 238x52 | PASS | target answered 200 |
| EL-MEM-165 | `/portal/join` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-MEM-166 | `/portal/join` | ur | link | میری دستاویزات My Documents | /ur/portal/documents | 1 | 238x52 | PASS | target answered 200 |
| EL-MEM-167 | `/portal/join` | ur | link | میری رکنیت My Membership | /ur/portal/membership | 1 | 238x52 | PASS | target answered 200 |
| EL-MEM-168 | `/portal/join` | ur | submit | Start my application درخواست شروع کریں | register.start | 1 | 224x82 | PASS | exercised by a functional spec |
| EL-MEM-169 | `/portal/membership` | en | button | Change language to Urdu | lang.toggle | 4 | 44x44 | PASS | exercised by a functional spec |
| EL-MEM-170 | `/portal/membership` | en | button | Light or dark theme | theme.toggle | 4 | 44x44 | PASS | exercised by a functional spec |
| EL-MEM-171 | `/portal/membership` | en | button | Sign out | logout | 4 | 116x44 | PASS | exercised by a functional spec |
| EL-MEM-172 | `/portal/membership` | en | link | Application form درخواست فارم | /portal/join | 4 | 233x45 | PASS | target answered 200 |
| EL-MEM-173 | `/portal/membership` | en | link | Company Profile کمپنی پروفائل | /portal/profile | 4 | 238x54 | PASS | target answered 200 |
| EL-MEM-174 | `/portal/membership` | en | link | Endorsement Requests تائید کی درخواستیں | /portal/endorse | 4 | 238x54 | PASS | target answered 200 |
| EL-MEM-175 | `/portal/membership` | en | link | Events & Trade تقریبات | /portal/events | 4 | 238x54 | PASS | target answered 200 |
| EL-MEM-176 | `/portal/membership` | en | link | Help & Support مدد اور رابطہ | /portal/support | 4 | 238x54 | PASS | target answered 200 |
| EL-MEM-177 | `/portal/membership` | en | link | MCCI Member Digital Chamber Portal | /portal | 4 | 238x82 | PASS | target answered 200 |
| EL-MEM-178 | `/portal/membership` | en | link | My Documents میری دستاویزات | /portal/documents | 4 | 238x54 | PASS | target answered 200 |
| EL-MEM-179 | `/portal/membership` | en | link | My membership میری رکنیت | nav | 3 | 191x68 | PASS | target answered 200 |
| EL-MEM-180 | `/portal/membership` | en | link | My Membership میری رکنیت | /portal/membership | 4 | 238x54 | PASS | target answered 200 |
| EL-MEM-181 | `/portal/membership` | en | link | Official form سرکاری فارم | /portal/form | 4 | 194x45 | PASS | target answered 200 |
| EL-MEM-182 | `/portal/membership` | en | link | Payments ادائیگیاں | /portal/payments | 4 | 238x54 | PASS | target answered 200 |
| EL-MEM-183 | `/portal/membership` | en | link | Request a service خدمت کی درخواست | nav | 3 | 202x68 | PASS | target answered 200 |
| EL-MEM-184 | `/portal/membership` | en | link | Request a Service خدمت کی درخواست | /portal/apply | 4 | 238x54 | PASS | target answered 200 |
| EL-MEM-185 | `/portal/membership` | en | link | Skip to content | #main | 4 | 144x47 | PASS | in-page anchor |
| EL-MEM-186 | `/portal/membership` | en | link | Track پیش رفت | /portal/mtrack | 4 | 134x45 | PASS | target answered 200 |
| EL-MEM-187 | `/portal/membership` | en | submit | Start my application درخواست شروع کریں | register.start | 1 | 224x70 | PASS | exercised by a functional spec |
| EL-MEM-188 | `/portal/membership` | en | tab | Certificates & cards سرٹیفکیٹ اور کارڈ | tab | 4 | 179x59 | PASS | exercised by a functional spec |
| EL-MEM-189 | `/portal/membership` | en | tab | Renewal & history تجدید اور تاریخچہ | tab | 4 | 164x59 | PASS | exercised by a functional spec |
| EL-MEM-190 | `/portal/membership` | en | tab | Status کیفیت | tab | 4 | 81x59 | PASS | exercised by a functional spec |
| EL-MEM-191 | `/portal/membership` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-MEM-192 | `/portal/membership` | ur | button | زبان انگریزی میں بدلیں | lang.toggle | 1 | 78x44 | PASS | exercised by a functional spec |
| EL-MEM-193 | `/portal/membership` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-MEM-194 | `/portal/membership` | ur | link | My membership میری رکنیت | nav | 1 | 191x80 | PASS | target answered 200 |
| EL-MEM-195 | `/portal/membership` | ur | link | Request a service خدمت کی درخواست | nav | 1 | 202x80 | PASS | target answered 200 |
| EL-MEM-196 | `/portal/membership` | ur | link | ادائیگیاں Payments | /ur/portal/payments | 1 | 238x52 | PASS | target answered 200 |
| EL-MEM-197 | `/portal/membership` | ur | link | ایم سی سی آئی ممبر ڈیجیٹل چیمبر پورٹل | /ur/portal | 1 | 238x99 | PASS | target answered 200 |
| EL-MEM-198 | `/portal/membership` | ur | link | پیش رفت Track | /ur/portal/mtrack | 1 | 133x50 | PASS | target answered 200 |
| EL-MEM-199 | `/portal/membership` | ur | link | تائید کی درخواستیں Endorsement Requests | /ur/portal/endorse | 1 | 238x52 | PASS | target answered 200 |
| EL-MEM-200 | `/portal/membership` | ur | link | تقریبات Events & Trade | /ur/portal/events | 1 | 238x52 | PASS | target answered 200 |
| EL-MEM-201 | `/portal/membership` | ur | link | خدمت کی درخواست Request a Service | /ur/portal/apply | 1 | 238x52 | PASS | target answered 200 |
| EL-MEM-202 | `/portal/membership` | ur | link | درخواست فارم Application form | /ur/portal/join | 1 | 219x50 | PASS | target answered 200 |
| EL-MEM-203 | `/portal/membership` | ur | link | سرکاری فارم Official form | /ur/portal/form | 1 | 185x50 | PASS | target answered 200 |
| EL-MEM-204 | `/portal/membership` | ur | link | کمپنی پروفائل Company Profile | /ur/portal/profile | 1 | 238x52 | PASS | target answered 200 |
| EL-MEM-205 | `/portal/membership` | ur | link | مدد اور رابطہ Help & Support | /ur/portal/support | 1 | 238x52 | PASS | target answered 200 |
| EL-MEM-206 | `/portal/membership` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-MEM-207 | `/portal/membership` | ur | link | میری دستاویزات My Documents | /ur/portal/documents | 1 | 238x52 | PASS | target answered 200 |
| EL-MEM-208 | `/portal/membership` | ur | link | میری رکنیت My Membership | /ur/portal/membership | 1 | 238x52 | PASS | target answered 200 |
| EL-MEM-209 | `/portal/membership` | ur | tab | Certificates & cards سرٹیفکیٹ اور کارڈ | tab | 1 | 179x71 | PASS | exercised by a functional spec |
| EL-MEM-210 | `/portal/membership` | ur | tab | Renewal & history تجدید اور تاریخچہ | tab | 1 | 164x71 | PASS | exercised by a functional spec |
| EL-MEM-211 | `/portal/membership` | ur | tab | Status کیفیت | tab | 1 | 81x71 | PASS | exercised by a functional spec |
| EL-MEM-212 | `/portal/mtrack` | en | button | Change language to Urdu | lang.toggle | 4 | 44x44 | PASS | exercised by a functional spec |
| EL-MEM-213 | `/portal/mtrack` | en | button | Light or dark theme | theme.toggle | 4 | 44x44 | PASS | exercised by a functional spec |
| EL-MEM-214 | `/portal/mtrack` | en | button | Sign out | logout | 4 | 116x44 | PASS | exercised by a functional spec |
| EL-MEM-215 | `/portal/mtrack` | en | link | Application form درخواست فارم | /portal/join | 4 | 233x45 | PASS | target answered 200 |
| EL-MEM-216 | `/portal/mtrack` | en | link | Company Profile کمپنی پروفائل | /portal/profile | 4 | 238x54 | PASS | target answered 200 |
| EL-MEM-217 | `/portal/mtrack` | en | link | Endorsement Requests تائید کی درخواستیں | /portal/endorse | 4 | 238x54 | PASS | target answered 200 |
| EL-MEM-218 | `/portal/mtrack` | en | link | Events & Trade تقریبات | /portal/events | 4 | 238x54 | PASS | target answered 200 |
| EL-MEM-219 | `/portal/mtrack` | en | link | Help & Support مدد اور رابطہ | /portal/support | 4 | 238x54 | PASS | target answered 200 |
| EL-MEM-220 | `/portal/mtrack` | en | link | MCCI Member Digital Chamber Portal | /portal | 4 | 238x82 | PASS | target answered 200 |
| EL-MEM-221 | `/portal/mtrack` | en | link | My Documents میری دستاویزات | /portal/documents | 4 | 238x54 | PASS | target answered 200 |
| EL-MEM-222 | `/portal/mtrack` | en | link | My Membership میری رکنیت | /portal/membership | 4 | 238x54 | PASS | target answered 200 |
| EL-MEM-223 | `/portal/mtrack` | en | link | Official form سرکاری فارم | /portal/form | 4 | 194x45 | PASS | target answered 200 |
| EL-MEM-224 | `/portal/mtrack` | en | link | Payments ادائیگیاں | /portal/payments | 4 | 238x54 | PASS | target answered 200 |
| EL-MEM-225 | `/portal/mtrack` | en | link | Request a Service خدمت کی درخواست | /portal/apply | 4 | 238x54 | PASS | target answered 200 |
| EL-MEM-226 | `/portal/mtrack` | en | link | Skip to content | #main | 4 | 144x47 | PASS | in-page anchor |
| EL-MEM-227 | `/portal/mtrack` | en | link | Track پیش رفت | /portal/mtrack | 4 | 134x45 | PASS | target answered 200 |
| EL-MEM-228 | `/portal/mtrack` | en | submit | Start my application درخواست شروع کریں | register.start | 4 | 224x70 | PASS | exercised by a functional spec |
| EL-MEM-229 | `/portal/mtrack` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-MEM-230 | `/portal/mtrack` | ur | button | زبان انگریزی میں بدلیں | lang.toggle | 1 | 78x44 | PASS | exercised by a functional spec |
| EL-MEM-231 | `/portal/mtrack` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-MEM-232 | `/portal/mtrack` | ur | link | ادائیگیاں Payments | /ur/portal/payments | 1 | 238x52 | PASS | target answered 200 |
| EL-MEM-233 | `/portal/mtrack` | ur | link | ایم سی سی آئی ممبر ڈیجیٹل چیمبر پورٹل | /ur/portal | 1 | 238x99 | PASS | target answered 200 |
| EL-MEM-234 | `/portal/mtrack` | ur | link | پیش رفت Track | /ur/portal/mtrack | 1 | 133x50 | PASS | target answered 200 |
| EL-MEM-235 | `/portal/mtrack` | ur | link | تائید کی درخواستیں Endorsement Requests | /ur/portal/endorse | 1 | 238x52 | PASS | target answered 200 |
| EL-MEM-236 | `/portal/mtrack` | ur | link | تقریبات Events & Trade | /ur/portal/events | 1 | 238x52 | PASS | target answered 200 |
| EL-MEM-237 | `/portal/mtrack` | ur | link | خدمت کی درخواست Request a Service | /ur/portal/apply | 1 | 238x52 | PASS | target answered 200 |
| EL-MEM-238 | `/portal/mtrack` | ur | link | درخواست فارم Application form | /ur/portal/join | 1 | 219x50 | PASS | target answered 200 |
| EL-MEM-239 | `/portal/mtrack` | ur | link | سرکاری فارم Official form | /ur/portal/form | 1 | 185x50 | PASS | target answered 200 |
| EL-MEM-240 | `/portal/mtrack` | ur | link | کمپنی پروفائل Company Profile | /ur/portal/profile | 1 | 238x52 | PASS | target answered 200 |
| EL-MEM-241 | `/portal/mtrack` | ur | link | مدد اور رابطہ Help & Support | /ur/portal/support | 1 | 238x52 | PASS | target answered 200 |
| EL-MEM-242 | `/portal/mtrack` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-MEM-243 | `/portal/mtrack` | ur | link | میری دستاویزات My Documents | /ur/portal/documents | 1 | 238x52 | PASS | target answered 200 |
| EL-MEM-244 | `/portal/mtrack` | ur | link | میری رکنیت My Membership | /ur/portal/membership | 1 | 238x52 | PASS | target answered 200 |
| EL-MEM-245 | `/portal/mtrack` | ur | submit | Start my application درخواست شروع کریں | register.start | 1 | 224x82 | PASS | exercised by a functional spec |
| EL-ENG-265 | `/portal/notifications` | en | button | Change language to Urdu | lang.toggle | 4 | 44x44 | PASS | exercised by a functional spec |
| EL-ENG-266 | `/portal/notifications` | en | button | Light or dark theme | theme.toggle | 4 | 44x44 | PASS | exercised by a functional spec |
| EL-ENG-267 | `/portal/notifications` | en | button | Mark all read | note.readall | 4 | 146x44 | PASS | exercised by a functional spec |
| EL-ENG-268 | `/portal/notifications` | en | button | Messages in Urdu | setting.toggle | 4 | 48x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-269 | `/portal/notifications` | en | button | Sign out | logout | 4 | 116x44 | PASS | exercised by a functional spec |
| EL-ENG-270 | `/portal/notifications` | en | link | Ask AI اے آئی | /portal/assistant | 4 | 135x45 | PASS | target answered 200 |
| EL-ENG-271 | `/portal/notifications` | en | link | Company Profile کمپنی پروفائل | /portal/profile | 4 | 238x54 | PASS | target answered 200 |
| EL-ENG-272 | `/portal/notifications` | en | link | Endorsement Requests تائید کی درخواستیں | /portal/endorse | 4 | 238x54 | PASS | target answered 200 |
| EL-ENG-273 | `/portal/notifications` | en | link | Events & Trade تقریبات | /portal/events | 4 | 238x54 | PASS | target answered 200 |
| EL-ENG-274 | `/portal/notifications` | en | link | Help & Support مدد اور رابطہ | /portal/support | 4 | 238x54 | PASS | target answered 200 |
| EL-ENG-275 | `/portal/notifications` | en | link | MCCI Member Digital Chamber Portal | /portal | 4 | 238x82 | PASS | target answered 200 |
| EL-ENG-276 | `/portal/notifications` | en | link | Messages پیغامات | /portal/notifications | 4 | 159x45 | PASS | target answered 200 |
| EL-ENG-277 | `/portal/notifications` | en | link | My Documents میری دستاویزات | /portal/documents | 4 | 238x54 | PASS | target answered 200 |
| EL-ENG-278 | `/portal/notifications` | en | link | My Membership میری رکنیت | /portal/membership | 4 | 238x54 | PASS | target answered 200 |
| EL-ENG-279 | `/portal/notifications` | en | link | Payments ادائیگیاں | /portal/payments | 4 | 238x54 | PASS | target answered 200 |
| EL-ENG-280 | `/portal/notifications` | en | link | Request a Service خدمت کی درخواست | /portal/apply | 4 | 238x54 | PASS | target answered 200 |
| EL-ENG-281 | `/portal/notifications` | en | link | Skip to content | #main | 4 | 144x47 | PASS | in-page anchor |
| EL-ENG-282 | `/portal/notifications` | ur | button | اردو میں پیغامات | setting.toggle | 1 | 48x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-ENG-283 | `/portal/notifications` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-ENG-284 | `/portal/notifications` | ur | button | زبان انگریزی میں بدلیں | lang.toggle | 1 | 78x44 | PASS | exercised by a functional spec |
| EL-ENG-285 | `/portal/notifications` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-ENG-286 | `/portal/notifications` | ur | button | سب پڑھے ہوئے | note.readall | 1 | 121x47 | PASS | exercised by a functional spec |
| EL-ENG-287 | `/portal/notifications` | ur | link | ادائیگیاں Payments | /ur/portal/payments | 1 | 238x52 | PASS | target answered 200 |
| EL-ENG-288 | `/portal/notifications` | ur | link | ایم سی سی آئی ممبر ڈیجیٹل چیمبر پورٹل | /ur/portal | 1 | 238x99 | PASS | target answered 200 |
| EL-ENG-289 | `/portal/notifications` | ur | link | اے آئی Ask AI | /ur/portal/assistant | 1 | 132x50 | PASS | target answered 200 |
| EL-ENG-290 | `/portal/notifications` | ur | link | پیغامات Messages | /ur/portal/notifications | 1 | 149x50 | PASS | target answered 200 |
| EL-ENG-291 | `/portal/notifications` | ur | link | تائید کی درخواستیں Endorsement Requests | /ur/portal/endorse | 1 | 238x52 | PASS | target answered 200 |
| EL-ENG-292 | `/portal/notifications` | ur | link | تقریبات Events & Trade | /ur/portal/events | 1 | 238x52 | PASS | target answered 200 |
| EL-ENG-293 | `/portal/notifications` | ur | link | خدمت کی درخواست Request a Service | /ur/portal/apply | 1 | 238x52 | PASS | target answered 200 |
| EL-ENG-294 | `/portal/notifications` | ur | link | کمپنی پروفائل Company Profile | /ur/portal/profile | 1 | 238x52 | PASS | target answered 200 |
| EL-ENG-295 | `/portal/notifications` | ur | link | مدد اور رابطہ Help & Support | /ur/portal/support | 1 | 238x52 | PASS | target answered 200 |
| EL-ENG-296 | `/portal/notifications` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-ENG-297 | `/portal/notifications` | ur | link | میری دستاویزات My Documents | /ur/portal/documents | 1 | 238x52 | PASS | target answered 200 |
| EL-ENG-298 | `/portal/notifications` | ur | link | میری رکنیت My Membership | /ur/portal/membership | 1 | 238x52 | PASS | target answered 200 |
| EL-OPP-001 | `/portal/opportunities` | en | button | Change language to Urdu | lang.toggle | 4 | 44x44 | PASS | exercised by a functional spec |
| EL-OPP-002 | `/portal/opportunities` | en | button | Light or dark theme | theme.toggle | 4 | 44x44 | PASS | exercised by a functional spec |
| EL-OPP-003 | `/portal/opportunities` | en | button | Post a requirement | opp.post | 4 | 194x44 | PASS | exercised by a functional spec |
| EL-OPP-004 | `/portal/opportunities` | en | button | Sign out | logout | 4 | 116x44 | PASS | exercised by a functional spec |
| EL-OPP-005 | `/portal/opportunities` | en | link | Company Profile کمپنی پروفائل | /portal/profile | 4 | 238x54 | PASS | target answered 200 |
| EL-OPP-006 | `/portal/opportunities` | en | link | Endorsement Requests تائید کی درخواستیں | /portal/endorse | 4 | 238x54 | PASS | target answered 200 |
| EL-OPP-007 | `/portal/opportunities` | en | link | Events & Trade تقریبات | /portal/events | 4 | 238x54 | PASS | target answered 200 |
| EL-OPP-008 | `/portal/opportunities` | en | link | Help & Support مدد اور رابطہ | /portal/support | 4 | 238x54 | PASS | target answered 200 |
| EL-OPP-009 | `/portal/opportunities` | en | link | MCCI Member Digital Chamber Portal | /portal | 4 | 238x82 | PASS | target answered 200 |
| EL-OPP-010 | `/portal/opportunities` | en | link | My Documents میری دستاویزات | /portal/documents | 4 | 238x54 | PASS | target answered 200 |
| EL-OPP-011 | `/portal/opportunities` | en | link | My Membership میری رکنیت | /portal/membership | 4 | 238x54 | PASS | target answered 200 |
| EL-OPP-012 | `/portal/opportunities` | en | link | Payments ادائیگیاں | /portal/payments | 4 | 238x54 | PASS | target answered 200 |
| EL-OPP-013 | `/portal/opportunities` | en | link | Request a Service خدمت کی درخواست | /portal/apply | 4 | 238x54 | PASS | target answered 200 |
| EL-OPP-014 | `/portal/opportunities` | en | link | Skip to content | #main | 4 | 144x47 | PASS | in-page anchor |
| EL-OPP-015 | `/portal/opportunities` | en | link | Trade opportunities تجارتی مواقع | /portal/opportunities | 4 | 247x45 | PASS | target answered 200 |
| EL-OPP-016 | `/portal/opportunities` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-OPP-017 | `/portal/opportunities` | ur | button | زبان انگریزی میں بدلیں | lang.toggle | 1 | 78x44 | PASS | exercised by a functional spec |
| EL-OPP-018 | `/portal/opportunities` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-OPP-019 | `/portal/opportunities` | ur | button | ضرورت پوسٹ کریں | opp.post | 1 | 136x49 | PASS | exercised by a functional spec |
| EL-OPP-020 | `/portal/opportunities` | ur | link | ادائیگیاں Payments | /ur/portal/payments | 1 | 238x52 | PASS | target answered 200 |
| EL-OPP-021 | `/portal/opportunities` | ur | link | ایم سی سی آئی ممبر ڈیجیٹل چیمبر پورٹل | /ur/portal | 1 | 238x99 | PASS | target answered 200 |
| EL-OPP-022 | `/portal/opportunities` | ur | link | تائید کی درخواستیں Endorsement Requests | /ur/portal/endorse | 1 | 238x52 | PASS | target answered 200 |
| EL-OPP-023 | `/portal/opportunities` | ur | link | تجارتی مواقع Trade opportunities | /ur/portal/opportunities | 1 | 227x50 | PASS | target answered 200 |
| EL-OPP-024 | `/portal/opportunities` | ur | link | تقریبات Events & Trade | /ur/portal/events | 1 | 238x52 | PASS | target answered 200 |
| EL-OPP-025 | `/portal/opportunities` | ur | link | خدمت کی درخواست Request a Service | /ur/portal/apply | 1 | 238x52 | PASS | target answered 200 |
| EL-OPP-026 | `/portal/opportunities` | ur | link | کمپنی پروفائل Company Profile | /ur/portal/profile | 1 | 238x52 | PASS | target answered 200 |
| EL-OPP-027 | `/portal/opportunities` | ur | link | مدد اور رابطہ Help & Support | /ur/portal/support | 1 | 238x52 | PASS | target answered 200 |
| EL-OPP-028 | `/portal/opportunities` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-OPP-029 | `/portal/opportunities` | ur | link | میری دستاویزات My Documents | /ur/portal/documents | 1 | 238x52 | PASS | target answered 200 |
| EL-OPP-030 | `/portal/opportunities` | ur | link | میری رکنیت My Membership | /ur/portal/membership | 1 | 238x52 | PASS | target answered 200 |
| EL-FIN-185 | `/portal/payments` | en | button | Change language to Urdu | lang.toggle | 4 | 44x44 | PASS | exercised by a functional spec |
| EL-FIN-186 | `/portal/payments` | en | button | Light or dark theme | theme.toggle | 4 | 44x44 | PASS | exercised by a functional spec |
| EL-FIN-187 | `/portal/payments` | en | button | Sign out | logout | 4 | 116x44 | PASS | exercised by a functional spec |
| EL-FIN-188 | `/portal/payments` | en | link | Company Profile کمپنی پروفائل | /portal/profile | 4 | 238x54 | PASS | target answered 200 |
| EL-FIN-189 | `/portal/payments` | en | link | Endorsement Requests تائید کی درخواستیں | /portal/endorse | 4 | 238x54 | PASS | target answered 200 |
| EL-FIN-190 | `/portal/payments` | en | link | Events & Trade تقریبات | /portal/events | 4 | 238x54 | PASS | target answered 200 |
| EL-FIN-191 | `/portal/payments` | en | link | Help & Support مدد اور رابطہ | /portal/support | 4 | 238x54 | PASS | target answered 200 |
| EL-FIN-192 | `/portal/payments` | en | link | MCCI Member Digital Chamber Portal | /portal | 4 | 238x82 | PASS | target answered 200 |
| EL-FIN-193 | `/portal/payments` | en | link | My Documents میری دستاویزات | /portal/documents | 4 | 238x54 | PASS | target answered 200 |
| EL-FIN-194 | `/portal/payments` | en | link | My Membership میری رکنیت | /portal/membership | 4 | 238x54 | PASS | target answered 200 |
| EL-FIN-195 | `/portal/payments` | en | link | Payments ادائیگیاں | /portal/payments | 4 | 238x54 | PASS | target answered 200 |
| EL-FIN-196 | `/portal/payments` | en | link | Request a Service خدمت کی درخواست | /portal/apply | 4 | 238x54 | PASS | target answered 200 |
| EL-FIN-197 | `/portal/payments` | en | link | Skip to content | #main | 4 | 144x47 | PASS | in-page anchor |
| EL-FIN-198 | `/portal/payments` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-FIN-199 | `/portal/payments` | ur | button | زبان انگریزی میں بدلیں | lang.toggle | 1 | 78x44 | PASS | exercised by a functional spec |
| EL-FIN-200 | `/portal/payments` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-FIN-201 | `/portal/payments` | ur | link | ادائیگیاں Payments | /ur/portal/payments | 1 | 238x52 | PASS | target answered 200 |
| EL-FIN-202 | `/portal/payments` | ur | link | ایم سی سی آئی ممبر ڈیجیٹل چیمبر پورٹل | /ur/portal | 1 | 238x99 | PASS | target answered 200 |
| EL-FIN-203 | `/portal/payments` | ur | link | تائید کی درخواستیں Endorsement Requests | /ur/portal/endorse | 1 | 238x52 | PASS | target answered 200 |
| EL-FIN-204 | `/portal/payments` | ur | link | تقریبات Events & Trade | /ur/portal/events | 1 | 238x52 | PASS | target answered 200 |
| EL-FIN-205 | `/portal/payments` | ur | link | خدمت کی درخواست Request a Service | /ur/portal/apply | 1 | 238x52 | PASS | target answered 200 |
| EL-FIN-206 | `/portal/payments` | ur | link | کمپنی پروفائل Company Profile | /ur/portal/profile | 1 | 238x52 | PASS | target answered 200 |
| EL-FIN-207 | `/portal/payments` | ur | link | مدد اور رابطہ Help & Support | /ur/portal/support | 1 | 238x52 | PASS | target answered 200 |
| EL-FIN-208 | `/portal/payments` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-FIN-209 | `/portal/payments` | ur | link | میری دستاویزات My Documents | /ur/portal/documents | 1 | 238x52 | PASS | target answered 200 |
| EL-FIN-210 | `/portal/payments` | ur | link | میری رکنیت My Membership | /ur/portal/membership | 1 | 238x52 | PASS | target answered 200 |
| EL-PROF-001 | `/portal/profile` | en | button | Change language to Urdu | lang.toggle | 4 | 44x44 | PASS | exercised by a functional spec |
| EL-PROF-002 | `/portal/profile` | en | button | Declare a change | chg.open | 3 | 155x44 | PASS | exercised by a functional spec |
| EL-PROF-003 | `/portal/profile` | en | button | Invite by email | user.invite | 3 | 158x44 | PASS | exercised by a functional spec |
| EL-PROF-004 | `/portal/profile` | en | button | Light or dark theme | theme.toggle | 4 | 44x44 | PASS | exercised by a functional spec |
| EL-PROF-005 | `/portal/profile` | en | button | Sign out | logout | 4 | 116x44 | PASS | exercised by a functional spec |
| EL-PROF-006 | `/portal/profile` | en | button | Urdu first | setting.toggle | 4 | 48x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PROF-007 | `/portal/profile` | en | link | Company Profile کمپنی پروفائل | /portal/profile | 4 | 238x54 | PASS | target answered 200 |
| EL-PROF-008 | `/portal/profile` | en | link | Endorsement Requests تائید کی درخواستیں | /portal/endorse | 4 | 238x54 | PASS | target answered 200 |
| EL-PROF-009 | `/portal/profile` | en | link | Events & Trade تقریبات | /portal/events | 4 | 238x54 | PASS | target answered 200 |
| EL-PROF-010 | `/portal/profile` | en | link | Help & Support مدد اور رابطہ | /portal/support | 4 | 238x54 | PASS | target answered 200 |
| EL-PROF-011 | `/portal/profile` | en | link | MCCI Member Digital Chamber Portal | /portal | 4 | 238x82 | PASS | target answered 200 |
| EL-PROF-012 | `/portal/profile` | en | link | My Documents میری دستاویزات | /portal/documents | 4 | 238x54 | PASS | target answered 200 |
| EL-PROF-013 | `/portal/profile` | en | link | My Membership میری رکنیت | /portal/membership | 4 | 238x54 | PASS | target answered 200 |
| EL-PROF-014 | `/portal/profile` | en | link | Payments ادائیگیاں | /portal/payments | 4 | 238x54 | PASS | target answered 200 |
| EL-PROF-015 | `/portal/profile` | en | link | Request a Service خدمت کی درخواست | /portal/apply | 4 | 238x54 | PASS | target answered 200 |
| EL-PROF-016 | `/portal/profile` | en | link | Skip to content | #main | 4 | 144x47 | PASS | in-page anchor |
| EL-PROF-017 | `/portal/profile` | ur | button | اردو پہلے | setting.toggle | 1 | 48x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-PROF-018 | `/portal/profile` | ur | button | ای میل سے مدعو کریں | user.invite | 1 | 143x47 | PASS | exercised by a functional spec |
| EL-PROF-019 | `/portal/profile` | ur | button | تبدیلی کا اقرار کریں | chg.open | 1 | 106x47 | PASS | exercised by a functional spec |
| EL-PROF-020 | `/portal/profile` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-PROF-021 | `/portal/profile` | ur | button | زبان انگریزی میں بدلیں | lang.toggle | 1 | 78x44 | PASS | exercised by a functional spec |
| EL-PROF-022 | `/portal/profile` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-PROF-023 | `/portal/profile` | ur | link | ادائیگیاں Payments | /ur/portal/payments | 1 | 238x52 | PASS | target answered 200 |
| EL-PROF-024 | `/portal/profile` | ur | link | ایم سی سی آئی ممبر ڈیجیٹل چیمبر پورٹل | /ur/portal | 1 | 238x99 | PASS | target answered 200 |
| EL-PROF-025 | `/portal/profile` | ur | link | تائید کی درخواستیں Endorsement Requests | /ur/portal/endorse | 1 | 238x52 | PASS | target answered 200 |
| EL-PROF-026 | `/portal/profile` | ur | link | تقریبات Events & Trade | /ur/portal/events | 1 | 238x52 | PASS | target answered 200 |
| EL-PROF-027 | `/portal/profile` | ur | link | خدمت کی درخواست Request a Service | /ur/portal/apply | 1 | 238x52 | PASS | target answered 200 |
| EL-PROF-028 | `/portal/profile` | ur | link | کمپنی پروفائل Company Profile | /ur/portal/profile | 1 | 238x52 | PASS | target answered 200 |
| EL-PROF-029 | `/portal/profile` | ur | link | مدد اور رابطہ Help & Support | /ur/portal/support | 1 | 238x52 | PASS | target answered 200 |
| EL-PROF-030 | `/portal/profile` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-PROF-031 | `/portal/profile` | ur | link | میری دستاویزات My Documents | /ur/portal/documents | 1 | 238x52 | PASS | target answered 200 |
| EL-PROF-032 | `/portal/profile` | ur | link | میری رکنیت My Membership | /ur/portal/membership | 1 | 238x52 | PASS | target answered 200 |
| EL-ENG-299 | `/portal/support` | en | button | Ask MCCI AI اے آئی سے پوچھیں Coming in the next release | ai.open | 4 | 365x199 | PARTIAL | disabled: Coming in the next release |
| EL-ENG-300 | `/portal/support` | en | button | Change language to Urdu | lang.toggle | 4 | 44x44 | PASS | exercised by a functional spec |
| EL-ENG-301 | `/portal/support` | en | button | How much is the fee? | faq.toggle | 4 | 561x51 | PASS | exercised by a functional spec |
| EL-ENG-302 | `/portal/support` | en | button | I do not know a proposer | faq.toggle | 4 | 561x51 | PASS | exercised by a functional spec |
| EL-ENG-303 | `/portal/support` | en | button | Light or dark theme | theme.toggle | 4 | 44x44 | PASS | exercised by a functional spec |
| EL-ENG-304 | `/portal/support` | en | button | Open a ticket ٹکٹ کھولیں Reply within 24 hours | ticket.new | 4 | 365x199 | PASS | exercised by a functional spec |
| EL-ENG-305 | `/portal/support` | en | button | Sign out | logout | 4 | 116x44 | PASS | exercised by a functional spec |
| EL-ENG-306 | `/portal/support` | en | button | When does membership expire? | faq.toggle | 4 | 561x51 | PASS | exercised by a functional spec |
| EL-ENG-307 | `/portal/support` | en | button | When does my membership start? | faq.toggle | 4 | 561x51 | PASS | exercised by a functional spec |
| EL-ENG-308 | `/portal/support` | en | button | Which documents do I need? | faq.toggle | 4 | 561x51 | PASS | exercised by a functional spec |
| EL-ENG-309 | `/portal/support` | en | link | Ask AI اے آئی | /portal/assistant | 4 | 135x45 | PASS | target answered 200 |
| EL-ENG-310 | `/portal/support` | en | link | Call us کال کریں 92-61-4543530 | help.call | 4 | 365x199 | PARTIAL | external / file link (not requested) |
| EL-ENG-311 | `/portal/support` | en | link | Company Profile کمپنی پروفائل | /portal/profile | 4 | 238x54 | PASS | target answered 200 |
| EL-ENG-312 | `/portal/support` | en | link | Email us ای میل کریں info@mcci.org.pk | help.email | 4 | 365x199 | PARTIAL | external / file link (not requested) |
| EL-ENG-313 | `/portal/support` | en | link | Endorsement Requests تائید کی درخواستیں | /portal/endorse | 4 | 238x54 | PASS | target answered 200 |
| EL-ENG-314 | `/portal/support` | en | link | Events & Trade تقریبات | /portal/events | 4 | 238x54 | PASS | target answered 200 |
| EL-ENG-315 | `/portal/support` | en | link | Guides رہنمائی Forms & checklists | nav | 4 | 365x199 | PASS | target answered 200 |
| EL-ENG-316 | `/portal/support` | en | link | Help & Support مدد اور رابطہ | /portal/support | 4 | 238x54 | PASS | target answered 200 |
| EL-ENG-317 | `/portal/support` | en | link | MCCI Member Digital Chamber Portal | /portal | 4 | 238x82 | PASS | target answered 200 |
| EL-ENG-318 | `/portal/support` | en | link | Messages پیغامات | /portal/notifications | 4 | 159x45 | PASS | target answered 200 |
| EL-ENG-319 | `/portal/support` | en | link | My Documents میری دستاویزات | /portal/documents | 4 | 238x54 | PASS | target answered 200 |
| EL-ENG-320 | `/portal/support` | en | link | My Membership میری رکنیت | /portal/membership | 4 | 238x54 | PASS | target answered 200 |
| EL-ENG-321 | `/portal/support` | en | link | Payments ادائیگیاں | /portal/payments | 4 | 238x54 | PASS | target answered 200 |
| EL-ENG-322 | `/portal/support` | en | link | Request a Service خدمت کی درخواست | /portal/apply | 4 | 238x54 | PASS | target answered 200 |
| EL-ENG-323 | `/portal/support` | en | link | Skip to content | #main | 4 | 144x47 | PASS | in-page anchor |
| EL-ENG-324 | `/portal/support` | en | link | Visit the Chamber چیمبر تشریف لائیں Address & hours | help.visit | 4 | 365x199 | PARTIAL | external / file link (not requested) |
| EL-ENG-325 | `/portal/support` | ur | button | اے آئی سے پوچھیں اے آئی سے پوچھیں اگلی ریلیز میں | ai.open | 1 | 365x211 | PARTIAL | disabled: اگلی ریلیز میں |
| EL-ENG-326 | `/portal/support` | ur | button | ٹکٹ کھولیں ٹکٹ کھولیں 24 گھنٹے میں جواب | ticket.new | 1 | 365x211 | PASS | exercised by a functional spec |
| EL-ENG-327 | `/portal/support` | ur | button | رکنیت کب ختم ہوتی ہے؟ | faq.toggle | 1 | 561x57 | PASS | exercised by a functional spec |
| EL-ENG-328 | `/portal/support` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-ENG-329 | `/portal/support` | ur | button | زبان انگریزی میں بدلیں | lang.toggle | 1 | 78x44 | PASS | exercised by a functional spec |
| EL-ENG-330 | `/portal/support` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-ENG-331 | `/portal/support` | ur | button | فیس کتنی ہے؟ | faq.toggle | 1 | 561x57 | PASS | exercised by a functional spec |
| EL-ENG-332 | `/portal/support` | ur | button | کون سی دستاویزات چاہئیں؟ | faq.toggle | 1 | 561x57 | PASS | exercised by a functional spec |
| EL-ENG-333 | `/portal/support` | ur | button | میری رکنیت کب شروع ہوتی ہے؟ | faq.toggle | 1 | 561x57 | PASS | exercised by a functional spec |
| EL-ENG-334 | `/portal/support` | ur | button | میں کسی تجویز کنندہ کو نہیں جانتا | faq.toggle | 1 | 561x57 | PASS | exercised by a functional spec |
| EL-ENG-335 | `/portal/support` | ur | link | ادائیگیاں Payments | /ur/portal/payments | 1 | 238x52 | PASS | target answered 200 |
| EL-ENG-336 | `/portal/support` | ur | link | ای میل کریں ای میل کریں info@mcci.org.pk | help.email | 1 | 365x211 | PARTIAL | external / file link (not requested) |
| EL-ENG-337 | `/portal/support` | ur | link | ایم سی سی آئی ممبر ڈیجیٹل چیمبر پورٹل | /ur/portal | 1 | 238x99 | PASS | target answered 200 |
| EL-ENG-338 | `/portal/support` | ur | link | اے آئی Ask AI | /ur/portal/assistant | 1 | 132x50 | PASS | target answered 200 |
| EL-ENG-339 | `/portal/support` | ur | link | پیغامات Messages | /ur/portal/notifications | 1 | 149x50 | PASS | target answered 200 |
| EL-ENG-340 | `/portal/support` | ur | link | تائید کی درخواستیں Endorsement Requests | /ur/portal/endorse | 1 | 238x52 | PASS | target answered 200 |
| EL-ENG-341 | `/portal/support` | ur | link | تقریبات Events & Trade | /ur/portal/events | 1 | 238x52 | PASS | target answered 200 |
| EL-ENG-342 | `/portal/support` | ur | link | چیمبر تشریف لائیں چیمبر تشریف لائیں پتہ اور اوقات | help.visit | 1 | 365x211 | PARTIAL | external / file link (not requested) |
| EL-ENG-343 | `/portal/support` | ur | link | خدمت کی درخواست Request a Service | /ur/portal/apply | 1 | 238x52 | PASS | target answered 200 |
| EL-ENG-344 | `/portal/support` | ur | link | رہنمائی رہنمائی فارم اور چیک لسٹیں | nav | 1 | 365x211 | PASS | target answered 200 |
| EL-ENG-345 | `/portal/support` | ur | link | کال کریں کال کریں 92-61-4543530 | help.call | 1 | 365x211 | PARTIAL | external / file link (not requested) |
| EL-ENG-346 | `/portal/support` | ur | link | کمپنی پروفائل Company Profile | /ur/portal/profile | 1 | 238x52 | PASS | target answered 200 |
| EL-ENG-347 | `/portal/support` | ur | link | مدد اور رابطہ Help & Support | /ur/portal/support | 1 | 238x52 | PASS | target answered 200 |
| EL-ENG-348 | `/portal/support` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-ENG-349 | `/portal/support` | ur | link | میری دستاویزات My Documents | /ur/portal/documents | 1 | 238x52 | PASS | target answered 200 |
| EL-ENG-350 | `/portal/support` | ur | link | میری رکنیت My Membership | /ur/portal/membership | 1 | 238x52 | PASS | target answered 200 |
| EL-PORTAL-001 | `/portal` | en | button | Change language to Urdu | lang.toggle | 4 | 44x44 | PASS | exercised by a functional spec |
| EL-PORTAL-002 | `/portal` | en | button | Light or dark theme | theme.toggle | 4 | 44x44 | PASS | exercised by a functional spec |
| EL-PORTAL-003 | `/portal` | en | button | Sign out | logout | 4 | 116x44 | PASS | exercised by a functional spec |
| EL-PORTAL-004 | `/portal` | en | link | Call helpdesk ہیلپ ڈیسک کو کال کریں | help.call | 4 | 156x61 | PARTIAL | external / file link (not requested) |
| EL-PORTAL-005 | `/portal` | en | link | Company Profile کمپنی پروفائل | /portal/profile | 4 | 238x54 | PASS | target answered 200 |
| EL-PORTAL-006 | `/portal` | en | link | Endorsement Requests تائید کی درخواستیں | /portal/endorse | 4 | 238x54 | PASS | target answered 200 |
| EL-PORTAL-007 | `/portal` | en | link | Events & Trade تقریبات | /portal/events | 4 | 238x54 | PASS | target answered 200 |
| EL-PORTAL-008 | `/portal` | en | link | Events تقریبات Trade events & meetings | nav | 4 | 365x199 | PASS | target answered 200 |
| EL-PORTAL-009 | `/portal` | en | link | Help & Support مدد اور رابطہ | /portal/support | 4 | 238x54 | PASS | target answered 200 |
| EL-PORTAL-010 | `/portal` | en | link | Help مدد Call · Email · Ask AI | nav | 4 | 365x199 | PASS | target answered 200 |
| EL-PORTAL-011 | `/portal` | en | link | MCCI Member Digital Chamber Portal | /portal | 4 | 238x82 | PASS | target answered 200 |
| EL-PORTAL-012 | `/portal` | en | link | My Documents میری دستاویزات | /portal/documents | 4 | 238x54 | PASS | target answered 200 |
| EL-PORTAL-013 | `/portal` | en | link | My Documents میری دستاویزات Certificates & letters | nav | 4 | 365x199 | PASS | target answered 200 |
| EL-PORTAL-014 | `/portal` | en | link | My Membership میری رکنیت | /portal/membership | 4 | 238x54 | PASS | target answered 200 |
| EL-PORTAL-015 | `/portal` | en | link | My Membership میری رکنیت New applicant | nav | 4 | 365x199 | PASS | target answered 200 |
| EL-PORTAL-016 | `/portal` | en | link | Pay Fees فیس ادا کریں Nothing due | nav | 4 | 365x199 | PASS | target answered 200 |
| EL-PORTAL-017 | `/portal` | en | link | Payments ادائیگیاں | /portal/payments | 4 | 238x54 | PASS | target answered 200 |
| EL-PORTAL-018 | `/portal` | en | link | Request a Service خدمت کی درخواست | /portal/apply | 4 | 238x54 | PASS | target answered 200 |
| EL-PORTAL-019 | `/portal` | en | link | Request a Service خدمت کی درخواست 7 services · 24-hour reply | nav | 4 | 365x199 | PASS | target answered 200 |
| EL-PORTAL-020 | `/portal` | en | link | Skip to content | #main | 4 | 144x47 | PASS | in-page anchor |
| EL-PORTAL-021 | `/portal` | en | link | View all | nav | 4 | 49x20 | PASS | target answered 200 |
| EL-PORTAL-022 | `/portal` | en | link | View all | nav | 4 | 49x20 | PASS | target answered 200 |
| EL-PORTAL-023 | `/portal` | en | submit | Start my application درخواست شروع کریں | register.start | 1 | 224x70 | PASS | exercised by a functional spec |
| EL-PORTAL-024 | `/portal` | ur | button | روشن یا تاریک انداز | theme.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-PORTAL-025 | `/portal` | ur | button | زبان انگریزی میں بدلیں | lang.toggle | 1 | 78x44 | PASS | exercised by a functional spec |
| EL-PORTAL-026 | `/portal` | ur | button | سائن آؤٹ | logout | 1 | 100x49 | PASS | exercised by a functional spec |
| EL-PORTAL-027 | `/portal` | ur | link | Call helpdesk ہیلپ ڈیسک کو کال کریں | help.call | 1 | 156x73 | PARTIAL | external / file link (not requested) |
| EL-PORTAL-028 | `/portal` | ur | link | Events تقریبات تجارتی تقریبات و اجلاس | nav | 1 | 365x211 | PASS | target answered 200 |
| EL-PORTAL-029 | `/portal` | ur | link | Help مدد کال · ای میل · اے آئی سے پوچھیں | nav | 1 | 365x211 | PASS | target answered 200 |
| EL-PORTAL-030 | `/portal` | ur | link | My Documents میری دستاویزات سرٹیفکیٹ اور خطوط | nav | 1 | 365x211 | PASS | target answered 200 |
| EL-PORTAL-031 | `/portal` | ur | link | My membership میری رکنیت | nav | 1 | 191x80 | PASS | target answered 200 |
| EL-PORTAL-032 | `/portal` | ur | link | Pay Fees فیس ادا کریں کچھ واجب الادا نہیں | nav | 1 | 365x211 | PASS | target answered 200 |
| EL-PORTAL-033 | `/portal` | ur | link | Request a service خدمت کی درخواست | nav | 1 | 202x80 | PASS | target answered 200 |
| EL-PORTAL-034 | `/portal` | ur | link | ادائیگیاں Payments | /ur/portal/payments | 1 | 238x52 | PASS | target answered 200 |
| EL-PORTAL-035 | `/portal` | ur | link | ایم سی سی آئی ممبر ڈیجیٹل چیمبر پورٹل | /ur/portal | 1 | 238x99 | PASS | target answered 200 |
| EL-PORTAL-036 | `/portal` | ur | link | تائید کی درخواستیں Endorsement Requests | /ur/portal/endorse | 1 | 238x52 | PASS | target answered 200 |
| EL-PORTAL-037 | `/portal` | ur | link | تقریبات Events & Trade | /ur/portal/events | 1 | 238x52 | PASS | target answered 200 |
| EL-PORTAL-038 | `/portal` | ur | link | خدمت کی درخواست Request a Service | /ur/portal/apply | 1 | 238x52 | PASS | target answered 200 |
| EL-PORTAL-039 | `/portal` | ur | link | سب دیکھیں | nav | 1 | 40x25 | PASS | target answered 200 |
| EL-PORTAL-040 | `/portal` | ur | link | سب دیکھیں | nav | 1 | 40x25 | PASS | target answered 200 |
| EL-PORTAL-041 | `/portal` | ur | link | کمپنی پروفائل Company Profile | /ur/portal/profile | 1 | 238x52 | PASS | target answered 200 |
| EL-PORTAL-042 | `/portal` | ur | link | مدد اور رابطہ Help & Support | /ur/portal/support | 1 | 238x52 | PASS | target answered 200 |
| EL-PORTAL-043 | `/portal` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-PORTAL-044 | `/portal` | ur | link | میری دستاویزات My Documents | /ur/portal/documents | 1 | 238x52 | PASS | target answered 200 |
| EL-PORTAL-045 | `/portal` | ur | link | میری رکنیت My Membership | /ur/portal/membership | 1 | 238x52 | PASS | target answered 200 |
| EL-AUTH-050 | `/register/pending` | en | button | Change language to Urdu | lang.toggle | 2 | 102x44 | PASS | exercised by a functional spec |
| EL-AUTH-051 | `/register/pending` | en | link | Back to website | nav | 2 | 135x24 | PASS | target answered 200 |
| EL-AUTH-052 | `/register/pending` | en | link | Skip to content | #main | 2 | 144x47 | PASS | in-page anchor |
| EL-AUTH-053 | `/register/pending` | ur | button | زبان انگریزی میں بدلیں | lang.toggle | 1 | 102x47 | PASS | exercised by a functional spec |
| EL-AUTH-054 | `/register/pending` | ur | link | مواد پر جائیں | #main | 1 | 88x57 | PASS | in-page anchor |
| EL-AUTH-055 | `/register/pending` | ur | link | ویب سائٹ پر واپس | nav | 1 | 113x33 | PASS | target answered 200 |
| EL-AUTH-056 | `/register` | en | button | Change language to Urdu | lang.toggle | 1 | 102x44 | PASS | exercised by a functional spec |
| EL-AUTH-057 | `/register` | en | button | Sign in | tab | 1 | 48x20 | PASS | exercised by a functional spec |
| EL-AUTH-058 | `/register` | en | input:checkbox | I confirm the details I have given are correct. |  | 1 | 13x13 | PASS | exercised by a functional spec |
| EL-AUTH-059 | `/register` | en | input:email | Email address |  | 1 | 460x58 | PASS | exercised by a functional spec |
| EL-AUTH-060 | `/register` | en | input:tel | Mobile number |  | 1 | 460x58 | PASS | exercised by a functional spec |
| EL-AUTH-061 | `/register` | en | link | Back to website | nav | 1 | 135x24 | PASS | target answered 200 |
| EL-AUTH-062 | `/register` | en | link | Skip to content | #main | 1 | 144x47 | PASS | in-page anchor |
| EL-AUTH-063 | `/register` | en | submit | Send code | register.start | 1 | 460x54 | PASS | exercised by a functional spec |
| EL-AUTH-064 | `/register` | en | tab | Sign In | tab | 1 | 224x38 | PASS | exercised by a functional spec |
| EL-AUTH-065 | `/register` | en | tab | Sign Up | tab | 1 | 224x38 | PASS | exercised by a functional spec |
| EL-AUTH-066 | `/register` | ur | button | زبان انگریزی میں بدلیں | lang.toggle | 1 | 102x47 | PASS | exercised by a functional spec |
| EL-AUTH-067 | `/register` | ur | button | سائن اِن کریں | tab | 1 | 64x29 | PASS | exercised by a functional spec |
| EL-AUTH-068 | `/register` | ur | input:checkbox | میں تصدیق کرتا/کرتی ہوں کہ دی گئی معلومات درست ہیں۔ |  | 1 | 13x13 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-AUTH-069 | `/register` | ur | input:email | ای میل ایڈریس |  | 1 | 460x58 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-AUTH-070 | `/register` | ur | input:tel | موبائل نمبر |  | 1 | 460x58 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-AUTH-071 | `/register` | ur | link | مواد پر جائیں | #main | 1 | 88x57 | PASS | in-page anchor |
| EL-AUTH-072 | `/register` | ur | link | ویب سائٹ پر واپس | nav | 1 | 113x33 | PASS | target answered 200 |
| EL-AUTH-073 | `/register` | ur | submit | کوڈ بھیجیں | register.start | 1 | 460x60 | PASS | exercised by a functional spec |
| EL-AUTH-074 | `/register` | ur | tab | سائن اَپ | tab | 1 | 224x48 | PASS | exercised by a functional spec |
| EL-AUTH-075 | `/register` | ur | tab | سائن اِن | tab | 1 | 224x48 | PASS | exercised by a functional spec |
| EL-SITE-456 | `/resources/form` | en | button | Change language to Urdu | lang.toggle | 2 | 82x44 | PASS | exercised by a functional spec |
| EL-SITE-457 | `/resources/form` | en | button | Pause the news ticker | ticker.pause | 2 | 44x37 | PASS | exercised by a functional spec |
| EL-SITE-458 | `/resources/form` | en | button | Print / save as PDF | doc.print | 2 | 186x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-459 | `/resources/form` | en | link | About | /about | 2 | 68x38 | PASS | target answered 200 |
| EL-SITE-460 | `/resources/form` | en | link | All news and notifications | ticker.all | 2 | 95x37 | PASS | target answered 200 |
| EL-SITE-461 | `/resources/form` | en | link | Certificate of Origin | /service?s=co | 2 | 245x31 | PASS | target answered 200 |
| EL-SITE-462 | `/resources/form` | en | link | Contact | /contact | 2 | 82x38 | PASS | target answered 200 |
| EL-SITE-463 | `/resources/form` | en | link | Directory | /directory | 2 | 90x38 | PASS | target answered 200 |
| EL-SITE-464 | `/resources/form` | en | link | E-BIL | /service?s=ebil | 2 | 245x31 | PASS | target answered 200 |
| EL-SITE-465 | `/resources/form` | en | link | MCCI Digital Chamber ایوانِ تجارت و صنعت ملتان | / | 2 | 157x59 | PASS | target answered 200 |
| EL-SITE-466 | `/resources/form` | en | link | Member Login | /login | 2 | 160x44 | PASS | target answered 200 |
| EL-SITE-467 | `/resources/form` | en | link | Membership | /membership | 2 | 112x38 | PASS | target answered 200 |
| EL-SITE-468 | `/resources/form` | en | link | News | /news | 2 | 63x38 | PASS | target answered 200 |
| EL-SITE-469 | `/resources/form` | en | link | NEWS Chamber news c36f7d | ticker.post | 2 | 194x38 | PASS | target answered 200 |
| EL-SITE-470 | `/resources/form` | en | link | NEWS Chamber news d098e0 | ticker.post | 2 | 201x38 | PASS | target answered 200 |
| EL-SITE-471 | `/resources/form` | en | link | Resources | /resources | 2 | 98x38 | PASS | target answered 200 |
| EL-SITE-472 | `/resources/form` | en | link | Services | /services | 2 | 84x38 | PASS | target answered 200 |
| EL-SITE-473 | `/resources/form` | en | link | Skip to content | #main | 2 | 144x47 | PASS | in-page anchor |
| EL-SITE-474 | `/resources/form` | en | link | Track | /track | 2 | 61x38 | PASS | target answered 200 |
| EL-SITE-475 | `/resources/form` | en | link | Verify | /verify | 2 | 65x38 | PASS | target answered 200 |
| EL-SITE-476 | `/resources/form` | en | link | Visa letters | /service?s=visa | 2 | 245x31 | PASS | target answered 200 |
| EL-SITE-477 | `/resources/form` | ur | button | پرنٹ / PDF محفوظ کریں | doc.print | 1 | 164x47 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-478 | `/resources/form` | ur | button | خبروں کی پٹی روکیں | ticker.pause | 1 | 44x37 | PASS | exercised by a functional spec |
| EL-SITE-479 | `/resources/form` | ur | button | زبان انگریزی میں بدلیں | lang.toggle | 1 | 82x44 | PASS | exercised by a functional spec |
| EL-SITE-480 | `/resources/form` | ur | link | ای-بِل | /ur/service?s=ebil | 1 | 245x37 | PASS | target answered 200 |
| EL-SITE-481 | `/resources/form` | ur | link | ایم سی سی آئی ڈیجیٹل چیمبر ایوانِ تجارت و صنعت ملتان | /ur | 1 | 157x79 | PASS | target answered 200 |
| EL-SITE-482 | `/resources/form` | ur | link | تصدیق | /ur/verify | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-483 | `/resources/form` | ur | link | تعارف | /ur/about | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-484 | `/resources/form` | ur | link | تمام خبریں اور اعلانات | ticker.all | 1 | 89x37 | PASS | target answered 200 |
| EL-SITE-485 | `/resources/form` | ur | link | ٹریک | /ur/track | 1 | 45x38 | PASS | target answered 200 |
| EL-SITE-486 | `/resources/form` | ur | link | خبر Chamber news c36f7d | ticker.post | 1 | 169x38 | PASS | target answered 200 |
| EL-SITE-487 | `/resources/form` | ur | link | خبر Chamber news d098e0 | ticker.post | 1 | 174x38 | PASS | target answered 200 |
| EL-SITE-488 | `/resources/form` | ur | link | خبریں | /ur/news | 1 | 45x38 | PASS | target answered 200 |
| EL-SITE-489 | `/resources/form` | ur | link | خدمات | /ur/services | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-490 | `/resources/form` | ur | link | ڈائریکٹری | /ur/directory | 1 | 59x38 | PASS | target answered 200 |
| EL-SITE-491 | `/resources/form` | ur | link | رابطہ | /ur/contact | 1 | 41x38 | PASS | target answered 200 |
| EL-SITE-492 | `/resources/form` | ur | link | رکنیت | /ur/membership | 1 | 46x38 | PASS | target answered 200 |
| EL-SITE-493 | `/resources/form` | ur | link | سرٹیفکیٹ آف اوریجن | /ur/service?s=co | 1 | 245x37 | PASS | target answered 200 |
| EL-SITE-494 | `/resources/form` | ur | link | ممبر لاگ اِن | /ur/login | 1 | 106x44 | PASS | target answered 200 |
| EL-SITE-495 | `/resources/form` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-SITE-496 | `/resources/form` | ur | link | وسائل | /ur/resources | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-497 | `/resources/form` | ur | link | ویزا لیٹر | /ur/service?s=visa | 1 | 245x37 | PASS | target answered 200 |
| EL-SITE-498 | `/resources` | en | button | Change language to Urdu | lang.toggle | 2 | 82x44 | PASS | exercised by a functional spec |
| EL-SITE-499 | `/resources` | en | button | Pause the news ticker | ticker.pause | 2 | 44x37 | PASS | exercised by a functional spec |
| EL-SITE-500 | `/resources` | en | link | About | /about | 2 | 68x38 | PASS | target answered 200 |
| EL-SITE-501 | `/resources` | en | link | All news and notifications | ticker.all | 2 | 95x37 | PASS | target answered 200 |
| EL-SITE-502 | `/resources` | en | link | Certificate of Origin | /service?s=co | 2 | 245x31 | PASS | target answered 200 |
| EL-SITE-503 | `/resources` | en | link | Contact | /contact | 2 | 82x38 | PASS | target answered 200 |
| EL-SITE-504 | `/resources` | en | link | Directory | /directory | 2 | 90x38 | PASS | target answered 200 |
| EL-SITE-505 | `/resources` | en | link | Download | res.download | 2 | 91x44 | PASS | target answered 200 |
| EL-SITE-506 | `/resources` | en | link | E-BIL | /service?s=ebil | 2 | 245x31 | PASS | target answered 200 |
| EL-SITE-507 | `/resources` | en | link | Home | nav | 2 | 44x44 | PASS | target answered 200 |
| EL-SITE-508 | `/resources` | en | link | MCCI Digital Chamber ایوانِ تجارت و صنعت ملتان | / | 2 | 157x59 | PASS | target answered 200 |
| EL-SITE-509 | `/resources` | en | link | Member Login | /login | 2 | 160x44 | PASS | target answered 200 |
| EL-SITE-510 | `/resources` | en | link | Membership | /membership | 2 | 112x38 | PASS | target answered 200 |
| EL-SITE-511 | `/resources` | en | link | News | /news | 2 | 63x38 | PASS | target answered 200 |
| EL-SITE-512 | `/resources` | en | link | NEWS Chamber news c36f7d | ticker.post | 2 | 194x38 | PASS | target answered 200 |
| EL-SITE-513 | `/resources` | en | link | NEWS Chamber news d098e0 | ticker.post | 2 | 201x38 | PASS | target answered 200 |
| EL-SITE-514 | `/resources` | en | link | Open | nav | 2 | 62x44 | PASS | target answered 200 |
| EL-SITE-515 | `/resources` | en | link | Open | nav | 2 | 62x44 | PASS | target answered 200 |
| EL-SITE-516 | `/resources` | en | link | Open | nav | 2 | 62x44 | PASS | target answered 200 |
| EL-SITE-517 | `/resources` | en | link | Resources | /resources | 2 | 98x38 | PASS | target answered 200 |
| EL-SITE-518 | `/resources` | en | link | Services | /services | 2 | 84x38 | PASS | target answered 200 |
| EL-SITE-519 | `/resources` | en | link | Skip to content | #main | 2 | 144x47 | PASS | in-page anchor |
| EL-SITE-520 | `/resources` | en | link | Track | /track | 2 | 61x38 | PASS | target answered 200 |
| EL-SITE-521 | `/resources` | en | link | Verify | /verify | 2 | 65x38 | PASS | target answered 200 |
| EL-SITE-522 | `/resources` | en | link | Visa letters | /service?s=visa | 2 | 245x31 | PASS | target answered 200 |
| EL-SITE-523 | `/resources` | ur | button | خبروں کی پٹی روکیں | ticker.pause | 1 | 44x37 | PASS | exercised by a functional spec |
| EL-SITE-524 | `/resources` | ur | button | زبان انگریزی میں بدلیں | lang.toggle | 1 | 82x44 | PASS | exercised by a functional spec |
| EL-SITE-525 | `/resources` | ur | link | ای-بِل | /ur/service?s=ebil | 1 | 245x37 | PASS | target answered 200 |
| EL-SITE-526 | `/resources` | ur | link | ایم سی سی آئی ڈیجیٹل چیمبر ایوانِ تجارت و صنعت ملتان | /ur | 1 | 157x79 | PASS | target answered 200 |
| EL-SITE-527 | `/resources` | ur | link | تصدیق | /ur/verify | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-528 | `/resources` | ur | link | تعارف | /ur/about | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-529 | `/resources` | ur | link | تمام خبریں اور اعلانات | ticker.all | 1 | 89x37 | PASS | target answered 200 |
| EL-SITE-530 | `/resources` | ur | link | ٹریک | /ur/track | 1 | 45x38 | PASS | target answered 200 |
| EL-SITE-531 | `/resources` | ur | link | خبر Chamber news c36f7d | ticker.post | 1 | 169x38 | PASS | target answered 200 |
| EL-SITE-532 | `/resources` | ur | link | خبر Chamber news d098e0 | ticker.post | 1 | 174x38 | PASS | target answered 200 |
| EL-SITE-533 | `/resources` | ur | link | خبریں | /ur/news | 1 | 45x38 | PASS | target answered 200 |
| EL-SITE-534 | `/resources` | ur | link | خدمات | /ur/services | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-535 | `/resources` | ur | link | ڈاؤن لوڈ | res.download | 1 | 55x44 | PASS | target answered 200 |
| EL-SITE-536 | `/resources` | ur | link | ڈائریکٹری | /ur/directory | 1 | 59x38 | PASS | target answered 200 |
| EL-SITE-537 | `/resources` | ur | link | رابطہ | /ur/contact | 1 | 41x38 | PASS | target answered 200 |
| EL-SITE-538 | `/resources` | ur | link | رکنیت | /ur/membership | 1 | 46x38 | PASS | target answered 200 |
| EL-SITE-539 | `/resources` | ur | link | سرٹیفکیٹ آف اوریجن | /ur/service?s=co | 1 | 245x37 | PASS | target answered 200 |
| EL-SITE-540 | `/resources` | ur | link | کھولیں | nav | 1 | 47x44 | PASS | target answered 200 |
| EL-SITE-541 | `/resources` | ur | link | کھولیں | nav | 1 | 47x44 | PASS | target answered 200 |
| EL-SITE-542 | `/resources` | ur | link | کھولیں | nav | 1 | 47x44 | PASS | target answered 200 |
| EL-SITE-543 | `/resources` | ur | link | ممبر لاگ اِن | /ur/login | 1 | 106x44 | PASS | target answered 200 |
| EL-SITE-544 | `/resources` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-SITE-545 | `/resources` | ur | link | ہوم | nav | 1 | 44x44 | PASS | target answered 200 |
| EL-SITE-546 | `/resources` | ur | link | وسائل | /ur/resources | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-547 | `/resources` | ur | link | ویزا لیٹر | /ur/service?s=visa | 1 | 245x37 | PASS | target answered 200 |
| EL-SITE-548 | `/service` | en | button | Change language to Urdu | lang.toggle | 2 | 82x44 | PASS | exercised by a functional spec |
| EL-SITE-549 | `/service` | en | button | Pause the news ticker | ticker.pause | 2 | 44x37 | PASS | exercised by a functional spec |
| EL-SITE-550 | `/service` | en | link | About | /about | 2 | 68x38 | PASS | target answered 200 |
| EL-SITE-551 | `/service` | en | link | All news and notifications | ticker.all | 2 | 95x37 | PASS | target answered 200 |
| EL-SITE-552 | `/service` | en | link | Apply now | svc.new | 2 | 108x44 | PASS | target answered 200 |
| EL-SITE-553 | `/service` | en | link | Certificate of Origin | /service?s=co | 2 | 245x31 | PASS | target answered 200 |
| EL-SITE-554 | `/service` | en | link | Contact | /contact | 2 | 82x38 | PASS | target answered 200 |
| EL-SITE-555 | `/service` | en | link | Directory | /directory | 2 | 90x38 | PASS | target answered 200 |
| EL-SITE-556 | `/service` | en | link | E-BIL | /service?s=ebil | 2 | 245x31 | PASS | target answered 200 |
| EL-SITE-557 | `/service` | en | link | Home | nav | 2 | 44x44 | PASS | target answered 200 |
| EL-SITE-558 | `/service` | en | link | MCCI Digital Chamber ایوانِ تجارت و صنعت ملتان | / | 2 | 157x59 | PASS | target answered 200 |
| EL-SITE-559 | `/service` | en | link | Member Login | /login | 2 | 160x44 | PASS | target answered 200 |
| EL-SITE-560 | `/service` | en | link | Membership | /membership | 2 | 112x38 | PASS | target answered 200 |
| EL-SITE-561 | `/service` | en | link | News | /news | 2 | 63x38 | PASS | target answered 200 |
| EL-SITE-562 | `/service` | en | link | NEWS Chamber news c36f7d | ticker.post | 2 | 194x38 | PASS | target answered 200 |
| EL-SITE-563 | `/service` | en | link | NEWS Chamber news d098e0 | ticker.post | 2 | 201x38 | PASS | target answered 200 |
| EL-SITE-564 | `/service` | en | link | Resources | /resources | 2 | 98x38 | PASS | target answered 200 |
| EL-SITE-565 | `/service` | en | link | Services | /services | 2 | 84x38 | PASS | target answered 200 |
| EL-SITE-566 | `/service` | en | link | Skip to content | #main | 2 | 144x47 | PASS | in-page anchor |
| EL-SITE-567 | `/service` | en | link | Track | /track | 2 | 61x38 | PASS | target answered 200 |
| EL-SITE-568 | `/service` | en | link | Track a token | nav | 2 | 128x44 | PASS | target answered 200 |
| EL-SITE-569 | `/service` | en | link | Verify | /verify | 2 | 65x38 | PASS | target answered 200 |
| EL-SITE-570 | `/service` | en | link | Visa letters | /service?s=visa | 2 | 245x31 | PASS | target answered 200 |
| EL-SITE-571 | `/services` | en | button | Change language to Urdu | lang.toggle | 2 | 82x44 | PASS | exercised by a functional spec |
| EL-SITE-572 | `/services` | en | button | Pause the news ticker | ticker.pause | 2 | 44x37 | PASS | exercised by a functional spec |
| EL-SITE-573 | `/services` | en | link | About | /about | 2 | 68x38 | PASS | target answered 200 |
| EL-SITE-574 | `/services` | en | link | All news and notifications | ticker.all | 2 | 95x37 | PASS | target answered 200 |
| EL-SITE-575 | `/services` | en | link | Certificate of Origin | /service?s=co | 2 | 245x31 | PASS | target answered 200 |
| EL-SITE-576 | `/services` | en | link | Certificate of Origin Attestation of Certificate of Origin (C.O.) View service → | nav | 2 | 273x237 | PASS | target answered 200 |
| EL-SITE-577 | `/services` | en | link | Contact | /contact | 2 | 82x38 | PASS | target answered 200 |
| EL-SITE-578 | `/services` | en | link | Directory | /directory | 2 | 90x38 | PASS | target answered 200 |
| EL-SITE-579 | `/services` | en | link | Document Attestation certificate, financial report, authority letter, MoU View service → | nav | 2 | 273x237 | PASS | target answered 200 |
| EL-SITE-580 | `/services` | en | link | E-BIL | /service?s=ebil | 2 | 245x31 | PASS | target answered 200 |
| EL-SITE-581 | `/services` | en | link | E-BIL Electronic Business Invitation Letter View service → | nav | 2 | 273x237 | PASS | target answered 200 |
| EL-SITE-582 | `/services` | en | link | Free Samples Letter carry free commercial samples abroad View service → | nav | 2 | 273x237 | PASS | target answered 200 |
| EL-SITE-583 | `/services` | en | link | Home | nav | 2 | 44x44 | PASS | target answered 200 |
| EL-SITE-584 | `/services` | en | link | MCCI Digital Chamber ایوانِ تجارت و صنعت ملتان | / | 2 | 157x59 | PASS | target answered 200 |
| EL-SITE-585 | `/services` | en | link | Member Login | /login | 2 | 160x44 | PASS | target answered 200 |
| EL-SITE-586 | `/services` | en | link | Membership | /membership | 2 | 112x38 | PASS | target answered 200 |
| EL-SITE-587 | `/services` | en | link | News | /news | 2 | 63x38 | PASS | target answered 200 |
| EL-SITE-588 | `/services` | en | link | NEWS Chamber news c36f7d | ticker.post | 2 | 194x38 | PASS | target answered 200 |
| EL-SITE-589 | `/services` | en | link | NEWS Chamber news d098e0 | ticker.post | 2 | 201x38 | PASS | target answered 200 |
| EL-SITE-590 | `/services` | en | link | Recommendatory Letter membership / company profile etc. View service → | nav | 2 | 273x237 | PASS | target answered 200 |
| EL-SITE-591 | `/services` | en | link | Resources | /resources | 2 | 98x38 | PASS | target answered 200 |
| EL-SITE-592 | `/services` | en | link | Services | /services | 2 | 84x38 | PASS | target answered 200 |
| EL-SITE-593 | `/services` | en | link | Skip to content | #main | 2 | 144x47 | PASS | in-page anchor |
| EL-SITE-594 | `/services` | en | link | Track | /track | 2 | 61x38 | PASS | target answered 200 |
| EL-SITE-595 | `/services` | en | link | Verify | /verify | 2 | 65x38 | PASS | target answered 200 |
| EL-SITE-596 | `/services` | en | link | Visa Guarantee (China) for obtaining Chinese visa View service → | nav | 2 | 273x237 | PASS | target answered 200 |
| EL-SITE-597 | `/services` | en | link | Visa letters | /service?s=visa | 2 | 245x31 | PASS | target answered 200 |
| EL-SITE-598 | `/services` | en | link | Visa Recommendation Visa Recommendation Letter View service → | nav | 2 | 273x237 | PASS | target answered 200 |
| EL-SITE-599 | `/services` | ur | button | خبروں کی پٹی روکیں | ticker.pause | 1 | 44x37 | PASS | exercised by a functional spec |
| EL-SITE-600 | `/services` | ur | button | زبان انگریزی میں بدلیں | lang.toggle | 1 | 82x44 | PASS | exercised by a functional spec |
| EL-SITE-601 | `/services` | ur | link | ای-بِل | /ur/service?s=ebil | 1 | 245x37 | PASS | target answered 200 |
| EL-SITE-602 | `/services` | ur | link | ای-بل دعوت نامہ الیکٹرانک بزنس دعوت نامہ خدمت دیکھیں → | nav | 1 | 273x233 | PASS | target answered 200 |
| EL-SITE-603 | `/services` | ur | link | ایم سی سی آئی ڈیجیٹل چیمبر ایوانِ تجارت و صنعت ملتان | /ur | 1 | 157x79 | PASS | target answered 200 |
| EL-SITE-604 | `/services` | ur | link | تصدیق | /ur/verify | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-605 | `/services` | ur | link | تعارف | /ur/about | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-606 | `/services` | ur | link | تمام خبریں اور اعلانات | ticker.all | 1 | 89x37 | PASS | target answered 200 |
| EL-SITE-607 | `/services` | ur | link | ٹریک | /ur/track | 1 | 45x38 | PASS | target answered 200 |
| EL-SITE-608 | `/services` | ur | link | چینی ویزا گارنٹی خط چینی ویزا کے حصول کے لیے خدمت دیکھیں → | nav | 1 | 273x233 | PASS | target answered 200 |
| EL-SITE-609 | `/services` | ur | link | خبر Chamber news c36f7d | ticker.post | 1 | 169x38 | PASS | target answered 200 |
| EL-SITE-610 | `/services` | ur | link | خبر Chamber news d098e0 | ticker.post | 1 | 174x38 | PASS | target answered 200 |
| EL-SITE-611 | `/services` | ur | link | خبریں | /ur/news | 1 | 45x38 | PASS | target answered 200 |
| EL-SITE-612 | `/services` | ur | link | خدمات | /ur/services | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-613 | `/services` | ur | link | دستاویزات کی تصدیق سرٹیفکیٹ، مالیاتی رپورٹ، اختیار نامہ، مفاہمتی یادداشت خدمت دیکھیں → | nav | 1 | 273x233 | PASS | target answered 200 |
| EL-SITE-614 | `/services` | ur | link | دیگر سفارشی خطوط رکنیت / کمپنی پروفائل وغیرہ خدمت دیکھیں → | nav | 1 | 273x233 | PASS | target answered 200 |
| EL-SITE-615 | `/services` | ur | link | ڈائریکٹری | /ur/directory | 1 | 59x38 | PASS | target answered 200 |
| EL-SITE-616 | `/services` | ur | link | رابطہ | /ur/contact | 1 | 41x38 | PASS | target answered 200 |
| EL-SITE-617 | `/services` | ur | link | رکنیت | /ur/membership | 1 | 46x38 | PASS | target answered 200 |
| EL-SITE-618 | `/services` | ur | link | سرٹیفکیٹ آف اوریجن | /ur/service?s=co | 1 | 245x37 | PASS | target answered 200 |
| EL-SITE-619 | `/services` | ur | link | سرٹیفکیٹ آف اوریجن سرٹیفکیٹ آف اوریجن کی تصدیق خدمت دیکھیں → | nav | 1 | 273x233 | PASS | target answered 200 |
| EL-SITE-620 | `/services` | ur | link | ممبر لاگ اِن | /ur/login | 1 | 106x44 | PASS | target answered 200 |
| EL-SITE-621 | `/services` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-SITE-622 | `/services` | ur | link | نمونہ جات سفارشی خط مفت تجارتی نمونے بیرونِ ملک لے جانے کے لیے خدمت دیکھیں → | nav | 1 | 273x233 | PASS | target answered 200 |
| EL-SITE-623 | `/services` | ur | link | ہوم | nav | 1 | 44x44 | PASS | target answered 200 |
| EL-SITE-624 | `/services` | ur | link | وسائل | /ur/resources | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-625 | `/services` | ur | link | ویزا سفارشی خط ویزا سفارشی خط خدمت دیکھیں → | nav | 1 | 273x233 | PASS | target answered 200 |
| EL-SITE-626 | `/services` | ur | link | ویزا لیٹر | /ur/service?s=visa | 1 | 245x37 | PASS | target answered 200 |
| EL-SITE-627 | `/service` | ur | button | خبروں کی پٹی روکیں | ticker.pause | 1 | 44x37 | PASS | exercised by a functional spec |
| EL-SITE-628 | `/service` | ur | button | زبان انگریزی میں بدلیں | lang.toggle | 1 | 82x44 | PASS | exercised by a functional spec |
| EL-SITE-629 | `/service` | ur | link | ابھی درخواست دیں | svc.new | 1 | 105x49 | PASS | target answered 200 |
| EL-SITE-630 | `/service` | ur | link | ای-بِل | /ur/service?s=ebil | 1 | 245x37 | PASS | target answered 200 |
| EL-SITE-631 | `/service` | ur | link | ایم سی سی آئی ڈیجیٹل چیمبر ایوانِ تجارت و صنعت ملتان | /ur | 1 | 157x79 | PASS | target answered 200 |
| EL-SITE-632 | `/service` | ur | link | تصدیق | /ur/verify | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-633 | `/service` | ur | link | تعارف | /ur/about | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-634 | `/service` | ur | link | تمام خبریں اور اعلانات | ticker.all | 1 | 89x37 | PASS | target answered 200 |
| EL-SITE-635 | `/service` | ur | link | ٹریک | /ur/track | 1 | 45x38 | PASS | target answered 200 |
| EL-SITE-636 | `/service` | ur | link | ٹوکن ٹریک کریں | nav | 1 | 97x49 | PASS | target answered 200 |
| EL-SITE-637 | `/service` | ur | link | خبر Chamber news c36f7d | ticker.post | 1 | 169x38 | PASS | target answered 200 |
| EL-SITE-638 | `/service` | ur | link | خبر Chamber news d098e0 | ticker.post | 1 | 174x38 | PASS | target answered 200 |
| EL-SITE-639 | `/service` | ur | link | خبریں | /ur/news | 1 | 45x38 | PASS | target answered 200 |
| EL-SITE-640 | `/service` | ur | link | خدمات | /ur/services | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-641 | `/service` | ur | link | ڈائریکٹری | /ur/directory | 1 | 59x38 | PASS | target answered 200 |
| EL-SITE-642 | `/service` | ur | link | رابطہ | /ur/contact | 1 | 41x38 | PASS | target answered 200 |
| EL-SITE-643 | `/service` | ur | link | رکنیت | /ur/membership | 1 | 46x38 | PASS | target answered 200 |
| EL-SITE-644 | `/service` | ur | link | سرٹیفکیٹ آف اوریجن | /ur/service?s=co | 1 | 245x37 | PASS | target answered 200 |
| EL-SITE-645 | `/service` | ur | link | ممبر لاگ اِن | /ur/login | 1 | 106x44 | PASS | target answered 200 |
| EL-SITE-646 | `/service` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-SITE-647 | `/service` | ur | link | ہوم | nav | 1 | 44x44 | PASS | target answered 200 |
| EL-SITE-648 | `/service` | ur | link | وسائل | /ur/resources | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-649 | `/service` | ur | link | ویزا لیٹر | /ur/service?s=visa | 1 | 245x37 | PASS | target answered 200 |
| EL-AUTH-076 | `/staff/login` | en | button | Open admin panel | login.staff | 1 | 178x45 | PASS | exercised by a functional spec |
| EL-AUTH-077 | `/staff/login` | en | button | Show password | password.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-AUTH-078 | `/staff/login` | en | input:email | Staff email |  | 1 | 460x50 | PASS | exercised by a functional spec |
| EL-AUTH-079 | `/staff/login` | en | input:password | Password |  | 1 | 460x50 | PASS | exercised by a functional spec |
| EL-AUTH-080 | `/staff/login` | en | link | Forgot password? | /login/forgot | 1 | 460x44 | PASS | target answered 200 |
| EL-AUTH-081 | `/staff/login` | en | link | Skip to content | #main | 1 | 144x47 | PASS | in-page anchor |
| EL-AUTH-082 | `/staff/login` | ur | button | ایڈمن پینل کھولیں | login.staff | 1 | 134x53 | PASS | exercised by a functional spec |
| EL-AUTH-083 | `/staff/login` | ur | button | پاس ورڈ دکھائیں | password.toggle | 1 | 44x44 | PASS | exercised by a functional spec |
| EL-AUTH-084 | `/staff/login` | ur | input:email | عملے کی ای میل |  | 1 | 460x51 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-AUTH-085 | `/staff/login` | ur | input:password | پاس ورڈ |  | 1 | 460x51 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-AUTH-086 | `/staff/login` | ur | link | پاس ورڈ بھول گئے؟ | /ur/login/forgot | 1 | 460x44 | PASS | target answered 200 |
| EL-AUTH-087 | `/staff/login` | ur | link | مواد پر جائیں | #main | 1 | 88x57 | PASS | in-page anchor |
| EL-SITE-650 | `/track` | en | button | Change language to Urdu | lang.toggle | 2 | 82x44 | PASS | exercised by a functional spec |
| EL-SITE-651 | `/track` | en | button | Pause the news ticker | ticker.pause | 2 | 44x37 | PASS | exercised by a functional spec |
| EL-SITE-652 | `/track` | en | input:text | Token |  | 2 | 753x44 | PASS | exercised by a functional spec |
| EL-SITE-653 | `/track` | en | link | About | /about | 2 | 68x38 | PASS | target answered 200 |
| EL-SITE-654 | `/track` | en | link | All news and notifications | ticker.all | 2 | 95x37 | PASS | target answered 200 |
| EL-SITE-655 | `/track` | en | link | Certificate of Origin | /service?s=co | 2 | 245x31 | PASS | target answered 200 |
| EL-SITE-656 | `/track` | en | link | Contact | /contact | 2 | 82x38 | PASS | target answered 200 |
| EL-SITE-657 | `/track` | en | link | Directory | /directory | 2 | 90x38 | PASS | target answered 200 |
| EL-SITE-658 | `/track` | en | link | E-BIL | /service?s=ebil | 2 | 245x31 | PASS | target answered 200 |
| EL-SITE-659 | `/track` | en | link | Home | nav | 2 | 44x44 | PASS | target answered 200 |
| EL-SITE-660 | `/track` | en | link | MCCI Digital Chamber ایوانِ تجارت و صنعت ملتان | / | 2 | 157x59 | PASS | target answered 200 |
| EL-SITE-661 | `/track` | en | link | Member Login | /login | 2 | 160x44 | PASS | target answered 200 |
| EL-SITE-662 | `/track` | en | link | Membership | /membership | 2 | 112x38 | PASS | target answered 200 |
| EL-SITE-663 | `/track` | en | link | News | /news | 2 | 63x38 | PASS | target answered 200 |
| EL-SITE-664 | `/track` | en | link | NEWS Chamber news c36f7d | ticker.post | 2 | 194x38 | PASS | target answered 200 |
| EL-SITE-665 | `/track` | en | link | NEWS Chamber news d098e0 | ticker.post | 2 | 201x38 | PASS | target answered 200 |
| EL-SITE-666 | `/track` | en | link | Resources | /resources | 2 | 98x38 | PASS | target answered 200 |
| EL-SITE-667 | `/track` | en | link | Services | /services | 2 | 84x38 | PASS | target answered 200 |
| EL-SITE-668 | `/track` | en | link | Skip to content | #main | 2 | 144x47 | PASS | in-page anchor |
| EL-SITE-669 | `/track` | en | link | Track | /track | 2 | 61x38 | PASS | target answered 200 |
| EL-SITE-670 | `/track` | en | link | Verify | /verify | 2 | 65x38 | PASS | target answered 200 |
| EL-SITE-671 | `/track` | en | link | Visa letters | /service?s=visa | 2 | 245x31 | PASS | target answered 200 |
| EL-SITE-672 | `/track` | en | submit | Track | track.go | 2 | 69x44 | PASS | exercised by a functional spec |
| EL-SITE-673 | `/track` | ur | button | خبروں کی پٹی روکیں | ticker.pause | 1 | 44x37 | PASS | exercised by a functional spec |
| EL-SITE-674 | `/track` | ur | button | زبان انگریزی میں بدلیں | lang.toggle | 1 | 82x44 | PASS | exercised by a functional spec |
| EL-SITE-675 | `/track` | ur | input:text | ٹوکن |  | 1 | 748x44 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-676 | `/track` | ur | link | ای-بِل | /ur/service?s=ebil | 1 | 245x37 | PASS | target answered 200 |
| EL-SITE-677 | `/track` | ur | link | ایم سی سی آئی ڈیجیٹل چیمبر ایوانِ تجارت و صنعت ملتان | /ur | 1 | 157x79 | PASS | target answered 200 |
| EL-SITE-678 | `/track` | ur | link | تصدیق | /ur/verify | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-679 | `/track` | ur | link | تعارف | /ur/about | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-680 | `/track` | ur | link | تمام خبریں اور اعلانات | ticker.all | 1 | 89x37 | PASS | target answered 200 |
| EL-SITE-681 | `/track` | ur | link | ٹریک | /ur/track | 1 | 45x38 | PASS | target answered 200 |
| EL-SITE-682 | `/track` | ur | link | خبر Chamber news c36f7d | ticker.post | 1 | 169x38 | PASS | target answered 200 |
| EL-SITE-683 | `/track` | ur | link | خبر Chamber news d098e0 | ticker.post | 1 | 174x38 | PASS | target answered 200 |
| EL-SITE-684 | `/track` | ur | link | خبریں | /ur/news | 1 | 45x38 | PASS | target answered 200 |
| EL-SITE-685 | `/track` | ur | link | خدمات | /ur/services | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-686 | `/track` | ur | link | ڈائریکٹری | /ur/directory | 1 | 59x38 | PASS | target answered 200 |
| EL-SITE-687 | `/track` | ur | link | رابطہ | /ur/contact | 1 | 41x38 | PASS | target answered 200 |
| EL-SITE-688 | `/track` | ur | link | رکنیت | /ur/membership | 1 | 46x38 | PASS | target answered 200 |
| EL-SITE-689 | `/track` | ur | link | سرٹیفکیٹ آف اوریجن | /ur/service?s=co | 1 | 245x37 | PASS | target answered 200 |
| EL-SITE-690 | `/track` | ur | link | ممبر لاگ اِن | /ur/login | 1 | 106x44 | PASS | target answered 200 |
| EL-SITE-691 | `/track` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-SITE-692 | `/track` | ur | link | ہوم | nav | 1 | 44x44 | PASS | target answered 200 |
| EL-SITE-693 | `/track` | ur | link | وسائل | /ur/resources | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-694 | `/track` | ur | link | ویزا لیٹر | /ur/service?s=visa | 1 | 245x37 | PASS | target answered 200 |
| EL-SITE-695 | `/track` | ur | submit | ٹریک کریں | track.go | 1 | 74x47 | PASS | exercised by a functional spec |
| EL-SITE-696 | `/` | ur | button | اگلی تصویر | slider.next | 1 | 46x46 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-697 | `/` | ur | button | پچھلی تصویر | slider.prev | 1 | 46x46 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-698 | `/` | ur | button | خبروں کی پٹی روکیں | ticker.pause | 1 | 44x37 | PASS | exercised by a functional spec |
| EL-SITE-699 | `/` | ur | button | زبان انگریزی میں بدلیں | lang.toggle | 1 | 102x47 | PASS | exercised by a functional spec |
| EL-SITE-700 | `/` | ur | input:radio | تجویز |  | 1 | 13x13 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-701 | `/` | ur | input:radio | شکایت |  | 1 | 13x13 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-702 | `/` | ur | input:text | آپ کا نام |  | 1 | 305x50 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-703 | `/` | ur | input:text | دستاویز کا کوڈ |  | 1 | 541x56 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-704 | `/` | ur | input:text | رکنیت نمبر (اختیاری) |  | 1 | 305x50 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-705 | `/` | ur | input:text | موبائل یا ای میل |  | 1 | 623x50 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-706 | `/` | ur | link | 061-4517087 | tel:+92614517087 | 1 | 96x31 | PARTIAL | external / file link (not requested) |
| EL-SITE-707 | `/` | ur | link | 061-4543530 | tel:+92614543530 | 1 | 96x31 | PARTIAL | external / file link (not requested) |
| EL-SITE-708 | `/` | ur | link | 3 نومبر، 2026 Chamber news c36f7d | post.view | 1 | 337x380 | PASS | target answered 200 |
| EL-SITE-709 | `/` | ur | link | 6 نومبر، 2026 Chamber news d098e0 | post.view | 1 | 539x380 | PASS | target answered 200 |
| EL-SITE-710 | `/` | ur | link | Adera Labs | https://www.aderalabs.com | 1 | 87x23 | PARTIAL | external / file link (not requested) |
| EL-SITE-711 | `/` | ur | link | CN چینی ویزا گارنٹی خط چین کے کاروباری ویزا کے لیے درخواست دیں | /ur/service?s=guar | 1 | 300x242 | PASS | target answered 200 |
| EL-SITE-712 | `/` | ur | link | CO سرٹیفکیٹ آف اوریجن ہر کھیپ کے لیے سرٹیفکیٹ آف اوریجن کی تصدیق درخواست دیں | /ur/service?s=co | 1 | 300x275 | PASS | target answered 200 |
| EL-SITE-713 | `/` | ur | link | DA دستاویزات کی تصدیق سرٹیفکیٹ، مالیاتی رپورٹس، مفاہمتی یادداشتیں درخواست دیں | /ur/service?s=att | 1 | 300x275 | PASS | target answered 200 |
| EL-SITE-714 | `/` | ur | link | EB ای-بل دعوت نامہ الیکٹرانک بزنس انویٹیشن لیٹر درخواست دیں | /ur/service?s=ebil | 1 | 300x242 | PASS | target answered 200 |
| EL-SITE-715 | `/` | ur | link | FS نمونہ جات سفارشی خط تجارتی نمونے بیرونِ ملک لے جانے کے لیے درخواست دیں | /ur/service?s=sample | 1 | 300x242 | PASS | target answered 200 |
| EL-SITE-716 | `/` | ur | link | info@mcci.org.pk | mailto:info@mcci.org.pk | 1 | 133x31 | PARTIAL | external / file link (not requested) |
| EL-SITE-717 | `/` | ur | link | RL دیگر سفارشی خطوط رکنیت اور کمپنی پروفائل کے خطوط درخواست دیں | /ur/service?s=other | 1 | 300x275 | PASS | target answered 200 |
| EL-SITE-718 | `/` | ur | link | VR ویزا سفارشی خط بیرونِ ملک کاروباری سفر کے لیے خطوط درخواست دیں | /ur/service?s=visa | 1 | 300x242 | PASS | target answered 200 |
| EL-SITE-719 | `/` | ur | link | ایگزیکٹو کمیٹی 2026-28 | /ur/about#leadership | 1 | 152x38 | PASS | target answered 200 |
| EL-SITE-720 | `/` | ur | link | ایوانِ تجارت و صنعت ملتان، صفحۂ اوّل | #top | 1 | 176x50 | PASS | in-page anchor |
| EL-SITE-721 | `/` | ur | link | تجارت کا فروغ تجارتی وفود، نمائشیں اور غیر ملکی مشنز کے دورے جو نئی منڈیاں کھولتے ہیں۔ | /ur/news | 1 | 404x303 | PASS | target answered 200 |
| EL-SITE-722 | `/` | ur | link | تعارف | #about | 1 | 66x51 | PASS | in-page anchor |
| EL-SITE-723 | `/` | ur | link | تمام خبریں | nav | 1 | 79x38 | PASS | target answered 200 |
| EL-SITE-724 | `/` | ur | link | تمام خبریں اور اعلانات | ticker.all | 1 | 89x37 | PASS | target answered 200 |
| EL-SITE-725 | `/` | ur | link | ٹوکن ٹریک کریں اپنی درخواست کی صورتِ حال دیکھیں | nav | 1 | 197x166 | PASS | target answered 200 |
| EL-SITE-726 | `/` | ur | link | خبر Chamber news c36f7d | ticker.post | 1 | 169x38 | PASS | target answered 200 |
| EL-SITE-727 | `/` | ur | link | خبر Chamber news d098e0 | ticker.post | 1 | 174x38 | PASS | target answered 200 |
| EL-SITE-728 | `/` | ur | link | خبریں اور اعلامیے | #news | 1 | 97x51 | PASS | in-page anchor |
| EL-SITE-729 | `/` | ur | link | خدمات | #services | 1 | 67x51 | PASS | in-page anchor |
| EL-SITE-730 | `/` | ur | link | خواتین کاروباری رکنیت کی کم فیس، رہنمائی اور فیصلوں میں شمولیت۔ | /ur/membership | 1 | 404x303 | PASS | target answered 200 |
| EL-SITE-731 | `/` | ur | link | دستاویز کی تصدیق | /ur/verify | 1 | 226x38 | PASS | target answered 200 |
| EL-SITE-732 | `/` | ur | link | دستاویز کی تصدیق اسکین کریں یا کوڈ درج کریں | #verify | 1 | 197x166 | PASS | in-page anchor |
| EL-SITE-733 | `/` | ur | link | ڈیجیٹل خدمات سرٹیفکیٹ، خطوط اور تصدیق، آن لائن جاری اور QR سے تصدیق شدہ۔ | /ur/services | 1 | 404x303 | PASS | target answered 200 |
| EL-SITE-734 | `/` | ur | link | رابطہ | #contact | 1 | 56x51 | PASS | in-page anchor |
| EL-SITE-735 | `/` | ur | link | رابطہ | /ur/contact | 1 | 226x38 | PASS | target answered 200 |
| EL-SITE-736 | `/` | ur | link | رکن بنیں چند منٹ میں آن لائن درخواست | register.start | 1 | 197x166 | PASS | target answered 200 |
| EL-SITE-737 | `/` | ur | link | رکن تلاش کریں کاروباری ڈائریکٹری | nav | 1 | 197x166 | PASS | target answered 200 |
| EL-SITE-738 | `/` | ur | link | رکنیت | #join | 1 | 62x51 | PASS | in-page anchor |
| EL-SITE-739 | `/` | ur | link | شرائط | nav | 1 | 73x61 | PASS | target answered 200 |
| EL-SITE-740 | `/` | ur | link | شکایات اور تجاویز بتائیں ہم کیسے بہتر ہو سکتے ہیں | #complaints | 1 | 197x166 | PASS | in-page anchor |
| EL-SITE-741 | `/` | ur | link | لائیو بورڈ کھولیں | nav | 1 | 174x32 | PASS | target answered 200 |
| EL-SITE-742 | `/` | ur | link | لائیو ڈیسک | #live | 1 | 67x51 | PASS | in-page anchor |
| EL-SITE-743 | `/` | ur | link | ممبر لاگ اِن | nav | 1 | 98x53 | PASS | target answered 200 |
| EL-SITE-744 | `/` | ur | link | مواد پر جائیں | #main | 1 | 88x57 | PASS | in-page anchor |
| EL-SITE-745 | `/` | ur | link | وکالت اور پالیسی بجٹ تجاویز اور اراکین کے مسائل وفاقی اور پنجاب حکومت تک۔ | /ur/about | 1 | 404x303 | PASS | target answered 200 |
| EL-SITE-746 | `/` | ur | submit | تصدیق کریں | verify.go | 1 | 104x56 | PASS | exercised by a functional spec |
| EL-SITE-747 | `/` | ur | submit | سیکریٹریٹ کو بھیجیں | contact.send | 1 | 134x53 | PASS | exercised by a functional spec |
| EL-SITE-748 | `/` | ur | tab | تصویر 1 | slider.go | 1 | 38x22 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-749 | `/` | ur | tab | تصویر 2 | slider.go | 1 | 38x22 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-750 | `/` | ur | tab | تصویر 3 | slider.go | 1 | 38x22 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-751 | `/` | ur | tab | تصویر 4 | slider.go | 1 | 38x22 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-752 | `/` | ur | tab | تصویر 5 | slider.go | 1 | 38x22 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-753 | `/` | ur | tab | تصویر 6 | slider.go | 1 | 38x22 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-754 | `/` | ur | textarea | آپ کا پیغام |  | 1 | 623x122 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-755 | `/verify/acceptance-code-does-not-exist` | en | button | Change language to Urdu | lang.toggle | 2 | 82x44 | PASS | exercised by a functional spec |
| EL-SITE-756 | `/verify/acceptance-code-does-not-exist` | en | button | Pause the news ticker | ticker.pause | 2 | 44x37 | PASS | exercised by a functional spec |
| EL-SITE-757 | `/verify/acceptance-code-does-not-exist` | en | input:text | Code under the QR |  | 2 | 385x45 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-758 | `/verify/acceptance-code-does-not-exist` | en | input:text | Membership number |  | 2 | 385x45 | PASS | exercised by a functional spec |
| EL-SITE-759 | `/verify/acceptance-code-does-not-exist` | en | link | About | /about | 2 | 68x38 | PASS | target answered 200 |
| EL-SITE-760 | `/verify/acceptance-code-does-not-exist` | en | link | All news and notifications | ticker.all | 2 | 95x37 | PASS | target answered 200 |
| EL-SITE-761 | `/verify/acceptance-code-does-not-exist` | en | link | Certificate of Origin | /service?s=co | 2 | 245x31 | PASS | target answered 200 |
| EL-SITE-762 | `/verify/acceptance-code-does-not-exist` | en | link | Contact | /contact | 2 | 82x38 | PASS | target answered 200 |
| EL-SITE-763 | `/verify/acceptance-code-does-not-exist` | en | link | Directory | /directory | 2 | 90x38 | PASS | target answered 200 |
| EL-SITE-764 | `/verify/acceptance-code-does-not-exist` | en | link | E-BIL | /service?s=ebil | 2 | 245x31 | PASS | target answered 200 |
| EL-SITE-765 | `/verify/acceptance-code-does-not-exist` | en | link | MCCI Digital Chamber ایوانِ تجارت و صنعت ملتان | / | 2 | 157x59 | PASS | target answered 200 |
| EL-SITE-766 | `/verify/acceptance-code-does-not-exist` | en | link | Member Login | /login | 2 | 160x44 | PASS | target answered 200 |
| EL-SITE-767 | `/verify/acceptance-code-does-not-exist` | en | link | Membership | /membership | 2 | 112x38 | PASS | target answered 200 |
| EL-SITE-768 | `/verify/acceptance-code-does-not-exist` | en | link | News | /news | 2 | 63x38 | PASS | target answered 200 |
| EL-SITE-769 | `/verify/acceptance-code-does-not-exist` | en | link | NEWS Chamber news c36f7d | ticker.post | 2 | 194x38 | PASS | target answered 200 |
| EL-SITE-770 | `/verify/acceptance-code-does-not-exist` | en | link | NEWS Chamber news d098e0 | ticker.post | 2 | 201x38 | PASS | target answered 200 |
| EL-SITE-771 | `/verify/acceptance-code-does-not-exist` | en | link | Resources | /resources | 2 | 98x38 | PASS | target answered 200 |
| EL-SITE-772 | `/verify/acceptance-code-does-not-exist` | en | link | Services | /services | 2 | 84x38 | PASS | target answered 200 |
| EL-SITE-773 | `/verify/acceptance-code-does-not-exist` | en | link | Skip to content | #main | 2 | 144x47 | PASS | in-page anchor |
| EL-SITE-774 | `/verify/acceptance-code-does-not-exist` | en | link | Track | /track | 2 | 61x38 | PASS | target answered 200 |
| EL-SITE-775 | `/verify/acceptance-code-does-not-exist` | en | link | Verify | /verify | 2 | 65x38 | PASS | target answered 200 |
| EL-SITE-776 | `/verify/acceptance-code-does-not-exist` | en | link | Visa letters | /service?s=visa | 2 | 245x31 | PASS | target answered 200 |
| EL-SITE-777 | `/verify/acceptance-code-does-not-exist` | en | submit | Check membership | verify.member | 2 | 385x44 | PASS | exercised by a functional spec |
| EL-SITE-778 | `/verify/acceptance-code-does-not-exist` | en | submit | Verify | verify.go | 2 | 385x44 | PASS | exercised by a functional spec |
| EL-SITE-779 | `/verify/acceptance-code-does-not-exist` | ur | button | خبروں کی پٹی روکیں | ticker.pause | 1 | 44x37 | PASS | exercised by a functional spec |
| EL-SITE-780 | `/verify/acceptance-code-does-not-exist` | ur | button | زبان انگریزی میں بدلیں | lang.toggle | 1 | 82x44 | PASS | exercised by a functional spec |
| EL-SITE-781 | `/verify/acceptance-code-does-not-exist` | ur | input:text | رکنیت نمبر |  | 1 | 385x51 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-782 | `/verify/acceptance-code-does-not-exist` | ur | input:text | کیو آر کے نیچے کوڈ |  | 1 | 385x51 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-783 | `/verify/acceptance-code-does-not-exist` | ur | link | ای-بِل | /ur/service?s=ebil | 1 | 245x37 | PASS | target answered 200 |
| EL-SITE-784 | `/verify/acceptance-code-does-not-exist` | ur | link | ایم سی سی آئی ڈیجیٹل چیمبر ایوانِ تجارت و صنعت ملتان | /ur | 1 | 157x79 | PASS | target answered 200 |
| EL-SITE-785 | `/verify/acceptance-code-does-not-exist` | ur | link | تصدیق | /ur/verify | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-786 | `/verify/acceptance-code-does-not-exist` | ur | link | تعارف | /ur/about | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-787 | `/verify/acceptance-code-does-not-exist` | ur | link | تمام خبریں اور اعلانات | ticker.all | 1 | 89x37 | PASS | target answered 200 |
| EL-SITE-788 | `/verify/acceptance-code-does-not-exist` | ur | link | ٹریک | /ur/track | 1 | 45x38 | PASS | target answered 200 |
| EL-SITE-789 | `/verify/acceptance-code-does-not-exist` | ur | link | خبر Chamber news c36f7d | ticker.post | 1 | 169x38 | PASS | target answered 200 |
| EL-SITE-790 | `/verify/acceptance-code-does-not-exist` | ur | link | خبر Chamber news d098e0 | ticker.post | 1 | 174x38 | PASS | target answered 200 |
| EL-SITE-791 | `/verify/acceptance-code-does-not-exist` | ur | link | خبریں | /ur/news | 1 | 45x38 | PASS | target answered 200 |
| EL-SITE-792 | `/verify/acceptance-code-does-not-exist` | ur | link | خدمات | /ur/services | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-793 | `/verify/acceptance-code-does-not-exist` | ur | link | ڈائریکٹری | /ur/directory | 1 | 59x38 | PASS | target answered 200 |
| EL-SITE-794 | `/verify/acceptance-code-does-not-exist` | ur | link | رابطہ | /ur/contact | 1 | 41x38 | PASS | target answered 200 |
| EL-SITE-795 | `/verify/acceptance-code-does-not-exist` | ur | link | رکنیت | /ur/membership | 1 | 46x38 | PASS | target answered 200 |
| EL-SITE-796 | `/verify/acceptance-code-does-not-exist` | ur | link | سرٹیفکیٹ آف اوریجن | /ur/service?s=co | 1 | 245x37 | PASS | target answered 200 |
| EL-SITE-797 | `/verify/acceptance-code-does-not-exist` | ur | link | ممبر لاگ اِن | /ur/login | 1 | 106x44 | PASS | target answered 200 |
| EL-SITE-798 | `/verify/acceptance-code-does-not-exist` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-SITE-799 | `/verify/acceptance-code-does-not-exist` | ur | link | وسائل | /ur/resources | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-800 | `/verify/acceptance-code-does-not-exist` | ur | link | ویزا لیٹر | /ur/service?s=visa | 1 | 245x37 | PASS | target answered 200 |
| EL-SITE-801 | `/verify/acceptance-code-does-not-exist` | ur | submit | تصدیق کریں | verify.go | 1 | 385x47 | PASS | exercised by a functional spec |
| EL-SITE-802 | `/verify/acceptance-code-does-not-exist` | ur | submit | رکنیت جانچیں | verify.member | 1 | 385x49 | PASS | exercised by a functional spec |
| EL-SITE-803 | `/verify` | en | button | Change language to Urdu | lang.toggle | 2 | 82x44 | PASS | exercised by a functional spec |
| EL-SITE-804 | `/verify` | en | button | Pause the news ticker | ticker.pause | 2 | 44x37 | PASS | exercised by a functional spec |
| EL-SITE-805 | `/verify` | en | input:text | Code under the QR |  | 2 | 385x45 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-806 | `/verify` | en | input:text | Membership number |  | 2 | 385x45 | PASS | exercised by a functional spec |
| EL-SITE-807 | `/verify` | en | link | About | /about | 2 | 68x38 | PASS | target answered 200 |
| EL-SITE-808 | `/verify` | en | link | All news and notifications | ticker.all | 2 | 95x37 | PASS | target answered 200 |
| EL-SITE-809 | `/verify` | en | link | Certificate of Origin | /service?s=co | 2 | 245x31 | PASS | target answered 200 |
| EL-SITE-810 | `/verify` | en | link | Contact | /contact | 2 | 82x38 | PASS | target answered 200 |
| EL-SITE-811 | `/verify` | en | link | Directory | /directory | 2 | 90x38 | PASS | target answered 200 |
| EL-SITE-812 | `/verify` | en | link | E-BIL | /service?s=ebil | 2 | 245x31 | PASS | target answered 200 |
| EL-SITE-813 | `/verify` | en | link | MCCI Digital Chamber ایوانِ تجارت و صنعت ملتان | / | 2 | 157x59 | PASS | target answered 200 |
| EL-SITE-814 | `/verify` | en | link | Member Login | /login | 2 | 160x44 | PASS | target answered 200 |
| EL-SITE-815 | `/verify` | en | link | Membership | /membership | 2 | 112x38 | PASS | target answered 200 |
| EL-SITE-816 | `/verify` | en | link | News | /news | 2 | 63x38 | PASS | target answered 200 |
| EL-SITE-817 | `/verify` | en | link | NEWS Chamber news c36f7d | ticker.post | 2 | 194x38 | PASS | target answered 200 |
| EL-SITE-818 | `/verify` | en | link | NEWS Chamber news d098e0 | ticker.post | 2 | 201x38 | PASS | target answered 200 |
| EL-SITE-819 | `/verify` | en | link | Resources | /resources | 2 | 98x38 | PASS | target answered 200 |
| EL-SITE-820 | `/verify` | en | link | Services | /services | 2 | 84x38 | PASS | target answered 200 |
| EL-SITE-821 | `/verify` | en | link | Skip to content | #main | 2 | 144x47 | PASS | in-page anchor |
| EL-SITE-822 | `/verify` | en | link | Track | /track | 2 | 61x38 | PASS | target answered 200 |
| EL-SITE-823 | `/verify` | en | link | Verify | /verify | 2 | 65x38 | PASS | target answered 200 |
| EL-SITE-824 | `/verify` | en | link | Visa letters | /service?s=visa | 2 | 245x31 | PASS | target answered 200 |
| EL-SITE-825 | `/verify` | en | submit | Check membership | verify.member | 2 | 385x44 | PASS | exercised by a functional spec |
| EL-SITE-826 | `/verify` | en | submit | Verify | verify.go | 2 | 385x44 | PASS | exercised by a functional spec |
| EL-SITE-827 | `/verify` | ur | button | خبروں کی پٹی روکیں | ticker.pause | 1 | 44x37 | PASS | exercised by a functional spec |
| EL-SITE-828 | `/verify` | ur | button | زبان انگریزی میں بدلیں | lang.toggle | 1 | 82x44 | PASS | exercised by a functional spec |
| EL-SITE-829 | `/verify` | ur | input:text | رکنیت نمبر |  | 1 | 385x51 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-830 | `/verify` | ur | input:text | کیو آر کے نیچے کوڈ |  | 1 | 385x51 | PARTIAL | present, named and wired; outcome not exercised by an automated test |
| EL-SITE-831 | `/verify` | ur | link | ای-بِل | /ur/service?s=ebil | 1 | 245x37 | PASS | target answered 200 |
| EL-SITE-832 | `/verify` | ur | link | ایم سی سی آئی ڈیجیٹل چیمبر ایوانِ تجارت و صنعت ملتان | /ur | 1 | 157x79 | PASS | target answered 200 |
| EL-SITE-833 | `/verify` | ur | link | تصدیق | /ur/verify | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-834 | `/verify` | ur | link | تعارف | /ur/about | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-835 | `/verify` | ur | link | تمام خبریں اور اعلانات | ticker.all | 1 | 89x37 | PASS | target answered 200 |
| EL-SITE-836 | `/verify` | ur | link | ٹریک | /ur/track | 1 | 45x38 | PASS | target answered 200 |
| EL-SITE-837 | `/verify` | ur | link | خبر Chamber news c36f7d | ticker.post | 1 | 169x38 | PASS | target answered 200 |
| EL-SITE-838 | `/verify` | ur | link | خبر Chamber news d098e0 | ticker.post | 1 | 174x38 | PASS | target answered 200 |
| EL-SITE-839 | `/verify` | ur | link | خبریں | /ur/news | 1 | 45x38 | PASS | target answered 200 |
| EL-SITE-840 | `/verify` | ur | link | خدمات | /ur/services | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-841 | `/verify` | ur | link | ڈائریکٹری | /ur/directory | 1 | 59x38 | PASS | target answered 200 |
| EL-SITE-842 | `/verify` | ur | link | رابطہ | /ur/contact | 1 | 41x38 | PASS | target answered 200 |
| EL-SITE-843 | `/verify` | ur | link | رکنیت | /ur/membership | 1 | 46x38 | PASS | target answered 200 |
| EL-SITE-844 | `/verify` | ur | link | سرٹیفکیٹ آف اوریجن | /ur/service?s=co | 1 | 245x37 | PASS | target answered 200 |
| EL-SITE-845 | `/verify` | ur | link | ممبر لاگ اِن | /ur/login | 1 | 106x44 | PASS | target answered 200 |
| EL-SITE-846 | `/verify` | ur | link | مواد پر جائیں | #main | 1 | 82x53 | PASS | in-page anchor |
| EL-SITE-847 | `/verify` | ur | link | وسائل | /ur/resources | 1 | 49x38 | PASS | target answered 200 |
| EL-SITE-848 | `/verify` | ur | link | ویزا لیٹر | /ur/service?s=visa | 1 | 245x37 | PASS | target answered 200 |
| EL-SITE-849 | `/verify` | ur | submit | تصدیق کریں | verify.go | 1 | 385x47 | PASS | exercised by a functional spec |
| EL-SITE-850 | `/verify` | ur | submit | رکنیت جانچیں | verify.member | 1 | 385x49 | PASS | exercised by a functional spec |
