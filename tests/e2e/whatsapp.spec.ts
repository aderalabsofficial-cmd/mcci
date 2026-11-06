import { execSync } from 'node:child_process';
import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import { expect, type Page, test } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readLocalEnv } from '../integration/local-env';
import { NO_BACKEND, readAccounts } from './accounts';
import { signInAs } from './helpers';

/**
 * WhatsApp (docs/30), end to end against tests/e2e/fake-iqpigeon.mjs, which follows the real provider's schema. Nothing
 * is ever really sent. Covers the acceptance list: connection, templates, personalisation, individual and campaign
 * sending, inbound and status events, duplicate protection across restarts, consent and opt-out, pause and cancel.
 */
const accounts = readAccounts();
test.describe.configure({ mode: 'serial' });

const FAKE = 'http://127.0.0.1:3997';
const SECRET = 'test-webhook-secret-not-a-real-one';
const CRON = 'test-cron-secret-not-a-real-one-0000000000';
const OWN_PHONE_ID = '100200300';
const tag = randomBytes(3).toString('hex').toUpperCase();
const seed = Number.parseInt(tag, 16) % 9_000_000;
const phone = (n: number) => `+9230${String(seed + n).padStart(8, '0')}`;
const NATURE = `WA-${tag}`;
const TEMPLATE = `notice_${tag.toLowerCase()}`;
const names = ['Alpha', 'Bravo', 'Charlie', 'Delta'].map((n) => `WA ${n} ${tag}`);
const companies: string[] = [];
const members: string[] = [];
const memberNos: string[] = [];
let admin: SupabaseClient;

const fake = (path: string, body?: unknown) =>
  fetch(`${FAKE}${path}`, { method: 'POST', body: JSON.stringify(body ?? {}) }).then((r) => r.json());
const sent = async () =>
  (
    (await fake('/__test/sent')) as {
      to: string;
      key: string;
      type: string;
      template: { name: string; components: { parameters: { text: string }[] }[] } | null;
      body: string | null;
      payload: { link?: string } | null;
    }[]
  ).filter((m) => m.to.startsWith(`+9230`));
const filterOf = () => ({
  groups: [{ match: 'all', exclude: false, rules: [{ field: 'nature', op: 'in', value: [NATURE] }] }],
});

async function postEvent(page: Page, event: object, opts: { secret?: string; age?: number } = {}) {
  const body = JSON.stringify(event);
  const t = String(Math.floor(Date.now() / 1000) - (opts.age ?? 0));
  const sig = createHmac('sha256', opts.secret ?? SECRET)
    .update(`${t}.${body}`)
    .digest('hex');
  return page.request.post('/api/webhooks/whatsapp', {
    data: body,
    headers: {
      'Content-Type': 'application/json',
      'X-IQP-Timestamp': t,
      'X-IQP-Signature': sig,
      'X-IQP-Event-Id': randomUUID(),
    },
  });
}
const event = (data: object, phoneNumberId = OWN_PHONE_ID) => ({
  id: randomUUID(),
  type: 'messages',
  data: { metadata: { phone_number_id: phoneNumberId }, ...data },
});
const inbound = (from: string, text: string) =>
  event({
    messages: [
      {
        id: `wamid.${randomUUID()}`,
        from: from.replace('+', ''),
        type: 'text',
        text: { body: text },
        timestamp: String(Math.floor(Date.now() / 1000)),
      },
    ],
  });
const tick = (page: Page) => page.request.post('/api/cron/whatsapp', { headers: { Authorization: `Bearer ${CRON}` } });
const grant = (i: number, categories = ['announcements', 'membership', 'events', 'opportunities']) =>
  admin.from('outreach_consents').insert({
    company_id: companies[i],
    phone: phone(i),
    status: 'granted',
    method: 'written',
    evidence: 'E2E form',
    categories,
  });

