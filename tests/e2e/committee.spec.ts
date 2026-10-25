import { randomBytes, randomUUID } from 'node:crypto';
import { expect, type Page, test } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readLocalEnv } from '../integration/local-env';
import { signInAs } from './helpers';

/**
 * Release 4 Membership Committee (docs/03 §1, docs/05 M5): a file reaching the committee waits until a meeting is
 * scheduled, then is on its agenda; the Secretary General defers it with a reason, schedules the next meeting and
 * approves it — the membership number and the payment voucher are created and emailed; the applicant sees both in
 * the portal (also in Urdu). A second file is rejected with the committee's reason. Minutes are recorded.
 */
const env = readLocalEnv();
test.skip(!env, 'needs the local Supabase stack (MCCI_IT_LOCAL=1 with its URL and keys)');
test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'desktop project only'));
// one applicant and shared meetings: the two tests run one after the other
test.describe.configure({ mode: 'serial' });

const MAILPIT = 'http://127.0.0.1:54324';
const tag = randomUUID().slice(0, 6);
let admin: SupabaseClient;
const applicant = { id: '', email: `e2e-cmt-${tag}@test.local`, password: randomBytes(18).toString('base64url') };
let company = '';
const apps: { id: string; token: string; name: string }[] = [];

async function application(name: string, cls: 'Associate' | 'Corporate') {
  const { data, error } = await admin
    .from('applications')
    .insert({
      company_id: company,
      created_by: applicant.id,
      stage: 'proposer',
      submitted_at: new Date().toISOString(),
      class: cls,
      form: { biz: cls === 'Corporate' ? 'pvt' : 'prop', name, rep: 'Committee Applicant' },
    })
    .select('id, token')
    .single();
  expect(error).toBeNull();
  apps.push({ id: data!.id, token: data!.token, name });
  // the second signature moves a file to the committee (as private.endorse_advance does)
  await admin.from('applications').update({ stage: 'committee' }).eq('id', data!.id);
}

test.beforeAll(async () => {
  if (!env) return;
  admin = createClient(env.url, env.secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await admin.auth.admin.createUser({
    email: applicant.email,
    password: applicant.password,
    email_confirm: true,
    user_metadata: { full_name: 'Committee Applicant' },
  });
  expect(error).toBeNull();
  applicant.id = data.user!.id;
  company = randomUUID();
  await admin.from('companies').insert({ id: company, name: `Committee Traders ${tag}`, biz_type: 'prop' });
  await admin.from('company_users').insert({ company_id: company, user_id: applicant.id, role: 'Owner' });
  await application(`Committee Traders ${tag}`, 'Associate');
});

test.afterAll(async () => {
  if (!admin || !applicant.id) return;
  const ids = apps.map((a) => a.id);
  await admin.from('payment_vouchers').delete().in('ref_id', ids);
  await admin.from('email_log').delete().in('application_id', ids);
  await admin.from('notifications').delete().eq('user_id', applicant.id);
  await admin.from('applications').delete().in('id', ids);
  await admin.from('meetings').delete().like('name', `%${tag}%`);
  await admin.from('companies').delete().eq('id', company);
  await admin.auth.admin.deleteUser(applicant.id);
});

const main = (page: Page) => page.getByRole('main');
const stage = async (id: string) =>
  (await admin.from('applications').select('stage, member_no').eq('id', id).single()).data!;
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });

async function schedule(page: Page, name: string) {
  await page.goto('/admin/meetings');
  await page.locator('[data-action="mt.create"]').click();
  const d = page.getByRole('dialog');
  await d.getByLabel('Meeting').fill(name);
  await d.getByLabel('Date').fill(today());
  await d.locator('[data-action="mt.create.confirm"]').click();
  await expect(main(page).getByRole('status')).toContainText(/Meeting MC-\d{4}-\d+ scheduled/);
  return (await admin.from('meetings').select('id').eq('name', name).single()).data!.id as string;
}

