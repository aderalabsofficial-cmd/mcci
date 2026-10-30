# 28 · Business Intelligence & Outreach: Phase A integration assessment (30 Oct 2026)

Read-only discovery of the two IQPigeon projects and the MCCI schema. Neither live IQPigeon service nor MCCI production
was changed. No `.env` or config file was opened. Every provider statement below comes from its source at commit
`b225748`; nothing has been tested against the live API yet, because MCCI has no account there.

## 1. Urgent, unrelated to MCCI: exposed files on iqpigeon.com

Found while inspecting the CRM's document root. **Not read and not changed.**

| Finding | Evidence |
|---|---|
| Backups of the CRM's config files download publicly from `/var/www/html` | `config.local.php.bak.20260912-064114` and `config.php.backup-before-db-fix` answer 200 `application/octet-stream` with their true sizes (a made-up name answers 200 `text/html`, so these are the real files). 11 backup-named files are in that folder. Nginx blocks only the exact names `config.local.php` and `config.local.server.php` |
| MariaDB is reachable from the internet | Port 3306 accepts connections from outside; firewalld, nftables and iptables services are inactive |
| Port 3001 is reachable from the internet | `taxdesk-api.service` |

Recommended, by whoever runs that site: move the backups out of the document root, **treat every credential in them as
leaked and rotate it**, check the access logs for downloads, and restrict 3306 to the host. These are outside this
module and the rules for this work (no Nginx, firewall or unrelated-site changes), so they need a separate decision.

## 2. The two projects

| | `whatsappapi.iqpigeon.com` | `iqpigeon.com` |
|---|---|---|
| Root | `/var/www/iqpigeon-whatsapp-api` | `/var/www/html` |
| What it is | WhatsApp API provider for CRM companies | CRM and automation monolith |
| Stack | Laravel 13, PHP 8.3, Inertia/React, MariaDB (`iqpigeon_whatsapp_api`), Redis | Plain PHP on php-fpm |
| Git | `git@github-iqp-whatsapp-api:waseemabbssgujjarr-create/iqpigeon-whatsapp-api.git`, `master` | **No repository on the server** |
| Deployed | Detached at `b225748` (equals `origin/master`), plus one uncommitted edit: two relationships in `app/Models/Partner.php`, and 11 changed `.gitignore` files | Unknown: no commit to read |
| Workers | Supervisor: 2 `queue:work redis --tries=5`, shared by all customers | Not inspected |
| Relationship | Its architecture doc records a separate database, separate users, and no runtime dependency on the CRM | |

**Decision: integrate only the API provider.** MCCI needs nothing from the CRM, and importing its data is forbidden. It
was therefore not archived: its folder mixes source with config backups and customer storage, so a clean archive would
take care for no benefit.

**Source access.** This machine's GitHub account cannot see the provider repository. A source-only archive of tracked
files was made instead (542 files, 0.8 MB; only `.env.example`; no vendor or node_modules; a pattern scan for live keys
and private keys found none):

`/root/mcci-outreach/iqpigeon-whatsapp-api-b225748-source.zip` (mode 600, sha256 starts `10e3fca5aef74dea`)

```bash
scp mcci-vps:/root/mcci-outreach/iqpigeon-whatsapp-api-b225748-source.zip .
```

It is not needed in the MCCI repository. Changing the provider would need collaborator access to that repository.

## 3. What the WhatsApp API provides (verified in source)

Base `https://whatsappapi.iqpigeon.com/api/v1`. Authentication: `Authorization: Bearer iqp_live_…` with scopes.