test.beforeAll(async () => {
  if (!accounts.backend) return;
  const env = readLocalEnv()!;
  admin = createClient(env.url, env.secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  await fake('/__test/reset');
  for (const [i, name] of names.entries()) {
    const { data: c, error } = await admin
      .from('companies')
      .insert({
        name,
        biz_type: 'pvt',
        nature_sector: NATURE,
        address: 'Road 1',
        tel: '061-1',
        manufacturing: i % 2 === 0,
      })
      .select('id')
      .single();
    expect(error).toBeNull();
    companies.push(c!.id);
    const no = `WA-${tag}-${i}`;
    const { data: m, error: e2 } = await admin
      .from('members')
      .insert({
        member_no: no,
        company_id: c!.id,
        class: 'Corporate',
        status: 'Permanent',
        rep_name: `Rep ${i}`,
        since: '2026-04-01',
        valid_to: '2099-03-31',
      })
      .select('id')
      .single();
    expect(e2).toBeNull();
    members.push(m!.id);
    memberNos.push(no);
    await admin.from('outreach_contacts').insert({ company_id: c!.id, name: `Contact ${i}`, phone: phone(i) });
  }
});

test.afterAll(async () => {
  if (!admin) return;
  await admin.from('whatsapp_campaigns').delete().like('name', `%${tag}%`);
  const phones = names.map((_, i) => phone(i));
  await admin.from('whatsapp_messages').delete().in('company_id', companies);
  await admin
    .from('whatsapp_messages')
    .delete()
    .in('phone', [...phones, phone(90)]);
  await admin
    .from('whatsapp_conversations')
    .delete()
    .in('phone', [...phones, phone(90)]);
  await admin.from('outreach_suppressions').delete().in('phone', phones);
  await admin.from('whatsapp_templates').delete().like('name', `%${tag.toLowerCase()}%`);
  // the masters go back to not submitted: the provider list in this test was the fake one
  await admin.from('whatsapp_templates').update({ status: 'LOCAL', provider_id: null }).like('name', 'mcci_%');
  await admin.from('members').delete().in('company_id', companies);
  await admin.from('companies').delete().in('id', companies);
  if (accounts.companyId) await admin.from('outreach_contacts').delete().eq('company_id', accounts.companyId);
});

test.beforeEach(({}, info) => {
  test.skip(info.project.name !== 'desktop', 'desktop project only');
  test.skip(!accounts.backend, NO_BACKEND);
});

async function setSettings(page: Page, s: { sending?: boolean; threshold?: number; consentOpen?: boolean }) {
  await page.goto('/admin/whatsapp/settings');
  if (s.sending !== undefined) await page.locator('[data-field="sending-enabled"]').setChecked(s.sending);
  if (s.threshold !== undefined) await page.locator('[data-field="threshold"]').fill(String(s.threshold));
  if (s.consentOpen !== undefined) await page.locator('[data-field="consent-open"]').setChecked(s.consentOpen);
  await page.locator('[data-action="wa.settings.save"]').click();
  await expect(page.locator('[data-section="sending"]').getByRole('status')).toContainText('Settings saved');
}

test('connection is healthy only when every step passes; secrets never reach the page', async ({ page }) => {
  await signInAs(page, 'sg');
  // start from sending off: a run stopped part-way through this file can leave it on
  await setSettings(page, { sending: false });
  await expect(page.locator('[data-secret-state="true"]')).toHaveText('Set');
  // a tick box stays a tick box, with its words beside it, not a full-width field
  for (const field of ['sending-enabled', 'consent-open']) {
    const box = await page.locator(`[data-field="${field}"]`).boundingBox();
    expect(box?.width).toBeLessThanOrEqual(44);
    const label = await page.locator(`label:has([data-field="${field}"])`).boundingBox();
    expect(label?.height).toBeLessThan(60);
  }
  // a long address wraps inside its box on a phone
  const size = page.viewportSize();
  await page.setViewportSize({ width: 375, height: 812 });
  const wide = await page
    .locator('.kv')
    .evaluateAll((els) => els.filter((e) => e.scrollWidth > e.clientWidth + 1).length);
  expect(wide).toBe(0);
  if (size) await page.setViewportSize(size);
  await page.locator('[data-action="wa.test"]').click();
  await expect(page.locator('[data-wa-status="webhook_failed"]')).toBeVisible(); // the API answering is not enough
  await expect(page.locator('[data-step="isolation"]')).toHaveAttribute('data-ok', 'true');
  await expect(page.locator('[data-step="webhook"]')).toHaveAttribute('data-ok', 'false');

  await fake('/__test/webhooks', [
    'http://localhost:3100/api/webhooks/whatsapp',
    'http://127.0.0.1:3100/api/webhooks/whatsapp',
  ]);
  await page.locator('[data-action="wa.test"]').click();
  await expect(page.locator('[data-wa-status="connected"]')).toBeVisible();
  await expect(page.locator('[data-account-name]')).toHaveText('MCCI Test');
  await expect(page.locator('[data-official-number]')).toHaveText('+92 61 000000');
  await expect(page.locator('[data-ready="provider"]')).toHaveAttribute('data-ok', 'true');
  await expect(page.locator('[data-ready="sender"]')).toHaveAttribute('data-ok', 'true');
  // connected is not permission to send: sending stays off until a person turns it on
  await expect(page.locator('[data-ready="sendingOn"]')).toHaveAttribute('data-ok', 'false');

  // a saved result from before the keys were complete does not stay on screen: opening the page checks again
  await admin.from('whatsapp_health').update({ status: 'not_configured', webhook_test_at: null }).eq('id', true);
  await page.reload();
  await expect(page.locator('[data-wa-status="connected"]')).toBeVisible();
  await page.goto('/admin/whatsapp');
  await expect(page.locator('[data-wa-status="connected"]')).toBeVisible();
  await page.goto('/admin/whatsapp/settings');

  // the provider's signed test: answered and recorded, nothing kept; forged or unrelated ones are refused
  const testEvent = { id: randomUUID(), type: 'webhook.test', data: { endpoint_id: 4, message: 'Test' } };
  expect((await postEvent(page, testEvent, { secret: 'wrong' })).status()).toBe(401);
  await expect(page.locator('[data-webhook-test="none"]')).toBeVisible();
  expect((await postEvent(page, testEvent)).status()).toBe(200);
  await page.reload();
  await expect(page.locator('[data-webhook-test="done"]')).toBeVisible();
  expect((await postEvent(page, { id: randomUUID(), type: 'messages', data: { messages: [] } })).status()).toBe(403);

  const html = await page.content();
  expect(html).not.toContain('test-iqpigeon-key');
  expect(html).not.toContain(SECRET);

  await fake('/__test/mode', { mode: 'auth' });
  await page.locator('[data-action="wa.test"]').click();
  await expect(page.locator('[data-wa-status="auth_failed"]')).toBeVisible();
  await fake('/__test/mode', { mode: 'ok' });
  await page.locator('[data-action="wa.test"]').click();
  await expect(page.locator('[data-wa-status="connected"]')).toBeVisible();
  await setSettings(page, { sending: true, threshold: 1 });
});

test('templates sync from the provider; wording and variable mapping are recorded; saving never approves', async ({
  page,
}) => {
  await signInAs(page, 'sg');
  await fake('/__test/templates', [
    { name: TEMPLATE, language: 'en', status: 'APPROVED', category: 'UTILITY', id: 't1' },
    { name: TEMPLATE, language: 'ur', status: 'APPROVED', category: 'UTILITY', id: 't2' },
    { name: `${TEMPLATE}_pending`, language: 'en', status: 'PENDING', category: 'MARKETING', id: 't3' },
  ]);
  await page.goto('/admin/whatsapp/templates');
  await page.locator('[data-action="wa.templates.sync"]').click();
  const en = page.locator(`[data-template="${TEMPLATE}"][data-language="en"]`);
  await expect(en.locator('[data-template-status="APPROVED"]')).toBeVisible();
  await en.locator('[data-field="tpl-body"]').fill('Dear {{1}}, your number is {{2}}.');
  await en.locator('[data-field="tpl-var-1"]').selectOption('business_name');
  await en.locator('[data-field="tpl-var-2"]').selectOption('membership_number');
  await en.locator('[data-field="template-buttons"]').fill('Renew now, Contact us');
  await en.locator('[data-action="wa.template.save"]').click();
  await expect(en.getByRole('status')).toContainText('Wording saved');
  await page.reload();
  await expect(en.locator('[data-field="template-buttons"]')).toHaveValue('Renew now, Contact us');
  const pending = page.locator(`[data-template="${TEMPLATE}_pending"]`);
  await pending.locator('[data-field="tpl-body"]').fill('Trying to approve this by saving');
  await pending.locator('[data-action="wa.template.save"]').click();
  await expect(pending.getByRole('status')).toContainText('Wording saved');
  await expect(pending.locator('[data-template-status="PENDING"]')).toBeVisible();
  const ur = page.locator(`[data-template="${TEMPLATE}"][data-language="ur"]`);
  await ur.locator('[data-field="tpl-body"]').fill('محترم {{1}}');
  await ur.locator('[data-field="tpl-var-1"]').selectOption('business_name');
  await ur.locator('[data-action="wa.template.save"]').click();
  await expect(ur.getByRole('status')).toContainText('Wording saved');
});

test('one message from a profile: no consent is refused; a template goes with the right values; status follows signed events', async ({
  page,
}) => {
  await signInAs(page, 'sg');
  await page.goto(`/admin/business-directory/profile?id=${members[0]}`);
  const panel = page.locator('[data-section="whatsapp"]');
  await panel.locator('[data-field="send-template"]').selectOption({ label: `${TEMPLATE} · en` });
  await panel.locator('[data-action="wa.send"]').click();
  await expect(panel.getByRole('alert')).toContainText('No recorded consent');
  expect((await sent()).filter((m) => m.to === phone(0))).toHaveLength(0);

  const consent = page.locator('[data-section="consent"]');
  await consent.locator('[data-field="consent-evidence"]').fill('Signed form 7');
  await consent.locator('[data-action="biz.consent.save"]').click();
  await expect(page.locator('[data-consent-state="granted"]')).toBeVisible();

  await panel.locator('[data-field="send-category"]').selectOption('membership');
  await panel.locator('[data-field="send-template"]').selectOption({ label: `${TEMPLATE} · en` });
  await panel.locator('[data-action="wa.send"]').click();
  await expect(panel.getByRole('status')).toContainText('Accepted by the provider');
  const mine = (await sent()).filter((m) => m.to === phone(0));
  expect(mine).toHaveLength(1);
  expect(mine[0]!.template!.components[0]!.parameters.map((p) => p.text)).toEqual([names[0], memberNos[0]]);

  // accepted is not delivered
  await page.reload();
  await expect(panel.locator('[data-last-state="submitted"]')).toBeVisible();

  // the worker finds the WhatsApp id, then signed events move it forward; a late one cannot move it back
  await fake('/__test/advance');
  await admin
    .from('whatsapp_messages')
    .update({ submitted_at: new Date(Date.now() - 120_000).toISOString() })
    .eq('phone', phone(0));
  expect((await tick(page)).status()).toBe(200);
  const { data: row } = await admin.from('whatsapp_messages').select('wa_id, state').eq('phone', phone(0)).single();
  expect(row!.state).toBe('sent');
  expect((await postEvent(page, event({ statuses: [{ id: row!.wa_id, status: 'read' }] }))).status()).toBe(200);
  expect((await postEvent(page, event({ statuses: [{ id: row!.wa_id, status: 'delivered' }] }))).status()).toBe(200);
  await page.reload();
  await expect(panel.locator('[data-last-state="read"]')).toBeVisible();
  await expect(panel.locator('[data-wa-history] [data-provider-ref]').first()).toHaveText(row!.wa_id!);
});

test('webhooks: bad signature, old event and another account are refused; replies reach the right place; unmatched waits; STOP blocks at once', async ({
  page,
}) => {
  await signInAs(page, 'sg');
  expect((await postEvent(page, inbound(phone(1), 'forged'), { secret: 'wrong' })).status()).toBe(401);
  expect((await postEvent(page, inbound(phone(1), 'old'), { age: 3600 })).status()).toBe(401);
  // correctly signed, a plausible number, but for another account's sender
  const before = await admin
    .from('whatsapp_messages')
    .select('id', { count: 'exact', head: true })
    .eq('phone', phone(1));
  const other = event(
    { messages: [{ id: 'wamid.other', from: phone(1).slice(1), type: 'text', text: { body: 'Not for MCCI' } }] },
    '999999',
  );
  expect((await postEvent(page, other)).status()).toBe(403);
  const after = await admin
    .from('whatsapp_messages')
    .select('id', { count: 'exact', head: true })
    .eq('phone', phone(1));
  expect(after.count).toBe(before.count);

  // a reply is matched to its one business, and opens the 24-hour window
  expect((await postEvent(page, inbound(phone(1), 'Hello MCCI'))).status()).toBe(200);
  await page.goto(`/admin/whatsapp/inbox?q=${encodeURIComponent(phone(1))}`);
  await page.locator(`[data-conversation="${phone(1)}"]`).click();
  await expect(page.locator(`[data-thread="${phone(1)}"]`)).toContainText('Hello MCCI');
  await expect(page.locator(`[data-thread="${phone(1)}"]`)).toContainText(names[1]!);
  await expect(page.locator('[data-window="open"]')).toBeVisible();
  await page.goto(`/admin/whatsapp/inbox?q=${encodeURIComponent(names[1]!)}`);
  await expect(page.locator(`[data-conversation="${phone(1)}"]`)).toBeVisible();
  await page.goto('/admin/whatsapp/inbox?q=Contact%201');
  await expect(page.locator(`[data-conversation="${phone(1)}"]`)).toBeVisible();
  await page.goto(`/admin/whatsapp/inbox?q=${encodeURIComponent(phone(1))}`);
  await page.locator(`[data-conversation="${phone(1)}"]`).click();

  // internal note, assignment
  await page.locator('[data-field="note-body"]').fill('Call them back');
  await page.locator('[data-action="wa.note.add"]').click();
  await expect(page.locator('[data-notes="1"]')).toContainText('Call them back');
  await page.locator('[data-field="conv-status"]').selectOption('pending');
  await page.locator('[data-action="wa.conv.save"]').click();
  await expect(page.locator('[data-section="manage"]').getByRole('status')).toContainText('Saved');

  // unknown number: nobody's, until a person links it
  expect((await postEvent(page, inbound(phone(90), 'Who is this?'))).status()).toBe(200);
  await page.goto('/admin/whatsapp/inbox?show=unmatched');
  await page.locator(`[data-conversation="${phone(90)}"]`).click();
  await expect(page.locator('[data-section="reply"]')).toHaveCount(0);
  await page.locator('[data-field="link-member"]').fill(memberNos[3]!);
  await page.locator('[data-action="wa.conv.link"]').click();
  await expect(page.locator('[data-section="reply"]')).toBeVisible();

  // STOP: suppressed immediately, whatever a person selects afterwards
  await grant(1);
  expect((await postEvent(page, inbound(phone(1), ' Stop '))).status()).toBe(200);
  await page.goto(`/admin/business-directory/profile?id=${members[1]}`);
  await expect(page.locator('[data-consent-state="opted_out"]')).toBeVisible();
  const panel = page.locator('[data-section="whatsapp"]');
  await panel.locator('[data-field="send-template"]').selectOption({ label: `${TEMPLATE} · en` });
  await panel.locator('[data-action="wa.send"]').click();
  await expect(panel.getByRole('alert')).toContainText('Opted out');
});

test('media: a renamed file is refused; a real one goes by an expiring link only inside the window', async ({
  page,
}) => {
  await signInAs(page, 'sg');
  await admin.from('outreach_suppressions').update({ active: false }).eq('phone', phone(1));
  await grant(1);
  const upload = (name: string, mimeType: string, buffer: Buffer) =>
    page.request.post('/api/whatsapp/attachments', { multipart: { file: { name, mimeType, buffer } } });
  expect((await upload('virus.pdf', 'application/pdf', Buffer.from('MZ-not-a-pdf'))).status()).toBe(400);
  const ok = await upload('circular.pdf', 'application/pdf', Buffer.from('%PDF-1.4 test'));
  expect(ok.status()).toBe(200);
  const att = (await ok.json()) as { id: string };

  await page.goto(`/admin/business-directory/profile?id=${members[1]}`);
  const panel = page.locator('[data-section="whatsapp"]');
  await panel
    .locator('[data-field="attachment"]')
    .setInputFiles({ name: 'circular.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test') });
  await expect(panel.locator('[data-attachment="circular.pdf"]')).toBeVisible();
  await panel.locator('[data-field="send-body"]').fill('For {{business_name}}');
  await panel.locator('[data-action="wa.send"]').click();
  await expect(panel.getByRole('status')).toContainText('Accepted by the provider');
  const doc = (await sent()).filter((m) => m.to === phone(1) && m.type === 'document');
  expect(doc).toHaveLength(1);
  const link = doc[0]!.payload!.link!;
  expect(doc[0]!.payload).toMatchObject({ filename: 'circular.pdf', caption: `For ${names[1]}` });
  expect((await page.request.get(link)).status()).toBe(200);
  expect((await page.request.get(link.replace(/sig=[0-9a-f]{4}/, 'sig=0000'))).status()).toBe(404);
  expect((await page.request.get(`/api/whatsapp/media/${att.id}`)).status()).toBe(404);

  // free text outside the window is refused
  await page.goto(`/admin/business-directory/profile?id=${members[2]}`);
  await grant(2);
  await page.reload();
  const closed = page.locator('[data-section="whatsapp"]');
  await closed.locator('[data-field="send-body"]').fill('Hello');
  await closed.locator('[data-action="wa.send"]').click();
  await expect(closed.getByRole('alert')).toContainText('Outside the 24-hour window');
});

