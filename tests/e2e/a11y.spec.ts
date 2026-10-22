import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { BUILT_ROUTES, localized, LOCALES, open } from './helpers';

// docs/10-testing.md: zero serious or critical axe violations on every page.
test.describe('accessibility (axe)', () => {
  for (const route of BUILT_ROUTES)
    for (const locale of LOCALES)
      test(`${localized(route, locale)}`, async ({ page }) => {
        await open(page, localized(route, locale));
        const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        const blocking = violations
          .filter((v) => v.impact === 'serious' || v.impact === 'critical')
          .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
        expect(blocking).toEqual([]);
      });
});
