# 30 · WhatsApp communication (owner brief of 30 Oct 2026)

MCCI owns contacts, consent, campaigns and history. The IQPigeon WhatsApp API only delivers. The IQPigeon CRM is not
involved. Automated tests use a stand-in provider. MCCI's account and official number are now on the live provider
(§9), but no real WhatsApp message has been sent: there are no approved templates or consented recipients yet, sending
is off, and the provider defects in §6 are not fixed.

## 1. Architecture

```
Staff → server actions (permission check) → Postgres: api.wa_* with the sending rules (private.wa_block), audit
Queue → lib/whatsapp/admin/dispatch.ts → lib/whatsapp/provider/iqpigeon.ts → whatsappapi.iqpigeon.com → Meta → recipient
Recipient → Meta → provider → POST /api/webhooks/whatsapp (signature, age, own number) → api.wa_webhook → history, inbox
```

Business logic depends only on `lib/whatsapp/provider/types.ts`. `tests/e2e/fake-iqpigeon.mjs` is the mock provider, with
the real routes, envelope, Idempotency-Key replay and 202 behaviour.

Secrets live only in the server environment: `IQPIGEON_API_URL`, `IQPIGEON_API_KEY`, `IQPIGEON_CONNECTION_ID`,
`IQPIGEON_PHONE_NUMBER_ID`, `IQPIGEON_WEBHOOK_SECRET`. `APP_URL` already exists; `CRON_SECRET` was added on the server on 2 Nov 2026 (§9). The settings screen shows
Set or Not set, never a value.

## 2. The provider's actual API (source at `b225748`)

| Need | Route | Notes |
|---|---|---|
| Account | `GET /api/v1/me` | `partner.name`, `partner.status` |
| Sender | `GET /api/v1/connections/{uuid}` | `status`, `display_phone_number`, `phone_number_id`, `waba_id`; scoped to the key's account |
| Send | `POST /api/v1/messages` | `connection_id, to, type (text, template, image, document, audio, video), body, template, payload`; requires `Idempotency-Key`; answers 202 queued, without a WhatsApp id |
| Status | `GET /api/v1/messages/{uuid}` | `status, wa_message_id, failure_code, failure_message` |
| Templates | `GET /api/v1/templates` | name, language, status, category, id; **no text** |
| Webhooks | `GET, POST /api/v1/webhooks` | body `{id, type, data}`, `data` is Meta's change value; headers `X-IQP-Signature` (HMAC of `timestamp.body`), `X-IQP-Timestamp`, `X-IQP-Event-Id`; 5 attempts |
| Limit | | 300 API calls a minute |

Not offered, so not shown in MCCI: location and interactive messages, template creation, file upload, Meta prices, quality
rating, messaging limits. Media goes by link: `/api/whatsapp/media/{id}?exp&sig`, valid 60 minutes, from a private bucket.

To confirm on the first real test: that `validated('template')` keeps `components`, and the exact `/webhooks` response.

## 3. Rules

`private.wa_block` runs when staff prepare a message and again in `api.wa_claim`, immediately before dispatch:

| Situation | Result |
|---|---|
| No number, invalid number, demo company | Blocked or skipped, reason recorded |
| Opted out or suppressed | Blocked, whatever was selected |
| No consent, or consent not covering this kind of message | Blocked |
| Template not `APPROVED` by Meta | Blocked. Saving wording in MCCI never changes this |
| Free text or media outside the 24-hour window | Blocked |
| A personalised value is missing | Skipped for that recipient |
| Number changed after the audience was fixed | Skipped: consent belongs to the earlier number |

There is no other path: `api.wa_claim`, `api.wa_result` and `api.wa_webhook` are for the secret-key server client only.
`settings.whatsapp.sendingEnabled` is **false by default** and stops everything.

