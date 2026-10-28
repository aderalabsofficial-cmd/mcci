import { randomBytes, randomInt, randomUUID } from 'node:crypto';
import { expect, type Page, test } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readLocalEnv } from '../integration/local-env';
import { readAccounts } from './accounts';
import { signInAs } from './helpers';

/**
 * Membership Committee since 0430 (docs/21 §1, §3): the Secretary General assigns the committee and it counts once the
 * President approves it; the Membership Officer types the membership number and forwards a verified file whose
 * proposer and seconder both approved; the file is on the committee desk at once (no meeting); the Convener approves
 * — voucher created and emailed, the applicant sees both in the portal (also in Urdu) — or declines / returns a file.
 * The President's approval is written directly here (the e2e accounts have no President); pgTAP 240 tests that rule.
 */
const env = readLocalEnv();
test.skip(!env, 'needs the local Supabase stack (MCCI_IT_LOCAL=1 with its URL and keys)');
test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'desktop project only'));
// one committee and one applicant: the tests run one after the other
test.describe.configure({ mode: 'serial' });

const MAILPIT = 'http://127.0.0.1:54324';
const tag = randomUUID().slice(0, 6);
let admin: SupabaseClient;
const applicant = { id: '', email: `e2e-cmt-${tag}@test.local`, password: randomBytes(18).toString('base64url') };
let company = '';
const apps: { id: string; token: string; name: string }[] = [];
const no = () => `A-${randomInt(80000, 99999)}`;

/** a verified file of the applicant whose proposer and seconder both approved (stage "proposer") */
async function application(name: string) {
  const { data, error } = await admin
    .from('applications')
    .insert({
      company_id: company,
      created_by: applicant.id,
      stage: 'proposer',
      submitted_at: new Date().toISOString(),
      class: 'Associate',
      form: { biz: 'prop', manufacturing: false, name, rep: 'Committee Applicant' },
    })
    .select('id, token')
    .single();
  expect(error).toBeNull();
  const member = readAccounts().memberRowId!;
  const at = new Date().toISOString();
  const expires = new Date(Date.now() + 7 * 86_400_000).toISOString();
  await admin.from('endorsements').insert([
    { application_id: data!.id, role: 'proposer', endorser_member_id: member, status: 'Approved', decided_at: at, expires_at: expires },
    { application_id: data!.id, role: 'seconder', endorser_member_id: member, status: 'Approved', decided_at: at, expires_at: expires },
  ]);
  apps.push({ id: data!.id, token: data!.token, name });
  return apps[apps.length - 1]!;
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
  // a committee left over from an earlier local run does not count for this one
  await admin.from('committee_assignments').update({ status: 'Superseded' }).eq('status', 'Approved');
  await admin.from('committee_assignments').update({ status: 'Withdrawn' }).eq('status', 'Pending');
});

test.afterAll(async () => {
  if (!admin || !applicant.id) return;
  const ids = apps.map((a) => a.id);
  await admin.from('payment_vouchers').delete().in('ref_id', ids);
  await admin.from('email_log').delete().in('application_id', ids);
  await admin.from('notifications').delete().eq('user_id', applicant.id);
  await admin.from('endorsements').delete().in('application_id', ids);
  await admin.from('applications').delete().in('id', ids);
  await admin.from('companies').delete().eq('id', company);
  await admin.from('committee_assignments').delete().eq('proposed_by', readAccounts().sg!.id);
  await admin.auth.admin.deleteUser(applicant.id);
});

const main = (page: Page) => page.getByRole('main');
const stage = async (id: string) =>
  (await admin.from('applications').select('stage, member_no').eq('id', id).single()).data!;

test('the SG assigns the Membership Committee; it counts once the President approves', async ({ page }) => {
  test.setTimeout(90_000);
  const sg = readAccounts().sg!;
  await signInAs(page, 'sg');
  await page.goto('/admin/committee');
  const card = main(page).getByTestId('committee-assignment');
  await expect(card).toContainText('No committee yet');
  await card.locator('[data-action="cmt.assign"]').click();
  const d = page.getByRole('dialog');
  await d.getByLabel('Convener').selectOption(sg.id);
  await d.locator('[data-action="cmt.assign.confirm"]').click();
  await expect(card.getByRole('status').first()).toContainText('Sent to the President for approval.');
  await expect(card.getByTestId('committee-pending')).toContainText('Waiting for the President');
  // the SG cannot approve their own proposal: no button for them
  await expect(card.locator('[data-action="cmt.assign.decide"]')).toHaveCount(0);

  // the President approves (written directly: see the note at the top)
  const { error } = await admin
    .from('committee_assignments')
    .update({ status: 'Approved', decided_by: sg.id, decided_at: new Date().toISOString() })
    .eq('proposed_by', sg.id)
    .eq('status', 'Pending');
  expect(error).toBeNull();
  await page.reload();
  await expect(card).toContainText('Convener');
  await expect(card.getByTestId('committee-pending')).toHaveCount(0);
});

