import { test } from '@playwright/test';
import { BUILT_ROUTES, expectNoHorizontalOverflow, localized, LOCALES, open } from './helpers';

// docs/15-mobile-app.md §8: every route at 360, 390 and 412 px, in English and Urdu, with no horizontal scroll.
const WIDTHS = [360, 390, 412];

test.describe('no horizontal overflow on phones', () => {
  test.skip(({ isMobile }) => !isMobile, 'phone projects only (mobile-360, app-shell)');

  for (const route of BUILT_ROUTES)
    for (const locale of LOCALES)
      test(`${localized(route, locale)}`, async ({ page }) => {
        for (const width of WIDTHS) {
          await page.setViewportSize({ width, height: 740 });
          await open(page, localized(route, locale));
          await expectNoHorizontalOverflow(page);
        }
      });
});
