# Screens catalogue

Generated from the v10 prototype registry (`M.META`). Every screen below exists in `reference/prototype/<role>/<page>/index.html` and must exist in the built app at the route shown.

## Public website (13 screens)

| Screen | Prototype path | Route in app | What it does |
|---|---|---|---|
| Home | `site/home/` | `/` | Full-width MCCI hero under a transparent header, live activity, counters, membership journey, member-to-member endorsement, temporary → permanent, services, verify, news, Urdu launch countdown |
| About | `site/about/` | `/about` | Mission, leadership, committees |
| Membership | `site/membership/` | `/membership` | Classes & class rule, fee schedule from the form, documents by business type, 8-step journey with temporary membership, FAQ |
| Services | `site/services/` | `/services` | The seven chamber services |
| Service detail | `site/service/` | `/service` | Requirements and how it works for one service; apply |
| Directory | `site/directory/` | `/directory` | Public member directory (public fields only; temporary members labelled) |
| Verify | `site/verify/` | `/verify` | Verify certificates, temporary certificates and letters by code or serial; shows Superseded for converted temporary certificates |
| Track | `site/track/` | `/track` | Public token tracking (stage and time only) |
| Live board | `site/live/` | `/live` | Lobby-screen board of chamber activity (anonymised) |
| News & Events | `site/news/` | `/news` | News posts and events calendar |
| Resources | `site/resources/` | `/resources` | Downloads: blank official form, checklists, guides |
| Contact | `site/contact/` | `/contact` | Contact form and complaint desk (create tickets) |
| Login | `site/login/` | `/login` | Member login (password / email code), register (start application), staff login |

## Member portal (17 screens)

| Screen | Prototype path | Route in app | What it does |
|---|---|---|---|
| Home | `member/dashboard/` | `/portal` | Greeting, the one next step, big service tiles, membership status, latest messages and requests |
| My Membership | `member/membership/` | `/portal/membership` | Status (8 steps), temporary membership countdown, printing progress, certificates & cards, renewal and history |
| Application form | `member/join/` | `/portal/join` | Six-step guided application built on the MCCI New Membership form: business type → documents & photo → AI-filled details → proposer & seconder → signature & declarations → official form preview & submit. Also shows the correction screen when returned. |
| Track | `member/mtrack/` | `/portal/mtrack` | Large 8-step tracker, full history with who/when, and every email / portal message received |
| Official form | `member/form/` | `/portal/form` | The filled 4-page MCCI New Membership form (or a blank copy with ?blank=1), ready to print or save as PDF |
| Request a Service | `member/apply/` | `/portal/apply` | Pick one of 7 services with big icons, upload documents, AI fills the request, pay and submit (24-hour SLA). Locked until membership is active (temporary counts). |
| My requests | `member/applications/` | `/portal/applications` | All my service requests with live status and SLA |
| Request detail | `member/application/` | `/portal/application` | Timeline, 24-hour countdown, documents, messages; download when issued; fix when returned |
| My Documents | `member/documents/` | `/portal/documents` | Everything MCCI issued (temporary / permanent certificate, cards, letters) with view, print and share; plus my uploaded files with upload & delete |
| Payments | `member/payments/` | `/portal/payments` | Payment vouchers to pay at the bank, upload of the paid receipt, verification status and receipts |
| Help & Support | `member/support/` | `/portal/support` | Big buttons to call, email, visit, ask AI or open a ticket; my tickets; FAQ |
| Ask AI | `member/assistant/` | `/portal/assistant` | MCCI AI chat, English & Urdu, answers from MCCI rules and the member’s own records |
| Messages | `member/notifications/` | `/portal/notifications` | All email / portal messages with read state, and preferences |
| Events & Trade | `member/events/` | `/portal/events` | Calendar and event list with one-tap registration |
| Trade opportunities | `member/opportunities/` | `/portal/opportunities` | Buyer inquiries shared by MCCI, post a requirement, my posts |
| Company Profile | `member/profile/` | `/portal/profile` | Registered particulars (changes go to MCCI for approval, per form note 4), partners & cards, company users, preferences |
| Endorsement requests | `member/endorse/` | `/portal/endorse` | Members receive proposer / seconder requests live, review the applicant and sign digitally or decline; history of endorsements and yearly limit |

## Admin panel (29 screens)

