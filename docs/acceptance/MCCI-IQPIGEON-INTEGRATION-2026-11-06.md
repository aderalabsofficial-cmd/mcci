# IQPigeon ↔ MCCI WhatsApp integration — inspection of the running deployment (6 Nov 2026)

Inspection of the shared server (MCCI and IQPigeon run on the same VPS), 6 Nov 2026, read only. The two-step fix in §3
was **applied on 7 Nov 2026 (04:18–04:20 UTC) on the owner's authorisation**: see §3a. Secrets were read only inside the
server and never printed.

## 1. What is deployed

| Part | Where | State |
|---|---|---|
| IQPigeon WhatsApp API (Laravel) | `/var/www/iqpigeon-whatsapp-api`, nginx `whatsappapi.iqpigeon.com` → php-fpm | Running; 2 queue workers (`artisan queue:work redis`) under supervisord; code at `b225748` |
| IQPigeon CRM (PHP) | `/var/www/html`, nginx `iqpigeon.com` → php-fpm | Running; holds the **Meta app's webhook callback** |
| Database | MariaDB `iqpigeon_whatsapp_api` (API), `iqpigeon_db` (CRM), on 127.0.0.1 | API connects to `127.0.0.1` |
| MCCI tenant | partner 7 "The Multan Chamber of Commerce & Industry" (active); connection 47 (active), phone number id `1462393916949933`, display `+92 312 7322224`, WABA `937323199090897`; the only connection with that phone id | Correct |
| MCCI webhook endpoint | `webhook_endpoints` id 4: `https://app.mcci.aderalabs.tech/api/webhooks/whatsapp`, events `["*"]`, active | Correct; IQPigeon's signed test reached MCCI on 3 Nov (3 × 200) |

## 2. The inbound path, link by link

```
Member's WhatsApp → Meta → [Meta app webhook] → iqpigeon.com/api/whatsapp-webhook.php (CRM)
   → bridge (only allow-listed phone / WABA ids) → whatsappapi.iqpigeon.com/webhooks/meta (API: signature, dedupe)
   → DeliverPartnerWebhookJob → app.mcci.aderalabs.tech/api/webhooks/whatsapp (MCCI: signature, age, own number)
   → api.wa_webhook → JOIN / STOP / inbox
```

| Link | Finding | Status |
|---|---|---|
| Meta → app | The app's `whatsapp_business_account` subscription is active, callback `https://iqpigeon.com/api/whatsapp-webhook.php`, field `messages` subscribed | OK |
| **MCCI's WABA → app** | `GET /937323199090897/subscribed_apps` (with MCCI's own token): **0 apps subscribed**. Meta therefore sends **no events at all** for MCCI's number (no messages, no delivery statuses). This is also Meta Support's "statuses subscription missing" | **Missing — root cause 1** |
| **CRM bridge** | `config.php`: `WHATSAPP_API_BRIDGE_PHONE_NUMBER_IDS = '1259226987283813,758204954052103'`, `..._WABA_IDS = '1058287677107935,757872340505399'`. MCCI's ids are not listed, so even a delivered event would not be forwarded to the API | **Missing — root cause 2** |
| CRM own processing | MCCI's number appears in no CRM table (`bbd_whatsapp_connections`, `client_whatsapp_accounts`, `whatsapp_messages_log`) and in no CRM webhook log line; no CRM bot answers it | Safe |
| API → MCCI | Payload `{id, type: field, data: value}`; `data` keeps `metadata.phone_number_id`, `messages[].from` (sender), `messages[].text.body` (JOIN/STOP text), `messages[].id` (wamid). Signed with the partner secret | OK (matches MCCI's handler) |
| Duplicates | API: `system_events` unique on a hash of the whole payload (a Meta retry is dropped); MCCI: event id once, and the WhatsApp message id once | OK |
| Tenant isolation | API picks the connection by `phone_number_id` (one match); MCCI refuses any other phone id (`IQPIGEON_PHONE_NUMBER_ID`) | OK |
| Traffic so far | API `system_events` from Meta: 24, all 25–28 Sep, none for MCCI; nginx: 0 hits on `/webhooks/meta` in 9 days; CRM endpoint: 14 POSTs in 9 days (other tenants) | — |

Outbound (MCCI → API → Meta): MCCI's `messages` table on IQPigeon has **0 rows**; MCCI has never sent a message (sending
is off by design). Not tested live: it needs an approved template or an open 24-hour window, both MCCI-side.

## 3. The fix (two changes, MCCI's own number only, no other tenant touched)

The auto-mode safety check stopped me from changing another service's configuration on my own. Both steps are
reversible and follow IQPigeon's own pattern for its two existing API tenants.

**Step 1 — allow-list MCCI in the CRM bridge** (root on the VPS):

