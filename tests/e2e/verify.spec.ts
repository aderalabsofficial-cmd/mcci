import { randomInt, randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { signReference } from '../../lib/qr/sign';
import { readLocalEnv } from '../integration/local-env';
import { NO_BACKEND, readAccounts } from './accounts';
import { qrTestKey } from './qr-key';

/**
 * Public verification (migration 0520, docs/26): a signed QR link, an altered signature, a random reference, a
 * membership number, a demo member that must not verify, a replaced certificate that names its replacement, the
 * per-address limit, and nothing private in the page. Rows are created with the local stack's secret key and removed
 * afterwards. Each test uses its own X-Real-IP (the e2e server trusts it, as production behind nginx), so the limits of
 * one test never touch another.
 */
const accounts = readAccounts();
const env = readLocalEnv();
const keyEnv = { QR_SIGNING_KEY: qrTestKey() } as unknown as NodeJS.ProcessEnv;
const ip = () => `198.51.100.${randomInt(1, 254)}`;

let current = '';
let replaced = '';
const demo = { company: randomUUID(), member: randomUUID(), no: `DEMO-C-${randomInt(100000, 999999)}`, doc: '' };
const docIds: string[] = [];

const admin = () =>
  createClient(env!.url, env!.secretKey, { auth: { persistSession: false, autoRefreshToken: false } });

test.beforeAll(async ({}, info) => {
  if (info.project.name !== 'desktop' || !accounts.backend || !env) return;
  const db = admin();
  const make = async (company: string, member: string, title: string) => {
    const { data, error } = await db
      .from('documents')
      .insert({ kind: 'certificate', company_id: company, member_id: member, title })
      .select('id, code')
      .single();
    if (error) throw new Error(error.message);
    docIds.push(data.id);
    return data;
  };
  const oldDoc = await make(accounts.companyId!, accounts.memberRowId!, 'E2E certificate (old)');
  const newDoc = await make(accounts.companyId!, accounts.memberRowId!, 'E2E certificate');
  const sup = await db.from('documents').update({ status: 'Superseded', superseded_by: newDoc.id }).eq('id', oldDoc.id);
  if (sup.error) throw new Error(sup.error.message);
  replaced = oldDoc.code;
  current = newDoc.code;

  const c = await db
    .from('companies')
    .insert({ id: demo.company, name: `E2E ${accounts.run} DEMO Traders`, biz_type: 'pvt', demo: true });
  if (c.error) throw new Error(c.error.message);
  const m = await db.from('members').insert({
    id: demo.member,
    member_no: demo.no,
    company_id: demo.company,
    class: 'Corporate',
    status: 'Permanent',
    rep_name: 'E2E Demo',
    since: '2020-04-01',
    valid_to: '2099-03-31',
  });
  if (m.error) throw new Error(m.error.message);
  demo.doc = (await make(demo.company, demo.member, 'E2E demo certificate')).code;
});

test.afterAll(async ({}, info) => {
  if (info.project.name !== 'desktop' || !accounts.backend || !env) return;
  const db = admin();
  await db.from('documents').update({ superseded_by: null }).in('id', docIds);
  await db.from('documents').delete().in('id', docIds);
  await db.from('members').delete().eq('id', demo.member);
  await db.from('companies').delete().eq('id', demo.company);
});

test.beforeEach(async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'desktop project only');
  test.skip(!accounts.backend || !env, NO_BACKEND);
  await page.setExtraHTTPHeaders({ 'X-Real-IP': ip() });
});

test('a signed QR link verifies as genuine and shows only the approved details', async ({ page }) => {
  const sig = signReference(current, keyEnv)!;
  await page.goto(`/verify/${current}?s=${sig}`);
  const result = page.locator('[data-verify="found"]');
  await expect(result).toContainText('Genuine — current MCCI member');
  await expect(result).toContainText(`E2E ${accounts.run} Traders`);
  await expect(result).toContainText(accounts.member!.memberNo);
  await expect(page.locator('[data-signature="valid"]')).toBeVisible();
  await expect(page.locator('.vf-pattern')).toHaveAttribute('data-fingerprint', /^[0-9A-F]{8}$/);
  // nothing private or internal in the page: no email, no storage path, no internal ids, no file links
  const html = await page.content();
  expect(html).not.toContain(accounts.member!.email);
  expect(html).not.toMatch(/scans\/|certificates\/|\/api\/certificates|\/api\/files/);
  expect(html).not.toContain(accounts.companyId!);
  expect(html).not.toContain(accounts.memberRowId!);
});