test('the officer forwards with the number; the Convener approves: voucher and email; the applicant sees them', async ({
  page,
  browser,
}) => {
  test.setTimeout(180_000);
  const file = await application(`Committee Traders ${tag}`);
  const number = no();

  // the Membership Officer types the number (the letter must match the class) and forwards
  await signInAs(page, 'staff');
  await page.goto(`/admin/mreview?t=${file.token}`);
  await main(page).locator('[data-action="adm.forward"]').click();
  const d = page.getByRole('dialog');
  await d.getByLabel(/Membership number/).fill(`C-${number.slice(2)}`);
  await d.locator('[data-action="adm.forward.confirm"]').click();
  await expect(page.getByText('C is for Corporate').first()).toBeVisible();
  // the dialog stays open with what was typed: correct it (any case, with or without the dash)
  await d.getByLabel(/Membership number/).fill(number.toLowerCase().replace('-', ' '));
  await d.locator('[data-action="adm.forward.confirm"]').click();
  await expect(main(page).getByRole('status').first()).toContainText(`Forwarded to the Membership Committee with No. ${number}.`);
  expect(await stage(file.id)).toEqual({ stage: 'committee', member_no: number });

  // on the desk at once; the Convener (the SG, as assigned above) approves
  await signInAs(page, 'sg');
  await page.goto('/admin/committee');
  const row = main(page).locator(`[data-token="${file.token}"]`);
  await expect(row).toContainText(`No. ${number}`);
  await row.locator('[data-decision="Approved"]').click();
  await expect(page.getByRole('dialog')).toContainText('cannot be undone');
  await page.locator('[data-action="cmt.decide.confirm"]').click();
  await expect(main(page).getByRole('status').first()).toContainText(
    new RegExp(`Approved · ${number} · payment voucher PV-\\d{4}-\\d+ sent\\.`),
  );
  expect(await stage(file.id)).toEqual({ stage: 'payment', member_no: number });
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
  expect(found.messages?.[0]?.Subject).toContain(number);

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
  await ap.goto('/ur/portal');
  await expect(ap.getByRole('main')).toContainText(`منظور — رکنیت نمبر ${number}`);
  await ctx.close();
});

test('the Convener returns a file to the officer, then declines one with a reason (the number is released)', async ({
  page,
}) => {
  test.setTimeout(120_000);
  const file = await application(`Declined Traders ${tag}`);
  const number = no();
  await admin.from('applications').update({ stage: 'committee', member_no: number }).eq('id', file.id);
  await signInAs(page, 'sg');
  await page.goto('/admin/committee');
  const row = () => main(page).locator(`[data-token="${file.token}"]`);

  await row().locator('[data-decision="Returned"]').click();
  await page.locator('[data-action="cmt.decide.confirm"]').click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('reason');
  await page.getByRole('dialog').getByLabel(/Membership Officer check/).fill('Check the NTN on the certificate again');
  await page.locator('[data-action="cmt.decide.confirm"]').click();
  await expect(main(page).getByRole('status').first()).toContainText('Returned to the Membership Officer.');
  expect(await stage(file.id)).toEqual({ stage: 'proposer', member_no: number });

  await admin.from('applications').update({ stage: 'committee' }).eq('id', file.id);
  await page.reload();
  await row().locator('[data-decision="Rejected"]').click();
  await page.getByRole('dialog').getByLabel(/Reason/).fill('Outside the Chamber’s jurisdiction');
  await page.locator('[data-action="cmt.decide.confirm"]').click();
  await expect(main(page).getByRole('status').first()).toContainText('Declined — the applicant has been told.');
  expect(await stage(file.id)).toEqual({ stage: 'rejected', member_no: null });
});