**Reliability.** One idempotency key per message for life (`mcci-c-<recipient>`, `mcci-m-<message>`). A claim moves
`next_attempt_at` forward first, so a dead worker's message returns after 2 minutes with the same key. Rate limit: back
off and retry, up to 6 attempts. No clear answer (timeout, 5xx): same key, up to 3 attempts, then `unknown` for a person.
Never resent with a new key. Status moves forward only. Events that arrive before the WhatsApp id is known are held.
A provider problem stops the batch. Reconciliation asks about unfinished messages; one stuck past `staleMinutes` (60)
becomes `unknown`.

**Campaign states.** Draft → (above `approvalThreshold`) Pending approval → Approved → Scheduled or Queued → Sending →
Completed, Partially completed or Failed; Paused and Cancelled from the running states. Creating a draft fixes the
audience: a trigger refuses any change to it. Approval needs Approve level and someone other than the creator. The launch
must repeat the exact recipient count. Nothing sends on save, open or approve. Pause and cancel stop further submission;
messages already accepted cannot be recalled, and the screens say so.

**Webhook trust.** Valid signature, timestamp within 5 minutes, and `metadata.phone_number_id` equal to MCCI's own.
Otherwise refused. A failed check stores nothing from the body. Only the event id and outcome are kept.

**Matching.** A reply joins a business only if exactly one business has that number. Otherwise it stays unmatched until a
person with Approve level links it.

**Opt-out.** STOP, UNSUBSCRIBE, OPT OUT, OPT-OUT, OPTOUT and the Urdu equivalents suppress the number immediately and
record a withdrawal. Consent history is append-only. Withdrawing all, or choosing fewer categories, is a new row.

## 4. Permissions

The brief's 17 suggested permissions map onto the existing per-module levels, editable in Staff & Roles. Defaults are
proposals (`TODO(MCCI)`).

| Permission | Requires |
|---|---|
| `outreach.view`, `outreach.reports.view` | `out` 1 (figures only; no numbers or message text) |
| `outreach.directory.view`, `outreach.segments.view` | `biz` 1 |
| `outreach.segments.manage` | `biz` 2 |
| `outreach.exports.create` | `biz` 2; sensitive columns `biz` 3 |
| `outreach.contacts.manage`, `outreach.consent.manage` | `out` 2 |
| `outreach.messages.send`, `outreach.campaigns.create`, `outreach.inbox.view`, `outreach.inbox.reply` | `out` 2 |
| `outreach.campaigns.schedule` | `out` 2 up to the threshold, `out` 3 above it |
| `outreach.campaigns.approve`, `.pause`, `.cancel`; link an unmatched number; lift a block | `out` 3 |
| `outreach.integration.manage` | `plat` 2 to test, `plat` 3 to change |

| Designation | `biz` | `out` | `plat` |
|---|---|---|---|
| Secretary General | 3 | 3 | 3 |
| Deputy Secretary — Membership | 3 | 3 | 0 |
| Membership Officer | 2 | 2 | 0 |
| President, Auditor | 1 | 1 | as before |
| IT Convener | 1 | 0 | 3 |

There is no separate "communication staff" designation: give someone `out` 2 with a per-person override.

## 5. MCCI onboarding checklist (owner and MCCI, nothing here can be done from code)

- [ ] Meta Business Portfolio in MCCI's own legal name, verified; administrators with 2-step login. Not AdEra Labs.
- [ ] WhatsApp Business Account owned by that portfolio. Record: portfolio id, WABA id, number, Phone Number ID, display name.
- [ ] A dedicated number MCCI controls that can receive the code, not an employee's, not on another account.
- [ ] Display name approved; profile: logo, description, website, email, address.
- [ ] A dedicated MCCI account on the provider (its own partner, not a shared one). Grant offline or subscribe.
- [ ] Connect the number through the provider's Embedded Signup; complete Cloud API registration.
- [ ] Check the number appears on exactly one provider connection (§6 item 1).
- [ ] Create an API key with `messages.send`, `messages.read`, `connections.read`, `templates.read`, `webhooks.read`.
- [ ] Register the webhook `https://<app host>/api/webhooks/whatsapp` for event `messages`, with a generated secret.
- [ ] Put the five `IQPIGEON_*` values in `/etc/mcci-web/env`, restart `mcci-web`: fill in the git-ignored
      `.env.iqpigeon.local`, then run `bash scripts/ops/whatsapp-env.sh`. Never commit these values.
