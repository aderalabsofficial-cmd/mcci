import { expect, test } from '@playwright/test';
import { NO_BACKEND, readAccounts } from './accounts';
import { signInAs } from './helpers';

/** Trade opportunities (migration 0540): post → MCCI publishes; MCCI inquiry → member interest → withdraw. */
const accounts = readAccounts();
const run = accounts.run ?? 'x';

test.beforeEach(({}, info) => {
  test.skip(info.project.name !== 'desktop', 'desktop project only');
  test.skip(!accounts.backend, NO_BACKEND);
});

test('a member posts a requirement, MCCI publishes it; a shared inquiry gets interest once, then withdrawn', async ({
  browser,
}) => {
  const member = await browser.newPage();
  await signInAs(member, 'member');
  await member.goto('/portal/opportunities');
  await member.locator('[data-action="opp.post"]').click();
  await member.getByLabel('Title').fill(`E2E ${run} needs cotton yarn`);
  await member.getByLabel('Details').fill('500 kg of 30s cotton yarn every month.');
  await member.locator('[data-action="opp.post.send"]').click();
  await expect(member.getByRole('status')).toContainText('MCCI will check it');
  await expect(
    member.locator('[data-status="Pending"]').filter({ hasText: `E2E ${run} needs cotton yarn` }),
  ).toBeVisible();

  const sg = await browser.newPage();
  await signInAs(sg, 'sg');
  await sg.goto('/admin/content');
  const waiting = sg.locator('[data-status="Pending"]').filter({ hasText: `E2E ${run} needs cotton yarn` });
  await waiting.locator('[data-action="opp.publish"]').click();
  await expect(sg.getByRole('status')).toContainText('Published.');
  await sg.locator('[data-action="opp.share"]').click();
  await sg.getByLabel('Title').fill(`E2E ${run} EU buyer seeks towels`);
  await sg.getByLabel('Details').fill('A German retailer looks for terry towel suppliers.');
  await sg.locator('[data-action="opp.share.send"]').click();
  await expect(sg.getByRole('status')).toContainText('The inquiry is published.');

  await member.reload();
  await expect(
    member.locator('[data-status="Published"]').filter({ hasText: `E2E ${run} needs cotton yarn` }),
  ).toBeVisible();
  const inquiry = member.locator('[data-opp]').filter({ hasText: `E2E ${run} EU buyer seeks towels` });
  await inquiry.locator('[data-action="opp.reply"]').click();
  await inquiry.getByRole('textbox').fill('We make terry towels.');
  await inquiry.locator('[data-action="opp.reply.send"]').click();
  await expect(member.getByRole('status')).toContainText('Your interest has been sent');
  await member.reload();
  await inquiry.locator('[data-action="opp.unreply"]').click();
  await expect(member.getByRole('status')).toContainText('Your interest is withdrawn');

  await sg.reload();
  for (const t of [`E2E ${run} needs cotton yarn`, `E2E ${run} EU buyer seeks towels`])
    await sg.locator('[data-status="Published"]').filter({ hasText: t }).locator('[data-action="opp.close"]').click();
});
