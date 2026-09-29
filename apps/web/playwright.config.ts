import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright smoke configuration for History 365 web v1.
 *
 * Run locally with:
 *   pnpm --filter @learn365/web exec playwright install --with-deps
 *   pnpm --filter @learn365/web test:e2e
 *
 * Two production `next start` servers from the same build (after `next build`):
 *
 *   :3100  accounts OFF — no database, exactly like CI before Phase 8. The
 *          five browser projects and the axe pass run here.
 *   :3101  accounts ON (review 2026-09-30 item 19) — a throwaway PGlite
 *          database in the OS temp folder, seeded by `e2e/accounts/seed.mjs`
 *          with test accounts and their sessions; a placeholder Google
 *          client (never contacted: the specs start from a session cookie).
 *          Only the `accounts-chromium` project talks to it.
 *
 * Ports stay clear of `next dev` on 3000; `E2E_PORT` moves both (the
 * accounts server takes the next port) when several checkouts run the
 * suite side by side — `reuseExistingServer` would otherwise pick up
 * another checkout's server.
 */
const PORT = Number(process.env['E2E_PORT'] ?? '3100');
const ACCOUNTS_PORT = PORT + 1;
const ORIGIN = `http://127.0.0.1:${String(PORT)}`;
const ACCOUNTS_ORIGIN = `http://127.0.0.1:${String(ACCOUNTS_PORT)}`;
const ACCOUNTS_DB_DIR = join(tmpdir(), `learn365-e2e-accounts-${String(ACCOUNTS_PORT)}`);

const ACCOUNT_SPECS = /accounts[\\/].+\.spec\.ts$/;
const A11Y_SPECS = /a11y\.spec\.ts$/;
/** The browser projects run everything except the accounts-on and axe specs. */
const ignoreSpecial = { testIgnore: [ACCOUNT_SPECS, A11Y_SPECS] };

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  // On CI the `github` reporter annotates failures on the PR diff (Phase 10).
  reporter: process.env['CI'] ? [['list'], ['github']] : 'list',
  use: {
    baseURL: ORIGIN,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium-desktop', ...ignoreSpecial, use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox-desktop', ...ignoreSpecial, use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit-desktop', ...ignoreSpecial, use: { ...devices['Desktop Safari'] } },
    { name: 'chromium-mobile', ...ignoreSpecial, use: { ...devices['Pixel 7'] } },
    { name: 'webkit-mobile', ...ignoreSpecial, use: { ...devices['iPhone 14'] } },
    {
      name: 'accounts-chromium',
      testMatch: ACCOUNT_SPECS,
      use: { ...devices['Desktop Chrome'], baseURL: ACCOUNTS_ORIGIN },
    },
    { name: 'a11y-desktop', testMatch: A11Y_SPECS, use: { ...devices['Desktop Chrome'] } },
    { name: 'a11y-mobile', testMatch: A11Y_SPECS, use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    {
      command: `next start --port ${String(PORT)}`,
      url: ORIGIN,
      reuseExistingServer: !process.env['CI'],
      stdout: 'ignore',
      stderr: 'pipe',
      timeout: 120_000,
    },
    {
      command: `node e2e/accounts/seed.mjs && next start --port ${String(ACCOUNTS_PORT)}`,
      // 200 only once the start-up migration has run against the seeded database.
      url: `${ACCOUNTS_ORIGIN}/api/health`,
      reuseExistingServer: !process.env['CI'],
      stdout: 'ignore',
      stderr: 'pipe',
      timeout: 120_000,
      env: {
        LEARN365_E2E_SEED: '1',
        DATABASE_URL: `pglite://${ACCOUNTS_DB_DIR}`,
        APP_URL: ACCOUNTS_ORIGIN,
        GOOGLE_CLIENT_ID: 'e2e-placeholder-client-id',
        GOOGLE_CLIENT_SECRET: 'e2e-placeholder-client-secret',
      },
    },
  ],
});
