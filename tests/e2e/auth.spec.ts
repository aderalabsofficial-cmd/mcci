import { expect, type Page, test } from '@playwright/test';
import { totp } from '../support/totp';
import { NO_BACKEND, readAccounts } from './accounts';
import { signInAs } from './helpers';

/**
 * M1 authentication through the real login page against the local Supabase stack (docs/catalogue: login.member,
 * login.otp, login.staff, register.start; docs/09: staff TOTP, email verification). Synthetic accounts from
 * auth.setup.ts. Emails are read from the local mail catcher (MAILPIT_URL). Following an emailed link needs the app
 * on Auth's site_url origin (local stack: http://127.0.0.1:3000), because Auth only redirects there:
 *   E2E_HOST=127.0.0.1 E2E_PORT=3000 pnpm test:e2e tests/e2e/auth.spec.ts --project=desktop
 */
const accounts = readAccounts();
const MAILPIT = process.env.MAILPIT_URL;
const ON_SITE_URL = process.env.E2E_HOST === '127.0.0.1' && process.env.E2E_PORT === '3000';
const LINKS_REASON =
  'emailed links redirect to Auth site_url: run with E2E_HOST=127.0.0.1 E2E_PORT=3000 and MAILPIT_URL';

test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'desktop project only'));

async function memberForm(page: Page, identifier: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Mobile, email or member ID').fill(identifier);
  await page.getByRole('tabpanel', { name: 'Member login' }).getByLabel('Password').fill(password);
  await page.locator('[data-action="login.member"]').click();
}

async function staffForm(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByRole('tab', { name: 'Staff' }).click();
  await page.getByLabel('Staff email').fill(email);
  await page.getByRole('tabpanel', { name: 'Staff' }).getByLabel('Password').fill(password);
  await page.locator('[data-action="login.staff"]').click();
}

/** The newest email to `address`, once at least `count` have arrived (Mailpit lists newest first). */
async function mailTo(address: string, count = 1) {
  for (let i = 0; i < 20; i++) {
    const res = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${address}"`)}`);
    const found = (await res.json()) as { messages?: { ID: string; Subject: string }[] };
    const list = found.messages ?? [];
    if (list.length >= count) {
      const msg = await (await fetch(`${MAILPIT}/api/v1/message/${list[0]!.ID}`)).json();
      return msg as { Subject: string; Text: string; HTML: string };
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`no email for ${address}`);
}

/**
 * The link in an Auth email: the MCCI templates link to /auth/confirm?token_hash=… (any device); Supabase's default
 * templates link to Auth's /auth/v1/verify, which redirects to /auth/confirm?code=… (same browser).
 */
function emailedLink(html: string): string {
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]!.replace(/&amp;/g, '&'));
  const link =
    hrefs.find((h) => /\/auth\/confirm\?.*token_hash=/.test(h)) ?? hrefs.find((h) => /\/auth\/v1\/verify\?/.test(h));
  if (!link) throw new Error('no sign-in link in the email');
  return link;
}

test('protected areas send visitors to the login page, keeping where they wanted to go', async ({ page }) => {
  await page.goto('/portal');
  await expect(page).toHaveURL(/\/login\?next=(%2F|\/)portal$/);
  await page.goto('/ur/admin');
  await expect(page).toHaveURL(/\/ur\/login\?next=(%2F|\/)admin$/);
});

