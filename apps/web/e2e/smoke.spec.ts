import { expect, test } from '@playwright/test';

const COURSE_ID = 'istorija-srbije-365';
const DAY_1_LESSON_ID = 'praistorija-i-antika-001';
// A second hand-authored (completable) lesson, distinct from day 1.
const AUTHORED_LESSON_ID = 'praistorija-i-antika-007';
// An unauthored placeholder lesson — renders the "upcoming" state.
const PLACEHOLDER_LESSON_ID = 'praistorija-i-antika-002';

test.describe('History 365 — smoke', () => {
  test('home renders hero + CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /Pregled kursa/ })).toBeVisible();
  });

  test('course overview renders eight eras', async ({ page }) => {
    await page.goto(`/course/${COURSE_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const eraCards = page.getByRole('link', { name: /^Epoha [IVX]+:/ });
    await expect(eraCards).toHaveCount(8);
  });

  test('lesson reader shows day, sidebar, timeline, and toggles completion', async ({ page }) => {
    await page.goto(`/course/${COURSE_ID}/lesson/${DAY_1_LESSON_ID}`);

    // "DAN 001" appears twice (mobile bar + LessonHeader eyebrow); the mobile
    // bar is display:none on desktop. Filter to the visible occurrence.
    await expect(
      page.getByText(/DAN 001/).filter({ visible: true }).first(),
    ).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Vremenska osa epoha' })).toBeVisible();

    const markBtn = page.getByRole('button', { name: /Označi kao završeno/ });
    await expect(markBtn).toBeVisible();
    await markBtn.click();

    await expect(
      page.getByRole('button', { name: /Označeno kao završeno/ }),
    ).toBeVisible();
  });

  test('completion persists across reload', async ({ page }) => {
    await page.goto(`/course/${COURSE_ID}/lesson/${AUTHORED_LESSON_ID}`);
    await page.getByRole('button', { name: /Označi kao završeno/ }).click();
    await expect(
      page.getByRole('button', { name: /Označeno kao završeno/ }),
    ).toBeVisible();

    await page.reload();

    await expect(
      page.getByRole('button', { name: /Označeno kao završeno/ }),
    ).toBeVisible();
  });

  test('placeholder lesson shows upcoming state and hides completion', async ({
    page,
  }) => {
    await page.goto(`/course/${COURSE_ID}/lesson/${PLACEHOLDER_LESSON_ID}`);
    await expect(page.getByText('Lekcija se uskoro objavljuje.')).toBeVisible();
    // Completion must not be possible for an unavailable lesson.
    await expect(
      page.getByRole('button', { name: /Označi kao završeno/ }),
    ).toHaveCount(0);
  });

  test('skip link is the first tab stop and focuses main', async ({ page, browserName }) => {
    // Safari/WebKit skips anchor tags during Tab navigation by default
    // (the "Press Tab to highlight each item" macOS preference is off in
    // Playwright's WebKit). The skip link itself is keyboard-reachable for
    // users who have full-keyboard-access enabled — that's the only audience
    // a skip link serves on Safari. Skip the assertion there.
    test.skip(browserName === 'webkit', 'WebKit Tab skips anchors by default');

    await page.goto('/');
    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: 'Preskoči na sadržaj' });
    await expect(skipLink).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused();
  });

  test('prefers-reduced-motion collapses timeline marker animation', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(`/course/${COURSE_ID}/lesson/${DAY_1_LESSON_ID}`);

    const marker = page.locator(
      '[class*="HistoricalTimeline_marker"], [class*="HistoricalTimeline"] [class*="marker"]',
    ).first();
    await expect(marker).toBeVisible();

    const transitionDuration = await marker.evaluate(
      (el) => window.getComputedStyle(el).transitionDuration,
    );
    // globals.css collapses every transition to 0.01ms under reduced motion.
    // Browsers normalise that to "1e-05s"; either form (or a literal "0s") is fine.
    const durationMs = Number.parseFloat(transitionDuration) *
      (transitionDuration.endsWith('ms') ? 1 : 1000);
    expect(durationMs).toBeLessThan(1);

    await context.close();
  });
});