test('campaign: preview explains exclusions, approval by someone else, exact-count launch, one message per recipient across restarts', async ({
  page,
  browser,
}) => {
  const officer = await browser.newPage();
  await signInAs(officer, 'staff');
  const f = encodeURIComponent(JSON.stringify(filterOf()));
  await officer.goto(`/admin/whatsapp/campaigns/new?f=${f}`);
  const c = officer.locator('[data-composer]');
  await expect(c.locator('[data-sender]')).toContainText('+92 61 000000');
  await c.locator('[data-field="campaign-name"]').fill(`Renewal ${tag}`);
  // the master template is the default; this campaign uses a plain approved template
  await c.locator('[data-field="kind-template"]').check();
  await c.locator('[data-field="campaign-category"]').selectOption('membership');
  await c.locator('[data-field="campaign-template"]').selectOption({ label: `${TEMPLATE} · en · UTILITY` });
  await c.locator('[data-action="wa.audience.preview"]').click();
  // three have consent (0, 1, 2); 3 has none and is named as excluded
  await expect(c.locator('[data-audience-eligible="3"]')).toBeVisible();
  await expect(c.locator('[data-block="no_consent"]')).toContainText('1');
  await expect(c.locator('[data-sample]').first()).toContainText('Dear');
  // manual exclusion
  await c.locator(`[data-recipient="${memberNos[2]}"] [data-action="wa.audience.exclude"]`).click();
  await expect(c.locator('[data-audience-eligible="2"]')).toBeVisible();
  await c.locator('[data-action="wa.campaign.create"]').click();
  await expect(officer.locator('[data-campaign-status="draft"]')).toBeVisible();
  const id = new URL(officer.url()).searchParams.get('id')!;
  expect((await sent()).filter((m) => m.key === `mcci-c-${id}`)).toHaveLength(0); // saving sends nothing

  await officer.locator('[data-action="wa.campaign.submit"]').click();
  await expect(officer.locator('[data-campaign-status="pending_approval"]')).toBeVisible();
  await expect(officer.locator('[data-action="wa.campaign.approve"]')).toHaveCount(0);
  await officer.close();

  const countBefore = (await sent()).length;
  await signInAs(page, 'sg');
  await page.goto(`/admin/whatsapp/campaigns/view?id=${id}`);
  await page.locator('[data-action="wa.campaign.approve"]').click();
  await expect(page.locator('[data-campaign-status="approved"]')).toBeVisible();
  await expect.poll(async () => (await sent()).length).toBe(countBefore); // approving sends nothing
  await page.locator('[data-action="wa.campaign.start"]').click();
  await expect(page.locator('[data-start-preview]')).toContainText('Dear');
  await page.locator('[data-action="wa.campaign.start.confirm"]').click();
  await expect(page.locator('[data-campaign-status="queued"]')).toBeVisible();

  // a batch; two recipients; the excluded business is not in the snapshot at all
  await page.locator('[data-action="wa.campaign.batch"]').click();
  await expect(page.locator('[data-campaign-status="completed"]')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('[data-stat="submitted"]')).toHaveAttribute('data-value', '2');
  await expect(page.locator('[data-stat="delivered"]')).toHaveAttribute('data-value', '0');
  await expect.poll(async () => (await sent()).length).toBe(countBefore + 2);
  await expect(page.locator(`[data-recipient="${memberNos[2]}"]`)).toHaveCount(0);
  await expect(page.locator(`[data-recipient="${memberNos[3]}"][data-status="skipped"]`)).toBeVisible();

  // finished: on Campaign History, off the list of campaigns in hand
  await page.goto('/admin/whatsapp/campaigns/history');
  await expect(page.locator(`[data-campaign="Renewal ${tag}"]`)).toBeVisible();
  await page.goto('/admin/whatsapp/campaigns');
  await expect(page.locator(`[data-campaign="Renewal ${tag}"]`)).toHaveCount(0);
  await page.goto(`/admin/whatsapp/campaigns/view?id=${id}`);

  // a worker that died after sending: the same message comes round again, with the same key, and no second message
  await admin
    .from('whatsapp_messages')
    .update({ state: 'submitting', next_attempt_at: new Date(Date.now() - 1000).toISOString() })
    .eq('campaign_id', id);
  await admin.from('whatsapp_campaigns').update({ status: 'sending' }).eq('id', id);
  expect((await tick(page)).status()).toBe(200);
  await expect.poll(async () => (await sent()).length).toBe(countBefore + 2);

  // the results export has no numbers
  const csv = await page.request.get(`/api/whatsapp/campaigns/${id}/export`);
  expect(csv.status()).toBe(200);
  const text = await csv.text();
  expect(text).toContain(names[0]!);
  expect(text).not.toContain(phone(0));
});

