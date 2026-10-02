import { expect, test } from '@playwright/test';

const COURSE_ID = 'istorija-srbije-365';
const PROGRESS_KEY = 'learn365:progress:v1';

function seed(completed: string[], lastOpened: string | null) {
  return JSON.stringify({
    state: {
      byCourse: {
        [COURSE_ID]: {
          completedLessonIds: completed,
          lastOpenedLessonId: lastOpened,
          updatedAt: '2026-05-19T09:00:00.000Z',
        },
      },
    },
    version: 1,
  });
}

test.describe('Istorija 365 — resume loop', () => {
  test('fresh user gets a real start action on the course overview, no empty ring', async ({
    page,
  }) => {
    await page.goto(`/course/${COURSE_ID}`);
    const start = page.getByRole('link', { name: /Počni od Dana 1/ });
    await expect(start).toBeVisible();
    await expect(start).toHaveAttribute('href', `/course/${COURSE_ID}/lesson/day-001`);
    // No progress ring (and no deflating "0%") until something is completed.
    await expect(page.getByRole('img', { name: /Pročitano/ })).toHaveCount(0);
    await expect(page.getByText('0%')).toHaveCount(0);
  });

  test('finishing Day 1 moves every resume action to Day 2, never back to Day 1', async ({
    page,
  }) => {
    await page.goto(`/course/${COURSE_ID}/lesson/day-001`);
    await page.getByRole('button', { name: /^Označi kao pročitano$/ }).click();
    await expect(page.getByRole('button', { name: /^Pročitano$/ })).toBeVisible();

    // First-win moment: a human sentence plus the labelled count, in the article.
    const article = page.locator('article');
    await expect(article.getByText('Prvi dan je iza tebe.')).toBeVisible();
    await expect(article.getByText('Pročitano 1 / 365')).toBeVisible();
    await expect(article.getByRole('link', { name: /Sledeća lekcija · DAN 002/ })).toBeVisible();

    // Home: the hero drops its CTA for a returning reader; the recommended
    // card right under the title is the one action, and it opens Day 2.
    await page.goto('/');
    await expect(page.getByRole('link', { name: /Počni kurs/ })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /DAN 002/ })).toHaveAttribute(
      'href',
      `/course/${COURSE_ID}/lesson/day-002`,
    );
    await expect(page.getByRole('link', { name: /DAN 001/ })).toHaveCount(0);

    // Course overview: the canonical row opens Day 2 and the ring counts
    // lessons (1 od 365) instead of rounding the first win down to "0%".
    await page.goto(`/course/${COURSE_ID}`);
    await expect(page.getByRole('link', { name: /Tvoj 2\. dan/ })).toHaveAttribute(
      'href',
      `/course/${COURSE_ID}/lesson/day-002`,
    );
    await expect(page.getByRole('img', { name: 'Pročitano 1 od 365 lekcija' })).toBeVisible();
    await expect(page.getByText('0%')).toHaveCount(0);
  });

  test('"Nastavi" opens the day after the last one read', async ({ page }) => {
    // Day 1 done (Day 2 opened but not finished) → resume Day 2.
    await page.addInitScript(({ key, value }) => window.localStorage.setItem(key, value), {
      key: PROGRESS_KEY,
      value: seed(['day-001'], 'day-002'),
    });
    await page.goto('/');
    await expect(page.getByRole('link', { name: /DAN 002/ })).toHaveAttribute(
      'href',
      `/course/${COURSE_ID}/lesson/day-002`,
    );
  });

  test('a lesson merely opened far ahead does not move "Tvoj N. dan"', async ({ page }) => {
    // Phase 21 rule: Days 1–3 read, Day 250 opened from the outline and left
    // unread → resume is Day 4 on Home and on the overview, and the
    // overview's tinted "you are here" row is that same lesson.
    await page.addInitScript(({ key, value }) => window.localStorage.setItem(key, value), {
      key: PROGRESS_KEY,
      value: seed(['day-001', 'day-002', 'day-003'], 'day-250'),
    });
    await page.goto('/');
    await expect(
      page.getByRole('region', { name: 'Danas' }).getByText('Tvoj 4. dan'),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /DAN 004/ })).toHaveAttribute(
      'href',
      `/course/${COURSE_ID}/lesson/day-004`,
    );
    await expect(page.getByText(/Tvoj 250\. dan/)).toHaveCount(0);

    await page.goto(`/course/${COURSE_ID}`);
    await expect(page.getByRole('link', { name: /Tvoj 4\. dan/ })).toHaveAttribute(
      'href',
      `/course/${COURSE_ID}/lesson/day-004`,
    );
    await expect(page.locator('a[class*="LessonNavItem_active"]')).toHaveAttribute(
      'href',
      `/course/${COURSE_ID}/lesson/day-004`,
    );
  });

  test('the open lesson, once read, keeps its place and says it is read', async ({ page }) => {
    // Active and completed are two facts: the current row stays the current
    // row (aria-current) and still carries ", pročitano".
    await page.addInitScript(({ key, value }) => window.localStorage.setItem(key, value), {
      key: PROGRESS_KEY,
      value: seed(['day-001'], 'day-001'),
    });
    await page.goto(`/course/${COURSE_ID}/lesson/day-001`);
    const contents = page.getByRole('button', { name: 'Otvori sadržaj' });
    if (await contents.isVisible()) await contents.click();
    const current = page
      .getByRole('navigation', { name: 'Sadržaj kursa' })
      .first()
      .locator('a[aria-current="page"]');
    await expect(current).toHaveAccessibleName(/Lepenski Vir.*pročitano/);
  });

  test('TopBar progress capsule is labelled on every viewport', async ({ page }) => {
    await page.goto('/');
    const capsule = page
      .getByRole('navigation', { name: 'Glavna navigacija' })
      .locator('[aria-label="Pročitane lekcije"]');
    await expect(capsule).toBeVisible();
    await expect(capsule.getByText('Pročitano')).toBeVisible();
    await expect(capsule.getByText('0 / 365')).toBeVisible();
  });
});
