import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Bike Connect client e2e tests.
 *
 * Scope: PUBLIC routes only (auth-blocked /me/* routes are skipped in test files).
 * The webServer block starts the Vite dev server automatically before the test run.
 */

const PORT = 5180; // Use a dedicated port to avoid conflicts with manual dev server

export default defineConfig({
  testDir: './e2e',
  /* Maximum time one test can run */
  timeout: 30_000,
  /* Expect timeout */
  expect: {
    timeout: 5_000,
  },
  /* Fail the build on CI if test.only is accidentally committed */
  forbidOnly: !!process.env.CI,
  /* Retry failing tests once on CI */
  retries: process.env.CI ? 1 : 0,
  /* Single worker — public routes are read-only, no parallelism issues */
  workers: 1,
  reporter: process.env.CI ? [['html', { outputFolder: 'playwright-report' }], ['list']] : 'list',
  use: {
    /* Base URL for all navigation helpers */
    baseURL: `http://localhost:${PORT}`,
    /* Always run headless */
    headless: true,
    /* Collect traces on first retry */
    trace: 'on-first-retry',
    /* No screenshots on pass — keep artifacts lean */
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Start the Vite dev server before tests and shut it down after */
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
