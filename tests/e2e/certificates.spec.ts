import { randomBytes, randomUUID } from 'node:crypto';
import { expect, type Browser, type Page, test } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { readLocalEnv } from '../integration/local-env';
import { signInAs } from './helpers';

/**
 * Certificates printed by the security press (migration 0450, docs/21 point 30): the SG uploads scans; each is read
 * (the fake model answers by image width: clear / blurry / unknown number), matched and listed with its conflicts.
 * The same scan twice is refused. The clear one is confirmed: QR reference created, nothing for the member yet; staff
 * preview, adjust and save the QR copy (the original stays byte-identical); the member's
 * number and validity are unchanged; the public check shows it; the member sees the stamped scan and the same QR larger.
 * The Membership Officer cannot override the blurry one (approver only); the unknown one is rejected with a reason.
 * Members never reach a scan file; another member never reaches this certificate.
 */
const env = readLocalEnv();
test.skip(!env, 'needs the local Supabase stack (MCCI_IT_LOCAL=1 with its URL and keys)');
test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'desktop project only'));
test.describe.configure({ mode: 'serial' });

const tag = randomUUID().slice(0, 6);
let admin: SupabaseClient;
const owner = { id: '', email: `e2e-cert-${tag}@test.local`, password: randomBytes(18).toString('base64url') };
let company = '';
let member = '';
const NO = 'C-90869';

/** a plain PNG of a given width: the fake model reads 640 clear, 641 blurry, 642 an unknown number */
const scan = async (width: number, seed: number) =>
  sharp({ create: { width, height: 480, channels: 3, background: { r: 240, g: 236 - seed, b: 220 } } })
    .png()
    .toBuffer();