- [ ] WhatsApp Settings → Test connection shows Connected.
- [ ] Create templates in Meta and wait for approval, then Synchronise, record the wording and map the variables.
- [ ] MCCI approves the consent wording (`wa.member.wording`), sets the version, opens member opt-in.
- [ ] Controlled test: a small set of explicitly consented numbers. No bulk send until §6 is closed.

Suggested templates, classified by actual purpose (Meta decides the final category): application acknowledgement, document
deficiency, approval, fee reminder, renewal reminder, certificate available (Utility); meeting announcement, official
circular (Utility if administrative); event invitation, general announcement (Marketing).

## 6. Provider and server remediation (blockers before any real campaign; not done, needs the provider's owner)

| # | Item | Where | Status |
|---|---|---|---|
| 1 | Events go to the first connection with a `phone_number_id`, ignoring account and status | `MetaWebhookProcessor::handleChange` | Open. MCCI refuses other numbers' events, but its own events could still go elsewhere if the number was ever on another account |
| 2 | A retry while the first request is in flight runs again (duplicate) | `HandleIdempotency` | Open. MCCI waits 2 minutes before reusing a key, which narrows but does not close it |
| 3 | A Meta exception leaves a message in `processing` forever | `SendOutboundMessageJob` | Open. MCCI marks it unknown after 60 minutes and never resends |
| 4 | The template list has no text or variables | `WhatsappMessageTemplateLister::normalizeRow` | Open. Staff record wording by hand; Meta's mismatch error catches differences |
| 5 | Config backups downloadable from `iqpigeon.com`, port 3306 open | Server (`docs/28` §1) | **Open and urgent.** Rotate every credential in those files |
| 6 | 3001 reachable from the internet; no active firewall | Server | Open |
| 7 | A 5xx stored by the idempotency layer replays for 24 hours | `HandleIdempotency` | Open. MCCI ends in `unknown` rather than resending |

## 7. Deployment and rollback (needs separate approval)

1. Fresh backup, verify, restore drill.
2. Tooling clone at the release commit. `migrate.sh --dry-run` → expect `20261108000580_whatsapp` pending. `--apply-next`.
3. `scripts/deploy/release.sh <sha>`. New screens work with sending off and no provider: status "Not configured".
4. Live check: `/api/health`; `/admin/whatsapp` as staff; `POST /api/webhooks/whatsapp` unsigned → 503 until configured,
   401 after; `POST /api/cron/whatsapp` → 401; dashboard shows sending off.
5. Do **not** add a timer for `/api/cron/whatsapp` without separate approval. Without it, "Send next batch" on a campaign
   does the work.

Rollback: `scripts/deploy/release.sh --rollback` for code. The migration is additive; the older release ignores the new
tables. It does change two default limits (Deputy Secretary `out` 3, Membership Officer `out` 2).

### Released 30 Oct 2026 (owner approved)

`b06f5b9` is live; rollback target `2f71d59`. Backup `mcci-20261030T204744Z` verified, restore drill 13/13 PASS, migration
0580 applied (companies, members and applications unchanged). Sending is off, consent is closed, no timer exists, the
media bucket is private, and there are 0 campaigns, messages and webhook events. Signed-out checks passed: health, public
pages, admin screens 404, unsigned webhook 503 `not_configured`, cron 401, attachment and export 403. Not checked live:
the screens signed in, and anything that needs the provider.

## 8. Acceptance (brief §19), tested against the stand-in provider

