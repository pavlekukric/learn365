import { expect, test } from '@playwright/test';

/**
 * Accounts are OFF in this suite: the Playwright server runs `next start`
 * with no DATABASE_URL / APP_URL / Google client. Every surface Phase 8
 * added must be absent or degrade calmly, and reading must be untouched.
 */
test.describe('History 365 — accounts off', () => {
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
    await expect(page.getByRole('status')).toContainText('Prijava trenutno nije dostupna');
    await expect(page.getByRole('link', { name: 'Nastavi sa Google-om' })).toHaveCount(0);
    await page.getByRole('link', { name: 'Nazad na čitanje' }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('/nalog sends the reader to /prijava', async ({ page }) => {
    await page.goto('/nalog');
    await expect(page).toHaveURL(/\/prijava$/);
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
    await page.getByRole('button', { name: /Završi/ }).click();
    await expect(page.getByText('Dan 2 je iza tebe.')).toBeVisible();
    await expect(page.getByText('Sačuvaj napredak i na drugim uređajima.')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Nastavi sa Google-om' })).toHaveCount(0);
  });

  test('/privatnost renders and is reachable from the footer', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('contentinfo').getByRole('link', { name: 'Privatnost' }).click();
    await expect(page).toHaveURL(/\/privatnost$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Šta čuvamo, i zašto' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Brisanje' })).toBeVisible();
  });
});
