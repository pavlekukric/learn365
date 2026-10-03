import { readFileSync } from 'node:fs';

import {
  expect,
  test,
  type BrowserContext,
  type Page,
  type Route,
  type TestInfo,
} from '@playwright/test';

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
  return page.evaluate((keys) => keys.map((key) => window.localStorage.getItem(key)), MARKER_KEYS);
}

async function me(page: Page): Promise<unknown> {
  return (await page.request.get('/api/me')).json();
}

async function serverCompleted(page: Page): Promise<string[]> {
  const response = await page.request.get(`/api/me/progress?courseId=${COURSE_ID}`);
  if (!response.ok()) return [];
  const body = (await response.json()) as { completedLessonIds: string[] };
  return [...body.completedLessonIds].sort();
}

/** Open a lesson signed in and wait until this browser is synced (marker written). */
async function openSynced(
  page: Page,
  lessonId: string,
  expected: readonly string[],
): Promise<void> {
  await page.goto(`/course/${COURSE_ID}/lesson/${lessonId}`);
  await expect.poll(() => localMarkers(page)).not.toContain(null);
  await expect.poll(() => localCompleted(page)).toEqual([...expected].sort());
}

const markRead = (page: Page) =>
  page
    .getByRole('button', { name: /Označi kao pročitano/ })
    .first()
    .click();