| # | Criterion | Evidence |
|---|---|---|
| 1 | Administrator configures the account | Server settings plus connection test; e2e. Credentials are not editable on screen by design |
| 2 | Official sender identified | e2e `isolation` step |
| 3 | Sync approved templates | e2e |
| 4 | Individual message | e2e |
| 5 | Selection across directory pages | e2e (Phase B, carried into the composer) |
| 6 | Campaign to a saved segment | Composer opens `?segment=`; e2e covers the filter path, not the segment link itself |
| 7 | Personalisation per recipient | e2e, pgTAP |
| 8 | Media | e2e (document); image, video, audio by unit-tested type rules only |
| 9 | English and Urdu templates | e2e records both; per-recipient language selection covered by code review only |
| 10 | Replies against the right business | e2e |
| 11 | Delivery events update the right record | e2e, pgTAP |
| 12 | Duplicates prevented | e2e, against the fake's replay; see §6 item 2 for the real provider |
| 13 | Consent and opt-out on the server | pgTAP, e2e |
| 14 | Pause, cancel | e2e |
| 15 | Permissions | pgTAP, e2e |
| 16 | Reports distinguish states | e2e |
| 17 | Account isolation | MCCI's side e2e; **provider's side open** (§6 item 1) |
| 18 | No send to a suppressed recipient | pgTAP, e2e |
| 19 | Survives worker restarts | e2e simulated restart |
| 20 | Audited | Row triggers; pgTAP sample |

**Test results (30 Oct):** database dry run 41 files, 1045 assertions, 0 failed; unit 314 passed; typecheck and lint clean;
full browser suite 1407 passed, 4 failed, 2 not run. Two failures (`/admin/whatsapp` colour contrast on phones) were real and
are fixed; two (`services.spec`, `verify.spec`) passed when re-run alone. The specs involved were re-run, not the whole suite.

**Not done:** real-number test (§5); provider fixes (§6); template buttons are stored but not captured or shown, because the
provider does not return them; no virus scan of uploads, as the server has no scanner; no choice of an existing MCCI document
as an attachment, only uploads; failure breakdown shows provider codes as they come; "Communication Reports" are the dashboard
and per-campaign results, with no separate date-range report.

## 9. Connection status (owner's brief of 2 Nov 2026, migration 0620)

**Why the site said "Not configured" with the keys in place.** The credentials were fine. The banner shows the result
saved in `whatsapp_health`, and that had last been written on 31 Oct, before the values were complete. Nothing checked
again until someone pressed Test connection. Opening the WhatsApp overview or Settings, or a worker tick, now checks
again when the saved result says not configured or is more than 10 minutes old. A failed check never blocks the page.

**Where the settings live.**

| | Local | Production |
|---|---|---|
| File the app reads | `.env.local` | `/etc/mcci-web/env`, `/etc/mcci-web/release.env` |
| `.env.iqpigeon.local` | Not read by the app. Input to `scripts/ops/whatsapp-env.sh`, which copies it to production | Not present |
| Provider in tests | `tests/e2e/fake-iqpigeon.mjs` | `https://whatsappapi.iqpigeon.com` |

Secret values are never shown, logged or stored in this repository. Keep `IQPIGEON_PHONE_NUMBER_ID` in
`.env.iqpigeon.local` equal to the connection's phone number ID before running that script: a wrong value makes the
connection test fail and refuses every webhook as another account's.

**Settings shows these as separate facts:** provider connected; MCCI's number verified; approved templates available;
contacts with consent; sending switched on. Being connected never turns sending on, and nothing turns it on by itself.

**The provider's webhook test.** IQPigeon's dashboard shows its webhook as working only after its own test is delivered.
That test is signed and names no number, so the route used to refuse it as another account's. A signed `webhook.test` now
answers 200 and records the time; nothing from it is kept. An unsigned one gets 401.

**Templates.** The provider's list gives name, language, status, category and ID only. Wording, buttons and variables are
MCCI's own record beside it. Saving them never approves anything; status comes only from the provider's list.

**Message types.** Text, template, image, document, audio and video: what the provider offers. It has no interactive
messages, so the composer does not offer them.

### Released 2 Nov 2026 (owner's brief)

