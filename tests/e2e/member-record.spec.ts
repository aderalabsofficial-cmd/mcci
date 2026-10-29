import { expect, test } from '@playwright/test';
import { readAccounts } from './accounts';
import { signInAs } from './helpers';

/**
 * Member Record (admin/member): opened from the Members Register; particulars, partners, documents, certificates,
 * payments and history as section pills; the register's actions on the record itself.
 */
test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'desktop project only'));

test('the register opens a member record; every section opens; the actions are there', async ({ page }) => {
  test.setTimeout(90_000);
  const id = readAccounts().memberRowId;
  test.skip(!id, 'needs the e2e member row');
  await signInAs(page, 'sg');
  await page.goto('/admin/members');
  await page.locator(`a[data-action="member.open"][href*="${id}"]`).click();
  await expect(page).toHaveURL(new RegExp(`/admin/member\\?id=${id}`));
  await expect(page.locator('.mr-grid')).toBeVisible();
  await expect(page.locator(`[data-member] [data-action^="reg."]`).first()).toBeVisible();
  for (const tab of ['partners', 'documents', 'certificates', 'payments', 'history', 'particulars']) {
    await page.locator(`[data-action="member.tab"][href$="tab=${tab}"]`).click();
    await expect(page).toHaveURL(new RegExp(`tab=${tab}`));
    await expect(page.locator(`[data-action="member.tab"][href$="tab=${tab}"]`)).toHaveAttribute('aria-current', 'page');
  }
  // without a member: a pointer to the register
  await page.goto('/admin/member');
  await expect(page.locator('.card a[href="/admin/members"]')).toBeVisible();
});
