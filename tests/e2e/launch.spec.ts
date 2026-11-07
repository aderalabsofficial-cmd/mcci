import { expect, test } from '@playwright/test';

/** the launch-day show (owner, 7 Nov 2026): a static page at /launch with its images, outside the locale routes */
test('the launch page opens with its countdown, button and images', async ({ page }) => {
  const failed: string[] = [];
  page.on('response', (r) => {
    if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`);
  });
  const res = await page.goto('/launch?wait=2');
  expect(res?.status()).toBe(200);
  expect(page.url()).toMatch(/\/launch\?wait=2$/);
  await expect(page).toHaveTitle(/Launch/);
  await expect(page.getByText('Press to launch the new website')).toBeVisible();
  await page.waitForLoadState('networkidle');
  expect(failed).toEqual([]);
  const broken = await page.$$eval('img', (imgs) =>
    imgs.filter((i) => i.complete && i.naturalWidth === 0 && i.getAttribute('src')).map((i) => i.getAttribute('src')),
  );
  expect(broken).toEqual([]);
  await expect(page.locator('a[href="/"]').first()).toBeAttached();
});
