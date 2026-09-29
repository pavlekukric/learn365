import { expect, test } from '@playwright/test';

const COURSE_ID = 'istorija-srbije-365';
const SEED = JSON.stringify({
  state: {
    byCourse: {
      [COURSE_ID]: {
        completedLessonIds: ['day-001', 'day-002'],
        lastOpenedLessonId: 'day-003',
        updatedAt: '2026-09-30T08:00:00.000Z',
      },
    },
  },
  version: 1,
});

test.describe('Returning reader — review 2026-09-30', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript((value) => {
      window.localStorage.setItem('learn365:progress:v1', value);
    }, SEED);
  });

  test('before any JS runs, the newcomer Home stays hidden', async ({ page }) => {
    // Without the JS chunks the page never hydrates: this is what a returning
    // reader sees until they arrive. Only the inline pre-paint script runs.
    await page.route('**/_next/static/chunks/**', (route) => route.abort());
    await page.goto('/', { waitUntil: 'load' });

    await expect(page.locator('html')).toHaveAttribute('data-progress', 'started');
    await expect(page.locator('#kako-funkcionise')).toBeHidden();
    await expect(page.getByRole('link', { name: 'Počni kurs' })).toBeHidden();
  });

  test('after hydration the mark is gone and the reader state shows', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Nastavi lekciju' })).toBeVisible();
    await expect(page.locator('html')).not.toHaveAttribute('data-progress', /.*/);
    await expect(page.locator('#kako-funkcionise')).toHaveCount(0);
  });

  test('the drawer closes when the open lesson is chosen again', async ({ page }) => {
    await page.goto(`/course/${COURSE_ID}/lesson/day-003`);
    const contents = page.getByRole('button', { name: 'Otvori sadržaj' });
    test.skip(!(await contents.isVisible()), 'Desktop two-column layout — no drawer');

    await contents.click();
    const drawer = page.getByRole('dialog', { name: 'Sadržaj kursa' });
    await expect(drawer).toBeVisible();
    await drawer.locator('a[aria-current="page"]').click();
    await expect(drawer).toBeHidden();
  });

  test('outline rows say which lessons are read', async ({ page }) => {
    await page.goto(`/course/${COURSE_ID}/lesson/day-003`);
    const contents = page.getByRole('button', { name: 'Otvori sadržaj' });
    if (await contents.isVisible()) await contents.click();
    const outline = page.getByRole('navigation', { name: 'Sadržaj kursa' }).first();
    await expect(outline.getByRole('link', { name: /Lepenski Vir.*pročitano/ })).toBeAttached();
  });
});
