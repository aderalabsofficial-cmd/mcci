import { readdirSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { open } from './helpers';

// docs/12-design-i18n.md: Urdu renders in the self-hosted Jameel Noori Nastaleeq; docs/15-mobile-app.md §7: the
// 6.8 MB file must be downloaded once per device, not on every visit.
const FONT = readdirSync('public/fonts').find((f) => /^jameel-noori\.[0-9a-f]{10}\.woff2$/.test(f));

test.describe('Urdu font', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'desktop project only'));

  test('is served with a one-year immutable cache', async ({ request }) => {
    expect(FONT).toBeDefined();
    const res = await request.get(`/fonts/${FONT}`);
    expect(res.status()).toBe(200);
    expect(res.headers()['cache-control']).toBe('public, max-age=31536000, immutable');
  });

  test('is what Urdu pages render with', async ({ page }) => {
    await open(page, '/ur/portal');
    const loaded = await page.evaluate(() =>
      [...document.fonts].some((f) => f.family.replace(/"/g, '') === 'Jameel Noori Nastaleeq' && f.status === 'loaded'),
    );
    expect(loaded).toBe(true);
  });
});