| Screen | Prototype path | Route in app | What it does |
|---|---|---|---|
| Dashboard | `admin/dashboard/` | `/admin` | Today at a glance: needs-attention list (temp expiring, certificates to upload, review queue, committee), KPIs, charts, live activity |
| Membership Pipeline | `admin/requests/` | `/admin/requests` | Stage board and table of all membership applications (form-based) |
| Application Review | `admin/mreview/` | `/admin/mreview` | One application per the official form: particulars (editable), partners, class rule, document checklist per business type (accept/reject), proposer & seconder, officer checklist, history; return / verify / reject |
| Committee Desk | `admin/committee/` | `/admin/committee` | Membership Committee agenda with approve / defer / reject; approval allocates membership no. and payment voucher |
| Temporary Memberships | `admin/temp/` | `/admin/temp` | NEW: 60-day temporary memberships issued on payment — days left, print status, extend / revoke / remind, and upload printed certificate to convert to permanent |
| Printing & Receiving | `admin/certs/` | `/admin/certs` | Print queue → batch → proof → printer → printed → received; then upload each certificate scan to convert temporary → permanent; dispatch / collection |
| Serial Register | `admin/serials/` | `/admin/serials` | Every certificate serial accounted for: batches, used, spoiled, balance; spoilage log |
| Members Register | `admin/members/` | `/admin/members` | All members (permanent, temporary, expired), change-of-particulars requests, renewal campaign |
| Member Record | `admin/member/` | `/admin/member` | View / edit a member: particulars, partners, documents, certificates (temp & permanent), payments, history; suspend, renew, message |
| Data Import | `admin/import/` | `/admin/import` | Import existing members from CSV / Excel: template, validate, import, roll back |
| Service Requests | `admin/applications/` | `/admin/applications` | All 7 services: board by status and table with SLA |
| Review Desk | `admin/review/` | `/admin/review` | One service request: AI-read document, extracted fields, checks; start / return / approve / sign & issue |
| SLA Monitor | `admin/sla/` | `/admin/sla` | Open requests nearest to the 24-hour deadline; edit SLA hours |
| Signing | `admin/approvals/` | `/admin/approvals` | Signatory queue: sign one or all; issues QR document |
| Documents & QR | `admin/documents/` | `/admin/documents` | QR registry of every issued document incl. temporary certificates (Valid / Superseded / Expired / Revoked), scans, revoke |
| Payments | `admin/payments/` | `/admin/payments` | Receipts to verify, collections and all vouchers |
| Vouchers & Receipts | `admin/psid/` | `/admin/psid` | Issue, view, verify uploaded receipts, record counter payments, cancel vouchers; bank auto-confirmation shown as a dependency |
| Events | `admin/events/` | `/admin/events` | Calendar, events list, create / edit |
| Meetings & Minutes | `admin/meetings/` | `/admin/meetings` | Committee meetings, minutes and decisions |
| Complaint Desk | `admin/complaints/` | `/admin/complaints` | Tickets from members and public: assign, reply, resolve |
| Website Content | `admin/content/` | `/admin/content` | News, notices, AI brief drafts for the public site |
| Notification Center | `admin/notify/` | `/admin/notify` | Email + portal message templates for every stage incl. payment verification and temporary membership alerts |
| Reports | `admin/reports/` | `/admin/reports` | Generate and download reports |
| Business Directory | `admin/bizdir/` | `/admin/business-directory` | Search, filter, select and review registered businesses (docs/29; no prototype screen) |
| Business Profile | `admin/bizprofile/` | `/admin/business-directory/profile` | Official record, outreach details, tags, contact and consent |
| Segments | `admin/segments/` | `/admin/business-directory/segments` | Saved dynamic segments with live counts |
| Exports | `admin/bizexports/` | `/admin/business-directory/exports` | Controlled, logged CSV, Excel and PDF exports |
| AI Insights | `admin/ai/` | `/admin/ai` | How document reading performs; guardrails |
| Staff & Roles | `admin/staff/` | `/admin/staff` | Invite staff by email, designations with seniority levels, editable limits per module (No access / View / Edit / Approve), view the panel as anyone |
| Audit Trail | `admin/audit/` | `/admin/audit` | Every action, who and when; export |
| Services Setup | `admin/services/` | `/admin/services` | Fee and documents per service (fees to be confirmed by MCCI) |
| Integrations | `admin/integrations/` | `/admin/integrations` | Connections included now (email) and those that depend on MCCI’s bank and courier, with the manual process used until then |
| Settings | `admin/settings/` | `/admin/settings` | Chamber details (printed on form & certificates), membership fees, temporary-membership policy, proposer & seconder rules, backup |
