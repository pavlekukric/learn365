import { readFileSync } from 'node:fs';

import { expect, test, type BrowserContext, type Page, type TestInfo } from '@playwright/test';

/**
 * Accounts ON (review 2026-09-30 item 19): the `accounts-chromium` project
 * runs against a second `next start` with a seeded PGlite database
 * (`seed.mjs`, `playwright.config.ts`). A test "signs in" by carrying the
 * session cookie the Google callback would have set; everything after that
 * — `/api/me`, the sync engine, `/nalog`, `/pregled` — is the real code.
 */

const COURSE_ID = 'istorija-srbije-365';
const PROGRESS_KEY = 'learn365:progress:v1';
const MARKER_KEYS = ['learn365:cloud:progress:v1', 'learn365:cloud:bookmarks:v1'];

interface SeededAccount {
  readonly key: string;
  readonly name: string;
  readonly completed: readonly string[];
  readonly isAdmin?: boolean;
}

const { accounts } = JSON.parse(
  readFileSync(new URL('./accounts.json', import.meta.url), 'utf8'),
) as { accounts: readonly SeededAccount[] };

function account(key: string): SeededAccount {
  const found = accounts.find((candidate) => candidate.key === key);
  if (found === undefined) throw new Error(`accounts.json has no account "${key}"`);
  return found;
}

/** Sign-out and deletion use an account up, so every retry takes the next one. */
function accountForAttempt(prefix: string, testInfo: TestInfo): SeededAccount {
  return account(`${prefix}-${String(testInfo.retry)}`);
}

async function signInAs(context: BrowserContext, testInfo: TestInfo, key: string): Promise<void> {
  const baseURL = testInfo.project.use.baseURL;
  if (baseURL === undefined) throw new Error('the accounts project needs a baseURL');
  await context.addCookies([
    {
      name: 'l365_session',
      value: `e2e-session-${key}`,
      url: baseURL,
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
}

async function localCompleted(page: Page): Promise<string[]> {
  return page.evaluate(
    ({ key, courseId }) => {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return [];
      const parsed = JSON.parse(raw) as {
        state?: { byCourse?: Record<string, { completedLessonIds?: string[] }> };
      };
      return [...(parsed.state?.byCourse?.[courseId]?.completedLessonIds ?? [])].sort();
    },
    { key: PROGRESS_KEY, courseId: COURSE_ID },
  );
}

async function localMarkers(page: Page): Promise<(string | null)[]> {
  return page.evaluate(
    (keys) => keys.map((key) => window.localStorage.getItem(key)),
    MARKER_KEYS,
  );
}

async function me(page: Page): Promise<unknown> {
  return (await page.request.get('/api/me')).json();
}

test.describe('History 365 — accounts on', () => {
  test('signing in unions local progress into the account; signing out clears this browser', async ({
    page,
    context,
  }, testInfo) => {
    const reader = accountForAttempt('sync', testInfo);

    // Anonymous reading first: one lesson done, only in this browser.
    await page.goto('/');
    await page.evaluate(
      ({ key, value }) => window.localStorage.setItem(key, value),
      {
        key: PROGRESS_KEY,
        value: JSON.stringify({
          state: {
            byCourse: {
              [COURSE_ID]: {
                completedLessonIds: ['day-001'],
                lastOpenedLessonId: 'day-001',
                updatedAt: '2026-09-01T09:00:00.000Z',
              },
            },
          },
          version: 1,
        }),
      },
    );

    // Sign in (the callback's cookie) and load a page: first contact → POST …/sync.
    await signInAs(context, testInfo, reader.key);
    const synced = page.waitForResponse(
      (response) =>
        response.url().includes('/api/me/progress/sync') && response.request().method() === 'POST',
    );
    await page.goto(`/course/${COURSE_ID}`);
    const syncResponse = await synced;
    expect(syncResponse.status()).toBe(200);

    const union = ['day-001', ...reader.completed].sort();
    await expect.poll(() => localCompleted(page)).toEqual(union);
    const onAccount = (await (
      await page.request.get(`/api/me/progress?courseId=${COURSE_ID}`)
    ).json()) as { completedLessonIds: string[] };
    expect([...onAccount.completedLessonIds].sort()).toEqual(union);
    expect(await me(page)).toMatchObject({ enabled: true, user: { name: reader.name } });
    await expect(
      page.getByRole('navigation', { name: 'Glavna navigacija' }).locator('a[data-link="account"]'),
    ).toHaveCount(1);

    // Sign out from /nalog: back Home, nothing of the account left in this browser.
    await page.goto('/nalog');
    await expect(page.getByRole('heading', { level: 1, name: reader.name })).toBeVisible();
    await page.getByRole('button', { name: 'Odjava', exact: true }).click();
    await expect(page).toHaveURL(/:\d+\/$/);
    await expect.poll(() => localCompleted(page)).toEqual([]);
    await expect.poll(() => localMarkers(page)).toEqual([null, null]);
    expect(await me(page)).toEqual({ enabled: true, user: null });
    expect((await context.cookies()).map((cookie) => cookie.name)).not.toContain('l365_session');
  });

  test('/nalog deletes the account after a confirmation', async ({ page, context }, testInfo) => {
    const reader = accountForAttempt('delete', testInfo);
    await signInAs(context, testInfo, reader.key);

    await page.goto('/nalog');
    await expect(page.getByRole('heading', { level: 1, name: reader.name })).toBeVisible();
    // The account's progress reached this browser (first contact, nothing local to add).
    await expect.poll(() => localCompleted(page)).toEqual([...reader.completed].sort());

    await page.getByRole('button', { name: 'Obriši nalog' }).click();
    const confirm = page.getByRole('group').filter({ hasText: 'Sigurno?' });
    await expect(confirm).toBeVisible();
    await confirm.getByRole('button', { name: 'Obriši', exact: true }).click();

    await expect(page).toHaveURL(/:\d+\/$/);
    await expect.poll(() => localCompleted(page)).toEqual([]);
    expect(await me(page)).toEqual({ enabled: true, user: null });

    // The same session cookie again: the account (and its sessions) are gone.
    await signInAs(context, testInfo, reader.key);
    expect(await me(page)).toEqual({ enabled: true, user: null });
    await page.goto('/nalog');
    await expect(page).toHaveURL(/\/prijava/);
  });

  test('/pregled: sign-in first, 404 for a reader, the overview for the owner', async ({
    page,
    context,
  }, testInfo) => {
    await page.goto('/pregled');
    await expect(page).toHaveURL(/\/prijava\?nazad=%2Fpregled$/);

    await signInAs(context, testInfo, account('reader').key);
    const forReader = await page.goto('/pregled');
    expect(forReader?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1, name: 'Stranica nije pronađena' })).toBeVisible();
    await page.goto('/nalog');
    await expect(page.getByRole('link', { name: 'Pregled naloga' })).toHaveCount(0);

    const owner = account('admin');
    await signInAs(context, testInfo, owner.key);
    await page.goto('/nalog');
    await page.getByRole('link', { name: 'Pregled naloga' }).click();
    await expect(page).toHaveURL(/\/pregled$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Nalozi' })).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: owner.name })).toBeVisible();
    expect((await page.request.get('/pregled')).status()).toBe(200);
  });
});
