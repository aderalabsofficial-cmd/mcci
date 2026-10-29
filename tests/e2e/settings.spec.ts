import { expect, test } from '@playwright/test';
import { signInAs } from './helpers';

/** Platform Settings (admin/settings, migration 0510): Platform 2+ saves with a reason; the change is audited. */
test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'desktop project only'));

test('the Secretary General changes the process time with a reason; it is saved and audited, and put back', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await signInAs(page, 'sg');
  await page.goto('/admin/settings');
  const card = page.locator('[data-settings="sla"]');
  const days = card.locator('[name="processDays"]');
  const before = await days.inputValue();
  await days.fill('12');
  await card.locator('[name="reason"]').fill('e2e: process time check');
  await card.locator('[data-action="settings.save"]').click();
  await expect(card.getByRole('status')).toContainText('Saved', { timeout: 20_000 });
  await page.reload();
  await expect(page.locator('[data-settings="sla"] [name="processDays"]')).toHaveValue('12');
  // out of range: refused by the database, nothing saved
  await page.locator('[data-settings="sla"] [name="hours"]').evaluate((el: HTMLInputElement) => el.removeAttribute('max'));
  await page.locator('[data-settings="sla"] [name="hours"]').fill('500');
  await page.locator('[data-settings="sla"] [data-action="settings.save"]').click();
  await expect(page.locator('[data-settings="sla"]').getByRole('alert')).toContainText('hours');
  // the audit trail has the change with its reason
  await page.goto('/admin/audit?q=process+time+check&days=1');
  await expect(page.locator('[data-audit]').first()).toContainText('e2e: process time check');
  // put it back
  await page.goto('/admin/settings');
  await page.locator('[data-settings="sla"] [name="processDays"]').fill(before);
  await page.locator('[data-settings="sla"] [data-action="settings.save"]').click();
  await expect(page.locator('[data-settings="sla"]').getByRole('status')).toContainText('Saved', { timeout: 20_000 });
});

test('staff without platform access do not see the settings', async ({ page }) => {
  await signInAs(page, 'staff');
  await page.goto('/admin/settings');
  await expect(page.locator('[data-settings]')).toHaveCount(0);
});

test('Connections shows what is connected and what waits on the bank or courier, with no secret on screen', async ({
  page,
}) => {
  await signInAs(page, 'sg');
  await page.goto('/admin/integrations');
  await expect(page.locator('[data-integration="ai"]')).toHaveAttribute('data-state', 'on');
  await expect(page.locator('[data-integration="portal"]')).toHaveAttribute('data-state', 'included');
  await expect(page.locator('[data-integration="bank"]')).toHaveAttribute('data-state', 'awaitBank');
  await expect(page.locator('[data-integration="courier"]')).toHaveAttribute('data-state', 'awaitApi');
  await expect(page.getByRole('main')).not.toContainText('sk-');
});

test('AI Insights shows how document reading performs and its guardrails (counts only)', async ({ page }) => {
  await signInAs(page, 'sg');
  await page.goto('/admin/ai');
  await expect(page.getByRole('heading', { name: 'AI Insights' })).toBeVisible();
  await expect(page.locator('.ai-guard li')).toHaveCount(5);
  await expect(page.locator('.kg')).toContainText('Documents read');
});
