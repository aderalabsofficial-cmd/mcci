import { randomInt, randomUUID } from 'node:crypto';
import { expect, type Page, test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { readLocalEnv } from '../integration/local-env';
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
const env = readLocalEnv();
const MAILPIT = process.env.MAILPIT_URL;
const ON_SITE_URL = process.env.E2E_HOST === '127.0.0.1' && process.env.E2E_PORT === '3000';
const LINKS_REASON =
  'emailed links redirect to Auth site_url: run with E2E_HOST=127.0.0.1 E2E_PORT=3000 and MAILPIT_URL';

test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'desktop project only'));

async function memberForm(page: Page, identifier: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Mobile, email or member ID').fill(identifier);
  await page.getByRole('tabpanel', { name: 'Member login' }).getByLabel('Password', { exact: true }).fill(password);
  await page.locator('[data-action="login.member"]').click();
}

async function staffForm(page: Page, email: string, password: string) {
  await page.goto('/staff/login');
  await page.getByLabel('Staff email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.locator('[data-action="login.staff"]').click();
}

/** a mobile number no other test account uses */
const freshMobile = () => `03${randomInt(10, 49)}${String(randomInt(0, 10_000_000)).padStart(7, '0')}`;

/** Sign-up steps 1 and 2 (owner, 4 Nov 2026): mobile and email, then the 6-digit code from the email */
async function signUpWithCode(page: Page, mobile: string, email: string) {
  await page.goto('/register');
  await page.getByLabel('Mobile number').fill(mobile);
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('I confirm the details I have given are correct.').check({ force: true });
  // the local mail catcher is slow: Auth sometimes gives up after 10 s ("not available"), and the person simply tries again
  const codeStep = page.getByRole('heading', { name: 'Enter your code' });
  for (let i = 0; i < 3 && !(await codeStep.isVisible()); i++) {
    await page.locator('[data-action="register.start"]').click();
    await expect(codeStep.or(page.locator('.au-err').filter({ hasText: /not available/ }))).toBeVisible({ timeout: 20_000 });
  }
  await expect(codeStep).toBeVisible();
  const mail = await mailTo(email);
  const code = /\b(\d{6})\b/.exec(mail.Text)?.[1];
  test.skip(!code, 'the local stack still sends the old confirmation email (link): load supabase/templates (restart)');
  return code!;
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

test('the portal sends visitors to the login page, keeping where they wanted to go; the admin panel is not found', async ({
  page,
}) => {
  await page.goto('/portal');
  await expect(page).toHaveURL(/\/login\?next=(%2F|\/)portal$/);
  // the admin panel points to no sign-in page (staff use their own page, lib/auth/staff-path.ts)
  expect((await page.goto('/ur/admin'))?.status()).toBe(404);
  await expect(page).toHaveURL(/\/ur\/admin$/);
});

test('every password field has a show / hide eye (mouse, keyboard, English and Urdu)', async ({ page }) => {
  for (const [url, field] of [
    ['/login', 'Password'],
    ['/staff/login', 'Password'],
  ] as const) {
    await page.goto(url);
    const input = page.getByLabel(field, { exact: true });
    const eye = input.locator('xpath=following-sibling::button[@data-action="password.toggle"]');
    await input.fill('not-a-real-secret');
    await expect(input).toHaveAttribute('type', 'password');
    await expect(eye).toHaveAccessibleName('Show password');
    await eye.click();
    await expect(input).toHaveAttribute('type', 'text');
    await expect(eye).toHaveAttribute('aria-pressed', 'true');
    await expect(eye).toHaveAccessibleName('Hide password');
    await expect(input).toHaveValue('not-a-real-secret');
    // keyboard: the eye is a real button
    await eye.focus();
    await page.keyboard.press('Enter');
    await expect(input).toHaveAttribute('type', 'password');
    // the field keeps what password managers need
    await expect(input).toHaveAttribute('name', /password|confirm/);
    await expect(input).toHaveAttribute('autocomplete', /password/);
  }
  await page.goto('/ur/login');
  await expect(page.locator('[data-action="password.toggle"]').first()).toHaveAccessibleName('پاس ورڈ دکھائیں');
});

test('sign up: mobile and email in three steps, no company or name yet, friendly checks before anything is sent', async ({
  page,
}) => {
  await page.goto('/register');
  await expect(page.locator('.au-steps li')).toHaveCount(3);
  await expect(page.getByLabel('Business name')).toHaveCount(0); // read from the documents later (owner, 4 Nov 2026)
  await page.locator('[data-action="register.start"]').click();
  await expect(page.locator('.au-err')).toContainText('highlighted');
  await page.getByLabel('Mobile number').fill('12345');
  await page.getByLabel('Email address').fill('steps@test.local');
  await page.locator('[data-action="register.start"]').click();
  await expect(page.locator('.au-err')).toContainText('mobile');
  await page.getByLabel('Mobile number').fill('0300-1234567');
  await page.locator('[data-action="register.start"]').click();
  await expect(page.locator('.au-err')).toContainText('tick');
  await expect(page).toHaveURL(/\/register$/);
});

test('sign in and sign up slide on one page; the address follows and each route opens on its own form', async ({
  page,
}) => {
  await page.goto('/login');
  await expect(page.getByRole('tab')).toHaveText(['Sign In', 'Sign Up']);
  await page.getByRole('tab', { name: 'Sign Up' }).click();
  await expect(page).toHaveURL(/\/register$/);
  await expect(page.getByLabel('Email address')).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Email address')).toBeVisible();
  await page.getByRole('tab', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByLabel('Mobile, email or member ID')).toBeVisible();
  await expect(page.getByLabel('Business name')).toHaveCount(0);
  // where the visitor wanted to go survives the round trip
  await page.goto('/login?next=%2Fportal%2Fapply');
  await page.getByRole('tab', { name: 'Sign Up' }).click();
  // the pane going away stays (inert) until the photo panel has covered it
  await page.locator('.au-pane:not([inert])').getByRole('tab', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(/\/login\?next=%2Fportal%2Fapply$/);
  await expect(page.locator('input[name="next"]')).toHaveValue('/portal/apply');
});

test.describe('with the local stack', () => {
  test.beforeEach(() => test.skip(!accounts.backend, NO_BACKEND));

  test('member: email + password → portal; the session survives a reload; sign out ends it', async ({ page }) => {
    await memberForm(page, accounts.member!.email, accounts.member!.password);
    await expect(page).toHaveURL(/\/portal$/, { timeout: 20_000 });
    await expect(page.getByText(`E2E Member ${accounts.run}`).first()).toBeVisible();
    await page.reload();
    await expect(page).toHaveURL(/\/portal$/, { timeout: 20_000 });
    await page.locator('[data-action="logout"]:visible').first().click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto('/portal');
    await expect(page).toHaveURL(/\/login\?next=(%2F|\/)portal$/);
  });

  test('member: member ID + password → portal', async ({ page }) => {
    await memberForm(page, accounts.member!.memberNo.toLowerCase(), accounts.member!.password);
    await expect(page).toHaveURL(/\/portal$/, { timeout: 20_000 });
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
    await expect(page).toHaveURL(/\/portal$/, { timeout: 20_000 });
  });

  test('the staff sign-in page refuses member accounts', async ({ page }) => {
    await staffForm(page, accounts.member!.email, accounts.member!.password);
    await expect(page.getByRole('main').getByRole('alert')).toHaveText(
      'This is not a staff account. Members sign in on the member login page.',
    );
  });

  test('staff and members sign in on separate pages (owner, 29 Oct 2026)', async ({ page }) => {
    // the members' page has no staff tab and links to no staff page
    await page.goto('/login');
    await expect(page.getByRole('tab')).toHaveText(['Sign In', 'Sign Up']);
    await expect(page.locator('a[href*="staff"]')).toHaveCount(0);
    // a staff account on the members' page is refused and signed out again
    await memberForm(page, accounts.staff!.email, accounts.staff!.password);
    await expect(page.getByRole('main').getByRole('alert')).toContainText('This is a staff account');
    await page.goto('/portal');
    await expect(page).toHaveURL(/\/login\?next=%2Fportal$/);
    // the admin panel does not exist for someone signed out (no pointer to any sign-in page)
    const admin = await page.goto('/admin');
    expect(admin?.status()).toBe(404);
    expect((await page.request.get('/admin/committee', { maxRedirects: 0 })).status()).toBe(404);
    // the staff page is not indexed
    await page.goto('/staff/login');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });

  test('a signed-in staff member never gets the member portal', async ({ page }) => {
    await signInAs(page, 'staff');
    await page.goto('/portal');
    await expect(page).toHaveURL(/\/admin$/);
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
    await expect(page).toHaveURL(/\/portal$/, { timeout: 20_000 });
  });

  test('sign-up: a code by email, the welcome, then name and password; a new applicant lands in the portal', async ({ page }) => {
    test.skip(!MAILPIT, 'needs MAILPIT_URL');
    const email = `e2e-${accounts.run}-reg@test.local`;
    const mobile = freshMobile();
    const code = await signUpWithCode(page, mobile, email);
    // a wrong code is refused in plain words; the right one shows the welcome and opens the last step
    await page.getByLabel('6-digit code').fill(code === '000000' ? '111111' : '000000');
    await page.locator('[data-action="register.code"]').click();
    await expect(page.getByRole('main').getByRole('alert')).toContainText('not right');
    await page.getByLabel('6-digit code').fill(code);
    await page.locator('[data-action="register.code"]').click();
    await expect(page.getByTestId('welcome')).toContainText('Welcome to MCCI');
    await expect(page).toHaveURL(/\/register\/details$/, { timeout: 20_000 });
    // not finished: the portal sends them back here
    await page.goto('/portal');
    await expect(page).toHaveURL(/\/register\/details$/);
    await page.getByLabel('Your full name').fill('E2E Applicant');
    await page.getByLabel('Password (at least 10 characters)').fill('E2e-password-123');
    await page.getByLabel('Repeat the password').fill('E2e-password-123');
    // every password field has its eye here too
    await expect(page.locator('[data-action="password.toggle"]')).toHaveCount(2);
    await page.locator('[data-action="register.finish"]').click();
    await expect(page.locator('.au-err')).toContainText('existing member');
    await page.locator('[data-action="register.member.no"]').click();
    await page.locator('[data-action="register.finish"]').click();
    await expect(page).toHaveURL(/\/portal$/, { timeout: 20_000 });
    await expect(page.getByText('E2E Applicant').first()).toBeVisible();
    // the mobile is theirs now: they sign in with it and the password
    await page.context().clearCookies();
    await memberForm(page, mobile, 'E2e-password-123');
    await expect(page).toHaveURL(/\/portal$/, { timeout: 20_000 });
  });

  test('sign-up: an existing member claims their number; only "pending" until staff approve and link it', async ({
    page,
    browser,
  }) => {
    test.skip(!MAILPIT || !env, 'needs MAILPIT_URL and the local stack');
    test.setTimeout(150_000);
    const admin = createClient(env!.url, env!.secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const digits = String(randomInt(70000, 99999));
    const { data: co } = await admin
      .from('companies')
      .insert({ name: `Claim Mills ${digits}`, biz_type: 'pvt' })
      .select('id')
      .single();
    const { data: mem } = await admin
      .from('members')
      .insert({ member_no: `MCCI-C-${digits}`, company_id: co!.id, class: 'Corporate', status: 'Permanent', rep_name: 'Rep', since: '2024-04-01', valid_to: '2099-03-31' })
      .select('id')
      .single();
    const email = `e2e-claim-${randomUUID().slice(0, 8)}@test.local`;
    try {
      const code = await signUpWithCode(page, freshMobile(), email);
      await page.getByLabel('6-digit code').fill(code);
      await page.locator('[data-action="register.code"]').click();
      await expect(page).toHaveURL(/\/register\/details$/, { timeout: 20_000 });
      await page.getByLabel('Your full name').fill('Claiming Owner');
      await page.getByLabel('Password (at least 10 characters)').fill('E2e-password-123');
      await page.getByLabel('Repeat the password').fill('E2e-password-123');
      await page.locator('[data-action="register.member.yes"]').click();
      await page.locator('[data-action="register.class"]').first().click(); // Corporate
      const number = page.getByLabel('Membership number (digits only)');
      await number.fill(`C-${digits}x`);
      await expect(number).toHaveValue(digits); // digits only; the prefix is shown, not typed
      await page.locator('[data-action="register.finish"]').click();
      await expect(page.getByTestId('claim-pending')).toContainText('6 to 12 hours');
      // the portal shows only the note; a new application cannot be started meanwhile
      await page.goto('/portal');
      await expect(page.getByTestId('claim-pending')).toContainText(`MCCI-C-${digits}`);
      await expect(page.locator('[data-action="register.start"]')).toHaveCount(0);

      // staff: the register's match is chosen; approve links the account
      const staff = await browser.newPage();
      await signInAs(staff, 'sg');
      await staff.goto('/admin/members');
      const row = staff.locator(`[data-claim="${email}"]`);
      await expect(row).toContainText(`MCCI-C-${digits}`);
      await expect(row.locator('[data-field="claim-member"]')).toHaveValue(mem!.id);
      await row.locator('[data-action="claim.approve"]').click();
      await expect(staff.locator('[data-section="claims"]').getByRole('status')).toContainText('Linked');
      await staff.close();
      await page.goto('/portal');
      await expect(page.getByTestId('claim-pending')).toHaveCount(0);
      await expect(page.getByRole('main')).toContainText(`MCCI-C-${digits}`);
    } finally {
      const { data: users } = await admin.auth.admin.listUsers({ perPage: 200 });
      const u = users?.users.find((x) => x.email === email);
      if (u) {
        await admin.from('company_users').delete().eq('user_id', u.id);
        await admin.auth.admin.deleteUser(u.id);
      }
      await admin.from('members').delete().eq('id', mem!.id);
      await admin.from('companies').delete().eq('id', co!.id);
    }
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
    await expect(page).toHaveURL(/\/portal$/, { timeout: 20_000 });
    await page.locator('[data-action="logout"]:visible').first().click();
    await memberForm(page, user.email, user.password);
    await expect(page.getByRole('main').getByRole('alert')).toHaveText(
      'These details do not match an account. Check them and try again.',
    );
    await memberForm(page, user.email, fresh);
    await expect(page).toHaveURL(/\/portal$/, { timeout: 20_000 });
  });
});