| Need | Status | Detail |
|---|---|---|
| Send one message | Yes | `POST /messages` (`text`, `template`, `image`, `document`, `audio`, `video`), answers 202 queued |
| Approved template messages | Yes | `template: {name, language: {code}, components}` passed to Meta unchanged, so English and Urdu are separate approved templates |
| List templates | Partly | `GET /templates` gives name, language, status, category, id. **No template text or variables** |
| Create templates | No | `POST /templates/sync` is a stub. Templates are made and approved in Meta's tools |
| Duplicate protection | Partly | `Idempotency-Key` required, 24 h, tied to the request body. See gap 2 |
| Message status | Yes | `GET /messages/{id}`: status, failure code and message, sent/delivered/read times, WhatsApp id |
| List messages | Weak | `GET /messages` returns the latest 50, with no paging or filter |
| Delivery webhooks | Yes | `POST /webhooks`, public HTTPS only; HMAC-SHA256 of `timestamp.body`; headers `X-IQP-Signature`, `-Timestamp`, `-Event-Id`, `-Request-Id`; 5 attempts (30, 60, 120, 300 s) |
| Inbound messages (for STOP) | Yes | Meta's `messages` change is forwarded in full under `data` |
| Rate limit | Yes | 300 API calls a minute on every plan, 429 with `Retry-After`. No monthly message quota is set |
| Connection status | Yes | `GET /connections`, `GET /me` |
| Usage | Unverified | `GET /usage` exists; whether sends are recorded was not checked |
| Cost estimates | No | Meta bills the business directly; the API exposes no prices |
| Meta quality rating, messaging tier | No | Not exposed |
| Broadcast, campaign, scheduling, pause, cancel | **No** | No such code exists. Once accepted, a message cannot be recalled |
| Opt-out or suppression | **No** | No such code exists |

So MCCI must own campaigns, pacing, scheduling, pause and cancel, consent and suppression. That matches the architecture
in the brief, and no second gateway is needed.

## 4. Provider gaps and how MCCI handles them

| # | Gap (source) | Effect | Handling without changing the provider | Worth fixing there |
|---|---|---|---|---|
| 1 | `MetaWebhookProcessor` finds the connection by `phone_number_id` with `first()`, ignoring status and customer | If MCCI's number was ever connected under another account, its status events and inbound replies could go to that account | Check before go-live that the number appears on exactly one connection | **Yes: a data-separation defect** |
| 2 | `HandleIdempotency` runs the request again when the first with that key is still in flight | A quick retry can send twice | One request at a time per recipient; retry only after a 2-minute wait, with the same key and byte-identical body | **Yes** |
| 3 | `SendOutboundMessageJob` marks `processing` before calling Meta; if that call throws, the queue retry exits early | Message stays `processing` forever; never resent, never failed | Show "unknown" after a timeout. Never resend automatically; staff decide | Yes |
| 4 | Meta rate-limit errors (such as 130429) are marked `failed` with no retry | Temporary limits look permanent | Read the Meta code in the failure text; pause and retry those only | Nice to have |
| 5 | 202 response has no WhatsApp id; webhooks carry only the WhatsApp id | Webhook events cannot be matched straight away | `GET /messages/{id}` after accepting, store the id, hold unmatched events briefly and reconcile | Nice to have |
| 6 | Status updates have no ordering check | A late `delivered` can overwrite `read` | MCCI only moves status forward | Nice to have |
| 7 | Template list has no text | MCCI cannot preview from the provider | Staff enter the approved wording in MCCI; Meta's mismatch error catches differences | **Yes: small change, and better previews** |
| 8 | Webhook carries the whole inbound message | Private replies reach MCCI | Read only opt-out keywords and buttons, store neither text nor media | No |

Not yet read: the exact webhook envelope in `DeliverPartnerWebhookAttemptJob`. To be confirmed before writing the
adapter.

**Decision:** Phase C builds against the provider as it is, with the handling above. Gaps 1, 2, 3 and 7 are recommended
as separate changes to the provider, by its owner or with explicit approval.

## 5. Architecture

```
MCCI staff → Next.js server actions (permission check, audit)
           → Postgres: segments, campaigns, recipient snapshot, consent, suppression, status events
           → sender worker (paced, one recipient at a time, stops on pause, outage or kill switch)
           → lib/outreach/provider: IQPigeon adapter, server-only (key from server environment)
           → whatsappapi.iqpigeon.com → Meta → recipient

Provider webhook → POST /api/webhooks/whatsapp (signature, timestamp window, event-id dedupe)
                 → status moves forward only; STOP → suppression immediately
```

MCCI holds every message until its turn, so scheduling, pause and cancel work: only the unsent are affected, and the
screens say so. Each recipient's consent is rechecked immediately before sending. The idempotency key is derived from
campaign and recipient, so a restart cannot send a second message.

