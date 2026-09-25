import { expect, test } from '@playwright/test';

const COURSE_ID = 'istorija-srbije-365';

test.describe('History 365 — course overview', () => {
  test('era card: the card opens its sections, the one link opens the right lesson', async ({
    page,
  }) => {
    await page.goto(`/course/${COURSE_ID}`);
    const card = page.getByRole('button', {
      name: 'Epoha I: Praistorija, antika i doseljavanje Slovena',
    });
    await expect(card).toHaveAttribute('aria-expanded', 'false');
    await card.click();
    await expect(card).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('button', { name: /Praistorija Podunavlja/ })).toBeVisible();
    // No stray standalone "Pokaži odeljke" button outside the cards.
    await expect(page.getByRole('button', { name: /^Pokaži odeljke/ })).toHaveCount(0);
    // The explicit action opens Day 1 for a fresh user.
    await expect(
      page.getByRole('link', { name: 'Počni: Praistorija, antika i doseljavanje Slovena' }),
    ).toHaveAttribute('href', `/course/${COURSE_ID}/lesson/day-001`);
  });

  test('era action resumes at the first unread lesson once the era has progress', async ({
    page,
  }) => {
    const seed = JSON.stringify({
      state: {
        byCourse: {
          [COURSE_ID]: {
            completedLessonIds: ['day-001', 'day-002'],
            lastOpenedLessonId: 'day-002',
            updatedAt: '2026-05-19T09:00:00.000Z',
          },
        },
      },
      version: 1,
    });
    await page.addInitScript(({ key, value }) => window.localStorage.setItem(key, value), {
      key: 'learn365:progress:v1',
      value: seed,
    });
    await page.goto(`/course/${COURSE_ID}`);
    await expect(
      page.getByRole('link', { name: 'Nastavi: Praistorija, antika i doseljavanje Slovena' }),
    ).toHaveAttribute('href', `/course/${COURSE_ID}/lesson/day-003`);
  });

  test('bookmark toggle is labelled on desktop and explains where saved lessons live', async ({
    page,
  }) => {
    await page.goto(`/course/${COURSE_ID}/lesson/day-001`);
    const toggle = page.getByRole('button', { name: 'Sačuvaj lekciju' });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('title', /strani kursa/);
    await toggle.click();
    await expect(page.getByRole('button', { name: 'Ukloni iz sačuvanih' })).toBeVisible();
  });
});