test('the committee defers, then approves a file: number, voucher and email; the applicant sees them', async ({
  page,
  browser,
}) => {
  test.setTimeout(180_000);
  const file = apps[0]!;
  await signInAs(page, 'sg');

  // no meeting yet: the file waits
  await page.goto('/admin/committee');
  await expect(page.getByRole('heading', { name: 'Waiting for a meeting' })).toBeVisible();
  await expect(main(page).locator(`[data-token="${file.token}"]`)).toBeVisible();

  // scheduling a meeting puts it on the agenda
  const m1 = await schedule(page, `MC ${tag} A`);
  await page.goto(`/admin/committee?m=${m1}`);
  const row = main(page).locator(`[data-token="${file.token}"]`);
  await expect(row).toBeVisible();

  // defer needs the committee's reason
  await row.locator('[data-decision="Deferred"]').click();
  await page.locator('[data-action="cmt.decide.confirm"]').click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('committee’s reason');
  await page.getByRole('dialog').getByLabel(/Committee note/).fill('Bring the latest NTN certificate');
  await page.locator('[data-action="cmt.decide.confirm"]').click();
  await expect(main(page).getByRole('status')).toContainText('Deferred');
  expect((await stage(file.id)).stage).toBe('committee');

  // next meeting; approve
  const m2 = await schedule(page, `MC ${tag} B`);
  await page.goto(`/admin/committee?m=${m2}`);
  await main(page).locator(`[data-token="${file.token}"] [data-decision="Approved"]`).click();
  await expect(page.getByRole('dialog')).toContainText('cannot be undone');
  await page.locator('[data-action="cmt.decide.confirm"]').click();
  await expect(main(page).getByRole('status')).toContainText(/Approved · MCCI-A-\d+ · payment voucher PV-\d{4}-\d+ sent\./);
  const after = await stage(file.id);
  expect(after.stage).toBe('payment');
  expect(after.member_no).toMatch(/^MCCI-A-\d+$/);
  const { data: v } = await admin
    .from('payment_vouchers')
    .select('voucher_no, amount, status')
    .eq('ref_type', 'membership')
    .eq('ref_id', file.id)
    .single();
  expect(v).toMatchObject({ amount: 11500, status: 'Unpaid' });
  const { data: mails } = await admin
    .from('email_log')
    .select('template_key, status')
    .eq('application_id', file.id)
    .eq('template_key', 'membership_approved_voucher');
  expect(mails).toEqual([{ template_key: 'membership_approved_voucher', status: 'sent' }]);
  const found = await (await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${applicant.email}`)}`)).json();
  expect(found.messages?.[0]?.Subject).toContain(after.member_no);

  // the applicant: what to do now, Payments, Urdu message
  const ctx = await browser.newContext();
  const ap = await ctx.newPage();
  await ap.goto('/login');
  await ap.getByLabel('Mobile, email or member ID').fill(applicant.email);
  await ap.getByRole('tabpanel', { name: 'Member login' }).getByLabel('Password').fill(applicant.password);
  await ap.locator('[data-action="login.member"]').click();
  await expect(ap).toHaveURL(/\/portal$/);
  await expect(ap.getByRole('main')).toContainText(v!.voucher_no);
  await ap.locator('[data-action="psid.show"]').click();
  await expect(ap).toHaveURL(/\/portal\/payments$/);
  const card = ap.getByRole('main').locator('.psid');
  await expect(card).toContainText(v!.voucher_no);
  await expect(card).toContainText('Rs. 11,500');
  await expect(card).toContainText('To be confirmed by MCCI');
  await expect(card.locator('[data-action="doc.print"]')).toBeVisible();
  await ap.goto('/ur/portal');
  await expect(ap.getByRole('main')).toContainText(`منظور — رکنیت نمبر ${after.member_no}`);
  await ctx.close();

  // minutes
  await page.goto('/admin/meetings');
  await page.locator(`[data-meeting="${m2}"] [data-action="mt.minutes"]`).click();
  await page.getByRole('dialog').getByLabel('Minutes / decisions').fill('Item 1 approved.');
  await page.locator('[data-action="mt.minutes.confirm"]').click();
  await expect(page.locator(`[data-meeting="${m2}"]`)).toContainText('Minutes recorded');
});

test('the committee rejects a file with its reason', async ({ page }) => {
  test.setTimeout(120_000);
  await application(`Rejected Traders ${tag}`, 'Corporate');
  const file = apps[apps.length - 1]!;
  await signInAs(page, 'sg');
  // placed on the earliest open meeting (or a new one when none is open)
  let { data: item } = await admin.from('committee_items').select('meeting_id').eq('application_id', file.id).maybeSingle();
  if (!item) {
    await schedule(page, `MC ${tag} C`);
    ({ data: item } = await admin.from('committee_items').select('meeting_id').eq('application_id', file.id).maybeSingle());
  }
  await page.goto(`/admin/committee?m=${item!.meeting_id}`);
  await main(page).locator(`[data-token="${file.token}"] [data-decision="Rejected"]`).click();
  await page.getByRole('dialog').getByLabel(/Committee note/).fill('Outside the Chamber’s jurisdiction');
  await page.locator('[data-action="cmt.decide.confirm"]').click();
  await expect(main(page).getByRole('status')).toContainText('Rejected — the applicant has been told.');
  const s = await stage(file.id);
  expect(s).toEqual({ stage: 'rejected', member_no: null });
});
