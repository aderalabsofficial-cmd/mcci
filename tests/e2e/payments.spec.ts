import { randomBytes, randomUUID } from 'node:crypto';
import { expect, type Browser, type Page, test } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readLocalEnv } from '../integration/local-env';
import { signInAs } from './helpers';

/**
 * Release 5 payments and temporary membership (docs/03 §3–4, docs/05 M6):
 * A. bank account not confirmed: the member is told not to pay and cannot upload; Accounts record a counter payment;
 *    the temporary membership, certificate with QR and public verification follow; the SG extends, then revokes.
 * B. the SG confirms MCCI's bank account; the member uploads a receipt; Accounts reject it with a reason; the member
 *    uploads again; Accounts verify → temporary membership. The bank account is set back to "not confirmed".
 */
const env = readLocalEnv();
test.skip(!env, 'needs the local Supabase stack (MCCI_IT_LOCAL=1 with its URL and keys)');
test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'desktop project only'));
test.describe.configure({ mode: 'serial' });

// a 1×1 PNG (the upload is checked by its bytes, not its name)
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);
const tag = randomUUID().slice(0, 6);
let admin: SupabaseClient;
type Person = { id: string; email: string; password: string; company: string; app: string; voucher: string; no: string };
const people: Person[] = [];

async function approvedApplicant(name: string, i: number): Promise<Person> {
  const email = `e2e-pay-${randomUUID().slice(0, 8)}@test.local`;
  const password = randomBytes(18).toString('base64url');
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: name } });
  expect(error).toBeNull();
  const company = randomUUID();
  await admin.from('companies').insert({ id: company, name: `${name} (draft)`, biz_type: 'prop' });
  await admin.from('company_users').insert({ company_id: company, user_id: data.user!.id, role: 'Owner' });
  const no = `MCCI-A-8${String(Date.now()).slice(-4)}${i}`;
  const { data: app, error: e2 } = await admin
    .from('applications')
    .insert({
      company_id: company,
      created_by: data.user!.id,
      stage: 'payment',
      class: 'Associate',
      member_no: no,
      submitted_at: new Date().toISOString(),
      form: { biz: 'prop', name, rep: `${name} Owner`, address: '3 Bosan Road, Multan', ntn: '1112223-4' },
    })
    .select('id')
    .single();
  expect(e2).toBeNull();
  const { data: v, error: e3 } = await admin
    .from('payment_vouchers')
    .insert({
      company_id: company,
      ref_type: 'membership',
      ref_id: app!.id,
      amount: 11500,
      lines: [
        { key: 'admission', label: 'Admission fee', amount: 4000 },
        { key: 'subscription', label: 'Annual subscription', amount: 7000 },
        { key: 'card', label: 'Membership card', amount: 500 },
      ],
      due_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    })
    .select('voucher_no')
    .single();
  expect(e3).toBeNull();
  return { id: data.user!.id, email, password, company, app: app!.id, voucher: v!.voucher_no, no };
}