```bash
cd /var/www/html && cp -p config.php config.php.bak-mcci-bridge-$(date +%Y%m%d)
sed -i "s/^define('WHATSAPP_API_BRIDGE_PHONE_NUMBER_IDS', '1259226987283813,758204954052103');/define('WHATSAPP_API_BRIDGE_PHONE_NUMBER_IDS', '1259226987283813,758204954052103,1462393916949933');/; s/^define('WHATSAPP_API_BRIDGE_WABA_IDS', '1058287677107935,757872340505399');/define('WHATSAPP_API_BRIDGE_WABA_IDS', '1058287677107935,757872340505399,937323199090897');/" config.php
php -l config.php && grep -n "WHATSAPP_API_BRIDGE_" config.php
```
Rollback: `cp -p config.php.bak-mcci-bridge-<date> config.php`.

**Step 2 — subscribe MCCI's WABA to the IQPigeon app** (uses MCCI's stored token inside IQPigeon; nothing printed):

```bash
cd /var/www/iqpigeon-whatsapp-api && sudo -u iqpigeon php artisan tinker --execute='
$c = App\Models\WhatsappConnectionCredential::where("whatsapp_connection_id", 47)->latest()->first();
$v = env("META_GRAPH_VERSION", "v21.0");
$r = Illuminate\Support\Facades\Http::withToken($c->access_token)->post("https://graph.facebook.com/$v/937323199090897/subscribed_apps");
echo json_encode($r->json()), PHP_EOL;
$g = Illuminate\Support\Facades\Http::withToken($c->access_token)->get("https://graph.facebook.com/$v/937323199090897/subscribed_apps");
echo "apps subscribed: ", count($g->json()["data"] ?? []), PHP_EOL;'
```
Expected: `{"success":true}` and `apps subscribed: 1`. Rollback: the same call with `->delete(...)`.

## 3a. Applied 7 Nov 2026

| Step | Original value | New value | Result |
|---|---|---|---|
| 1. CRM bridge, `/var/www/html/config.php` line 125 | `WHATSAPP_API_BRIDGE_PHONE_NUMBER_IDS` = `1259226987283813,758204954052103` | same + `,1462393916949933` | `php -l` clean; only these 2 lines differ; owner `nginx:nginx` 644 unchanged; opcache revalidates every 2 s (no reload needed) |
| 1. same file, line 126 | `WHATSAPP_API_BRIDGE_WABA_IDS` = `1058287677107935,757872340505399` | same + `,937323199090897` | as above |
| 2. Meta `POST /937323199090897/subscribed_apps` (MCCI's own token, inside IQPigeon) | 0 apps subscribed | 1 app: `552479924130015` "IQ Pigeon Tech Solutions" | `{"success":true}` |

Backup of the original file: `/root/backups/mcci-iqpigeon-20261107T041855Z/config.php.orig` (outside the web root, mode
700 directory). No other tenant's id, webhook or row was touched.

**Rollback** (root on the VPS):

```bash
cp -p /root/backups/mcci-iqpigeon-20261107T041855Z/config.php.orig /var/www/html/config.php && php -l /var/www/html/config.php
cd /var/www/iqpigeon-whatsapp-api && sudo -u iqpigeon php artisan tinker --execute='
$c = App\Models\WhatsappConnectionCredential::where("whatsapp_connection_id", 47)->latest()->first();
$v = env("META_GRAPH_VERSION", "v21.0");
echo json_encode(Illuminate\Support\Facades\Http::withToken($c->access_token)->delete("https://graph.facebook.com/$v/937323199090897/subscribed_apps")->json()), PHP_EOL;'
```

Not yet verified live: no message has been sent to MCCI's number since (§4 needs a person with the designated test
phone). Production keeps consent and sending **off**, so an inbound JOIN or STOP is recorded but nothing is sent back.

**Security finding on the same server (7 Nov 2026), not caused by this change:** 13 older IQPigeon backup copies in
`/var/www/html` (`config.php.bak.*`, `config.php.backup-before-db-fix`, `config.php.before-email-test-mode`,
`config.php.pre-staging-fix`, `config.local.php.bak.*`, `api/whatsapp-webhook.php.bak-*`) are served publicly by nginx
(HTTP 200). They hold IQPigeon's secrets, including `META_APP_SECRET` of the Meta app that carries MCCI's webhooks. Moving
another application's files was refused by the session's safety check; the owner must (1) move them out of the web
root and (2) rotate every secret they contain — see the release report.

## 4. Live verification once the fix is in (needs a person with the designated test phone)

1. In the member portal (test member account), save the test phone's number and give consent (consent open on a test basis
   only, or with the approved wording), then press *Get my code*.
2. From the test phone, send `JOIN <code>` to +92 312 7322224. Expected within seconds: CRM log line, API
   `system_events` row (`messages`), API `webhook_deliveries` row `delivered 200`, MCCI `outreach_verifications` row
   `verified`, member page shows "Confirmed on WhatsApp".
3. From a second phone send the same code: `mismatch`, nothing verified. Send it again from the test phone: `used`.
4. From the test phone send `STOP`: MCCI suppression `recipient`, member page "Turned off", staff see "STOP received on
   WhatsApp" and cannot lift it.
5. No message is sent back by MCCI or IQPigeon in any of these steps; no real member is involved.

Until steps 1–2 are done these remain covered by the local automated tests only (`tests/e2e/wa-consent-centre.spec.ts`,
`supabase/tests/database/400_wa_consent_centre.test.sql`), which drive MCCI's real webhook route with IQPigeon's signed
envelope.
