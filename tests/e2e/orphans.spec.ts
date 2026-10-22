import { test } from '@playwright/test';
import { BUILT_ROUTES, expectNoOrphans, localized, LOCALES, open } from './helpers';

test.describe('orphan audit', () => {
  for (const route of BUILT_ROUTES)
    for (const locale of LOCALES)
      test(`${localized(route, locale)}`, async ({ page, isMobile }) => {
        await open(page, localized(route, locale));
        await expectNoOrphans(page);

        // On phones, also audit what the More / menu sheet reveals.
        if (isMobile) {
          const more = page.locator('[data-action="menu.toggle"]:visible').first();
          if (await more.count()) {
            await more.click();
            await page.getByRole('dialog').waitFor();
            await expectNoOrphans(page);
          }
        }
      });
});
