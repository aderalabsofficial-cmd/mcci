import { randomInt, randomUUID } from 'node:crypto';
import { expect, type Page, test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { readLocalEnv } from '../integration/local-env';

/**
 * A tab opened before a release (lib/net/skew.ts): its navigations and server actions carry the old deployment ID.
 * The server answers them so the browser loads the page afresh, and the old action never runs (3 Nov 2026: one looped
 * between routes until it timed out). The suite's build has the ID e2e-build (playwright.config.ts).
 */
const CURRENT = 'e2e-build';
const OLD = 'release-before';
const env = readLocalEnv();

test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'desktop project only'));
// the contact form's rate limit counts per address: this test has its own
test.use({ extraHTTPHeaders: { 'x-real-ip': `10.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}` } });

/** every page-data request and server action from here on claims to come from the older release */
async function playOldTab(page: Page) {
  await page.route('**/*', (route) => {
    const headers = route.request().headers();
    if (headers['rsc'] || headers['next-action']) headers['x-deployment-id'] = OLD;
    return route.continue({ headers });
  });
}

/** a mark that only survives navigation inside the same document: gone after a full page load */
const mark = (page: Page) => page.evaluate(() => ((window as unknown as { __sameDoc?: boolean }).__sameDoc = true));
const marked = (page: Page) => page.evaluate(() => (window as unknown as { __sameDoc?: boolean }).__sameDoc === true);

test('the server tells requests from an older release apart; this release is untouched', async ({ request }) => {
  const stale = await request.get('/about', { headers: { rsc: '1', 'x-deployment-id': OLD } });
  expect(stale.status()).toBe(409);
  const fresh = await request.get('/about', { headers: { rsc: '1', 'x-deployment-id': CURRENT } });
  expect(fresh.status()).toBe(200);
  expect(fresh.headers()['content-type']).toContain('text/x-component');
  const action = await request.post('/contact?from=old', {
    headers: { 'next-action': 'a'.repeat(42), 'x-deployment-id': OLD, 'content-type': 'text/plain;charset=UTF-8' },
    data: '[]',
  });
  expect(action.status()).toBe(200);
  expect(action.headers()['x-action-redirect']).toBe('/contact?from=old;replace');
  expect((await request.get('/about')).status()).toBe(200); // a plain page load carries no ID and always works
});

test('an open tab from an older release loads the page afresh; its form is not sent', async ({ page }) => {
  // this release's own navigations carry its ID and stay in the same document
  await page.goto('/about');
  await mark(page);
  const own = page.waitForRequest((r) => r.headers()['rsc'] === '1');
  await page.locator('.crumbs a[href="/"]').click();
  expect((await own).headers()['x-deployment-id']).toBe(CURRENT);
  await expect(page).toHaveURL(/\/$/);
  expect(await marked(page)).toBe(true);

  // the same tab after a release: a link opens its page with a full load
  await playOldTab(page);
  await page.locator('.qa[href="/about#structure"]').click();
  await expect(page).toHaveURL(/\/about/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('About the Chamber');
  expect(await marked(page)).toBe(false);

  // a form sent from it: the page reloads, nothing is created
  await page.goto('/contact');
  await mark(page);
  const tag = `skew${randomUUID().slice(0, 6)}`;
  await page.getByLabel('Suggestion').check();
  await page.getByLabel('Your name').fill(`Visitor ${tag}`);
  await page.getByLabel('Mobile or email').fill(`${tag}@test.local`);
  await page.getByLabel('Your message').fill('This must not become a ticket.');
  await page.locator('[data-action="contact.send"]').click();
  await expect.poll(() => marked(page).catch(() => false)).toBe(false);
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.getByLabel('Your name')).toHaveValue('');
  await expect(page.locator('[data-outcome="ok"]')).toHaveCount(0);
  if (env) {
    const admin = createClient(env.url, env.secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data } = await admin.from('tickets').select('id').eq('name', `Visitor ${tag}`);
    expect(data).toEqual([]);
  }
});