test.describe('with the local stack', () => {
  test.beforeEach(() => test.skip(!accounts.backend, NO_BACKEND));

  test('member: email + password → portal; the session survives a reload; sign out ends it', async ({ page }) => {
    await memberForm(page, accounts.member!.email, accounts.member!.password);
    await expect(page).toHaveURL(/\/portal$/);
    await expect(page.getByText(`E2E Member ${accounts.run}`).first()).toBeVisible();
    await page.reload();
    await expect(page).toHaveURL(/\/portal$/);
    await page.locator('[data-action="logout"]:visible').first().click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto('/portal');
    await expect(page).toHaveURL(/\/login\?next=(%2F|\/)portal$/);
  });

  test('member: member ID + password → portal', async ({ page }) => {
    await memberForm(page, accounts.member!.memberNo.toLowerCase(), accounts.member!.password);
    await expect(page).toHaveURL(/\/portal$/);
  });

  test('wrong password and unknown member ID get the same message (nothing is revealed)', async ({ page }) => {
    await memberForm(page, accounts.member!.email, 'not-the-password-123');
    const alert = page.getByRole('main').getByRole('alert');
    await expect(alert).toHaveText('These details do not match an account. Check them and try again.');
    await memberForm(page, 'MCCI-C-999999', 'not-the-password-123');
    await expect(page.getByRole('main').getByRole('alert')).toHaveText(
      'These details do not match an account. Check them and try again.',
    );
  });

  test('a member cannot open the admin panel', async ({ page }) => {
    await signInAs(page, 'member');
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/portal$/);
  });

  test('the Staff tab refuses member accounts', async ({ page }) => {
    await staffForm(page, accounts.member!.email, accounts.member!.password);
    await expect(page.getByRole('main').getByRole('alert')).toHaveText(
      'This is not a staff account. Please use the Member login tab.',
    );
  });

  test('staff: password, then 2-step code; a wrong code is refused; admin needs the second step', async ({ page }) => {
    await staffForm(page, accounts.staff!.email, accounts.staff!.password);
    await expect(page).toHaveURL(/\/login\/verify$/);
    // after the password alone the admin panel is still closed
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login\/verify$/);
    const right = totp(accounts.staff!.totpSecret);
    await page.getByLabel('6-digit code').fill(String((Number(right) + 1) % 1_000_000).padStart(6, '0'));
    await page.locator('[data-action="login.staff"]').click();
    await expect(page.getByRole('main').getByRole('alert')).toContainText('That code is not correct');
    await page.getByLabel('6-digit code').fill(totp(accounts.staff!.totpSecret));
    await page.locator('[data-action="login.staff"]').click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByText('Membership Officer').first()).toBeVisible();
  });

  test('email code: only an email address is accepted; a code request shows the code step', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Mobile, email or member ID').fill(accounts.member!.memberNo);
    await page.locator('[data-action="login.otp"]').click();
    await expect(page.getByRole('main').getByRole('alert')).toHaveText('To receive a code, type your email address.');
    await page.getByLabel('Mobile, email or member ID').fill(accounts.member!.email);
    await page.locator('[data-action="login.otp"]').click();
    await expect(page.getByRole('heading', { name: 'Enter the 6-digit code' })).toBeVisible();
  });

  test('email code: the 6-digit code from the email signs in', async ({ page }) => {
    test.skip(!MAILPIT, 'needs MAILPIT_URL');
    await page.goto('/login');
    await page.getByLabel('Mobile, email or member ID').fill(accounts.member!.email);
    await page.locator('[data-action="login.otp"]').click();
    await expect(page.getByRole('heading', { name: 'Enter the 6-digit code' })).toBeVisible();
    const mail = await mailTo(accounts.member!.email);
    const code = /\b(\d{6})\b/.exec(mail.Text)?.[1];
    test.skip(
      !code,
      'the local stack still sends Supabase default emails (link only, no code): load supabase/templates (restart)',
    );
    await page.getByLabel('Code').fill(code!);
    await page.locator('[data-action="login.otp"]').click();
    await expect(page).toHaveURL(/\/portal$/);
  });

  test('registration: inactive until the emailed confirmation link is opened, then signed in', async ({ page }) => {
    const email = `e2e-${accounts.run}-reg@test.local`;
    await page.goto('/register');
    await page.getByLabel('Your full name').fill('E2E Applicant');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password (at least 10 characters)').fill('E2e-password-123');
    await page.getByLabel('Repeat the password').fill('E2e-password-123');
    await page.locator('[data-action="register.start"]').click();
    await expect(page.getByRole('main').getByRole('status')).toContainText(
      `We have emailed a confirmation link to ${email}`,
    );
    // a lost email can be sent again (Auth limits emails per address and per hour, so it may answer "too many")
    await page.locator('[data-action="register.resend"]').click();
    const answer = page.getByRole('main').getByText(/sent the confirmation link to .+ again|Too many attempts/);
    await expect(answer).toBeVisible();
    // a second email replaces the first link, so only the newest one works
    const emails = /sent the confirmation link/.test(await answer.innerText()) ? 2 : 1;
    await memberForm(page, email, 'E2e-password-123');
    await expect(page.getByRole('main').getByRole('alert')).toHaveText(
      'Please confirm your email address first — open the link we emailed to you.',
    );
    test.skip(!ON_SITE_URL || !MAILPIT, LINKS_REASON);
    const mail = await mailTo(email, emails);
    expect(mail.Subject).toBeTruthy();
    // a re-sent link only works on its own with the MCCI templates (token_hash); the default ones need the browser's
    // PKCE verifier, which the cookie-less resend does not set
    test.skip(emails === 2 && !/token_hash=/.test(mail.HTML), 'resent link needs the MCCI templates (token_hash)');
    await page.goto(emailedLink(mail.HTML));
    await expect(page).toHaveURL(/\/portal$/);
    await expect(page.getByText('E2E Applicant').first()).toBeVisible();
  });

  test('password reset: emailed link → new password; the old one stops working', async ({ page }) => {
    test.skip(!ON_SITE_URL || !MAILPIT, LINKS_REASON);
    const user = accounts.reset!;
    await page.goto('/login/forgot');
    await page.getByLabel('Email').fill(user.email);
    await page.locator('[data-action="auth.reset.request"]').click();
    await expect(page.getByRole('main').getByRole('status')).toContainText(user.email);
    const mail = await mailTo(user.email);
    await page.goto(emailedLink(mail.HTML));
    await expect(page).toHaveURL(/\/login\/reset$/);
    const fresh = `New-${accounts.run}-pass!`;
    await page.getByLabel('New password', { exact: true }).fill(fresh);
    await page.getByLabel('Repeat the new password', { exact: true }).fill(fresh);
    await page.locator('[data-action="auth.reset.save"]').click();
    await expect(page).toHaveURL(/\/portal$/);
    await page.locator('[data-action="logout"]:visible').first().click();
    await memberForm(page, user.email, user.password);
    await expect(page.getByRole('main').getByRole('alert')).toHaveText(
      'These details do not match an account. Check them and try again.',
    );
    await memberForm(page, user.email, fresh);
    await expect(page).toHaveURL(/\/portal$/);
  });
});
