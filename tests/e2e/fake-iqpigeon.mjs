import { createHmac, randomUUID } from 'node:crypto';
import { createServer } from 'node:http';

/**
 * Stand-in for the IQPigeon WhatsApp API, written from its source at b225748: same routes, Bearer key, required
 * Idempotency-Key with replay, 202 "queued" with no WhatsApp id, `{ success, data }` envelope, signed webhooks.
 * Test-only controls live under /__test. Nothing is ever really sent.
 */
const PORT = 3997;
const KEY = 'test-iqpigeon-key';
const CONNECTION = '11111111-2222-4333-8444-555555555555';
const PHONE_ID = '100200300';

let messages = new Map();
let byKey = new Map();
let mode = 'ok'; // ok | rate_limit | server_error | hang | auth
let webhooks = [];
let templates = [];

const send = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};
const ok = (res, status, data) => send(res, status, { success: true, data, request_id: 'req_test' });
const error = (res, status, code, message) => send(res, status, { success: false, error: { code, message }, request_id: 'req_test' });
const read = (req) =>
  new Promise((resolve) => {
    let b = '';
    req.on('data', (c) => (b += c));
    req.on('end', () => resolve(b));
  });
const view = (m) => ({ id: m.id, connection_id: CONNECTION, direction: 'outbound', status: m.status, to: m.to, type: m.type, wa_message_id: m.wa, failure_code: m.failure_code, failure_message: m.failure_message });

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const raw = await read(req);
  if (url.pathname === '/health') return send(res, 200, { ok: true });

  if (url.pathname === '/__test/reset') {
    messages = new Map();
    byKey = new Map();
    mode = 'ok';
    webhooks = [];
    templates = [];
    return send(res, 200, {});
  }
  if (url.pathname === '/__test/mode') {
    mode = JSON.parse(raw).mode;
    return send(res, 200, {});
  }
  if (url.pathname === '/__test/templates') {
    templates = JSON.parse(raw);
    return send(res, 200, {});
  }
  if (url.pathname === '/__test/webhooks') {
    webhooks = JSON.parse(raw);
    return send(res, 200, {});
  }
  if (url.pathname === '/__test/sent') return send(res, 200, [...messages.values()]);
  if (url.pathname === '/__test/advance') {
    // the provider's worker finished: WhatsApp id assigned
    for (const m of messages.values()) if (m.status === 'queued') Object.assign(m, { status: 'sent', wa: `wamid.${m.id}` });
    return send(res, 200, [...messages.values()]);
  }
  if (url.pathname === '/__test/sign') {
    const { secret, body } = JSON.parse(raw);
    const t = String(Math.floor(Date.now() / 1000));
    return send(res, 200, { timestamp: t, signature: createHmac('sha256', secret).update(`${t}.${body}`).digest('hex') });
  }

  if (mode === 'auth' || req.headers.authorization !== `Bearer ${KEY}`) return error(res, 401, 'unauthenticated', 'Invalid or expired API key.');
  if (mode === 'hang') return; // no answer at all
  if (mode === 'rate_limit' && url.pathname !== '/api/v1/me') return error(res, 429, 'rate_limit_exceeded', 'Too many API requests. Retry later.');
  if (mode === 'server_error' && url.pathname !== '/api/v1/me') return error(res, 500, 'server_error', 'Server error.');

  if (url.pathname === '/api/v1/me') return ok(res, 200, { partner: { id: 'p1', name: 'MCCI Test', slug: 'mcci', status: 'active', provisioning_status: 'active' } });
  if (url.pathname === `/api/v1/connections/${CONNECTION}`)
    return ok(res, 200, { connection: { id: CONNECTION, status: 'active', display_phone_number: '+92 61 000000', phone_number_id: PHONE_ID, waba_id: '555' } });
  if (url.pathname.startsWith('/api/v1/connections/')) return error(res, 404, 'connection_not_found', 'Connection not found.');
  if (url.pathname === '/api/v1/templates') return ok(res, 200, { templates });
  if (url.pathname === '/api/v1/webhooks') return ok(res, 200, { webhooks: webhooks.map((u) => ({ id: randomUUID(), url: u, is_active: true })) });
  if (url.pathname === '/api/v1/messages' && req.method === 'POST') {
    const key = req.headers['idempotency-key'];
    if (!key) return error(res, 400, 'idempotency_key_required', 'Idempotency-Key header is required for this request.');
    if (byKey.has(key)) return ok(res, 202, { message: view(byKey.get(key)) }); // replay: no second message
    const b = JSON.parse(raw);
    if (b.connection_id !== CONNECTION) return error(res, 404, 'connection_not_found', 'Connection not found.');
    const m = { id: randomUUID(), status: 'queued', to: b.to, type: b.type, wa: null, body: b.body ?? null, template: b.template ?? null, payload: b.payload ?? null, key };
    messages.set(m.id, m);
    byKey.set(key, m);
    return ok(res, 202, { message: view(m) });
  }
  if (url.pathname.startsWith('/api/v1/messages/')) {
    const m = messages.get(url.pathname.split('/').pop());
    return m ? ok(res, 200, { message: view(m) }) : error(res, 404, 'message_not_found', 'Message not found.');
  }
  return error(res, 404, 'not_found', 'Not found');
}).listen(PORT, '127.0.0.1');
