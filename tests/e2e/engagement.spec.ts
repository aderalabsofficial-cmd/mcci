import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { signInAs } from './helpers';

/**
 * Engagement part 1 (migration 0490): events created by staff and booked by a member; a member's support ticket answered
 * and resolved on the Complaint Desk; a Live post on the public site; the member's messages marked read. Every new
 * control is clicked (docs/10-testing.md).
 */
test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'desktop project only'));
test.describe.configure({ mode: 'serial' });

const run = randomUUID().slice(0, 6);

test('staff publish an event; a member registers once', async ({ page, browser }) => {
  test.setTimeout(90_000);
  await signInAs(page, 'sg');
  await page.goto('/admin/events');
  await page.locator('[data-action="ev.create"]').click();
  const dialog = page.getByRole('dialog');
  await dialog.locator('[name="title"]').fill(`Export clinic ${run}`);
  await dialog.locator('[name="starts_at"]').fill('2027-01-15T10:00');
  await dialog.locator('[name="venue"]').fill('MCCI Hall');
  await dialog.locator('[name="seats"]').fill('20');
  await dialog.locator('[data-action="ev.save"]').click();
  await expect(dialog).toBeHidden({ timeout: 20_000 });
  await expect(page.getByRole('main')).toContainText(`Export clinic ${run}`);

  const member = await browser.newPage();
  await signInAs(member, 'member');
  await member.goto('/portal/events');
  // the "Upcoming" list (the calendar shows the same event without the button)
  const card = member.locator('[data-event]', {
    hasText: `Export clinic ${run}`,
    has: member.locator('[data-action="event.reg"]'),
  });
  await expect(card).toBeVisible();
  await card.locator('[data-action="event.reg"]').click();
  await expect(card.locator('[data-action="event.reg"]')).toBeDisabled({ timeout: 20_000 });
  await member.close();
});

test('a member raises a ticket; staff find it, reply and resolve it; the member sees both', async ({ page, browser }) => {
  test.setTimeout(120_000);
  const member = await browser.newPage();
  await signInAs(member, 'member');
  await member.goto('/portal/support');
  await member.locator('[data-action="ticket.new"]').click();
  const dialog = member.getByRole('dialog');
  await dialog.locator('[name="subject"]').fill(`Certificate copy ${run}`);
  await dialog.locator('[name="body"]').fill('Please send a second copy of our certificate.');
  await dialog.locator('[data-action="ticket.new.send"]').click();
  await expect(dialog).toBeHidden({ timeout: 20_000 });
  await expect(member.locator('[data-action="ticket.view"]', { hasText: `Certificate copy ${run}` })).toBeVisible();

  await signInAs(page, 'sg');
  await page.goto('/admin/complaints');
  // search and status filter
  await page.getByRole('search').getByRole('textbox').fill(run);
  await page.locator('[data-action="ticket.filter"]').click();
  await expect(page).toHaveURL(new RegExp(`q=${run}`));
  await expect(page.locator('tbody tr')).toHaveCount(1);
  const ticket = await page.locator('tbody tr').getAttribute('data-ticket');
  await page.locator('tbody tr [data-action="ticket.view"]').click();
  // the list stays filtered while a ticket is open
  await expect(page).toHaveURL(new RegExp(`q=${run}.*t=`));
  await page.locator('textarea[name="body"]').fill('A second copy is on its way.');
  await page.locator('[data-action="ticket.reply"]').click();
  await expect(page.getByRole('main')).toContainText('A second copy is on its way.', { timeout: 20_000 });
  await page.locator('[data-action="tk.resolve"]').click();
  await page.getByRole('dialog').locator('[data-action="tk.resolve.confirm"]').click();
  await expect(page.locator(`tr[data-ticket="${ticket}"] .bd`)).toHaveText('Resolved', { timeout: 20_000 });

  await member.reload();
  await member.locator('[data-action="ticket.view"]', { hasText: `Certificate copy ${run}` }).click();
  await expect(member.getByRole('main')).toContainText('A second copy is on its way.');
  await member.close();
});

test('a Live post appears on the public news page; a draft does not', async ({ page }) => {
  test.setTimeout(90_000);
  await signInAs(page, 'sg');
  await page.goto('/admin/content');
  for (const [title, status] of [
    [`Chamber news ${run}`, 'Live'],
    [`Draft note ${run}`, 'Draft'],
  ] as const) {
    await page.locator('[data-action="post.create"]').click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('[name="status"]').selectOption(status);
    await dialog.locator('[name="title"]').fill(title);
    await dialog.locator('[name="body"]').fill('MCCI members can now apply online.');
    await dialog.locator('[data-action="post.save"]').click();
    await expect(dialog).toBeHidden({ timeout: 20_000 });
  }
  await page.context().clearCookies();
  await page.goto('/news');
  await expect(page.getByRole('main')).toContainText(`Chamber news ${run}`);
  await expect(page.getByRole('main')).not.toContainText(`Draft note ${run}`);
});

test('the member marks every message read', async ({ page }) => {
  await signInAs(page, 'member');
  await page.goto('/portal/notifications');
  const all = page.locator('[data-action="note.readall"]');
  if (await all.isEnabled()) {
    await all.click();
    await expect(all).toBeDisabled({ timeout: 20_000 });
  }
  await expect(all).toHaveAttribute('title', 'Everything is read');
});
