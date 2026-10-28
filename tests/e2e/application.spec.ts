import { randomBytes, randomUUID } from 'node:crypto';
import { expect, type Page, test } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { readLocalEnv } from '../integration/local-env';

/**
 * M3 membership application (docs/05 M3 acceptance): a newly registered person starts an application, chooses the
 * business type, uploads the documents and photo, lets AI fill the form (tests/e2e/fake-openai.mjs), signs, declares
 * and submits; missing items block submission and are listed in plain words; a returned application shows only the
 * rejected documents and can be resubmitted. Needs the local stack; the applicants are created and removed here.
 */
const env = readLocalEnv();
test.skip(!env, 'needs the local Supabase stack (MCCI_IT_LOCAL=1 with its URL and keys)');
test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'desktop project only'));
test.describe.configure({ mode: 'serial' });

let admin: SupabaseClient;
const people: { id: string; email: string; password: string }[] = [];

test.beforeAll(() => {
  if (env) admin = createClient(env.url, env.secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
});

test.afterAll(async () => {
  for (const p of people) {
    const { data: links } = await admin.from('company_users').select('company_id').eq('user_id', p.id);
    const companies = (links ?? []).map((l) => l.company_id);
    if (companies.length) {
      await admin.from('ai_extractions').delete().in('company_id', companies);
      await admin.from('notifications').delete().eq('user_id', p.id);
      await admin.from('applications').delete().in('company_id', companies);
      await admin.from('companies').delete().in('id', companies);
    }
    await admin.auth.admin.deleteUser(p.id);
  }
});

async function applicant(page: Page, name: string) {
  const email = `e2e-app-${randomUUID().slice(0, 8)}@test.local`;
  const password = randomBytes(18).toString('base64url');
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  });
  expect(error).toBeNull();
  people.push({ id: data.user!.id, email, password });
  await page.goto('/login');
  await page.getByLabel('Mobile, email or member ID').fill(email);
  await page.getByRole('tabpanel', { name: 'Member login' }).getByLabel('Password').fill(password);
  await page.locator('[data-action="login.member"]').click();
  await expect(page).toHaveURL(/\/portal$/, { timeout: 20_000 });
  return data.user!.id;
}

const PDF = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
const photo = () =>
  sharp({ create: { width: 700, height: 900, channels: 3, background: '#c99a7a' } })
    .jpeg()
    .toBuffer();
const ink = () =>
  sharp({ create: { width: 600, height: 200, channels: 3, background: '#ffffff' } })
    .composite([
      { input: { create: { width: 400, height: 20, channels: 3, background: '#0b2a5b' } }, top: 90, left: 100 },
    ])
    .png()
    .toBuffer();

/** clicks a control that opens the file picker and hands it the file */
async function choose(page: Page, click: () => Promise<void>, name: string, mimeType: string, buffer: Buffer) {
  const chooser = page.waitForEvent('filechooser');
  await click();
  await (await chooser).setFiles({ name, mimeType, buffer });
}

async function startApplication(page: Page) {
  await page.goto('/portal');
  await page.locator('[data-action="register.start"]').click();
  await expect(page).toHaveURL(/\/portal\/join$/);
  await expect(page.getByRole('heading', { name: /What type of business do you have/ })).toBeVisible();
}

const saved = (page: Page) => expect(page.locator('.wz-save')).toHaveText('Saved', { timeout: 15_000 });

