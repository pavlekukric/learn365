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
    await expect(page.getByRole('link', { name: /DAN 003/ })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Počni kurs' })).toHaveCount(0);
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

  // Review 2026-10-03 P1 1: the store rehydrating after first paint flipped
  // the footer to "completed" and fired the just-completed scroll, so a read
  // lesson opened by URL (reload, new tab, bookmark) landed on its footer.
  test('a read lesson opened by URL stays at the top', async ({ page }) => {
    await page.goto(`/course/${COURSE_ID}/lesson/day-002`);
    await expect(page.getByRole('button', { name: /^Pročitano/ })).toBeVisible();
    await page.waitForTimeout(800); // a smooth scroll would be under way by now
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test("the reader's own click still brings the completion moment into view", async ({ page }) => {
    await page.goto(`/course/${COURSE_ID}/lesson/day-003`);
    await page.getByRole('button', { name: /^Označi kao pročitano$/ }).click();
    await expect(page.getByRole('link', { name: /Sledeća lekcija · DAN 004/ })).toBeInViewport();
  });
});