`fc15c14` is live; rollback targets `7e80de3`, `1fcf00d`. Backup `mcci-20261102T174154Z` verified, restore drill 13/13
PASS, migration 0620 applied (55 total; companies, members, applications, vouchers, posts, messages and audit rows
unchanged). `CRON_SECRET` was added to `/etc/mcci-web/env`; no timer exists, and scheduled jobs stay off.

One worker tick run by hand made the production app check the provider: status `connected`, all six steps passed, account
"The Multan Chamber of Commerce & Industry", number +92 312 7322224, WABA 937323199090897. It sent nothing. Sending and
member opt-in stay off. Meta has 0 templates and MCCI has 0 consents.

Not checked live: the signed-in screens, and IQPigeon's own webhook test, which a person has to press in its dashboard.
No real message has been sent. Before running `scripts/ops/whatsapp-env.sh` again, correct the phone number ID in
`.env.iqpigeon.local`: it differs from the value on the server, which is the one the provider confirmed.

### Phone number ID, 3 Nov 2026

**Cause.** `.env.iqpigeon.local` held `1483566256955179`, the number in the owner's Meta screenshot address, not the phone
number ID. IQPigeon reports `1462393916949933` for MCCI's connection `63acfb76-…`: the production app's own check (step
"isolation", which compares the two) passed with it on 2 and 3 Nov. Production never had the wrong value; running the copy
script with the old file would have put it there, and the app would then have refused every webhook.

**Fix.** The local file now has `1462393916949933`. `scripts/ops/whatsapp-env.sh` refuses to change the phone number ID
when it differs from the server's, unless `--replace-phone-id` is given because MCCI's number really changed; `--check`
compares it too. What `1483566256955179` identifies in Meta (a portfolio or another asset) was not established.

**Production settings.** All seven names the app reads are set: `IQPIGEON_API_URL`, `IQPIGEON_API_KEY`,
`IQPIGEON_CONNECTION_ID`, `IQPIGEON_PHONE_NUMBER_ID`, `IQPIGEON_WEBHOOK_SECRET`, `CRON_SECRET`, `APP_URL`. Nothing is
missing. Whether the local file's key and webhook secret equal production's was not compared.

**Webhook test.** IQPigeon offers it only as a button on its signed-in dashboard (`POST /webhooks/{id}/test`, a web route
with no API equivalent), so it needs the owner. `whatsapp_health.webhook_test_at` is still empty: no test has arrived.
The only webhook requests in the server log on 3 Nov were the release checks' own unsigned probes, refused with 401.

## 10. MCCI master templates (owner, 3 Nov 2026; migration 0630)

Four reusable templates, one per campaign category, each in English (`en`) and Urdu (`ur`). Staff choose one, fill in
the subject and details, and reach the same guided path as any campaign. Nobody creates a new template per message.

| Category (composer) | Template name on Meta | Meta category | Variables in order |
|---|---|---|---|
| Official MCCI announcements | `mcci_official_announcement` | Marketing | contact person, business name, subject, summary, link |
| Membership & administrative updates | `mcci_membership_update` | Utility | contact person, business name, membership number, subject, details, action needed (optional, default "None"), link |
| Events & invitations | `mcci_event_invitation` | Marketing | contact person, business name, event, date, time, venue, confirm-by date, link |
| Business opportunities & initiatives | `mcci_business_opportunity` | Marketing | contact person, business name, opportunity, sector, summary, last date, link |

**Why these categories.** Membership updates concern the member's own membership (application, renewal, documents,
payment): Utility. Announcements, invitations and opportunities are informational or promotional messages MCCI starts:
Marketing. They are not forced into Utility. Meta may re-categorise on review; the category shown is the one Meta reports.