test('an altered signature is refused without a lookup', async ({ page }) => {
  const sig = signReference(current, keyEnv)!;
  const bad = sig.slice(0, 5) + (sig[5] === 'A' ? 'B' : 'A') + sig.slice(6); // one character changed
  await page.goto(`/verify/${current}?s=${bad}`);
  await expect(page.locator('[data-verify="tampered"]')).toContainText('signature does not match');
  await expect(page.locator('[data-verify="found"]')).toHaveCount(0);
  // a signature made for another reference does not fit this one either
  await page.goto(`/verify/${current}?s=${signReference(replaced, keyEnv)}`);
  await expect(page.locator('[data-verify="tampered"]')).toBeVisible();
});

test('a random reference and a malformed one are not found', async ({ page }) => {
  await page.goto('/verify?c=MCCI-QR-AAAAA-AAAAA');
  await expect(page.locator('[data-verify="none"]')).toContainText('No MCCI document has this code');
  await page.goto('/verify?c=hello');
  await expect(page.locator('[data-verify="invalid"]')).toBeVisible();
});

test('a membership number verifies; the form on the page works', async ({ page }) => {
  await page.goto('/verify');
  await page.getByLabel('Membership number', { exact: true }).fill(accounts.member!.memberNo.toLowerCase());
  await page.locator('[data-action="verify.member"]').click();
  await expect(page).toHaveURL(/\/verify\?m=/);
  const result = page.locator('[data-verify="found"]');
  await expect(result).toContainText('Genuine — current MCCI member');
  await expect(result).toContainText(current);
});

test('a replaced certificate says so and names the new reference', async ({ page }) => {
  await page.goto(`/verify?c=${replaced}`);
  const result = page.locator('[data-verify="found"]');
  await expect(result).toContainText('Certificate replaced');
  await expect(result).toContainText(`replaced by ${current}`);
  await expect(result.locator('[data-cert-status="Superseded"]')).toBeVisible();
});

test('a demo member never verifies, by number or by certificate', async ({ page }) => {
  await page.goto(`/verify?m=${demo.no}`);
  await expect(page.locator('[data-verify="none"]')).toBeVisible();
  await page.goto(`/verify?c=${demo.doc}`);
  await expect(page.locator('[data-verify="none"]')).toBeVisible();
});

test('the public API answers the same, and limits membership-number checks per address', async ({ request }) => {
  const headers = { 'X-Real-IP': ip() };
  const ok = await request.get(`/api/public/verify?ref=${current}&s=${signReference(current, keyEnv)}`, { headers });
  expect(ok.status()).toBe(200);
  const body = await ok.json();
  expect(body).toMatchObject({ found: true, signature: 'valid' });
  expect(Object.keys(body.result).sort()).toEqual(
    [
      'business_name',
      'category',
      'certificate_ref',
      'certificate_status',
      'checked_on',
      'class',
      'member_no',
      'member_since',
      'member_status',
      'replaced_by',
      'valid_to',
    ].sort(),
  );
  expect(ok.headers()['cache-control']).toContain('no-store');
  expect((await request.get('/api/public/verify?ref=MCCI-QR-AAAAA-AAAAA', { headers })).status()).toBe(404);

  const limited = { 'X-Real-IP': ip() };
  const codes: number[] = [];
  for (let i = 0; i < 11; i++)
    codes.push((await request.get(`/api/public/verify?member=MCCI-C-${100000 + i}`, { headers: limited })).status());
  expect(codes.slice(0, 10).every((c) => c === 404)).toBe(true);
  expect(codes[10]).toBe(429);
});
