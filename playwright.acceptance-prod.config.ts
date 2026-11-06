import { defineConfig, devices } from '@playwright/test';

/**
 * Read-only acceptance crawl of the LIVE site as a visitor (docs/acceptance, 6 Nov 2026):
 *   ACCEPTANCE=1 ACCEPTANCE_TARGET=production pnpm exec playwright test -c playwright.acceptance-prod.config.ts
 * No local servers, no accounts, no form submissions: tests/e2e/acceptance.spec.ts only opens pages and follows links.
 */
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /acceptance\.spec\.ts/,
  outputDir: 'test-results/acceptance-prod',
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: [['line']],
  use: {
    baseURL: process.env.ACCEPTANCE_BASE_URL ?? 'https://app.mcci.aderalabs.tech',
    trace: 'off',
    screenshot: 'off',
  },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }],
});
