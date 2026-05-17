import { defineConfig, devices } from '@playwright/test';

/**
 * Screenshot-pack configuration — separate from the smoke `playwright.config.ts`
 * so it can run with its own reporter, viewports, and output folder without
 * affecting the e2e suite.
 *
 * Output: ../../screenshots/{mobile,desktop} (repo-root `screenshots/`).
 * Server: production `next start --port 3100` (same port as smoke; reused
 * if already running locally).
 *
 * Run from the repo root with `pnpm screenshots`, or from this package with
 * `pnpm screenshots`.
 */
export default defineConfig({
  testDir: './scripts/screenshots',
  testMatch: /capture\.spec\.ts$/,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:3100',
    // Disable animations so screenshots are deterministic.
    reducedMotion: 'reduce',
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 1000 },
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false,
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 14'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
      },
    },
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