test('pause stops submission, an outage waits without resending, cancel keeps what went; a late opt-out is skipped', async ({
  page,
}) => {
  await signInAs(page, 'sg');
  const db = admin;
  const mk = async (suffix: string) => {
    const { data: tpl } = await db
      .from('whatsapp_templates')
      .select('id')
      .eq('name', TEMPLATE)
      .eq('language', 'en')
      .single();
    const { data: camp } = await db
      .from('whatsapp_campaigns')
      .insert({
        name: `${suffix} ${tag}`,
        category: 'membership',
        message_kind: 'template',
        template_id: tpl!.id,
        status: 'queued',
      })
      .select('id')
      .single();
    await db.from('whatsapp_campaign_recipients').insert(
      [0, 1, 2].map((i) => ({
        campaign_id: camp!.id,
        company_id: companies[i],
        member_no: memberNos[i],
        business_name: names[i],
        phone: phone(i),
      })),
    );
    return camp!.id as string;
  };
  const id = await mk('Control');
  await page.goto(`/admin/whatsapp/campaigns/view?id=${id}`);
  await page.locator('[data-action="wa.campaign.pause"]').click();
  await expect(page.locator('[data-campaign-status="paused"]')).toBeVisible();
  const before = (await sent()).length;
  await tick(page);
  expect((await sent()).length).toBe(before);

  // resumes during an outage: nothing is lost, nothing is marked sent
  await page.locator('[data-action="wa.campaign.resume"]').click();
  await expect(page.locator('[data-campaign-status="queued"]')).toBeVisible();
  await fake('/__test/mode', { mode: 'rate_limit' });
  expect((await tick(page)).status()).toBe(200);
  expect((await sent()).length).toBe(before);
  await fake('/__test/mode', { mode: 'ok' });

  // one recipient opts out now: the check immediately before dispatch stops it
  await db
    .from('outreach_suppressions')
    .upsert({ phone: phone(2), reason: 'Late opt-out', source: 'recipient' }, { onConflict: 'phone' });
  await db
    .from('whatsapp_messages')
    .update({ next_attempt_at: new Date(Date.now() - 1000).toISOString() })
    .eq('campaign_id', id);
  expect((await tick(page)).status()).toBe(200);
  await page.reload();
  await expect(
    page
      .locator(`[data-recipient="${memberNos[2]}"][data-status="skipped"]`)
      .or(page.locator(`[data-recipient="${memberNos[2]}"][data-status="failed"]`)),
  ).toBeVisible();
  const toSuppressed = (await sent()).filter((m) => m.to === phone(2) && m.key.includes('mcci-c-'));
  expect(toSuppressed).toHaveLength(0);
  await db.from('outreach_suppressions').update({ active: false }).eq('phone', phone(2));

  const second = await mk('Cancel');
  await page.goto(`/admin/whatsapp/campaigns/view?id=${second}`);
  await page.locator('[data-action="wa.campaign.cancel"]').click();
  await page.locator('[data-action="wa.campaign.cancel.confirm"]').click();
  await expect(page.locator('[data-campaign-status="cancelled"]')).toBeVisible();
  await expect(page.locator('[data-stat="cancelled"]')).toHaveAttribute('data-value', '3');
  const now = (await sent()).length;
  await tick(page);
  expect((await sent()).length).toBe(now);
});

