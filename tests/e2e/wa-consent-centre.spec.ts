import { execSync } from 'node:child_process';
import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readLocalEnv } from '../integration/local-env';
import { readAccounts } from './accounts';
import { expectNoHorizontalOverflow, expectNoOrphans, signInAs } from './helpers';

/**
 * WhatsApp consent centre (migration 0690, docs/30 §12; owner's brief and decisions A–C of 6 Nov 2026), end to end
 * against the local stack and the stand-in provider. The member's own journey (number, categories, consent, JOIN,
 * withdraw, re-subscribe), what staff see on the Member Record and the Members Register, staff-assisted consent and its
 * limits, the audience, and the screens in English, Urdu and at 360 px. Screenshots go to docs/screenshots/wa-consent.
 */
// the only spec that changes settings.whatsapp.consentOpen (others seed consent directly), so it is set at each step
test.describe.configure({ mode: 'serial' });

const accounts = readAccounts();
const SECRET = 'test-webhook-secret-not-a-real-one';
const OWN_PHONE_ID = '100200300';
const SHOTS = 'docs/screenshots/wa-consent';
const tag = randomBytes(3).toString('hex');
const seed = Number.parseInt(tag, 16) % 9_000_000;
const MEMBER_PHONE_LOCAL = `0301${String(seed).padStart(7, '0')}`;
const MEMBER_PHONE = `+92${MEMBER_PHONE_LOCAL.slice(1)}`;
const OTHER_PHONE = `+92302${String(seed).padStart(7, '0')}`;
const TARGET_PHONE = `+92303${String(seed).padStart(7, '0')}`;
let admin: SupabaseClient;
let target = { company: '', member: '' };

const sql = (q: string) => {
  const cmd = process.env.MCCI_IT_SQL_CMD;
  if (!cmd) throw new Error('MCCI_IT_SQL_CMD is needed to change the WhatsApp setting');
  return execSync(cmd, { input: q, encoding: 'utf8' }).trim();
};
const consentOpen = (open: boolean) =>
  sql(`update private.settings set value = value || '{"consentOpen":${open},"consentVersion":"e2e-v1"}'::jsonb where key = 'whatsapp';`);

/** one inbound WhatsApp text, signed as the provider signs it */
async function inbound(page: Page, from: string, text: string, eventId = randomUUID()) {
  const body = JSON.stringify({
    id: randomUUID(),
    type: 'messages',
    data: {
      metadata: { phone_number_id: OWN_PHONE_ID },
      messages: [
        {
          id: `wamid.${randomUUID()}`,
          from: from.replace('+', ''),
          type: 'text',
          text: { body: text },
          timestamp: String(Math.floor(Date.now() / 1000)),
        },
      ],
    },
  });
  const t = String(Math.floor(Date.now() / 1000));
  const sig = createHmac('sha256', SECRET).update(`${t}.${body}`).digest('hex');
  const r = await page.request.post('/api/webhooks/whatsapp', {
    data: body,
    headers: { 'Content-Type': 'application/json', 'X-IQP-Timestamp': t, 'X-IQP-Signature': sig, 'X-IQP-Event-Id': eventId },
  });
  expect(r.status()).toBe(200);
  return (await r.json()) as { result: string };
}

const shot = async (page: Page, name: string) => {
  mkdirSync(SHOTS, { recursive: true });
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
};

