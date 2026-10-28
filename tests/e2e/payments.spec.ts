import { randomBytes, randomUUID } from 'node:crypto';
import { expect, type Browser, type Page, test } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readLocalEnv } from '../integration/local-env';
import { signInAs } from './helpers';

/**
 * Payments and activation without temporary membership (0340, 0440; docs/21 points 27–29, docs/22 §3):
 * A. bank account not confirmed: the member is told not to pay and cannot upload; Accounts record a counter payment;
 *    the membership is active at once (Permanent, valid to 31 March). In the Members Register the officer marks the
 *    member blacklisted — renewal is refused with a clear message — records the whitelisting, issues the renewal
 *    voucher; Accounts verify it and the membership runs to the next 31 March. A lapsed member is restored by hand.
 * B. the SG confirms MCCI's bank account; the member uploads a receipt; Accounts reject it with a reason; the member
 *    uploads again; Accounts verify → membership active. The bank account is set back to "not confirmed".
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
      await admin.from('payment_vouchers').delete().in('ref_id', members);
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
  await expect(page).toHaveURL(/\/portal$/, { timeout: 20_000 });
  return page;
}

const flash = (page: Page) => page.locator('[data-flash]');
const REASON = 'Reason (the member will see it)';

async function act(page: Page, row: string, action: string, fields: Record<string, string> = {}) {
  await page.locator(`${row} [data-action="${action}"]`).first().click();
  const d = page.getByRole('dialog');
  for (const [label, value] of Object.entries(fields)) await d.getByLabel(label).fill(value);
  await d.locator(`[data-action="${action}.confirm"]`).click();
}

const yearEnd = (d: Date) => {
  const k = new Date(d.toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' }));
  return `${k.getUTCFullYear() + (k.getUTCMonth() >= 3 ? 1 : 0)}-03-31`;
};

test('A. counter payment → membership active; blacklist blocks renewal; whitelist, renew, restore', async ({ page, browser }) => {
  test.setTimeout(180_000);
  const p = people[0]!;

  // the member: not told to pay, no upload while the bank account is not confirmed
  const mp = await asMember(browser, p);
  await mp.goto('/portal/payments');
  await expect(mp.getByRole('main')).toContainText('To be confirmed by MCCI');
  await expect(mp.locator('[data-action="pay.upload"]')).toHaveCount(0);

  // Accounts (the SG has every level) record the payment received at the counter → active at once
  await signInAs(page, 'sg');
  await page.goto('/admin/psid');
  await act(page, `[data-voucher="${p.voucher}"]`, 'psid.markpaid', { 'Bank / counter receipt reference': 'MCCI-CASH-0001' });
  await expect(flash(page)).toContainText(`membership ${p.no} is now active`);
  const { data: a } = await admin.from('applications').select('stage, member_id').eq('id', p.app).single();
  expect(a!.stage).toBe('permanent');
  const { data: mem } = await admin.from('members').select('status, valid_to').eq('id', a!.member_id).single();
  expect(mem).toEqual({ status: 'Permanent', valid_to: yearEnd(new Date()) });
  expect((await admin.from('temp_memberships').select('id').eq('member_id', a!.member_id)).data).toEqual([]);
  const { data: co } = await admin.from('companies').select('name, ntn').eq('id', p.company).single();
  expect(co).toEqual({ name: `Counter Traders ${tag}`, ntn: '1112223-4' });

  // the member: an active member, no temporary membership anywhere
  await mp.goto('/portal');
  await expect(mp.getByRole('main')).toContainText('You are an MCCI member');
  await expect(mp.getByRole('main')).not.toContainText(/temporary/i);
  await mp.context().close();

  // Members Register: blacklisted → renewal refused with a clear message
  const row = `[data-member="${p.no}"]`;
  await page.goto('/admin/members');
  await act(page, row, 'reg.blacklist', { [REASON]: 'Listed on the FBR notice of 1 Oct' });
  await expect(flash(page)).toContainText('Marked blacklisted');
  await expect(page.locator('tr', { has: page.locator(row) }).locator('[data-blacklisted]')).toBeVisible();
  await act(page, row, 'reg.renew');
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Record the whitelisting');
  await page.getByRole('dialog').locator('[data-action="modal.close"]').click();

  // whitelisting recorded with the evidence; renewal voucher; Accounts verify → the next 31 March
  await act(page, row, 'reg.whitelist', { [REASON]: 'FBR whitelisting letter No. 77 seen' });
  await expect(flash(page)).toContainText('Whitelisting recorded');
  await act(page, row, 'reg.renew');
  await expect(flash(page)).toContainText(/Renewal voucher PV-\d{4}-\d+ issued/);
  const { data: rv } = await admin.from('payment_vouchers').select('voucher_no, amount').eq('ref_type', 'renewal').eq('ref_id', a!.member_id).single();
  expect(rv!.amount).toBe(7000);
  await page.goto('/admin/psid');
  await act(page, `[data-voucher="${rv!.voucher_no}"]`, 'psid.markpaid', { 'Bank / counter receipt reference': 'MCCI-CASH-0002' });
  await expect(flash(page)).toContainText('Payment verified');
  const next = `${Number(yearEnd(new Date()).slice(0, 4)) + 1}-03-31`;
  expect((await admin.from('members').select('valid_to').eq('id', a!.member_id).single()).data!.valid_to).toBe(next);

  // a lapsed member is restored by hand by the officer, with the reason
  await admin.from('members').update({ status: 'Expired', valid_to: '2024-03-31' }).eq('id', a!.member_id);
  await page.goto('/admin/members');
  await act(page, row, 'reg.restore', { [REASON]: 'Dues 2024-26 settled, receipt 5512' });
  await expect(flash(page)).toContainText('Membership restored');
  expect((await admin.from('members').select('status, valid_to').eq('id', a!.member_id).single()).data).toEqual({
    status: 'Permanent',
    valid_to: yearEnd(new Date()),
  });
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

    // Accounts open the receipt and verify → the membership is active
    await page.goto('/admin/payments');
    await expect(page.locator(`[data-voucher="${p.voucher}"] [data-action="psid.view"]`)).toHaveAttribute('href', /receipts/);
    await act(page, `[data-voucher="${p.voucher}"]`, 'pay.verify');
    await expect(flash(page)).toContainText(`membership ${p.no} is now active`);
    const { data: mails } = await admin.from('email_log').select('template_key, status').eq('application_id', p.app);
    expect(mails!.map((x) => x.template_key).sort()).toEqual(
      ['payment_receipt_received', 'payment_receipt_received', 'payment_rejected', 'member_activated'].sort(),
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