test.describe('History 365 — accounts on', () => {
  test('signing in unions local progress into the account; signing out clears this browser', async ({
    page,
    context,
  }, testInfo) => {
    const reader = accountForAttempt('sync', testInfo);

    // Anonymous reading first: one lesson done, only in this browser. Wait
    // for this page's `/api/me` first — answered after the cookie below, it
    // would start a sync from this page's (empty) store.
    const anonymousMe = page.waitForResponse((response) => response.url().endsWith('/api/me'));
    await page.goto('/');
    await anonymousMe;
    await page.evaluate(({ key, value }) => window.localStorage.setItem(key, value), {
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
    });

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
    await expect(
      page.getByRole('heading', { level: 1, name: 'Stranica nije pronađena' }),
    ).toBeVisible();
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
  // Phase 23 (review 2026-10-01 P1 item 4): no silent loss of signed-in progress.

  test('a lesson marked read and reloaded at once is kept and reaches the account', async ({
    page,
    context,
  }, testInfo) => {
    const reader = accountForAttempt('reload', testInfo);
    await signInAs(context, testInfo, reader.key);
    await openSynced(page, 'day-010', reader.completed);

    // Reload inside the 250 ms debounce: no PATCH left this page.
    await markRead(page);
    await page.reload();

    const expected = [...reader.completed, 'day-010'].sort();
    await expect.poll(() => localCompleted(page)).toEqual(expected);
    await expect.poll(() => serverCompleted(page)).toEqual(expected);
  });

  test('changes made during an outage survive closing the tab and go out on the next visit', async ({
    page,
    context,
  }, testInfo) => {
    const reader = accountForAttempt('outage', testInfo);
    await signInAs(context, testInfo, reader.key);
    await openSynced(page, 'day-011', reader.completed);

    let refused = 0;
    await page.route('**/api/me/progress', async (route) => {
      if (route.request().method() !== 'PATCH') return route.continue();
      refused += 1;
      return route.fulfill({ status: 503, body: '{"error":"db"}' });
    });
    await markRead(page);
    // The first try and the one retry, then the engine waits.
    await expect.poll(() => refused, { timeout: 10_000 }).toBeGreaterThanOrEqual(2);
    expect(await serverCompleted(page)).toEqual([...reader.completed].sort());
    await page.close();

    const next = await context.newPage();
    await next.goto(`/course/${COURSE_ID}`);
    const expected = [...reader.completed, 'day-011'].sort();
    await expect.poll(() => serverCompleted(next)).toEqual(expected);
    await expect.poll(() => localCompleted(next)).toEqual(expected);
  });

  test('two tabs: a lesson read in each is kept in both and on the account', async ({
    page,
    context,
  }, testInfo) => {
    const reader = accountForAttempt('tabs', testInfo);
    await signInAs(context, testInfo, reader.key);
    await openSynced(page, 'day-012', reader.completed);
    const other = await context.newPage();
    await openSynced(other, 'day-013', reader.completed);

    await markRead(page);
    await expect.poll(() => localCompleted(other)).toContain('day-012');
    await markRead(other);

    const expected = [...reader.completed, 'day-012', 'day-013'].sort();
    await expect.poll(() => localCompleted(page)).toEqual(expected);
    await expect.poll(() => localCompleted(other)).toEqual(expected);
    await expect.poll(() => serverCompleted(page)).toEqual(expected);
  });

  test('Odjava in one tab: the other tab drops the account and cannot leak it into the next one', async ({
    page,
    context,
  }, testInfo) => {
    const first = accountForAttempt('tabsout', testInfo);
    const second = accountForAttempt('next', testInfo);
    await signInAs(context, testInfo, first.key);
    await openSynced(page, 'day-020', first.completed);
    const other = await context.newPage();
    await openSynced(other, 'day-021', first.completed);

    await page.goto('/nalog');
    await page.getByRole('button', { name: 'Odjava', exact: true }).click();
    await expect(page).toHaveURL(/:\d+\/$/);

    // The other tab followed: empty store, no markers, signed out.
    await expect.poll(() => localCompleted(other)).toEqual([]);
    await expect.poll(() => localMarkers(other)).toEqual([null, null]);
    // Reading on there now is anonymous reading — only this lesson.
    await markRead(other);
    await expect.poll(() => localCompleted(other)).toEqual(['day-021']);

    // The next reader signs in on this browser: their first sync unions
    // the anonymous lesson, and none of the first account's.
    await signInAs(context, testInfo, second.key);
    await other.goto(`/course/${COURSE_ID}`);
    const expected = [...second.completed, 'day-021'].sort();
    await expect.poll(() => serverCompleted(other)).toEqual(expected);
    for (const lessonId of first.completed) {
      expect(await serverCompleted(other)).not.toContain(lessonId);
    }
  });

  // Review 2026-10-03 P1 item 2: a sign-in as another account without `Odjava`.

  test('a tab that missed an account switch cannot write into the new account', async ({
    page,
    context,
  }, testInfo) => {
    const first = accountForAttempt('switchfrom', testInfo);
    const second = accountForAttempt('switchto', testInfo);
    await signInAs(context, testInfo, first.key);
    await openSynced(page, 'day-030', first.completed);

    // Hold this tab's later `/api/me` answers: it keeps believing it is the
    // first account while the reader clicks (the race the server must catch).
    const held: Route[] = [];
    let holding = true;
    await page.route('**/api/me', (route) => {
      if (holding) held.push(route);
      else void route.continue();
    });

    // A new session cookie for another account (the Google callback after a
    // second sign-in), no `Odjava`; another tab loads as that account.
    await signInAs(context, testInfo, second.key);
    const other = await context.newPage();
    await openSynced(other, 'day-031', second.completed);
    // The other tab rewrote the markers to its account: this tab re-asks.
    await expect.poll(() => held.length).toBeGreaterThan(0);
    const asked = held.length;

    const patch = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/me/progress') && response.request().method() === 'PATCH',
    );
    await markRead(page);
    expect((await patch).status()).toBe(409);
    expect(await serverCompleted(other)).toEqual([...second.completed].sort());
    // The 409 makes the sync layer re-ask too.
    await expect.poll(() => held.length).toBeGreaterThan(asked);

    // Once `/api/me` answers, the stale tab follows the new account.
    holding = false;
    for (const route of held) await route.continue();
    await expect(page.locator('a[data-link="account"]').first()).toHaveAttribute(
      'aria-label',
      `Nalog: ${second.name}`,
    );
    await expect.poll(() => localCompleted(page)).toEqual([...second.completed].sort());
    expect(await serverCompleted(other)).toEqual([...second.completed].sort());
  });
});
