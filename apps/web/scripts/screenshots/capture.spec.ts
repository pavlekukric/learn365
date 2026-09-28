import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test, type Page, type TestInfo } from '@playwright/test';

import { clearProgress, seedProgress } from './seedProgress';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * History 365 — full visual screenshot pack.
 *
 * One spec per shot, parameterised by Playwright projects (`desktop`,
 * `mobile`). All output goes to `<repo>/screenshots/{desktop,mobile}/`
 * with a stable filename pattern: `<viewport>-<slug>.png`.
 *
 * The script does not modify any app code or styling. The only state
 * manipulation is via localStorage seeding (`seedProgress`), which mirrors
 * what a real user's browser would hold.
 */

const COURSE_ID = 'istorija-srbije-365';

const LESSON = {
  day1: 'day-001',
  day7: 'day-007',
  nemanjici1: 'day-046',
  placeholder: 'day-359',
} as const;

const SCREENSHOTS_ROOT = path.resolve(__dirname, '../../../../screenshots');

function shotPath(testInfo: TestInfo, slug: string): string {
  const viewport = testInfo.project.name; // 'desktop' | 'mobile'
  return path.join(SCREENSHOTS_ROOT, viewport, `${viewport}-${slug}.png`);
}

async function gotoAndSettle(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: 'networkidle' });
  // Wait for headline to ensure server-rendered content is on screen.
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  // Web fonts can shift layout — wait for them before snapping.
  await page.evaluate(() => document.fonts.ready);
}

async function snap(
  page: Page,
  testInfo: TestInfo,
  slug: string,
  opts: { fullPage?: boolean } = {},
): Promise<void> {
  await page.screenshot({
    path: shotPath(testInfo, slug),
    fullPage: opts.fullPage ?? true,
    animations: 'disabled',
  });
}

test.describe('Screenshot pack', () => {
  // Each test starts with a clean localStorage. Specific tests opt in to
  // seeded progress where it matters.
  test.beforeEach(async ({ page }) => {
    await clearProgress(page);
  });

  test('home — fresh session', async ({ page }, testInfo) => {
    await gotoAndSettle(page, '/');
    await snap(page, testInfo, 'home');
  });

  test('home — with progress (continue state)', async ({ page }, testInfo) => {
    await seedProgress(page, {
      courseId: COURSE_ID,
      completedLessonIds: [LESSON.day1, LESSON.day7],
      lastOpenedLessonId: LESSON.day7,
    });
    await gotoAndSettle(page, '/');
    await snap(page, testInfo, 'home-with-progress');
  });

  test('course overview — fresh session', async ({ page }, testInfo) => {
    await gotoAndSettle(page, `/course/${COURSE_ID}`);
    await snap(page, testInfo, 'course-overview');
  });

  test('course overview — with progress', async ({ page }, testInfo) => {
    await seedProgress(page, {
      courseId: COURSE_ID,
      completedLessonIds: [LESSON.day1, LESSON.day7, LESSON.nemanjici1],
      lastOpenedLessonId: LESSON.nemanjici1,
    });
    await gotoAndSettle(page, `/course/${COURSE_ID}`);
    await snap(page, testInfo, 'course-overview-with-progress');
  });

  test('lesson — day 001 (first lesson, era I)', async ({ page }, testInfo) => {
    await gotoAndSettle(page, `/course/${COURSE_ID}/lesson/${LESSON.day1}`);
    await snap(page, testInfo, 'lesson-001');
  });

  test('lesson — day 046 (different era, Nemanjići)', async ({ page }, testInfo) => {
    await gotoAndSettle(
      page,
      `/course/${COURSE_ID}/lesson/${LESSON.nemanjici1}`,
    );
    await snap(page, testInfo, 'lesson-046-nemanjici');
  });

  test('lesson — completed state', async ({ page }, testInfo) => {
    await seedProgress(page, {
      courseId: COURSE_ID,
      completedLessonIds: [LESSON.day7],
      lastOpenedLessonId: LESSON.day7,
    });
    await gotoAndSettle(page, `/course/${COURSE_ID}/lesson/${LESSON.day7}`);
    // Sanity: the button should reflect the completed state from seed.
    await expect(
      page.getByRole('button', { name: /^Pročitano$/ }).first(),
    ).toBeVisible();
    await snap(page, testInfo, 'lesson-007-completed');
  });

  // Close-up of the post-completion footer so the "DAN N završeno." line
  // and the primary next-lesson card are legible without zooming into the
  // full-page shot. Scrolls the next-lesson card into view and snaps a
  // viewport-sized frame anchored at the bottom of the article.
  test('lesson — completion moment (footer close-up)', async ({
    page,
  }, testInfo) => {
    await seedProgress(page, {
      courseId: COURSE_ID,
      completedLessonIds: [LESSON.day7],
      lastOpenedLessonId: LESSON.day7,
    });
    await gotoAndSettle(page, `/course/${COURSE_ID}/lesson/${LESSON.day7}`);
    const card = page.getByRole('link', { name: /Sledeća lekcija/ }).first();
    await expect(card).toBeVisible();
    await card.scrollIntoViewIfNeeded();
    await snap(page, testInfo, 'lesson-007-completion-moment', {
      fullPage: false,
    });
  });

  test('lesson — placeholder/upcoming state', async ({ page }, testInfo) => {
    await gotoAndSettle(
      page,
      `/course/${COURSE_ID}/lesson/${LESSON.placeholder}`,
    );
    await expect(page.getByText('Ova lekcija je u pripremi.')).toBeVisible();
    await snap(page, testInfo, 'lesson-placeholder');
  });

  test('404 — not found', async ({ page }, testInfo) => {
    await page.goto('/this-route-does-not-exist', {
      waitUntil: 'networkidle',
    });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await snap(page, testInfo, 'not-found');
  });

  // ────────────────────────────────────────────────────────────────────────
  // Mobile-only interactive states.
  //
  // The "Sadržaj" trigger only renders on single-column layouts (≤1024px);
  // on desktop the sidebar is permanently visible, so there is no drawer to
  // open. The app has no separate mobile-menu / paywall / settings / modal
  // surface beyond this drawer — see screenshots/README.md.
  // ────────────────────────────────────────────────────────────────────────
  test('lesson — Sadržaj drawer open (mobile only)', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'mobile',
      'Sadržaj drawer only exists on single-column layouts (≤1024px).',
    );
    await gotoAndSettle(page, `/course/${COURSE_ID}/lesson/${LESSON.day1}`);
    await page.getByRole('button', { name: /Otvori sadržaj/ }).click();
    await expect(
      page.getByRole('dialog', { name: 'Sadržaj kursa' }),
    ).toBeVisible();
    // Drawer pins to viewport — a viewport-sized shot reads better than
    // a full-page shot (which would extend past the dialog's scroll area).
    await snap(page, testInfo, 'lesson-001-sadrzaj-drawer', {
      fullPage: false,
    });
  });
});
