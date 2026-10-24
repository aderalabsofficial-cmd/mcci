import { expect, test } from '@playwright/test';
import { authFor } from './helpers';

/**
 * mobile-360 on slow 3G (docs/15-mobile-app.md §8): the shell must be usable before the large Urdu font arrives
 * (font-display: swap). Budget is generous for slow 3G; the 3 s target in §7 is for 4G.
 */
test.describe('slow 3G', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'mobile-360', 'mobile-360 project only'));
  test.setTimeout(90_000);

  for (const route of ['/', '/portal'])
    test(`${route} shows its navigation quickly`, async ({ page, context }) => {
      const cdp = await context.newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Network.emulateNetworkConditions', {
        offline: false,
        latency: 400,
        downloadThroughput: (500 * 1024) / 8,
        uploadThroughput: (500 * 1024) / 8,
      });
      await authFor(page, route);
      const start = Date.now();
      await page.goto(route, { waitUntil: 'commit' });
      const nav =
        route === '/'
          ? page.getByRole('button', { name: 'Menu' })
          : page.getByRole('navigation', { name: 'Quick navigation' });
      await expect(nav).toBeVisible({ timeout: 60_000 });
      const ms = Date.now() - start;
      test.info().annotations.push({ type: 'first usable (slow 3G)', description: `${ms} ms` });
      expect(ms).toBeLessThan(30_000);
    });
});
