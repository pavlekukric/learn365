import { expect, test } from '@playwright/test';

/**
 * Accounts are OFF in this suite: the Playwright server runs `next start`
 * with no DATABASE_URL / APP_URL / Google client. Every surface Phase 8
 * added must be absent or degrade calmly, and reading must be untouched.
 */
test.describe('Istorija 365 — accounts off', () => {
  test('masthead shows no account entry and /api/me reports disabled', async ({ page }) => {
    const me = page.waitForResponse((response) => response.url().includes('/api/me'));
    await page.goto('/');
    const body = (await (await me).json()) as unknown;
    expect(body).toEqual({ enabled: false, user: null });

    const nav = page.getByRole('navigation', { name: 'Glavna navigacija' });
    await expect(nav.getByRole('link', { name: 'Kurs' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Prijava' })).toHaveCount(0);
    await expect(nav.locator('a[data-link="account"]')).toHaveCount(0);
  });

  test('/prijava says sign-in is unavailable and keeps a way back', async ({ page }) => {
    await page.goto('/prijava');
    await expect(page.getByRole('heading', { level: 1, name: 'Prijava' })).toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: /Prijava trenutno/ })).toContainText('Prijava trenutno nije dostupna');
    await expect(page.getByRole('link', { name: 'Nastavi sa Google-om' })).toHaveCount(0);
    await page.getByRole('link', { name: 'Nazad na čitanje' }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('/nalog sends the reader to /prijava', async ({ page }) => {
    await page.goto('/nalog');
    await expect(page).toHaveURL(/\/prijava$/);
  });

  test('the account card and the 404 card keep their room and their gutters', async ({ page }) => {
    // Regression guard (Phase 16): `.shell` and the page's own wrapper used to
    // share one element, so whichever stylesheet loaded last took the other's
    // padding — since Phase 14 the cards sat glued to the masthead. They are
    // separate elements now; this holds the result, not the order.
    for (const path of ['/prijava', '/ova-strana-ne-postoji']) {
      await page.goto(path);
      const box = await page.evaluate(() => {
        const masthead = document.querySelector('body header')?.getBoundingClientRect();
        const card = document.querySelector('main h1')?.parentElement?.getBoundingClientRect();
        if (!masthead || !card) return null;
        return {
          gap: Math.round(card.top - masthead.bottom),
          left: Math.round(card.left),
          right: Math.round(window.innerWidth - card.right),
        };
      });
      expect(box, path).not.toBeNull();
      if (!box) continue;
      expect(box.gap, `${path}: room under the masthead`).toBeGreaterThanOrEqual(40);
      expect(box.left, `${path}: left gutter`).toBeGreaterThanOrEqual(16);
      expect(box.right, `${path}: right gutter`).toBeGreaterThanOrEqual(16);
    }
  });

  test('/pregled does not exist, and crawlers are told to stay out', async ({ page, request }) => {
    // The owner's accounts overview (Phase 16): with accounts off there is
    // nobody who could be allowed in, so the address is a plain 404.
    const response = await page.goto('/pregled');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1, name: 'Stranica nije pronađena' })).toBeVisible();
    await expect(page.getByText('Nalozi', { exact: true })).toHaveCount(0);

    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toContain('Disallow: /pregled');
  });

  test('no sign-in ask after the second completed lesson', async ({ page }) => {
    // One lesson already done; finishing a second one is exactly when the
    // ask would appear with accounts on. Here it must not.
    await page.addInitScript(
      ({ key, value }) => window.localStorage.setItem(key, value),
      {
        key: 'learn365:progress:v1',
        value: JSON.stringify({
          state: {
            byCourse: {
              'istorija-srbije-365': {
                completedLessonIds: ['day-001'],
                lastOpenedLessonId: 'day-001',
                updatedAt: '2026-05-19T09:00:00.000Z',
              },
            },
          },
          version: 1,
        }),
      },
    );
    await page.goto('/course/istorija-srbije-365/lesson/day-002');
    await page.getByRole('button', { name: /Označi kao pročitano/ }).click();
    await expect(page.getByText('Dan 2 je iza tebe.')).toBeVisible();
    await expect(page.getByText('Sačuvaj napredak i na drugim uređajima.')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Nastavi sa Google-om' })).toHaveCount(0);
  });

  test('/privatnost renders and is reachable from the footer', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('contentinfo').getByRole('link', { name: 'Privatnost' }).click();
    await expect(page).toHaveURL(/\/privatnost$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Šta se čuva, i zašto' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Brisanje' })).toBeVisible();
  });
});