test('selecting in the directory carries to the composer; the new filters work', async ({ page }) => {
  await signInAs(page, 'sg');
  const f = encodeURIComponent(JSON.stringify(filterOf()));
  await page.goto(`/admin/business-directory?f=${f}`);
  await page
    .locator('[data-directory] tbody tr', { hasText: names[0]! })
    .locator('[data-action="biz.select.row"]')
    .check();
  await page.locator('[data-action="wa.compose.open"]').click();
  await expect(page.locator('[data-field="who-selected"]')).toBeChecked();
  await page.locator('[data-field="kind-template"]').check();
  await page.locator('[data-field="campaign-template"]').selectOption({ label: `${TEMPLATE} · en · UTILITY` });
  await page.locator('[data-field="campaign-category"]').selectOption('membership');
  await page.locator('[data-action="wa.audience.preview"]').click();
  await expect(page.locator('[data-audience-eligible="1"]')).toBeVisible();
  // leave no selection behind for other tests
  await page.evaluate(() => sessionStorage.clear());

  const contacted = encodeURIComponent(
    JSON.stringify({
      groups: [
        {
          match: 'all',
          exclude: false,
          rules: [
            { field: 'nature', op: 'in', value: [NATURE] },
            { field: 'previously_contacted', op: 'is', value: true },
          ],
        },
      ],
    }),
  );
  await page.goto(`/admin/business-directory?f=${contacted}`);
  await expect(page.locator('[data-directory] tbody tr', { hasText: names[0]! })).toBeVisible();
  await expect(page.locator('[data-directory] tbody tr', { hasText: names[3]! })).toHaveCount(0);
});

