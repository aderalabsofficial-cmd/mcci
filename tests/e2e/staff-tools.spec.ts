import { expect, test } from '@playwright/test';
import { NO_BACKEND, readAccounts } from './accounts';
import { signInAs } from './helpers';

/** Reports, global search and My queue (staff tools), with their permission boundaries. */
const accounts = readAccounts();

test.beforeEach(({}, info) => {
  test.skip(info.project.name !== 'desktop', 'desktop project only');
  test.skip(!accounts.backend, NO_BACKEND);
});

test('reports show aggregate sections and download as CSV', async ({ page }) => {
  await signInAs(page, 'sg');
  await page.goto('/admin/reports');
  for (const s of ['membership', 'pipeline', 'payments', 'services', 'committee', 'verification'])
    await expect(page.locator(`[data-report="${s}"]`)).toBeVisible();
  const csv = await page.request.get('/api/reports?from=2026-01-01&to=2026-12-31');
  expect(csv.status()).toBe(200);
  expect(csv.headers()['content-type']).toContain('text/csv');
  expect(await csv.text()).toContain('"section","item","count"');
});

test('search finds a member by number, within the person’s limits', async ({ page }) => {
  await signInAs(page, 'sg');
  await page.goto(`/admin/search?q=${accounts.member!.memberNo}`);
  await expect(page.locator('[data-kind="member"]').first()).toContainText(accounts.member!.memberNo);
  await page.goto('/admin/search?q=%25%25');
  await expect(page.getByText('Type at least 2 characters.')).toBeVisible();
});

test('My queue opens from the bottom-bar link; the queue API is staff-only', async ({ page, browser }) => {
  await signInAs(page, 'sg');
  await page.goto('/admin/queue');
  await expect(page.locator('[data-queue="notifications"]')).toBeVisible();
  const json = await page.request.get('/api/queue');
  expect(json.status()).toBe(200);
  expect(Array.isArray((await json.json()).groups)).toBe(true);

  const member = await browser.newPage();
  await signInAs(member, 'member');
  expect((await member.request.get('/api/queue')).status()).toBe(403);
  expect((await member.request.get('/api/reports?from=2026-01-01&to=2026-12-31')).status()).toBe(403);
  await member.close();
});
