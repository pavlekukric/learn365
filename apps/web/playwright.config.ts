import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright smoke configuration for History 365 web v1.
 *
 * Run locally with:
 *   pnpm --filter @learn365/web exec playwright install --with-deps
 *   pnpm --filter @learn365/web test:e2e
 *
 * The config spins up a production `next start` server on port 3100 to avoid
 * collisions with `next dev` on 3000, and runs the suite headless against
 * desktop Chromium.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  // On CI the `github` reporter annotates failures on the PR diff (Phase 10).
  reporter: process.env['CI'] ? [['list'], ['github']] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:3100',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox-desktop', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit-desktop', use: { ...devices['Desktop Safari'] } },
    { name: 'chromium-mobile', use: { ...devices['Pixel 7'] } },
    { name: 'webkit-mobile', use: { ...devices['iPhone 14'] } },
  ],
  webServer: {
    command: 'next start --port 3100',
    url: 'http://127.0.0.1:3100',
    reuseExistingServer: !process.env['CI'],
    stdout: 'ignore',
    stderr: 'pipe',
    timeout: 120_000,
  },
});
