# 30 · WhatsApp communication (owner brief of 30 Oct 2026)

MCCI owns contacts, consent, campaigns and history. The IQPigeon WhatsApp API only delivers. The IQPigeon CRM is not
involved. This module is **tested against a stand-in provider only**: no real WhatsApp message has been sent, because
MCCI has no account on the provider yet (§5).

## 1. Architecture

```
Staff → server actions (permission check) → Postgres: api.wa_* with the sending rules (private.wa_block), audit
Queue → lib/whatsapp/admin/dispatch.ts → lib/whatsapp/provider/iqpigeon.ts → whatsappapi.iqpigeon.com → Meta → recipient
Recipient → Meta → provider → POST /api/webhooks/whatsapp (signature, age, own number) → api.wa_webhook → history, inbox
```

Business logic depends only on `lib/whatsapp/provider/types.ts`. `tests/e2e/fake-iqpigeon.mjs` is the mock provider, with
the real routes, envelope, Idempotency-Key replay and 202 behaviour.

Secrets live only in the server environment: `IQPIGEON_API_URL`, `IQPIGEON_API_KEY`, `IQPIGEON_CONNECTION_ID`,
`IQPIGEON_PHONE_NUMBER_ID`, `IQPIGEON_WEBHOOK_SECRET`. `CRON_SECRET` and `APP_URL` already exist. The settings screen shows
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
- [ ] Put the five `IQPIGEON_*` values in `/etc/mcci-web/env`, restart `mcci-web`.
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