// fixtures and the setting belong to the desktop flow only: the other projects run just the layout test
test.beforeAll(async ({}, info) => {
  if (!accounts.backend || info.project.name !== 'desktop') return;
  const env = readLocalEnv()!;
  admin = createClient(env.url, env.secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  // the member's register record carries a mobile in its telephone field, as imported registers do (MCCI-A-1905)
  await admin.from('companies').update({ tel: `061-4500000, ${MEMBER_PHONE_LOCAL}` }).eq('id', accounts.companyId!);
  const { data: c } = await admin
    .from('companies')
    .insert({ name: `WA Consent Target ${tag}`, biz_type: 'prop', tel: '061-4511111' })
    .select('id')
    .single();
  const { data: m } = await admin
    .from('members')
    .insert({
      member_no: `MCCI-A-8${String(seed).slice(0, 4)}`,
      company_id: c!.id,
      class: 'Associate',
      status: 'Permanent',
      rep_name: 'Target Rep',
      since: '2022-04-01',
      valid_to: '2099-03-31',
    })
    .select('id')
    .single();
  target = { company: c!.id, member: m!.id };
  consentOpen(false);
});

test.afterAll(async ({}, info) => {
  if (!admin || info.project.name !== 'desktop') return;
  consentOpen(false);
  for (const company of [accounts.companyId!, target.company].filter(Boolean)) {
    await admin.from('outreach_join_codes').delete().eq('company_id', company);
    await admin.from('outreach_verifications').delete().eq('company_id', company);
    await admin.from('outreach_contact_history').delete().eq('company_id', company);
    await admin.from('outreach_consents').delete().eq('company_id', company);
    await admin.from('outreach_contacts').delete().eq('company_id', company);
  }
  await admin.from('outreach_verifications').delete().in('phone', [MEMBER_PHONE, OTHER_PHONE]);
  await admin.from('outreach_suppressions').delete().in('phone', [MEMBER_PHONE, TARGET_PHONE]);
  await admin.from('whatsapp_messages').delete().in('phone', [MEMBER_PHONE, OTHER_PHONE]);
  await admin.from('whatsapp_conversations').delete().in('phone', [MEMBER_PHONE, OTHER_PHONE]);
  if (target.member) await admin.from('members').delete().eq('id', target.member);
  if (target.company) await admin.from('companies').delete().eq('id', target.company);
});

test('member: the dashboard card leads to WhatsApp Preferences; consent waits for MCCI, the number does not', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'one flow; the layouts are checked separately');
  consentOpen(false);
  await signInAs(page, 'member');
  await page.goto('/portal');
  const card = page.locator('[data-section="wa-card"]');
  await expect(card).toHaveAttribute('data-wa-status', 'no_number');
  await card.locator('[data-action="wa.card.open"]').click();
  await expect(page).toHaveURL(/\/portal\/whatsapp$/);

  // decision A: the page is always there; until MCCI opens consent only the contact can change
  await expect(page.locator('[data-wa-closed]')).toBeVisible();
  await expect(page.locator('[data-action="wa.prefs.consent"]')).toHaveCount(0);
  await expect(page.locator('[data-wa-categories-list] li')).toHaveCount(5);
  await expectNoOrphans(page);

  // the register's mobile is only suggested, never filled in
  await expect(page.locator('[data-field="wa-phone"]')).toHaveValue('');
  await expect(page.locator('[data-action="wa.prefs.suggest"]')).toHaveCount(1);
  await page.locator('[data-field="wa-name"]').fill('E2E Contact');
  await page.locator('[data-field="wa-phone"]').fill('0300-12');
  await page.locator('[data-action="wa.prefs.contact"]').click();
  await expect(page.locator('[data-section="wa-contact"]').getByRole('alert')).toContainText('WhatsApp mobile number');
  await expect(page.locator('[data-field="wa-name"]')).toHaveValue('E2E Contact');
  await page.locator('[data-action="wa.prefs.suggest"]').click();
  await page.locator('[data-action="wa.prefs.contact"]').click();
  await expect(page.locator('[data-section="wa-contact"]').getByRole('status')).toContainText('saved');
  await expect(page.locator('[data-wa-phone]')).toContainText(`+92 ${MEMBER_PHONE.slice(3, 6)} ${MEMBER_PHONE.slice(6)}`);
  await expect(page.locator('[data-wa-status]').first()).toHaveAttribute('data-wa-status', 'not_collected');
  await shot(page, '01-member-closed-en');
});

