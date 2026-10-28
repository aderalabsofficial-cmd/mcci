import { randomBytes, randomUUID } from 'node:crypto';
import { expect, type Page, test } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readLocalEnv } from '../integration/local-env';
import { signInAs } from './helpers';

/**
 * Release 2 staff review (docs/05 M5 first half): the Membership Officer finds a submitted application in the
 * pipeline, starts the review, rejects one document with a reason, accepts the others and returns the file; the
 * applicant sees only that document and the note, replaces it and resubmits; the officer accepts it, completes the
 * checklist and verifies — the applicant is told. Members never reach the staff screens.
 */
const env = readLocalEnv();
test.skip(!env, 'needs the local Supabase stack (MCCI_IT_LOCAL=1 with its URL and keys)');
test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'desktop project only'));

let admin: SupabaseClient;
let applicant: { id: string; email: string; password: string };
let appId = '';
let token = '';
let company = '';

test.beforeAll(async () => {
  if (!env) return;
  admin = createClient(env.url, env.secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  applicant = {
    id: '',
    email: `e2e-rev-${randomUUID().slice(0, 8)}@test.local`,
    password: randomBytes(18).toString('base64url'),
  };
  const { data, error } = await admin.auth.admin.createUser({
    email: applicant.email,
    password: applicant.password,
    email_confirm: true,
    user_metadata: { full_name: 'Review Applicant' },
  });
  expect(error).toBeNull();
  applicant.id = data.user!.id;
  company = randomUUID();
  await admin.from('companies').insert({ id: company, name: 'Review Traders', biz_type: 'prop' });
  await admin.from('company_users').insert({ company_id: company, user_id: applicant.id, role: 'Owner' });
  const { data: app } = await admin
    .from('applications')
    .insert({
      company_id: company,
      created_by: applicant.id,
      stage: 'submitted',
      submitted_at: new Date().toISOString(),
      class: 'Associate',
      jurisdiction_ok: true,
      decl1: true,
      decl2: true,
      sign_path: `${company}/applications/x/sign/s.png`,
      form: {
        biz: 'prop',
        manufacturing: false,
        repEmail: 'rep@test.local',
        repAddress: 'Multan',
        nature: { sector: 'trade', items: ['Wholesaler'], other: '' },
        addrMatch: true,
        name: 'Review Traders',
        address: '1 Bosan Road, Multan',
        ntn: '1234567-8',
        tel: '061-1',
        email: 'r@test.local',
        particulars: 'Wholesale & Distribution: Wholesaler',
        est: '2015-01-01',
        rep: 'Review Applicant',
        desig: 'Proprietor',
        cnic: '36302-4444444-4',
        mobile: '0300-4444444',
      },
    })
    .select('id, token')
    .single();
  appId = app!.id;
  token = app!.token;
  const pdf = Buffer.from('%PDF-1.4\n%%EOF\n');
  for (const key of ['cnic', 'ntn', 'addr', 'bank', 'photo']) {
    const path = `${company}/applications/${appId}/${key}/seed.pdf`;
    await admin.storage.from('application-docs').upload(path, pdf, { contentType: 'application/pdf' });
    await admin.from('application_documents').insert({ application_id: appId, key, path, file_name: `${key}.pdf` });
  }
});

test.afterAll(async () => {
  if (!admin || !applicant?.id) return;
  await admin.from('notifications').delete().eq('user_id', applicant.id);
  await admin.from('email_log').delete().eq('application_id', appId);
  await admin.from('applications').delete().eq('company_id', company);
  await admin.from('companies').delete().eq('id', company);
  await admin.auth.admin.deleteUser(applicant.id);
});

async function asApplicant(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Mobile, email or member ID').fill(applicant.email);
  await page.getByRole('tabpanel', { name: 'Member login' }).getByLabel('Password').fill(applicant.password);
  await page.locator('[data-action="login.member"]').click();
  await expect(page).toHaveURL(/\/portal$/);
}

const stage = async () =>
  (await admin.from('applications').select('stage').eq('id', appId).single()).data!.stage as string;
const banner = (page: Page) => page.getByRole('main').locator('.banner');

test('officer returns a file, the applicant corrects it, the officer verifies it', async ({ page, browser }) => {
  test.setTimeout(150_000);
  await signInAs(page, 'staff');

  // pipeline: the new file is on the board and in the table
  await page.goto('/admin/requests');
  await expect(page.getByRole('heading', { name: 'Membership Pipeline' })).toBeVisible();
  await expect(page.getByRole('link', { name: token })).toBeVisible();
  await page.getByRole('link', { name: token }).click();
  await expect(page).toHaveURL(new RegExp(`/admin/mreview\\?t=${token}$`));

  // start the review; reject the NTN certificate with a reason, accept the rest
  await page.locator('[data-action="adm.app.open"]').click();
  await expect(banner(page)).toContainText('Review started.');
  expect(await stage()).toBe('review');
  await page.locator('[data-doc="ntn"] [data-action="adm.doc.reject"]').click();
  await page.getByRole('dialog').getByLabel('Reason').fill('The NTN certificate is not readable');
  await page.locator('[data-action="adm.doc.reject.confirm"]').click();
  await expect(banner(page)).toContainText('Document rejected.');
  for (const key of ['cnic', 'addr', 'bank', 'photo']) {
    await page.locator(`[data-doc="${key}"] [data-action="adm.doc.ok"]`).click();
    await expect(page.locator(`[data-doc="${key}"]`)).toContainText('Accepted');
  }
  await page.locator('[data-action="adm.return"]').first().click();
  await page
    .getByRole('dialog')
    .getByLabel('Note for the applicant')
    .fill('Please upload a clear copy of your NTN certificate.');
  await page.locator('[data-action="adm.return.confirm"]').click();
  await expect(banner(page)).toContainText(/Returned to the applicant\.|could not be sent/);
  expect(await stage()).toBe('returned');
  const { data: emails } = await admin.from('email_log').select('template_key, status').eq('application_id', appId);
  expect(emails!.map((e) => e.template_key)).toContain('membership_returned');
  expect(emails!.every((e) => e.status === 'sent' || e.status === 'failed')).toBe(true);

  // the applicant sees only the rejected document and the note, replaces it and resubmits
  const ctx = await browser.newContext();
  const ap = await ctx.newPage();
  await asApplicant(ap);
  await expect(ap.getByRole('heading', { name: 'Correction needed' })).toBeVisible();
  await ap.goto('/portal/join');
  await expect(ap.getByText('Please upload a clear copy of your NTN certificate.')).toBeVisible();
  await expect(ap.locator('[data-doc]')).toHaveCount(1);
  const chooser = ap.waitForEvent('filechooser');
  await ap.locator('[data-doc="ntn"] [data-action="app.fix.upload"]').click();
  await (
    await chooser
  ).setFiles({ name: 'ntn-clear.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\nclear\n%%EOF\n') });
  await expect(ap.locator('[data-doc]')).toHaveCount(0, { timeout: 20_000 });
  await ap.locator('[data-action="app.resubmit"]').click();
  await expect(ap).toHaveURL(/\/portal\/mtrack$/, { timeout: 30_000 });
  expect(await stage()).toBe('review');

  // back at the desk: the replaced document is marked, accepted; checklist; verify → proposer
  await page.reload();
  await expect(page.locator('[data-doc="ntn"]')).toContainText('re-uploaded');
  await page.locator('[data-doc="ntn"] [data-action="adm.doc.ok"]').click();
  await expect(page.locator('[data-doc="ntn"]')).toContainText('Accepted');
  for (const sw of await page.locator('[data-action="adm.check"]').all()) {
    await sw.click();
    await expect(sw).toHaveAttribute('aria-checked', 'true');
  }
  await page.locator('[data-action="adm.verify"]').click();
  await page.locator('[data-action="adm.verify.confirm"]').click();
  await expect(banner(page)).toContainText(/Documents verified\.|could not be sent/);
  expect(await stage()).toBe('proposer');

  await ap.goto('/portal');
  await expect(ap.getByRole('heading', { name: 'Documents verified — choose your proposer and seconder' })).toBeVisible();
  await ctx.close();
});

test('members never reach the staff screens', async ({ page }) => {
  await signInAs(page, 'member');
  await page.goto('/admin/requests');
  await expect(page).toHaveURL(/\/portal$/);
  await page.goto(`/admin/mreview?t=${token || 'MCCI-2026-M-0001'}`);
  await expect(page).toHaveURL(/\/portal$/);
});
