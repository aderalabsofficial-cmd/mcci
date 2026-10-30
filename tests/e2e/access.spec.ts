import { expect, type Page, test } from '@playwright/test';
import { readAccounts } from './accounts';
import { signInAs } from './helpers';

/**
 * M1 Staff & Roles and company users through the real screens against the local Supabase stack (actions
 * staff.invite/edit/resend/revoke, perm.cycle/reset, user.invite/edit/remove, profile.change, and accepting both kinds
 * of invitation from the emailed link). Invitation emails are read from the local mail catcher (MAILPIT_URL); the
 * app sends them itself, so the links work on any origin (only the path is used here).
 */
const accounts = readAccounts();
const MAILPIT = process.env.MAILPIT_URL;
const run = accounts.run ?? 'none';

test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'desktop project only'));

async function invitationPath(address: string): Promise<string> {
  for (let i = 0; i < 30; i++) {
    const res = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${address}"`)}`);
    const found = (await res.json()) as { messages?: { ID: string }[] };
    if (found.messages?.length) {
      const msg = (await (await fetch(`${MAILPIT}/api/v1/message/${found.messages[0]!.ID}`)).json()) as {
        HTML: string;
        Text: string;
      };
      expect(msg.Text).toContain('Assalam-o-Alaikum');
      expect(msg.Text).toContain('السلام علیکم');
      const href = /href="([^"]*\/invite\/[^"]+)"/.exec(msg.HTML)?.[1];
      if (!href) throw new Error('no invitation link in the email');
      return new URL(href.replace(/&amp;/g, '&')).pathname;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`no invitation email for ${address}`);
}

/** Opens an invitation link in a fresh browser (nobody signed in) and sets the password. */
async function activate(page: Page, path: string) {
  await page.context().clearCookies();
  await page.goto(path);
  await expect(page.getByRole('heading', { name: 'Accept your invitation' })).toBeVisible();
  await page.getByLabel('Create password').fill('e2e-Password-123!');
  await page.getByLabel('Confirm password', { exact: true }).fill('e2e-Password-123!');
  await page.locator('[data-action="invite.activate"]').click();
}

test('an invalid invitation link says so and offers nothing else', async ({ page }) => {
  await page.goto(`/invite/${'x'.repeat(43)}`);
  await expect(page.getByText('This invitation link is not valid')).toBeVisible();
  await expect(page.locator('[data-action="invite.activate"]')).toHaveCount(0);
});

test.describe('Staff & Roles', () => {
  test('a Membership Officer sees that the screen is outside their limits', async ({ page }) => {
    await signInAs(page, 'staff');
    await page.goto('/admin/staff');
    await expect(page.getByText('This screen is outside your limits')).toBeVisible();
    await expect(page.locator('[data-action="staff.invite"]')).toHaveCount(0);
  });

  test('the Secretary General invites an officer, who sets a password and goes to 2-step set-up', async ({ page }) => {
    test.skip(!MAILPIT, 'needs MAILPIT_URL');
    await signInAs(page, 'sg');
    await page.goto('/admin/staff');
    await expect(page.getByRole('heading', { name: 'Limits by designation' })).toBeVisible();
    await expect(page.getByRole('button', { name: `E2E Officer ${run}` })).toBeVisible();

    const email = `e2e-${run}-officer2@test.local`;
    await page.locator('[data-action="staff.invite"]').click();
    const dialog = page.getByRole('dialog', { name: 'Invite staff by email' });
    await dialog.getByLabel('Full name').fill(`E2E New Officer ${run}`);
    await dialog.getByLabel('Official email').fill(email);
    await dialog.getByLabel('Designation').selectOption('Accounts Officer');
    await dialog.locator('[data-action="staff.invite.send"]').click();
    // sending goes through SMTP (the local mail catcher): allow for a loaded machine
    await expect(page.getByRole('status')).toContainText(`Invitation emailed to ${email}`, { timeout: 15_000 });
    await expect(page.getByRole('row', { name: new RegExp(email) })).toContainText('Invited');

    // a second invitation to the same address is refused with a clear message
    await page.locator('[data-action="staff.invite"]').click();
    await dialog.getByLabel('Full name').fill('Again');
    await dialog.getByLabel('Official email').fill(email);
    await dialog.locator('[data-action="staff.invite.send"]').click();
    await expect(dialog.getByRole('alert')).toContainText('already open');
    await dialog.getByRole('button', { name: 'Cancel' }).click();

    const path = await invitationPath(email);
    await activate(page, path);
    await expect(page).toHaveURL(/\/login\/verify$/);

    // the link works once
    await page.context().clearCookies();
    await page.goto(path);
    await expect(page.getByText('already been accepted')).toBeVisible();
  });

  test('the Secretary General resends and cancels an invitation', async ({ page }) => {
    test.skip(!MAILPIT, 'needs MAILPIT_URL');
    await signInAs(page, 'sg');
    await page.goto('/admin/staff');
    const email = `e2e-${run}-officer3@test.local`;
    await page.locator('[data-action="staff.invite"]').click();
    const invite = page.getByRole('dialog', { name: 'Invite staff by email' });
    await invite.getByLabel('Full name').fill(`E2E Third ${run}`);
    await invite.getByLabel('Official email').fill(email);
    await invite.locator('[data-action="staff.invite.send"]').click();
    await expect(page.getByRole('status')).toContainText('Invitation emailed', { timeout: 15_000 });
    const first = await invitationPath(email);

    await page.getByRole('button', { name: `E2E Third ${run}` }).click();
    const person = page.getByRole('dialog', { name: `E2E Third ${run}` });
    await person.locator('[data-action="staff.resend"]').click();
    await expect(page.getByRole('status')).toContainText(`Invitation re-sent to ${email}`);

    // the old link stopped working when the new one was sent
    const ctx = await page.context().browser()!.newContext();
    const other = await ctx.newPage();
    await other.goto(first);
    await expect(other.getByText('This invitation link is not valid')).toBeVisible();
    await ctx.close();

    await page.getByRole('button', { name: `E2E Third ${run}` }).click();
    await person.locator('[data-action="staff.revoke"]').click();
    await expect(page.getByRole('status')).toContainText('Invitation cancelled');
    await expect(page.getByRole('button', { name: `E2E Third ${run}` })).toHaveCount(0);
  });

  test('limits by designation: changes wait for Save on that designation and the password; undo; reset needs it too', async ({ page }) => {
    await signInAs(page, 'sg');
    await page.goto('/admin/staff');
    const row = page.locator('[data-designation="Front Desk / Data Entry"]');
    await row.getByRole('button', { name: 'Front Desk / Data Entry · Reports & AI: No access' }).click();
    // only on screen: marked unsaved, nothing stored yet
    await expect(row).toHaveAttribute('data-unsaved', '1');
    await expect(row).toContainText('1 unsaved change');
    await row.locator('[data-action="perm.undo"]').click();
    await expect(row).not.toHaveAttribute('data-unsaved', /.+/);
    await expect(row.locator('[data-action="perm.save"]')).toBeDisabled();
    await expect(
      page.getByRole('button', { name: 'Secretary General · Staff & audit: Approve' }),
      'the Secretary General row is fixed',
    ).toBeDisabled();

    await row.getByRole('button', { name: 'Front Desk / Data Entry · Reports & AI: No access' }).click();
    await row.locator('[data-action="perm.save"]').click();
    const d = page.getByRole('dialog');
    await expect(d.locator('[data-changes]')).toContainText('Reports & AI: No access → View');
    // a wrong password changes nothing
    await d.getByLabel('Your password').fill('not-the-password-123');
    await d.locator('[data-action="perm.save.confirm"]').click();
    await expect(d).toContainText('That password is not correct. Nothing was changed.');
    await d.getByLabel('Your password').fill(accounts.sg!.password);
    await d.locator('[data-action="perm.save.confirm"]').click();
    await expect(page.getByRole('status')).toContainText('Front Desk / Data Entry: 1 limit(s) saved.');
    await expect(row.getByRole('button', { name: 'Front Desk / Data Entry · Reports & AI: View' })).toBeVisible();
    await expect(row).not.toHaveAttribute('data-unsaved', /.+/);

    await page.locator('[data-action="perm.reset"]').click();
    await page.getByRole('dialog').getByLabel('Your password').fill(accounts.sg!.password);
    await page.locator('[data-action="perm.reset.confirm"]').click();
    await expect(page.getByRole('status')).toContainText('Default limits restored');
    await expect(row.getByRole('button', { name: 'Front Desk / Data Entry · Reports & AI: No access' })).toBeVisible();
  });
});

test.describe('Company Profile', () => {
  test('the Owner invites a colleague, who joins with the chosen role and limited rights; then removes them', async ({
    page,
    browser,
  }) => {
    test.skip(!MAILPIT, 'needs MAILPIT_URL');
    await signInAs(page, 'member');
    await page.goto('/portal/profile');
    await expect(page.getByText(`E2E ${run} Traders`)).toBeVisible();
    await expect(page.getByText('(you)')).toBeVisible();

    const email = `e2e-${run}-colleague@test.local`;
    await page.locator('[data-action="user.invite"]').click();
    const dialog = page.getByRole('dialog', { name: 'Invite a colleague' });
    await dialog.getByLabel('Name').fill(`E2E Colleague ${run}`);
    await dialog.getByLabel('Email').fill(email);
    await dialog.getByLabel('Role').selectOption('Accounts');
    await dialog.locator('[data-action="user.invite.send"]').click();
    // sending goes through SMTP (the local mail catcher): allow for a loaded machine
    await expect(page.getByRole('status')).toContainText(`Invitation emailed to ${email}`, { timeout: 15_000 });

    const ctx = await browser.newContext();
    const colleague = await ctx.newPage();
    await activate(colleague, await invitationPath(email));
    await expect(colleague).toHaveURL(/\/portal\/profile$/);
    await expect(colleague.getByText(`E2E ${run} Traders`)).toBeVisible();
    await expect(colleague.getByText('Only your company’s authorized representative')).toBeVisible();
    await expect(colleague.locator('[data-action="user.invite"]')).toHaveCount(0);
    await expect(colleague.locator('[data-action="profile.change"]')).toHaveCount(0);

    await page.reload();
    await page.getByRole('button', { name: new RegExp(`E2E Colleague ${run}`) }).click();
    await page.getByRole('dialog').locator('[data-action="user.remove"]').click();
    await expect(page.getByRole('status')).toContainText(`Removed E2E Colleague ${run}`);

    // access ends at once: the colleague's next page load no longer shows the company
    await colleague.reload();
    await expect(colleague.getByText('Your account is not linked to a company yet')).toBeVisible();
    await ctx.close();
  });

  test('the Owner requests a change of particulars; it shows as pending', async ({ page }) => {
    await signInAs(page, 'member');
    await page.goto('/portal/profile');
    await page.getByRole('button', { name: 'Request change of Business Telephone No.' }).click();
    const dialog = page.getByRole('dialog', { name: 'Request a change' });
    await dialog.getByLabel('New value').fill('061-1234567');
    await dialog.getByLabel('Reason (optional)').fill('New landline');
    await dialog.locator('[data-action="profile.change.send"]').click();
    await expect(page.getByRole('status')).toContainText('Change request sent to MCCI');
    await expect(page.getByText('1 change pending')).toBeVisible();
    await expect(page.getByText('061-1234567')).toBeVisible();
  });
});