test('member: categories start unticked; consent needs a yes; staff see it at once; JOIN confirms the exact number', async ({
  page,
  browser,
}, info) => {
  test.skip(info.project.name !== 'desktop', 'one flow');
  consentOpen(true);
  await signInAs(page, 'member');
  await page.goto('/portal/whatsapp');
  const boxes = page.locator('[data-section="wa-consent"] input[name="categories"]');
  await expect(boxes).toHaveCount(5);
  for (const b of await boxes.all()) await expect(b).not.toBeChecked();
  await page.locator('[data-category="membership"]').check();
  await page.locator('[data-category="services"]').check();
  await page.locator('[data-action="wa.prefs.consent"]').click();
  await expect(page.locator('[data-section="wa-consent"]').getByRole('alert')).toContainText('agree');
  await expect(page.locator('[data-category="services"]')).toBeChecked();
  await page.locator('[data-field="wa-agree"]').check();
  await page.locator('[data-action="wa.prefs.consent"]').click();
  await expect(page.locator('[data-wa-state]')).toHaveText('Active');
  await expect(page.locator('[data-wa-categories]')).toHaveAttribute('data-wa-categories', 'membership,services');
  await expect(page.locator('[data-wa-version]')).toHaveAttribute('data-wa-version', 'e2e-v1');

  // staff: the register and the member record show it straight away
  const staff = await browser.newPage();
  await signInAs(staff, 'staff');
  await staff.goto(`/admin/members?q=${accounts.member!.memberNo}`);
  await expect(staff.locator('[data-wa-cell]')).toHaveAttribute('data-wa-cell', 'partial');
  await staff.goto(`/admin/member?id=${accounts.memberRowId}&tab=whatsapp`);
  const section = staff.locator('[data-section="consent"]');
  await expect(section).toHaveAttribute('data-wa-status', 'partial');
  await expect(section.locator('[data-wa-phone]')).toContainText(MEMBER_PHONE.slice(6));
  await expect(section.locator('[data-wa-verified]')).toHaveAttribute('data-wa-verified', 'no');

  // JOIN: a code, then the message — from another number first (nothing happens), then from the saved one
  await page.locator('[data-action="wa.prefs.code"]').click();
  const code = (await page.locator('.wa-code').innerText()).replace('JOIN', '').trim();
  expect(code).toMatch(/^[A-Z2-9]{6}$/);
  expect(await inbound(page, OTHER_PHONE, `JOIN ${code}`)).toEqual(expect.objectContaining({ result: 'ok' }));
  await page.locator('[data-action="wa.prefs.check"]').click();
  await expect(page.locator('[data-wa-outcome]')).toHaveAttribute('data-wa-outcome', 'mismatch');
  const event = randomUUID();
  await inbound(page, MEMBER_PHONE, `join ${code.toLowerCase()}`, event);
  expect((await inbound(page, MEMBER_PHONE, `JOIN ${code}`, event)).result).toBe('duplicate');
  await page.reload();
  await expect(page.locator('[data-wa-verified]')).toHaveAttribute('data-wa-verified', 'yes');
  await expect(page.locator('[data-wa-confirmed]')).toBeVisible();
  await shot(page, '02-member-active-en');

  await staff.reload();
  await expect(section.locator('[data-wa-verified]')).toHaveAttribute('data-wa-verified', 'yes');
  await expect(section.locator('[data-consent-history]')).toContainText('JOIN from another number');
  await shot(staff, '05-staff-member-record-en');
  await staff.goto(`/admin/members?wa=partial&q=${accounts.member!.memberNo}`);
  await expect(staff.locator('[data-wa="partial"]')).toHaveAttribute('aria-current', 'true');
  await expect(staff.locator('[data-wa-cell] [data-wa-verified]')).toBeVisible();
  await shot(staff, '06-staff-register-en');
  await staff.close();
});

test('member: withdraw; staff see the opt-out and cannot override it; fresh consent waits for a new JOIN', async ({
  page,
  browser,
}, info) => {
  test.skip(info.project.name !== 'desktop', 'one flow');
  consentOpen(true);
  await signInAs(page, 'member');
  await page.goto('/portal/whatsapp');
  await page.locator('[data-action="wa.prefs.stop"]').click();
  await page.getByRole('dialog').locator('[data-action="wa.prefs.stop.confirm"]').click();
  await expect(page.locator('[data-wa-state]')).toHaveText('Turned off');
  await expect(page.locator('[data-wa-reconsent]')).toBeVisible();
  for (const b of await page.locator('[data-section="wa-consent"] input[name="categories"]').all()) await expect(b).not.toBeChecked();

  const staff = await browser.newPage();
  await signInAs(staff, 'sg');
  await staff.goto(`/admin/member?id=${accounts.memberRowId}&tab=whatsapp`);
  await expect(staff.locator('[data-member-optout]')).toBeVisible();
  await expect(staff.locator('[data-action="biz.consent.save"]')).toHaveCount(0);
  await expect(staff.locator('[data-action="biz.unsuppress"]')).toHaveCount(0);
  // the database refuses even the highest level: no way round the screen
  expect(sql(`select private.wa_status('${accounts.companyId}')`)).toBe('opted_out');
  expect(sql(`select private.wa_block('${accounts.companyId}', '${MEMBER_PHONE}', 'membership', 'template', null)`)).toBe('suppressed');
  await staff.close();

  // fresh consent: only what is ticked now, and nothing goes until a JOIN made after it arrives
  consentOpen(true);
  await page.reload();
  await page.locator('[data-category="events"]').check();
  await page.locator('[data-field="wa-agree"]').check();
  await page.locator('[data-action="wa.prefs.consent"]').click();
  await expect(page.locator('[data-wa-state]')).toHaveText('Waiting for your WhatsApp confirmation');
  await expect(page.locator('[data-wa-categories]')).toHaveAttribute('data-wa-categories', 'events');
  await page.locator('[data-action="wa.prefs.code"]').click();
  const code = (await page.locator('.wa-code').innerText()).replace('JOIN', '').trim();
  await inbound(page, MEMBER_PHONE, `JOIN ${code}`);
  await page.locator('[data-action="wa.prefs.check"]').click();
  await expect(page.locator('[data-wa-state]')).toHaveText('Active');

  // STOP on WhatsApp works the same way, at once
  await inbound(page, MEMBER_PHONE, 'STOP');
  await page.reload();
  await expect(page.locator('[data-wa-state]')).toHaveText('Turned off');
  await expect(page.locator('[data-section="wa-history"] [data-event="consent_withdrawn"]').first()).toContainText('WhatsApp reply');
});