**Variables carry structured content only.** Contact person, business name and membership number come from MCCI's
records for each recipient. The other fields are short, single-line values with a fixed purpose and maximum length
(subject 80, summary or details 500, names 80, date or time 40, venue 120, sector 60, link 200 and `https://` only);
line breaks, tabs, five spaces in a row and `{{` are refused (Meta's parameter rules). The wording around them is fixed
and approved by Meta, so a field cannot become an unrestricted free-form message.

**Approval.** IQPigeon's API lists templates but cannot create or submit them (`POST /templates/sync` does nothing; its
dashboard has no template pages). Each version is therefore submitted in WhatsApp Manager, Message templates, Create
template, using the name, category, language, header, body, footer and sample values shown under "What to submit to
Meta" on the Templates screen. Statuses arrive only through the provider sync: `LOCAL` (never submitted),
`NOT_ON_PROVIDER`, `PENDING`, `APPROVED`, `REJECTED`, `PAUSED`, `DISABLED`. A campaign can be made from a version only
when it is `APPROVED`. The English approval does not approve the Urdu version.

**Editing.** Administrators with Approve level change a version's header, body or footer while Meta does not hold it
(not approved, not under review). The body must use each of its variables exactly once, never first, last or next to
another. Each save is a new version, audited. Approved or pending wording is locked; changing it means a new submission.
The generic template editor cannot change a master's wording or variables.

**Composer.** "MCCI master template" is the first message type. Staff pick the template and language, fill in the
fields, see the message as it will arrive, then "Check the audience": every business in the selection is in exactly
one group: can receive free text (conversation open in the last 24 hours), needs the template, no consent for this
category, opted out, no valid number. Everyone who may receive it gets the template. Only if the operator ticks the
mixed option, with both groups shown, do those with an open conversation get a reviewed free-text version instead;
each recipient's type is fixed in the snapshot. Recipients who may not receive it are recorded as skipped with the
reason. Individual messages use the same path with one business selected. Submission, approval above the size limit,
scheduling, launch and the exact-count confirmation are unchanged. Consent, opt-out and approval are checked again
immediately before each message is dispatched.

**Status on 3 Nov 2026.** All eight versions are `LOCAL` locally and are not on the provider: none has been submitted to
Meta, none is approved. TODO(MCCI): the Secretary General reviews the wording; then each version is submitted in
WhatsApp Manager and the Templates screen is synchronised.

## 11. Quota, scheduling and readiness (owner's directives of 3 Nov 2026; migration 0640)

**What Meta Support confirmed (3 Nov 2026).** Business portfolio `1641814260669555`, WABA `937323199090897`, technology
provider IQPigeon. Messaging tier: untiered, 250 unique recipients per rolling 24 hours, shared by every number in the
portfolio. Business Verification not completed; after verification 2,000; then 10,000 automatically when quality is
Medium or High and at least half the current limit (1,000) is reached within a seven-day moving period. Meta also found
the `statuses` webhook subscription missing.

**The quota service.** `public.whatsapp_quota` holds the portfolio, WABA, tier, limit, verification, phone and template
quality, the source (Meta Support, an administrator from WhatsApp Manager, or the provider) with a note, who confirmed
it and when. IQPigeon's API reports none of these, so they are entered and confirmed, never fetched or guessed. Seeded
with Meta Support's figures above, dated 3 Nov 2026. Nothing raises the limit from MCCI's own counts: an administrator
(Platform level 3) confirms a new tier on Campaign Readiness, audited with the note.

- **What counts.** Unique numbers that received a template message (a conversation MCCI started) in the last 24 hours,
  from this CRM, plus a recorded figure for other numbers or tools in the same portfolio (valid for 24 hours).
  Repeat messages to the same person, and free text inside an open conversation, take no new place.
- **Fail-safe.** No confirmed limit, or a confirmation older than the chosen number of days (default 7): template
  messages to new recipients are held. Nothing is sent on a guess.
- **Dispatch.** Before every batch the room is recalculated. A new template recipient with no room stays pending for
  the next window: never skipped for capacity, never given a new idempotency key. Individual template messages obey the
  same limit. MCCI's own daily cap (`dailyLimit`, WhatsApp Settings) stays as an extra brake; it has no built-in value.
- **Campaign size.** Up to 5,000 selected members per campaign (`maxCampaign`, configurable). Approval by a second
  person with Approve level above the size threshold is unchanged.