test('master templates: English and Urdu, approval only from the provider, fields and preview, five audience groups, a reviewed mixed draft, fields reach the provider', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await signInAs(page, 'sg');
  await setSettings(page, { sending: true, threshold: 10 });

  // four masters, each in two languages; none is approved until the provider lists it
  await page.goto('/admin/whatsapp/templates');
  await expect(page.locator('[data-master]')).toHaveCount(4);
  await expect(page.locator('[data-master-version]')).toHaveCount(8);
  await expect(page.locator('[data-master="membership"] [data-meta-category="UTILITY"]')).toBeVisible();
  await expect(page.locator('[data-master="events"] [data-meta-category="MARKETING"]')).toBeVisible();
  await fake('/__test/templates', [
    { name: TEMPLATE, language: 'en', status: 'APPROVED', category: 'UTILITY', id: 't1' },
    { name: 'mcci_official_announcement', language: 'en', status: 'APPROVED', category: 'MARKETING', id: 'm1' },
  ]);
  await page.locator('[data-action="wa.templates.sync"]').click();
  const card = page.locator('[data-master="announcements"]');
  await expect(card.locator('[data-master-version="en"] [data-master-status="APPROVED"]')).toBeVisible();
  await expect(card.locator('[data-master-version="ur"] [data-master-status="NOT_ON_PROVIDER"]')).toBeVisible();
  await expect(card.locator('[data-master-version="en"] [data-master-locked="meta"]')).toBeVisible();
  await card.locator('[data-master-version="ur"] [data-action="wa.master.submission"]').click();
  await expect(card.locator('[data-submission="ur"]')).toContainText('mcci_official_announcement');
  // an administrator may change wording Meta does not hold; a broken variable is refused before saving
  const ur = card.locator('[data-master-version="ur"]');
  await ur.locator('[data-field="master-body-ur"]').fill('{{1}} بغیر متن');
  await expect(ur.locator('[data-wording-problem]')).toBeVisible();
  await expect(ur.locator('[data-action="wa.master.save"]')).toBeDisabled();

  // the audience, set here whatever earlier tests left: 0 consented with an open conversation, 1 consented without
  // one, 2 opted out, 3 never consented
  await admin
    .from('outreach_suppressions')
    .delete()
    .in('phone', [phone(0), phone(1)]);
  await grant(0, ['announcements']);
  await grant(1, ['announcements']);
  await grant(2, ['announcements']);
  await admin.from('outreach_consents').delete().eq('company_id', companies[3]!);
  await admin
    .from('outreach_suppressions')
    .upsert({ phone: phone(2), reason: 'E2E opt-out', source: 'staff', active: true }, { onConflict: 'phone' });
  await admin
    .from('whatsapp_conversations')
    .update({ last_inbound_at: null })
    .in('phone', [phone(1), phone(2), phone(3)]);
  expect((await postEvent(page, inbound(phone(0), 'Hello MCCI'))).status()).toBe(200);

  const f = encodeURIComponent(JSON.stringify(filterOf()));
  await page.goto(`/admin/whatsapp/campaigns/new?f=${f}`);
  const c = page.locator('[data-composer]');
  await expect(c.locator('[data-field="kind-master"]')).toBeChecked();
  await c.locator('[data-field="campaign-name"]').fill(`Office timings ${tag}`);
  // Urdu is not approved: it can be prepared, never turned into a campaign
  await c.locator('[data-field="master-language-ur"]').check();
  await expect(c.locator('[data-master-not-approved]')).toBeVisible();
  await expect(c.locator('[data-action="wa.master.create"]')).toBeDisabled();
  await c.locator('[data-field="master-language-en"]').check();
  // DEF-008 (6 Nov 2026): examples looked like typed values while the preview said [subject]. Examples now read
  // "e.g. …", an empty field shows by its label in the preview, and the note under it names what is still empty.
  await expect(c.locator('[data-field="master-subject"]')).toHaveValue('');
  await expect(c.locator('[data-field="master-subject"]')).toHaveAttribute('placeholder', /^e\.g\. /);
  await expect(c.locator('[data-master-preview]')).toContainText('[Subject]');
  await expect(c.locator('[data-master-missing]')).toContainText('Subject');
  await c.locator('[data-field="master-subject"]').fill('Revised office timings');
  await c.locator('[data-field="master-summary"]').fill('From 1 December the Secretariat opens 9:00 am to 4:00 pm.');
  await c.locator('[data-field="master-link"]').fill('https://example.org/news');
  await expect(c.locator('[data-master-preview]')).toContainText('Subject: Revised office timings');
  await expect(c.locator('[data-master-missing]')).toHaveCount(0);
  await c.locator('[data-action="wa.master.audience"]').click();
  await expect(c.locator('[data-breakdown-total="4"]')).toBeVisible();
  await expect(c.locator('[data-group="free_text"]')).toHaveAttribute('data-count', '1');
  await expect(c.locator('[data-group="template_required"]')).toHaveAttribute('data-count', '1');
  await expect(c.locator('[data-group="opted_out"]')).toHaveAttribute('data-count', '1');
  await expect(c.locator('[data-group="no_consent"]')).toHaveAttribute('data-count', '1');
  await expect(c.locator('[data-group="invalid"]')).toHaveAttribute('data-count', '0');
  await expect(c.locator(`[data-recipient="${memberNos[3]}"]`)).toHaveAttribute('data-row-group', 'no_consent');
  await expect(c.locator('[data-capacity]')).toBeVisible();
  // mixed only when chosen: the free-text version starts from the same filled message
  await c.locator('[data-field="master-mixed"]').check();
  await expect(c.locator('[data-field="master-mixed-body"]')).toHaveValue(/Revised office timings/);
  await c.locator('[data-action="wa.master.create"]').click();
  await expect(page.locator('[data-campaign-status="draft"]')).toBeVisible();
  const id = new URL(page.url()).searchParams.get('id')!;
  const { data: rec } = await admin
    .from('whatsapp_campaign_recipients')
    .select('company_id, kind, status, reason')
    .eq('campaign_id', id);
  const of = (i: number) => rec!.find((r) => r.company_id === companies[i])!;
  expect(of(0)).toMatchObject({ kind: 'text', status: 'pending' });
  expect(of(1)).toMatchObject({ kind: 'template', status: 'pending' });
  expect(of(3)).toMatchObject({ status: 'skipped', reason: 'no_consent' }); // never silently left out

  // launch: the template carries the fields, the open conversation gets the reviewed free text
  const before = (await sent()).length;
  await page.locator('[data-action="wa.campaign.submit"]').click();
  await expect(page.locator('[data-campaign-status="approved"]')).toBeVisible();
  await page.locator('[data-action="wa.campaign.start"]').click();
  await page.locator('[data-action="wa.campaign.start.confirm"]').click();
  await page.locator('[data-action="wa.campaign.batch"]').click();
  await expect(page.locator('[data-campaign-status="completed"]')).toBeVisible({ timeout: 20_000 });
  await expect.poll(async () => (await sent()).length).toBe(before + 2);
  const out = (await sent()).slice(before);
  const tpl = out.find((m) => m.to === phone(1))!;
  expect(tpl.type).toBe('template');
  expect(tpl.template!.name).toBe('mcci_official_announcement');
  expect(tpl.template!.components[0]!.parameters.map((p) => p.text)).toEqual([
    'Contact 1',
    names[1],
    'Revised office timings',
    'From 1 December the Secretariat opens 9:00 am to 4:00 pm.',
    'https://example.org/news',
  ]);
  const text = out.find((m) => m.to === phone(0))!;
  expect(text.type).toBe('text');
  expect(text.body).toContain('Revised office timings');
});