test('staff: assisted consent needs a method, evidence and the member’s explicit yes; view-only staff see a masked number', async ({
  page,
  browser,
}, info) => {
  test.skip(info.project.name !== 'desktop', 'one flow');
  consentOpen(true);
  await signInAs(page, 'staff');
  await page.goto(`/admin/member?id=${target.member}&tab=whatsapp`);
  const section = page.locator('[data-section="consent"]');
  await expect(section).toHaveAttribute('data-wa-status', 'no_number');
  await section.locator('[data-field="contact-name"]').fill('Target Rep');
  await section.locator('[data-field="contact-phone"]').fill(`0${TARGET_PHONE.slice(3)}`);
  await section.locator('[data-action="biz.contact.save"]').click();
  await expect(section).toHaveAttribute('data-wa-status', 'not_collected');
  for (const b of await section.locator('input[name="categories"]').all()) await expect(b).not.toBeChecked();
  await section.locator('[data-category="announcements"]').check();
  await section.locator('[data-field="consent-method"]').selectOption('phone');
  await section.locator('[data-field="consent-evidence"]').fill('Called on 6 Nov 2026, 11:00; agreed to announcements');
  await section.locator('[data-action="biz.consent.save"]').click();
  await expect(section.getByRole('alert')).toContainText('clearly agreed');
  await section.locator('[data-field="consent-confirmed"]').check();
  await section.locator('[data-action="biz.consent.save"]').click();
  await expect(section).toHaveAttribute('data-wa-status', 'partial');
  await expect(section.locator('[data-consent-history]')).toContainText('Phone call');
  await expect(section.locator('[data-consent-history]')).toContainText('e2e-v1');
  await expectNoOrphans(page);

  // decision A for staff too: with consent closed only a withdrawal can be recorded
  consentOpen(false);
  await page.reload();
  await expect(section.locator('[data-wa-closed]')).toBeVisible();
  await expect(section.locator('[data-field="consent-status"] option[value="granted"]')).toHaveCount(0);
  consentOpen(true);

  const president = await browser.newPage();
  await signInAs(president, 'president');
  await president.goto(`/admin/member?id=${target.member}&tab=whatsapp`);
  await expect(president.locator('[data-wa-phone]')).toContainText('••••');
  await expect(president.locator('[data-action="biz.consent.save"]')).toHaveCount(0);
  await expect(president.locator('[data-action="biz.contact.save"]')).toHaveCount(0);
  await president.close();
});

test('the screens in Urdu and at phone width: right-to-left, no sideways scroll', async ({ page }, info) => {
  test.skip(info.project.name === 'app-shell', 'covered by desktop and mobile-360');
  await signInAs(page, 'member');
  for (const locale of ['', '/ur']) {
    await page.goto(`${locale}/portal/whatsapp`);
    await expect(page.locator('[data-section="wa-status"]')).toBeVisible();
    if (locale) {
      await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
      await expect(page.locator('[data-section="wa-status"] h3')).toContainText('واٹس ایپ');
    }
    await expectNoHorizontalOverflow(page);
    await expectNoOrphans(page);
    await shot(page, `0${locale ? 4 : 3}-member-${locale ? 'ur' : 'en'}-${info.project.name}`);
  }
  await page.goto('/portal');
  await expect(page.locator('[data-section="wa-card"]')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await shot(page, `07-member-dashboard-${info.project.name}`);

  await signInAs(page, 'staff');
  await page.goto(`/ur/admin/member?id=${accounts.memberRowId}&tab=whatsapp`);
  await expect(page.locator('[data-section="consent"]')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await shot(page, `08-staff-member-record-ur-${info.project.name}`);
});
