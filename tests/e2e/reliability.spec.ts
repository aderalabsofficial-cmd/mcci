import { randomBytes, randomUUID } from 'node:crypto';
import { expect, type Page, test } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readLocalEnv } from '../integration/local-env';
import { signInAs } from './helpers';

/**
 * Reliability (incidents 25 Oct 2026): a failed server-action call is never silent and never looks like success.
 * 1. Application form open across a release (Next.js answers "action not found"): the edit is kept, the form says
 *    so and offers a reload; after the reload the edit is back and saved.
 * 2. Connection cut while saving: "Not saved" with Retry; Retry saves the same edit.
 * 3. A staff action cut off: "not confirmed" (never "done"), the database unchanged; trying again works.
 */
const env = readLocalEnv();
test.skip(!env, 'needs the local Supabase stack (MCCI_IT_LOCAL=1 with its URL and keys)');
test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'desktop project only'));

let admin: SupabaseClient;
const person = { id: '', email: `e2e-rel-${randomUUID().slice(0, 8)}@test.local`, password: randomBytes(18).toString('base64url') };
let company = '';
let draftApp = '';
let reviewApp = '';
let reviewToken = '';

test.beforeAll(async () => {
  if (!env) return;
  admin = createClient(env.url, env.secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await admin.auth.admin.createUser({
    email: person.email,
    password: person.password,
    email_confirm: true,
    user_metadata: { full_name: 'Reliability Applicant' },
  });
  expect(error).toBeNull();
  person.id = data.user!.id;
  company = randomUUID();
  await admin.from('companies').insert({ id: company, name: 'Reliability Traders', biz_type: 'prop' });
  await admin.from('company_users').insert({ company_id: company, user_id: person.id, role: 'Owner' });
  const { data: d } = await admin
    .from('applications')
    .insert({ company_id: company, created_by: person.id, stage: 'draft', form: { biz: 'prop', step: 2, name: 'Before' } })
    .select('id')
    .single();
  draftApp = d!.id;
  // a second company's submitted file for the staff test
  const other = randomUUID();
  await admin.from('companies').insert({ id: other, name: 'Reliability Review Co', biz_type: 'prop' });
  const { data: r } = await admin
    .from('applications')
    .insert({ company_id: other, created_by: person.id, stage: 'submitted', submitted_at: new Date().toISOString(), class: 'Associate', form: { biz: 'prop', name: 'Reliability Review Co' } })
    .select('id, token')
    .single();
  reviewApp = r!.id;
  reviewToken = r!.token;
});

test.afterAll(async () => {
  if (!admin || !person.id) return;
  await admin.from('applications').delete().eq('created_by', person.id);
  await admin.from('companies').delete().in('name', ['Reliability Traders', 'Reliability Review Co']);
  await admin.auth.admin.deleteUser(person.id);
});

const formName = async () =>
  ((await admin.from('applications').select('form').eq('id', draftApp).single()).data?.form as { name?: string }).name;

async function signIn(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Mobile, email or member ID').fill(person.email);
  await page.getByRole('tabpanel', { name: 'Member login' }).getByLabel('Password').fill(person.password);
  await page.locator('[data-action="login.member"]').click();
  await expect(page).toHaveURL(/\/portal$/, { timeout: 20_000 });
}

/** answer every server action from this page the way Next.js answers a tab from an older release */
const staleBuild = (page: Page) =>
  page.route('**/*', (route) =>
    route.request().method() === 'POST' && route.request().headers()['next-action']
      ? route.fulfill({ status: 404, headers: { 'x-nextjs-action-not-found': '1', 'content-type': 'text/plain' }, body: 'Server action not found.' })
      : route.continue(),
  );
const cutOff = (page: Page) =>
  page.route('**/*', (route) =>
    route.request().method() === 'POST' && route.request().headers()['next-action'] ? route.abort('connectionreset') : route.continue(),
  );

test('application form open across a release: the edit is kept, said so, and saved after the reload', async ({ page }) => {
  test.setTimeout(120_000);
  await signIn(page);
  await page.goto('/portal/join');
  const name = page.getByLabel('Name of Business');
  await expect(name).toHaveValue('Before');

  await staleBuild(page);
  await name.fill('Stale Tab Traders');
  const line = page.locator('.wz-save');
  await expect(line).toHaveAttribute('data-state', 'stale');
  await expect(line).toContainText('MCCI Digital was updated');
  await expect(page.getByRole('main').getByRole('alert').filter({ hasText: 'Nothing was saved by this click' })).toBeVisible();
  expect(await formName()).toBe('Before');

  await page.unroute('**/*');
  await line.locator('[data-action="page.reload"]').click();
  await expect(page.getByLabel('Name of Business')).toHaveValue('Stale Tab Traders');
  await expect(page.getByRole('status').filter({ hasText: 'are back and are being saved' })).toBeVisible();
  await expect.poll(formName, { timeout: 15_000 }).toBe('Stale Tab Traders');
});

test('connection cut while saving: "Not saved" with Retry, and Retry saves the same edit', async ({ page }) => {
  test.setTimeout(120_000);
  await signIn(page);
  await page.goto('/portal/join');
  await cutOff(page);
  await page.getByLabel('Name of Business').fill('Retry Traders');
  const line = page.locator('.wz-save');
  await expect(line).toHaveAttribute('data-state', 'error');
  expect(await formName()).not.toBe('Retry Traders');
  await page.unroute('**/*');
  await line.locator('[data-action="wiz.retry"]').click();
  await expect(line).toHaveAttribute('data-state', 'saved');
  await expect.poll(formName, { timeout: 15_000 }).toBe('Retry Traders');
});

test('a staff action cut off says "not confirmed", changes nothing, and works when tried again', async ({ page }) => {
  test.setTimeout(120_000);
  await signInAs(page, 'staff');
  await page.goto(`/admin/mreview?t=${reviewToken}`);
  await page.waitForLoadState('networkidle');
  await cutOff(page);
  await page.locator('[data-action="adm.app.open"]').click();
  const notice = page.getByRole('main').locator('[data-outcome="unconfirmed"]');
  await expect(notice).toContainText('did not confirm');
  await expect(notice.locator('[data-action="page.reload"]')).toBeVisible();
  await expect(page.getByRole('main').locator('[data-outcome="ok"]')).toHaveCount(0);
  expect((await admin.from('applications').select('stage').eq('id', reviewApp).single()).data!.stage).toBe('submitted');

  await page.unroute('**/*');
  await page.locator('[data-action="adm.app.open"]').click();
  await expect(page.getByRole('main').locator('[data-outcome="ok"]')).toContainText('Review started.');
  expect((await admin.from('applications').select('stage').eq('id', reviewApp).single()).data!.stage).toBe('review');
});
