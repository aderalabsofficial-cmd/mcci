import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;
export const APP_UA_SUFFIX = ' MCCIApp/1.0';

/**
 * Projects (docs/10-testing.md, docs/15-mobile-app.md §8):
 *  - desktop     1440 × 900 Chromium
 *  - mobile-360  360 × 640 touch phone; perf.spec adds slow-3G throttling
 *  - app-shell   Pixel 7 with the Android shell's user agent (data-shell="app")
 * The app runs as a production build so tests see what users get.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  timeout: 45_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile-360',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 360, height: 640 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'app-shell',
      use: {
        ...devices['Pixel 7'],
        userAgent: devices['Pixel 7'].userAgent + APP_UA_SUFFIX,
      },
    },
  ],
  webServer: {
    command: `pnpm build && pnpm start --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