- **Schedule.** Each campaign with waiting recipients shows, window by window, how many can go at the confirmed limit
  (an estimate; the dispatcher decides at each batch). Pause, resume and cancel act on what has not gone.

**Campaign Readiness** (`/admin/whatsapp/readiness`). Outstanding issues; account and limit (confirmed, with source and
date); capacity now (counted: reached in 24 hours, other numbers, room, next free place, recipients waiting, members
with consent); scaling (counted: unique recipients in 7 days, Meta's target of half the limit, remaining; quality and
last tier as confirmed); master templates approved; delivery statuses received. Confirmation form for administrators.

**Tests.** `supabase/tests/database/396_wa_quota.test.sql` runs 3,000 simulated businesses (created and rolled back in
the test; no real member): 250 with 100 used by another number, usage older than 24 hours, stale and unknown limits,
2,000, the rolling window, 10,000, seven-day use and target, one message per recipient, a new recipient refused when
there is no room, consent and opt-out exclusions recorded, permissions.

### Status, 3 Nov 2026

| | |
|---|---|
| Implemented and tested (locally, mock provider) | Master templates EN + UR with approval gate, wording rules and Meta submission details; audience in five groups; reviewed mixed campaigns; quota with fail-safe, shared usage, rolling window and seven-day monitor; scheduling across windows; Campaign Readiness; consent, opt-out, idempotency, retries, pause/resume/cancel, approval and audit (earlier work) |
| Configured, awaiting Meta approval | All eight master versions: submit each in WhatsApp Manager (details on the Templates screen); status `LOCAL` until then |
| Awaiting MCCI Business Verification | The limit stays 250 until Meta verifies the portfolio; then confirm the new tier on Campaign Readiness |
| Awaiting IQPigeon | Subscribe the `statuses` webhook field for MCCI's number (Meta Support finding); fix the open provider defects in §6 before a real campaign |
| Awaiting member consent | No member has given WhatsApp consent; member opt-in stays closed until MCCI approves the consent wording |
| Awaiting production acceptance | Not released; signed-in checks on the live site with an authorised staff account; no real bulk sending without the owner's explicit approval |

## 12. Consent centre (owner's brief and decisions A–C of 6 Nov 2026; migration 0690)

One consent system, extended; no second one. The member and staff screens read and write the same tables
(`outreach_contacts`, `outreach_consents`, `outreach_suppressions`) through `api.*` functions that hold every rule.

**Member** (`/portal/whatsapp`, "WhatsApp Preferences"; linked from the dashboard card, Company Profile and the menu).
Always available, whatever `consentOpen` says (decision A). Every company user sees the status; only the account Owner
(company area `profile` level 2, the authorized representative) changes anything. Four steps on one page:

1. Contact person and WhatsApp number. Any common Pakistani form is accepted and stored as `+923XXXXXXXXX`
   (`private.wa_phone`, mirrored by `normalizeWhatsapp`); a Pakistani landline is refused. Numbers from the register
   (`companies.tel`, which holds the mobile for imported members such as MCCI-A-1905) and the user's own mobile are
   offered as tap-to-use suggestions, never filled in.
2. Five categories, each explained, **none ticked for the member**: announcements, membership & renewal, events,
   business opportunities, and (new) service / application / certificate updates (`services`). Consent statement with
   its version, an explicit "Yes — I agree" box, Give consent. Until MCCI opens consent the categories are shown
   read-only with "Consent is awaiting MCCI's approval".
3. Confirm the number on WhatsApp (JOIN, below). Optional; required to subscribe again after an opt-out.
4. Stop all WhatsApp messages (confirmation dialog). Always allowed.

Status, consent time, last update, confirmation and a history are on the page. A newly invited company user lands on
the page once with a welcome note and "Skip for now". Imported members who already accepted their invitation see the
same card; nothing new is sent to them.