test('campaign readiness: every figure says where it comes from; an administrator confirms the limit; nothing is raised from counts', async ({
  page,
}) => {
  const { data: original } = await admin.from('whatsapp_quota').select('*').single();
  try {
    await signInAs(page, 'sg');
    await page.goto('/admin/whatsapp/readiness');
    await expect(page.locator('[data-section="account"] [data-source="confirmed"]')).toBeVisible();
    await expect(page.locator('[data-section="capacity"] [data-source="counted"]')).toBeVisible();
    await expect(page.locator('[data-value-verification]')).toHaveAttribute(
      'data-value-verification',
      original!.verification,
    );
    await expect(page.locator('[data-issue="statuses"], [data-issue="verification"]').first()).toBeVisible();
    const week = await page.locator('[data-value-week]').getAttribute('data-value-week');

    await page.locator('[data-field="quota-tier"]').fill('TIER_2K');
    await page.locator('[data-field="quota-limit"]').fill('2000');
    await page.locator('[data-field="quota-verification"]').selectOption('verified');
    await page.locator('[data-field="quota-note"]').fill(`E2E ${tag}: WhatsApp Manager shows Tier 2K`);
    await page.locator('[data-action="wa.quota.confirm"]').click();
    await expect(page.locator('[data-section="confirm"]').getByRole('status')).toContainText(
      'Account figures confirmed',
    );
    await expect(page.locator('[data-value-limit]')).toHaveAttribute('data-value-limit', '2000');
    await expect(page.locator('[data-value-target]')).toHaveAttribute('data-value-target', '1000');
    await expect(page.locator('[data-issue="verification"]')).toHaveCount(0);
    await expect(page.locator('[data-value-week]')).toHaveAttribute('data-value-week', week!); // confirming changes no count
    const { data: row } = await admin.from('whatsapp_quota').select('note, confirmed_by, source').single();
    expect(row).toMatchObject({ note: `E2E ${tag}: WhatsApp Manager shows Tier 2K`, confirmed_by: accounts.sg!.id });
    // the audit log is not granted to the service role: read it through the local SQL hook
    const reason = execSync(process.env.MCCI_IT_SQL_CMD ?? '', {
      input: "select reason from public.audit_log where object = 'whatsapp_quota' order by id desc limit 1;",
    }).toString();
    expect(reason).toContain(`E2E ${tag}`);
  } finally {
    await admin.from('whatsapp_quota').update(original!).eq('id', true);
  }
});