test('a new applicant fills the whole form with AI help and submits (proprietorship, 6 documents)', async ({
  page,
}) => {
  test.setTimeout(180_000);
  const uid = await applicant(page, 'Amir Khan');
  await expect(page.getByRole('heading', { name: 'Apply for New Membership' })).toBeVisible();
  await startApplication(page);

  // every step says what to do, in English and Urdu
  await expect(page.getByTestId('step-guide').locator('p[lang="ur"]')).toContainText('مینوفیکچرنگ');

  // step 1: main category, type, class questions, nature, jurisdiction; class and fee follow the rule
  await page.getByRole('button', { name: /^Non-manufacturing/ }).click();
  await page.getByRole('button', { name: /^Proprietorship/ }).click();
  // a proprietorship answers the class questions; turnover is asked only once sales tax is "Yes"
  await expect(page.locator('[data-action="wiz.flag"]')).toHaveCount(2);
  await page.getByRole('button', { name: /^Wholesale & Distribution/ }).click();
  await page.getByRole('button', { name: 'Wholesaler', exact: true }).click();
  await page.getByRole('group', { name: 'Eligibility' }).getByRole('button', { name: /^Yes/ }).click();
  await expect(page.locator('.feebox')).toContainText('Associate');
  await expect(page.locator('.feebox')).toContainText('Rs. 11,500');
  await saved(page);

  // step 2: the 6 slots of a proprietorship that is not sales-tax registered (no sales tax certificate)
  await page.locator('[data-action="wiz.next"]').click();
  await expect(page.locator('[data-doc]')).toHaveCount(6);
  await expect(page.locator('[data-doc="st"]')).toHaveCount(0);
  for (const key of ['cnic', 'ntn', 'addr', 'bank']) {
    const slot = page.locator(`[data-doc="${key}"]`);
    await choose(
      page,
      () => slot.locator('[data-action="wiz.doc.upload"]').click(),
      `${key}.pdf`,
      'application/pdf',
      PDF,
    );
    await expect(slot).toHaveClass(/\bok\b/, { timeout: 20_000 });
  }
  // a file that is not a document is refused in plain words
  await choose(
    page,
    () => page.locator('[data-doc="itr"] [data-action="wiz.doc.upload"]').click(),
    'x.exe',
    'application/octet-stream',
    Buffer.from('MZ not a pdf'),
  );
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Use a PDF, JPG or PNG file.');
  // passport photo through the 35 × 45 mm crop
  await choose(
    page,
    () => page.locator('[data-doc="photo"] [data-action="wiz.photo"]').click(),
    'me.jpg',
    'image/jpeg',
    await photo(),
  );
  await page.locator('[data-action="photo.save"]').click();
  await expect(page.locator('[data-doc="photo"]')).toHaveClass(/\bok\b/, { timeout: 20_000 });
  await expect(page.locator('.prog')).toContainText('5 of 6 added');

  // AI reads the documents and fills the form; low-confidence fields are highlighted
  await page.locator('[data-action="wiz.ai"]').click();
  await expect(page.getByRole('heading', { name: /Check your details/ })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByLabel(/Name of Business/)).toHaveValue('Fresh Traders (AI)');
  await expect(page.getByLabel(/Business NTN/)).toHaveValue('7654321-0');
  await expect(page.getByLabel(/CNIC No\./)).toHaveValue('36302-7654321-1');
  await expect(page.locator('.jf.w')).toHaveCount(1); // address 78 % → please check
  await expect(page.getByLabel(/Particulars of Business/)).toHaveValue('Wholesale & Distribution: Wholesaler');

  // the applicant completes the rest
  await page.getByLabel(/Business Address/).fill('22 Abdali Road, Multan Cantt.');
  await page.getByLabel(/Business Telephone No\./).fill('061-4500000');
  await page.getByLabel(/Business Email ID/).fill('info@fresh.test');
  await page.getByLabel(/Date of Business Establishment/).fill('2018-05-01');
  await page.getByLabel(/^Designation/).fill('Proprietor');
  await page.getByLabel(/Mobile No\./).fill('0300-1234567');
  await page.getByLabel(/Email of Authorized Representative/).fill('amir@fresh.test');
  await page.getByLabel(/Address of Authorized Representative/).fill('22 Abdali Road, Multan Cantt.');
  await page.locator('[data-action="wiz.addr"]').click();
  await expect(page.locator('.jf.w')).toHaveCount(0);
  await saved(page);

  // step 4 (endorsement opens with M4), step 5: signature photo, declarations
  await page.locator('[data-action="wiz.next"]').click();
  await expect(page.getByRole('heading', { name: /Proposer & seconder/ })).toBeVisible();
  await page.locator('[data-action="wiz.next"]').click();
  await choose(
    page,
    () => page.locator('[data-action="wiz.sign.upload"]').click(),
    'sign.png',
    'image/png',
    await ink(),
  );
  await expect(page.locator('.sigbox img').first()).toBeVisible({ timeout: 20_000 });
  for (const b of await page.locator('[data-action="wiz.declare"]').all()) await b.click();
  await saved(page);

  // step 6: official form preview and submit
  await page.locator('[data-action="wiz.next"]').click();
  await expect(page.getByText('Everything is complete. You can submit now.')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.of-page')).toHaveCount(4);
  await expect(page.locator('.of-wrap')).toContainText('Fresh Traders (AI)');
  await page.locator('[data-action="wiz.submit"]').click();
  await expect(page).toHaveURL(/\/portal\/mtrack\?submitted=1$/, { timeout: 30_000 });
  await expect(page.getByRole('status').first()).toContainText(/has been submitted/);
  await expect(page.getByRole('heading', { name: 'MCCI is checking your documents' })).toBeVisible();

  const { data: rows } = await admin.from('company_users').select('company_id').eq('user_id', uid);
  const { data: app } = await admin
    .from('applications')
    .select('stage, class, form')
    .eq('company_id', rows![0]!.company_id)
    .single();
  expect(app).toMatchObject({ stage: 'submitted', class: 'Associate' });
  const { count } = await admin
    .from('ai_extractions')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', rows![0]!.company_id)
    .eq('status', 'done');
  expect(count).toBe(4);

  // after submission the form is read-only
  await page.goto('/portal/join');
  await expect(page.getByRole('heading', { name: /My application/ })).toBeVisible();
  await expect(page.locator('[data-action="wiz.next"]')).toHaveCount(0);
});

test('Pvt Ltd shows 11 documents; submitting with missing items lists them in plain words', async ({ page }) => {
  test.setTimeout(90_000);
  await applicant(page, 'Sana Ali');
  await startApplication(page);
  await page.getByRole('button', { name: /^Ltd\. \/ Pvt\. Ltd Co\./ }).click();
  await expect(page.locator('.feebox')).toContainText('Corporate');
  // a body corporate registered with SECP: no class questions, only sales tax (for the documents) and women
  await expect(page.getByTestId('body-corporate')).toBeVisible();
  await expect(page.locator('[data-action="wiz.flag"]')).toHaveCount(2);
  await saved(page);
  await page.locator('[data-action="wiz.step"]').nth(1).click();
  await expect(page.locator('[data-doc]')).toHaveCount(11);
  await expect(page.locator('[data-doc="pphoto"]')).toBeVisible();
  await page.locator('[data-action="wiz.step"]').nth(5).click();
  const missing = page.getByTestId('missing');
  await expect(missing).toContainText('Main business category');
  await expect(missing).toContainText('Memorandum & Articles');
  await expect(missing).toContainText('At least two partners / directors');
  await expect(missing).toContainText('Company stamp / seal');
  await page.locator('[data-action="wiz.submit"]').click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Some items are still missing');
  await expect(page).toHaveURL(/\/portal\/join$/);
});

test('LLP is Corporate; a registered AOP asks Form C, an unregistered one does not', async ({ page }) => {
  test.setTimeout(90_000);
  await applicant(page, 'Hina Malik');
  await startApplication(page);
  await page.getByTestId('category').getByRole('button', { name: /^Manufacturing/ }).click();
  await page.getByRole('button', { name: /^LLP/ }).click();
  await expect(page.locator('.feebox')).toContainText('Corporate');
  await expect(page.getByTestId('body-corporate')).toBeVisible();
  await page.getByRole('button', { name: /^Partnership \/ AOP/ }).click();
  await expect(page.getByTestId('body-corporate')).toHaveCount(0);
  await page.getByRole('button', { name: /^Registered AOP/ }).click();
  await saved(page);
  await page.locator('[data-action="wiz.step"]').nth(1).click();
  await expect(page.locator('[data-doc="formc"]')).toBeVisible();
  await page.locator('[data-action="wiz.step"]').nth(0).click();
  await page.getByRole('button', { name: /^Unregistered AOP/ }).click();
  await saved(page);
  await page.locator('[data-action="wiz.step"]').nth(1).click();
  await expect(page.locator('[data-doc="formc"]')).toHaveCount(0);
  // sales tax registered: the w.e.f. date and the registration certificate are asked; manufacturing + GST = Corporate
  await page.locator('[data-action="wiz.step"]').nth(0).click();
  await page.locator('[data-action="wiz.flag"]').first().click();
  await expect(page.locator('.feebox')).toContainText('Corporate');
  await saved(page);
  await page.locator('[data-action="wiz.step"]').nth(1).click();
  await expect(page.locator('[data-doc="st"]')).toBeVisible();
  await expect(page.getByLabel(/Sales tax registered w\.e\.f\./)).toBeVisible();
});

test('a returned application shows only the rejected document; re-upload and resubmit', async ({ page }) => {
  test.setTimeout(90_000);
  const uid = await applicant(page, 'Bilal Ahmed');
  await startApplication(page);
  // the rest of the file is prepared directly (the full path is covered above); MCCI returns it with one rejection
  const { data: rows } = await admin.from('company_users').select('company_id').eq('user_id', uid);
  const company = rows![0]!.company_id;
  const { data: app } = await admin.from('applications').select('id').eq('company_id', company).single();
  const appId = app!.id;
  await admin
    .from('applications')
    .update({
      form: {
        biz: 'prop',
        manufacturing: false,
        repEmail: 'b@test.local',
        repAddress: 'Multan',
        nature: { sector: 'trade', items: ['Wholesaler'], other: '' },
        addrMatch: true,
        name: 'Bilal Stores',
        address: 'Multan',
        ntn: '1111111-1',
        tel: '061-1',
        email: 'b@test.local',
        particulars: 'Wholesale & Distribution: Wholesaler',
        est: '2010-01-01',
        rep: 'Bilal Ahmed',
        desig: 'Proprietor',
        cnic: '36302-3333333-3',
        mobile: '0300-0000000',
      },
      jurisdiction_ok: true,
      decl1: true,
      decl2: true,
      sign_path: `${company}/applications/${appId}/sign/x.png`,
      stage: 'returned',
      return_note: 'Your NTN certificate is not readable. Please upload a clear copy.',
    })
    .eq('id', appId);
  for (const key of ['cnic', 'ntn', 'addr', 'bank', 'photo']) {
    await admin.from('application_documents').insert({
      application_id: appId,
      key,
      path: `${company}/applications/${appId}/${key}/seed.pdf`,
      file_name: `${key}.pdf`,
      status: key === 'ntn' ? 'rejected' : 'ok',
      reject_reason: key === 'ntn' ? 'Not readable' : null,
    });
  }

  await page.goto('/portal');
  await expect(page.getByRole('heading', { name: 'Correction needed' })).toBeVisible();
  await page.goto('/portal/join');
  await expect(page.getByText('Your NTN certificate is not readable.')).toBeVisible();
  await expect(page.locator('[data-doc]')).toHaveCount(1);
  await choose(
    page,
    () => page.locator('[data-doc="ntn"] [data-action="app.fix.upload"]').click(),
    'ntn-clear.pdf',
    'application/pdf',
    PDF,
  );
  await expect(page.locator('[data-doc]')).toHaveCount(0, { timeout: 20_000 });
  await page.locator('[data-action="app.resubmit"]').click();
  await expect(page).toHaveURL(/\/portal\/mtrack$/, { timeout: 30_000 });
  const { data: after } = await admin.from('applications').select('stage').eq('id', appId).single();
  expect(after!.stage).toBe('review');
});
