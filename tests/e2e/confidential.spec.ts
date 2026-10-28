import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { readLocalEnv } from '../integration/local-env';
import { readAccounts } from './accounts';
import { signInAs } from './helpers';

/**
 * Confidential documents and the register (migration 0460, docs/22 §4): the Membership Officer views an applicant's
 * document only through the app (watermarked, logged) and can never get the original file — not by the download
 * link, not by a storage link; the Secretary General neither; only the IT Convener downloads the original and exports
 * the register. Every attempt is logged.
 */
const env = readLocalEnv();
test.skip(!env, 'needs the local Supabase stack (MCCI_IT_LOCAL=1 with its URL and keys)');
test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'desktop project only'));
test.describe.configure({ mode: 'serial' });

let admin: SupabaseClient;
const company = randomUUID();
const app = randomUUID();
const path = `${company}/applications/${app}/cnic.png`;
const file = `/api/files/application-docs/${path}`;

test.beforeAll(async () => {
  if (!env) return;
  admin = createClient(env.url, env.secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const owner = readAccounts().member!.id;
  await admin.from('companies').insert({ id: company, name: `Confidential ${company.slice(0, 6)}`, biz_type: 'prop' });
  await admin.from('applications').insert({ id: app, company_id: company, created_by: owner, stage: 'review', submitted_at: new Date().toISOString(), form: { biz: 'prop', name: 'Confidential Traders' } });
  const png = await sharp({ create: { width: 400, height: 260, channels: 3, background: { r: 200, g: 220, b: 240 } } }).png().toBuffer();
  await admin.storage.from('application-docs').upload(path, png, { contentType: 'image/png', upsert: true });
  await admin.from('application_documents').insert({ application_id: app, key: 'cnic', path, file_name: 'cnic.png', mime: 'image/png' });
});

test.afterAll(async () => {
  if (!admin) return;
  await admin.storage.from('application-docs').remove([path]);
  await admin.from('applications').delete().eq('id', app);
  await admin.from('companies').delete().eq('id', company);
});

test('the Membership Officer views watermarked copies only; download and storage links are refused', async ({ page }) => {
  test.setTimeout(90_000);
  await signInAs(page, 'staff');
  const token = (await admin.from('applications').select('token').eq('id', app).single()).data!.token;
  await page.goto(`/admin/mreview?t=${token}`);
  const view = page.locator('[data-doc="cnic"] [data-action="wiz.doc.view"]');
  await expect(view).toHaveAttribute('href', new RegExp(`^/api/files/application-docs/`));
  await expect(page.locator('[data-action="doc.download"]')).toHaveCount(0);

  const seen = await page.request.get(file);
  expect(seen.status()).toBe(200);
  expect(seen.headers()['content-type']).toBe('image/jpeg'); // the watermarked copy, not the stored PNG
  expect(seen.headers()['content-disposition']).toBe('inline');
  expect((await page.request.get(`${file}?download=1`)).status()).toBe(403);
  // a made-up path or another bucket
  expect((await page.request.get(`/api/files/application-docs/${company}/applications/${app}/../../x`)).status()).not.toBe(200);
  expect((await page.request.get(`/api/files/certificates/scans/x/original.png`)).status()).toBe(403);
  // the register export
  expect((await page.request.get('/api/register/export')).status()).toBe(200);
  expect((await (await page.request.get('/api/register/export')).text()).trim().split('\n')).toHaveLength(1); // the header only
});

test('the Secretary General cannot download or export either', async ({ page }) => {
  await signInAs(page, 'sg');
  expect((await page.request.get(`${file}?download=1`)).status()).toBe(403);
  await page.goto('/admin/members');
  await expect(page.locator('[data-action="reg.export"]')).toHaveCount(0);
  expect((await (await page.request.get('/api/register/export')).text()).trim().split('\n')).toHaveLength(1);
});

test('the IT Convener downloads the original and exports the register; every attempt is logged', async ({ page }) => {
  await signInAs(page, 'itconv');
  const original = await page.request.get(`${file}?download=1`);
  expect(original.status()).toBe(200);
  expect(original.headers()['content-type']).toBe('image/png');
  expect(original.headers()['content-disposition']).toMatch(/^attachment/);
  await page.goto('/admin/members');
  await expect(page.locator('[data-action="reg.export"]')).toBeVisible();
  const csv = await page.request.get('/api/register/export');
  expect(csv.headers()['content-type']).toContain('text/csv');
  expect((await csv.text()).split('\n').length).toBeGreaterThan(2);

  const { data: log } = await admin.from('file_access_log').select('mode, allowed, designation').eq('path', path);
  expect(log!.filter((x) => x.mode === 'download' && !x.allowed).map((x) => x.designation).sort()).toEqual(['Membership Officer', 'Secretary General']);
  expect(log!.filter((x) => x.mode === 'download' && x.allowed).map((x) => x.designation)).toEqual(['IT Convener']);
  expect(log!.some((x) => x.mode === 'view' && x.allowed && x.designation === 'Membership Officer')).toBe(true);
});
