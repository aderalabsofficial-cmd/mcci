import { expect, type Page, test } from '@playwright/test';
import { NO_BACKEND, readAccounts } from './accounts';

/**
 * Sign-out after 15 minutes without activity (owner's request, 26 Oct 2026). Each test signs in through the login
 * page with its own session (the shared test sessions must not be revoked).
 *  - server: a request after 15 idle minutes signs the session out, revokes it, and the sign-in page says why
 *  - browser: a warning in the last minute with "Stay signed in"; at the limit the person is signed out
 */
const accounts = readAccounts();
test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'desktop project only'));

async function signIn(page: Page) {
  test.skip(!accounts.backend, NO_BACKEND);
  await page.goto('/login');
  await page.getByLabel('Mobile, email or member ID').fill(accounts.member!.email);
  await page.getByRole('tabpanel', { name: 'Member login' }).getByLabel('Password').fill(accounts.member!.password);
  await page.locator('[data-action="login.member"]').click();
  await expect(page).toHaveURL(/\/portal/, { timeout: 20_000 });
}

test('the server signs out a session idle for more than 15 minutes, and it cannot be used again', async ({
  page,
  context,
}) => {
  await signIn(page);
  const session = (await context.cookies()).filter((c) => c.name !== 'mcci_seen');
  const seen = (await context.cookies()).find((c) => c.name === 'mcci_seen');
  expect(seen, 'the server records the last activity').toBeTruthy();
  // as if the last activity was 16 minutes ago
  await context.addCookies([{ ...seen!, value: String(Date.now() - 16 * 60_000) }]);
  await page.goto('/portal/membership');
  await expect(page).toHaveURL(/\/login\?.*expired=1/);
  await expect(page.getByRole('main')).toContainText('You were signed out after 15 minutes without activity');
  // the old session cookies no longer work: the session was revoked, not just forgotten by this browser
  await context.clearCookies();
  await context.addCookies(session);
  await page.goto('/portal');
  await expect(page).toHaveURL(/\/login/);
});

test('activity keeps the session; the browser warns in the last minute and signs out at 15 minutes', async ({
  page,
}) => {
  await page.clock.install();
  await signIn(page);
  await page.goto('/portal');
  // 14 minutes 10 seconds without touching anything: the warning
  await page.clock.fastForward('14:10');
  const warning = page.getByRole('dialog');
  await expect(warning).toContainText(/signed out in \d+ seconds/);
  await warning.locator('[data-action="session.stay"]').click();
  await expect(warning).toBeHidden();
  await expect(page).toHaveURL(/\/portal$/);
  // then 15 minutes without activity: signed out, and the sign-in page says why
  await page.clock.fastForward('15:10');
  await expect(page).toHaveURL(/\/login\?.*expired=1/, { timeout: 15_000 });
  await expect(page.getByRole('main')).toContainText('You were signed out after 15 minutes without activity');
  await page.goto('/portal');
  await expect(page).toHaveURL(/\/login/);
});