**Statuses** (`private.wa_status`, one per business): `no_number`, `not_collected`, `full` (all five), `partial`,
`awaiting_verification` (fresh consent after the member's own opt-out, waiting for JOIN), `opted_out` (the member's
own withdrawal or STOP), `blocked` (a block MCCI set). Confirmation on WhatsApp is shown beside it, separately.

**Number change.** The old number and name go to `outreach_contact_history`; a granted consent for the old number ends
with a `number_change` row; unused JOIN codes are cancelled; confirmation starts again. Consent is never carried to a
new number (it was always keyed on company + number).

**JOIN.** The member gets a six-character code (`api.wa_join_code`: 30 minutes, one use, at most five an hour; only a
SHA-256 hash is stored) and sends `JOIN <code>` from WhatsApp (a `wa.me` link opens the chat with the text filled in).
The webhook (`private.wa_join`) verifies the number only when the code is current and unused **and** the message comes
from exactly the number the member saved with it; a code alone, or a contact record alone, never links a number.
Every attempt is recorded in `outreach_verifications` (`verified`, `mismatch`, `expired`, `used`, `unknown_code`) with
the WhatsApp message id; duplicate deliveries stop at the event id and the message id. JOIN proves control of the
number; it is not consent, and nothing is sent back.

**Opt-out and subscribing again (decision C).** STOP / UNSUBSCRIBE / OPT OUT (+ Urdu) and the member's own withdrawal
(portal, or recorded by staff at the member's request) create a suppression with source `recipient` or `member`. Staff,
including Approve level, cannot lift it (`api.biz_unsuppress` refuses) and cannot record consent over it
(`api.wa_consent_record` refuses with `member_optout`). Only the member subscribes again: fresh categories (nothing
restored), a new consent row with the current wording version, then a JOIN code made after that consent, sent from the
same number; only that lifts the suppression. The STOP and withdrawal rows stay in the history. A block MCCI set itself
(`staff`) can still be lifted by Approve level with a reason.

**Staff** — "WhatsApp & Communication Preferences" on the Member Record (tab WhatsApp, with the status in the summary
strip) and on the Business Directory profile: status, number (masked as `+92 300 •••• 567` without contact access),
contact person, confirmation, categories, how consent was given, when, by whom, wording version, opt-out, full history.
Staff with `out` 2 record the member's decision: method (phone call, signed form, in person, email, event sign-up,
approved opt-in flow, other), evidence (3–500 characters) and a required box "the member clearly and freely agreed";
new consent only once MCCI has opened it, for staff as for members. The Members Register has a WhatsApp column (status,
confirmation, categories; never numbers) and filters: no number, consent not collected, full, partial, opted out,
number not confirmed, active member without consent. Seen by staff with `out` ≥ 1 or `biz` ≥ 1.

**Campaigns.** Five categories; the membership-update master can go as a service update ("Send as"). The audience
builder filters on WhatsApp status, consented category and confirmation, besides status, class, sector, location,
expiry and manual selection; counts are server-side and every recipient is checked again at dispatch. The composer
explains the 24-hour window, how to send a test (a campaign of one consented business), and that a WhatsApp Channel is
separate: neither IQPigeon nor Meta's Cloud API can post to a Channel, so it is never sent from here or counted.

**Settings.** `consentOpen` now means "MCCI has approved the consent wording": it gates new consent only.

**Dependency (production).** JOIN needs IQPigeon to deliver inbound `messages` events to `/api/webhooks/whatsapp`.
The provider's own webhook test arrived on 3 Nov; no real inbound message has reached production yet. Until one does,
members see "Not confirmed yet" and nothing claims otherwise; consent itself does not depend on JOIN except to
subscribe again after the member's own opt-out.

**Production state found on 6 Nov 2026 (read only).** `consentOpen` is **true** and `sendingEnabled` is **true** with
wording version `draft-1`, contrary to decision A. Nothing can be sent (0 approved templates, 0 consents), but members
can already give consent against the draft wording. Before or with the release of 0690: turn consent off in WhatsApp
Settings until MCCI approves the wording (owner's action).