test.beforeAll(async () => {
  if (!env) return;
  admin = createClient(env.url, env.secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  // a member registered earlier with this number (the certificate's number) and its owner's account
  await admin.from('members').delete().eq('member_no', NO);
  company = randomUUID();
  await admin.from('companies').insert({ id: company, name: 'Garden Makers (Pvt.) Ltd.', biz_type: 'pvt' });
  const { data: m } = await admin
    .from('members')
    .insert({
      member_no: NO,
      company_id: company,
      class: 'Corporate',
      status: 'Permanent',
      rep_name: 'Cert Owner',
      since: '2026-05-20',
      valid_to: '2027-03-31',
    })
    .select('id')
    .single();
  member = m!.id;
  const { data: u } = await admin.auth.admin.createUser({
    email: owner.email,
    password: owner.password,
    email_confirm: true,
    user_metadata: { full_name: 'Cert Owner' },
  });
  owner.id = u.user!.id;
  await admin.from('company_users').insert({ company_id: company, user_id: owner.id, role: 'Owner' });
});

test.afterAll(async () => {
  if (!admin) return;
  const { data: scans } = await admin
    .from('certificate_scans')
    .select('id, path, stamped_path')
    .like('file_name', `%${tag}%`);
  const files = (scans ?? []).flatMap((s) => [s.path, s.stamped_path].filter(Boolean) as string[]);
  if (files.length) await admin.storage.from('certificates').remove(files);
  await admin.from('certificate_scans').delete().like('file_name', `%${tag}%`);
  await admin.from('documents').delete().eq('member_id', member);
  await admin.from('notifications').delete().eq('company_id', company);
  await admin.from('members').delete().eq('id', member);
  await admin.from('company_users').delete().eq('company_id', company);
  await admin.from('companies').delete().eq('id', company);
  if (owner.id) await admin.auth.admin.deleteUser(owner.id);
});

const row = (page: Page, name: string) => page.locator(`[data-scan="${name}"]`);

async function upload(page: Page, files: { name: string; buffer: Buffer }[]) {
  await page.locator('[data-action="cert.upload"]').setInputFiles(files.map((f) => ({ ...f, mimeType: 'image/png' })));
}

async function asOwner(browser: Browser): Promise<Page> {
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await p.goto('/login');
  await p.getByLabel('Mobile, email or member ID').fill(owner.email);
  await p.getByRole('tabpanel', { name: 'Member login' }).getByLabel('Password', { exact: true }).fill(owner.password);
  await p.locator('[data-action="login.member"]').click();
  await expect(p).toHaveURL(/\/portal$/, { timeout: 20_000 });
  return p;
}

test('upload, read, conflicts and duplicates; the clear scan is confirmed and its QR stamped', async ({
  page,
  browser,
}) => {
  test.setTimeout(180_000);
  const clear = `clear-${tag}.png`;
  const blurry = `blurry-${tag}.png`;
  const unknown = `unknown-${tag}.png`;
  const clearBytes = await scan(640, 1);
  await signInAs(page, 'sg');
  await page.goto('/admin/temp');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Certificates');
  await upload(page, [
    { name: clear, buffer: clearBytes },
    { name: blurry, buffer: await scan(641, 2) },
    { name: unknown, buffer: await scan(642, 3) },
  ]);
  await expect(row(page, unknown)).toBeVisible({ timeout: 60_000 });

  // what was read, matched and flagged
  await expect(row(page, clear)).toContainText(`Matched: ${NO}`);
  await expect(row(page, clear).locator('[data-conflicts]')).toHaveCount(0);
  await expect(row(page, blurry).locator('[data-conflicts]')).toContainText('not clearly readable');
  await expect(row(page, unknown).locator('[data-conflicts]')).toContainText('number not in the register');

  // the same scan again is refused
  await upload(page, [{ name: `again-${tag}.png`, buffer: clearBytes }]);
  await expect(page.getByRole('main').getByRole('alert').first()).toContainText('already uploaded');

  // nothing applied before a person confirms
  expect((await admin.from('documents').select('id').eq('member_id', member)).data).toEqual([]);

  // confirm the clear one → QR document, stamped scan; member unchanged
  await row(page, clear).locator('[data-action="cert.confirm"]').click();
  await page.getByRole('dialog').locator('[data-action="cert.confirm.confirm"]').click();
  await expect(page.getByRole('main').getByRole('status').first()).toContainText(
    `Confirmed for ${NO}: reference MCCI-QR-`,
  );
  await expect(row(page, clear)).toHaveAttribute('data-status', 'confirmed');
  const { data: doc } = await admin
    .from('documents')
    .select('code, status, valid_to, path')
    .eq('member_id', member)
    .single();
  expect(doc).toMatchObject({ status: 'Valid', valid_to: '2027-03-31' });
  expect(doc!.path).toMatch(/^scans\/[0-9a-f-]{36}\/original\.png$/); // no QR copy yet
  expect((await admin.from('members').select('member_no, valid_to, serial').eq('id', member).single()).data).toEqual({
    member_no: NO,
    valid_to: '2027-03-31',
    serial: 'B 1934589',
  });
  const clearId = (await admin.from('certificate_scans').select('id').eq('file_name', clear).single()).data!
    .id as string;

  // confirmed but no QR copy: the member cannot reach the certificate, its QR or the original
  const ep = await asOwner(browser);
  expect((await ep.request.get(`/api/certificates/${doc!.code}`)).status()).toBe(404);
  expect((await ep.request.get(`/api/certificates/${doc!.code}/qr?format=png`)).status()).toBe(404);
  await ep.context().close();

  // the editor: original, proposed copy at the default position, large QR; adjust; save
  const ed = row(page, clear).locator('.stamp-ed');
  await expect(ed).toHaveAttribute('data-stamp', 'missing');
  await ed.locator('[data-action="cert.stamp.open"]').click();
  await expect(ed.locator('[data-preview="ready"] img')).toBeVisible({ timeout: 30_000 });
  await expect(ed.locator('[data-field="cx"]')).toHaveValue('50');
  await expect(ed.locator('[data-field="cy"]')).toHaveValue('83');
  await expect(ed.locator('[data-field="mm"]')).toHaveValue('27');
  await ed.locator('[data-field="cy"]').fill('80');
  await ed.locator('[data-action="cert.stamp.preview"]').click();
  await expect(ed.locator('[data-action="cert.stamp.save"]')).toBeEnabled({ timeout: 30_000 });
  await ed.locator('[data-action="cert.stamp.save"]').click();
  await expect(row(page, clear).locator('.stamp-ed')).toHaveAttribute('data-stamp', 'saved', { timeout: 30_000 });
  const { data: saved } = await admin.from('documents').select('code, path').eq('member_id', member);
  expect(saved).toHaveLength(1); // one record, one reference
  expect(saved![0]).toEqual({ code: doc!.code, path: `scans/${clearId}/stamped.png` });

  // the original is byte-identical; the copy has the QR at the chosen spot; downloads and the large QR work
  const original = await page.request.get(`/api/certificates/scan/${clearId}?download=1`);
  expect(original.headers()['content-disposition']).toContain('attachment');
  expect(Buffer.compare(Buffer.from(await original.body()), clearBytes)).toBe(0);
  const stamped = await page.request.get(`/api/certificates/scan/${clearId}?v=stamped&download=1`);
  expect(stamped.status()).toBe(200);
  const img = sharp(Buffer.from(await stamped.body()));
  const { width, height } = await img.metadata();
  const px = await img
    .extract({ left: Math.round(width! / 2), top: Math.round(height! * 0.8), width: 1, height: 1 })
    .removeAlpha()
    .raw()
    .toBuffer();
  expect([...px]).not.toEqual([240, 235, 220]);
  for (const f of ['png', 'svg']) {
    const q = await page.request.get(`/api/certificates/${doc!.code}/qr?format=${f}&download=1`);
    expect(q.status()).toBe(200);
    expect(q.headers()['content-disposition']).toContain(`${doc!.code}.${f}`);
  }

  // the unknown one is rejected with a reason
  await row(page, unknown).locator('[data-action="cert.reject"]').click();
  await page.getByRole('dialog').getByLabel('Reason').fill('Not in our register — returned to the printer');
  await page.getByRole('dialog').locator('[data-action="cert.reject.confirm"]').click();
  await expect(row(page, unknown)).toHaveAttribute('data-status', 'rejected');

  // public check of the QR
  const pub = await (await browser.newContext()).newPage();
  await pub.goto(`/verify/${doc!.code}`);
  await expect(pub.getByRole('main').locator('[data-verify="found"]')).toContainText('Valid');
  await expect(pub.getByRole('main')).toContainText(NO);
  await pub.context().close();

  // the member: the stamped scan and the same QR, larger; a scan file never
  const mp = await asOwner(browser);
  await mp.goto(`/portal/documents?code=${doc!.code}`);
  const cert = mp.locator(`[data-cert="${doc!.code}"]`);
  await expect(cert.locator('img')).toBeVisible();
  await expect(cert.locator('.cert-qr-svg svg')).toBeVisible();
  expect((await mp.request.get(`/api/certificates/${doc!.code}`)).status()).toBe(200);
  const scanId = (await admin.from('certificate_scans').select('id').eq('file_name', clear).single()).data!.id;
  expect((await mp.request.get(`/api/certificates/scan/${scanId}`)).status()).toBe(403);
  await mp.context().close();
});

test('the Membership Officer reviews but cannot override a conflict; another member cannot open the certificate', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await signInAs(page, 'staff');
  await page.goto('/admin/temp');
  const blurry = row(page, `blurry-${tag}.png`);
  await blurry.locator('[data-action="cert.confirm"]').click();
  const d = page.getByRole('dialog');
  await expect(d).toContainText('only the certificate approver');
  await expect(d.locator('[data-action="cert.confirm.confirm"]')).toBeDisabled();
  await d.locator('[data-action="modal.close"]').click();

  // another member (the e2e member persona) never reaches this certificate's file
  const { data: doc } = await admin.from('documents').select('code').eq('member_id', member).single();
  await signInAs(page, 'member');
  expect((await page.request.get(`/api/certificates/${doc!.code}`)).status()).toBe(404);
});
