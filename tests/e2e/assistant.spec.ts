import { expect, test } from '@playwright/test';
import { NO_BACKEND, readAccounts } from './accounts';
import { signInAs } from './helpers';

/**
 * Ask MCCI AI (lib/assistant): a member asks and gets an answer built from approved MCCI content (fees etc.); the
 * conversation is kept; "Talk to staff" opens a real support ticket. The model is the local fake
 * (tests/e2e/fake-openai.mjs), which echoes which context the server sent.
 */
const accounts = readAccounts();

test.beforeEach(({}, info) => {
  test.skip(info.project.name !== 'desktop', 'desktop project only');
  test.skip(!accounts.backend, NO_BACKEND);
});

test('a member asks, gets an answer from approved MCCI content, and can hand over to staff', async ({ page }) => {
  await signInAs(page, 'member');
  await page.goto('/portal/assistant');
  await expect(page.getByRole('heading', { name: /Ask MCCI AI/ })).toBeVisible();
  await page.getByLabel('Ask about membership, fees, documents or your file…').fill('What is the membership fee?');
  await page.locator('[data-action="ai.ask"]').click();
  const answer = page.locator('[data-role="assistant"]').last();
  await expect(answer).toContainText('FAKE-ASSISTANT knowledge-ok');
  await page.reload();
  await expect(page.locator('[data-role="user"]').last()).toContainText('What is the membership fee?');

  await page.locator('[data-action="ai.staff"]').click();
  await expect(page.getByRole('status')).toContainText('went to the MCCI team as request');
  await page.goto('/portal/support');
  await expect(page.getByText('Ask MCCI AI — please help').first()).toBeVisible();
});