## 6. Fit with MCCI today

**Production has almost no directory data yet:** 8 companies (4 of them demo) and 2 members. 1 company has a nature of
business, 0 a sector, 1 a phone, 1 an email. The dashboard and segments will show little until the member register is
imported (`docs/13`), and it must not be padded with made-up figures.

| Brief asks for | Exists | Plan |
|---|---|---|
| Name, number, class, status, validity, representative | Yes: `companies`, `members` | Read only, never copied |
| Manufacturing, nature, sector | `manufacturing`, `nature_sector`, `nature_items`, `sector` | Reuse. `sector` is empty |
| Registration type | `biz_type`: prop, aop, pvt, mnc, public | Reuse the actual values. LLP and registered firm do not exist, so adding them is MCCI's call |
| Status: Active | `member_status`: Temporary, Permanent, Expired, Suspended, Revoked, TempExpired | Reuse `private.public_member_status` so "Active" means the same as on Verify |
| City, district | **None** (only free-text `address`) | Editable outreach metadata; never guessed from the address |
| WhatsApp contact | **None** (`profiles.mobile`, `application_partners.mobile`, `companies.tel`) | Outreach contact per company, seeded only by explicit staff or member action |
| WhatsApp consent, suppression | **None** (`consents` covers terms and privacy only) | New tables with who, when, how and evidence |
| Tags, segments, campaigns, exports log | None | New tables |

**New tables (Phase B–D, additive):** `outreach_profiles`, `outreach_tags`, `company_tags`, `outreach_contacts`,
`outreach_consents`, `outreach_suppressions`, `segments`, `campaigns`, `campaign_recipients`, `campaign_events`,
`export_jobs`. RLS on all; every staff change audited. Official records are never written by this module.

**Permissions:** the model is one level (0–3) per module, so 13 separate switches do not fit it. Proposed:

| Module | 1 View | 2 Edit | 3 Approve |
|---|---|---|---|
| `biz` Business directory | Directory, dashboard (aggregates) | Tags, segments, outreach metadata, plain exports | Sensitive contacts and columns, large exports |
| `out` Outreach | Campaign reports | Create campaigns, manage consent and suppression | Approve, launch, schedule, pause, cancel, lift a suppression |
| `plat` (existing) | | | Provider settings (level 3) |

A campaign above a size set in `settings` needs an approver other than its creator. Sensitive export columns also need
a reason. Phase B as built is in `docs/29`.

**Conflicts with current project rules:**
- `CLAUDE.md` rule 1 and `docs/00-scope.md` say WhatsApp must not be built. This brief is the owner's change of scope;
  both are updated when Phase B starts.
- The prototype is the specification for screens, but it has no such screens. New screens follow its design tokens,
  with the English and Urdu wording in this module's own doc.
- `docs/01` says no webhooks in this phase. This adds one, signed and rate limited.

## 7. Limits to state plainly

- Delivery is never guaranteed. Counts come from provider and Meta responses only.
- Meta's quality rating, messaging limits and prices will not appear in MCCI, because the API does not expose them.
- Messages already accepted by the provider cannot be cancelled.
- The provider keeps its own copy of recipient, body and status.
- **Consent decides the audience.** Unless members opt in, every campaign's eligible audience is zero, by design.

## 8. What the owner must provide

| Item | Needed for | Blocks |
|---|---|---|
| Provider account for MCCI, subscribed or granted offline (none exists under an MCCI name) | API key, webhook | Phase C live test |
| MCCI's own WhatsApp number and Meta business, connected through Embedded Signup; display name approved | Sending | Phase C live test |
| Approved English and Urdu templates in Meta | Campaigns | First campaign |
| Consent wording and how consent is collected (recommended: member opt-in in the portal; staff entry only with evidence) | Audience | First campaign |
| Approval to run the sender on the server (scheduled jobs are off today) | Sending and scheduling | Production only |
| Member register import | Useful directory and dashboard | Meaningful data |

Phases B, C (against a fake provider), D, E and F's automated tests can all proceed without these. A live WhatsApp test
cannot.