test.beforeAll(async () => {
  if (!env) return;
  admin = createClient(env.url, env.secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  people.push(await approvedApplicant(`Counter Traders ${tag}`, 1), await approvedApplicant(`Upload Traders ${tag}`, 2));
});

test.afterAll(async () => {
  if (!admin) return;
  for (const p of people) {
    const { data: m } = await admin.from('members').select('id').eq('company_id', p.company);
    const members = (m ?? []).map((x) => x.id);
    if (members.length) {
      await admin.from('temp_memberships').delete().in('member_id', members);
      await admin.from('print_items').delete().in('member_id', members);
      await admin.from('documents').delete().in('member_id', members);
    }
    await admin.from('applications').update({ member_id: null }).eq('id', p.app);
    await admin.from('members').delete().eq('company_id', p.company);
    await admin.from('payment_receipts').delete().eq('company_id', p.company);
    await admin.from('payment_vouchers').delete().eq('company_id', p.company);
    await admin.from('notifications').delete().or(`user_id.eq.${p.id},company_id.eq.${p.company}`);
    await admin.from('email_log').delete().eq('application_id', p.app);
    await admin.from('applications').delete().eq('id', p.app);
    await admin.from('companies').delete().eq('id', p.company);
    await admin.auth.admin.deleteUser(p.id);
  }
});

async function asMember(browser: Browser, p: Person): Promise<Page> {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto('/login');
  await page.getByLabel('Mobile, email or member ID').fill(p.email);
  await page.getByRole('tabpanel', { name: 'Member login' }).getByLabel('Password').fill(p.password);
  await page.locator('[data-action="login.member"]').click();
  await expect(page).toHaveURL(/\/portal$/);
  return page;
}

const flash = (page: Page) => page.locator('[data-flash]');

async function act(page: Page, row: string, action: string, fields: Record<string, string> = {}) {
  await page.locator(`${row} [data-action="${action}"]`).first().click();
  const d = page.getByRole('dialog');
  for (const [label, value] of Object.entries(fields)) await d.getByLabel(label).fill(value);
  await d.locator(`[data-action="${action}.confirm"]`).click();
}

test('A. counter payment → temporary membership, certificate, public verification, extend, revoke', async ({ page, browser }) => {
  test.setTimeout(180_000);
  const p = people[0]!;

  // the member: not told to pay, no upload while the bank account is not confirmed
  const mp = await asMember(browser, p);
  await mp.goto('/portal/payments');
  await expect(mp.getByRole('main')).toContainText('To be confirmed by MCCI');
  await expect(mp.locator('[data-action="pay.upload"]')).toHaveCount(0);

  // Accounts (the SG has every level) record the payment received at the counter
  await signInAs(page, 'sg');
  await page.goto('/admin/psid');
  await act(page, `[data-voucher="${p.voucher}"]`, 'psid.markpaid', { 'Bank / counter receipt reference': 'MCCI-CASH-0001' });
  await expect(flash(page)).toContainText(`temporary membership ${p.no} issued`);
  const { data: a } = await admin.from('applications').select('stage, member_id').eq('id', p.app).single();
  expect(a!.stage).toBe('temp');
  const { data: doc } = await admin.from('documents').select('code, status').eq('member_id', a!.member_id).single();
  expect(doc!.status).toBe('Temporary');
  const { data: co } = await admin.from('companies').select('name, ntn').eq('id', p.company).single();
  expect(co).toEqual({ name: `Counter Traders ${tag}`, ntn: '1112223-4' });

  // the member: what to do now → certificate with QR
  await mp.goto('/portal');
  await expect(mp.getByRole('main')).toContainText(`Membership No. ${p.no} is active until`);
  await mp.locator('[data-action="doc.view"]').first().click();
  await expect(mp).toHaveURL(new RegExp(`/portal/documents\\?code=${doc!.code}$`));
  const cert = mp.locator(`[data-cert="${doc!.code}"]`);
  await expect(cert).toContainText(p.no);
  await expect(cert).toContainText(`Counter Traders ${tag}`);
  await expect(cert.locator('svg')).toHaveCount(1);
  await mp.context().close();

  // anyone: the QR link
  const pub = await browser.newContext();
  const pp = await pub.newPage();
  await pp.goto(`/verify/${doc!.code}`);
  await expect(pp.getByRole('main').locator('[data-verify="found"]')).toContainText('Valid — temporary membership');
  await expect(pp.getByRole('main')).toContainText(p.no);
  await pp.goto('/verify?c=MCCI-QR-AAAAA-AAAAA');
  await expect(pp.getByRole('main').locator('[data-verify="none"]')).toBeVisible();

  // the SG extends, then revokes the document; verification shows it
  await page.goto('/admin/temp');
  await act(page, `[data-temp="${p.no}"]`, 'temp.extend', { 'Reason (the member will see it)': 'Security printer delayed' });
  await expect(flash(page)).toContainText('Extended until');
  await page.goto('/admin/documents');
  await act(page, `[data-code="${doc!.code}"]`, 'qr.revoke', { 'Reason (the member will see it)': 'Test revocation' });
  await expect(flash(page)).toContainText('revoked');
  await pp.goto(`/verify/${doc!.code}`);
  await expect(pp.getByRole('main').locator('[data-verify="found"]')).toContainText('Revoked');
  await pub.close();
});

test('B. bank confirmed → receipt upload, reject with reason, upload again, verify', async ({ page, browser }) => {
  test.setTimeout(180_000);
  const p = people[1]!;
  await signInAs(page, 'sg');

  // the SG confirms MCCI's bank account
  await page.goto('/admin/payments');
  await page.locator('[data-action="settings.save"]').click();
  await page.getByLabel('Bank', { exact: true }).fill('Test Bank Ltd');
  await page.getByLabel('Account title').fill('Multan Chamber of Commerce & Industry');
  await page.getByLabel('IBAN').fill('PK36 SCBL 0000 0011 2345 6702');
  await page.getByLabel(/MCCI Accounts confirmed this account/).check();
  await page.locator('[data-action="settings.save.confirm"]').click();
  await expect(flash(page)).toContainText('Bank account confirmed');

  try {
    // the member uploads the paid slip
    const mp = await asMember(browser, p);
    await mp.goto('/portal/payments');
    await expect(mp.getByRole('main')).toContainText('PK36 SCBL 0000 0011 2345 6702');
    await mp.getByLabel('Photo or PDF of the paid bank slip').setInputFiles({ name: 'slip.png', mimeType: 'image/png', buffer: PNG });
    await mp.locator('[data-action="pay.upload"]').click();
    // the page now shows the receipt with Accounts (the form is gone: nothing more to upload)
    await expect(mp.getByRole('main')).toContainText('MCCI Accounts are verifying it');

    // Accounts reject it with a reason; the member sees why and uploads again
    await page.goto('/admin/payments');
    await act(page, `[data-voucher="${p.voucher}"]`, 'pay.reject', { 'Reason (the member will see it)': 'The amount is not readable' });
    await expect(flash(page)).toContainText('not accepted');
    await mp.goto('/portal/payments');
    await expect(mp.getByRole('main')).toContainText('The amount is not readable');
    await mp.getByLabel('Photo or PDF of the paid bank slip').setInputFiles({ name: 'slip2.png', mimeType: 'image/png', buffer: PNG });
    await mp.locator('[data-action="pay.upload"]').click();
    await expect(mp.getByRole('main')).toContainText('MCCI Accounts are verifying it');

    // Accounts open the receipt and verify → temporary membership
    await page.goto('/admin/payments');
    await expect(page.locator(`[data-voucher="${p.voucher}"] [data-action="psid.view"]`)).toHaveAttribute('href', /receipts/);
    await act(page, `[data-voucher="${p.voucher}"]`, 'pay.verify');
    await expect(flash(page)).toContainText(`temporary membership ${p.no} issued`);
    const { data: mails } = await admin.from('email_log').select('template_key, status').eq('application_id', p.app);
    expect(mails!.map((x) => x.template_key).sort()).toEqual(
      ['payment_receipt_received', 'payment_receipt_received', 'payment_rejected', 'temp_issued'].sort(),
    );
    expect(mails!.every((x) => x.status === 'sent')).toBe(true);
    await mp.context().close();
  } finally {
    // back to "to be confirmed" (the test account details must not stay confirmed)
    await page.goto('/admin/payments');
    await page.locator('[data-action="settings.save"]').click();
    await page.locator('[data-action="settings.save.confirm"]').click();
    await expect(flash(page)).toContainText('not confirmed');
  }
});
