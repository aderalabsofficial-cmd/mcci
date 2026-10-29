import { expect, test } from '@playwright/test';
import { signInAs } from './helpers';

/**
 * Audit Trail (admin/audit, migration 0500): staff with Staff & Audit access read every change (who, what, when, old →
 * new, why) and search it; only the IT Convener downloads it, and every download attempt is logged.
 */
test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'desktop project only'));

test('the Secretary General reads and searches the audit trail, but cannot export it', async ({ page }) => {
  await signInAs(page, 'sg');
  await page.goto('/admin/audit');
  await expect(page.getByRole('heading', { name: 'Audit Trail' })).toBeVisible();
  await expect(page.locator('[data-audit]').first()).toBeVisible();
  await expect(page.locator('[data-action="audit.export"]')).toHaveCount(0);
  // search: only matching entries stay
  await page.getByRole('search').getByRole('textbox').fill('role_permissions');
  await page.getByRole('search').getByRole('combobox').selectOption('365');
  await page.locator('[data-action="audit.filter"]').click();
  await expect(page).toHaveURL(/q=role_permissions/);
  for (const row of await page.locator('[data-audit]').all()) await expect(row).toContainText(/role_permissions/i);
  // the changed fields of an entry open in place
  const details = page.locator('[data-audit] details').first();
  if (await details.count()) {
    await details.locator('summary').click();
    await expect(details.locator('li').first()).toBeVisible();
  }
  expect((await page.request.get('/api/audit/export')).status()).toBe(200);
  expect((await (await page.request.get('/api/audit/export')).text()).trim().split('\n')).toHaveLength(1); // header only
});

test('the IT Convener exports the audit trail as CSV', async ({ page }) => {
  await signInAs(page, 'itconv');
  await page.goto('/admin/audit?days=30');
  const link = page.locator('[data-action="audit.export"]');
  await expect(link).toHaveAttribute('href', /\/api\/audit\/export\?days=30/);
  const csv = await page.request.get((await link.getAttribute('href'))!);
  expect(csv.headers()['content-type']).toContain('text/csv');
  expect(csv.headers()['content-disposition']).toMatch(/^attachment; filename="mcci-audit-log-/);
  expect((await csv.text()).split('\n').length).toBeGreaterThan(2);
});

test('staff without Staff & Audit access see no audit trail', async ({ page }) => {
  await signInAs(page, 'staff');
  await page.goto('/admin/audit');
  await expect(page.locator('[data-audit]')).toHaveCount(0);
  await expect(page.getByRole('main')).toContainText(/outside your limits|not allowed|no access/i);
});