test('member opt-in: closed until MCCI opens it, then the member chooses and can withdraw', async ({
  page,
  browser,
}) => {
  test.skip(!accounts.companyId, 'needs the e2e member company');
  const member = await browser.newPage();
  await signInAs(member, 'member');
  await member.goto('/portal/profile');
  await expect(member.locator('[data-section="whatsapp-consent"]')).toHaveCount(0);

  await signInAs(page, 'sg');
  await setSettings(page, { consentOpen: true });
  await member.reload();
  const card = member.locator('[data-section="whatsapp-consent"]');
  const number = phone(50);
  await card.locator('[data-field="member-phone"]').fill(number);
  await card.locator('[data-field="member-grant"]').check();
  await card.locator('[data-category="opportunities"]').uncheck();
  await card.locator('[data-action="wa.member.save"]').click();
  await expect(card.getByRole('status')).toContainText('Your choice is saved');
  const { data: yes } = await admin
    .from('outreach_consents')
    .select('status, method, categories, wording_version')
    .eq('phone', number)
    .order('id', { ascending: false })
    .limit(1)
    .single();
  expect(yes).toMatchObject({ status: 'granted', method: 'member_portal', wording_version: 'draft-1' });
  expect(yes!.categories).not.toContain('opportunities');

  await card.locator('[data-field="member-grant"]').uncheck();
  await card.locator('[data-action="wa.member.save"]').click();
  await expect(card.getByRole('status')).toContainText('will not receive');
  const { data: stop } = await admin.from('outreach_suppressions').select('active').eq('phone', number).single();
  expect(stop!.active).toBe(true);
  await member.close();
  await admin.from('outreach_suppressions').delete().eq('phone', number);
  await admin.from('outreach_consents').delete().eq('phone', number);
  await setSettings(page, { consentOpen: false });
});

test('boundaries: members and outsiders are refused; view-only staff see figures, not messages', async ({
  page,
  browser,
}) => {
  const anon = await browser.newPage();
  expect((await anon.request.post('/api/cron/whatsapp')).status()).toBe(401);
  expect(
    (
      await anon.request.post('/api/whatsapp/attachments', {
        multipart: { file: { name: 'a.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF') } },
      })
    ).status(),
  ).toBe(403);
  await anon.close();

  const member = await browser.newPage();
  await signInAs(member, 'member');
  await member.goto('/admin/whatsapp/inbox');
  await expect(member.locator('[data-conversations]')).toHaveCount(0);
  await member.close();

  await signInAs(page, 'president');
  await page.goto('/admin/whatsapp');
  await expect(page.locator('[data-wa-status]')).toBeVisible();
  await page.goto('/admin/whatsapp/inbox');
  await expect(page.locator('[data-conversations]')).toHaveCount(0);
  await page.goto('/admin/whatsapp/consent');
  await expect(page.locator('[data-consent-numbers]')).toHaveCount(0);
});

test('turn sending off again: the switch stops everything', async ({ page }) => {
  await signInAs(page, 'sg');
  await setSettings(page, { sending: false, threshold: 25 });
  await page.goto(`/admin/business-directory/profile?id=${members[0]}`);
  const panel = page.locator('[data-section="whatsapp"]');
  await panel.locator('[data-field="send-template"]').selectOption({ label: `${TEMPLATE} · en` });
  await panel.locator('[data-action="wa.send"]').click();
  await expect(panel.getByRole('alert')).toContainText('switched off');
});
