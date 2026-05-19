import { expect, test } from '@playwright/test';

const COURSE_ID = 'istorija-srbije-365';
const DAY_1_LESSON_ID = 'day-001';
// A second hand-authored (completable) lesson, distinct from day 1.
const AUTHORED_LESSON_ID = 'day-007';
// An unauthored placeholder lesson — renders the "upcoming" state.
const PLACEHOLDER_LESSON_ID = 'day-359';

test.describe('History 365 — smoke', () => {
  test('home renders hero + CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // Fresh session has no progress, so the state-aware hero CTA reads
    // "Započni kurs" and links to the first lesson.
    await expect(page.getByRole('link', { name: /Započni kurs/ })).toBeVisible();
  });

  test('TopBar Kurs link is reachable on every viewport', async ({ page }) => {
    // Mobile regression guard: the TopBar must keep the "Kurs" text link
    // visible on ≤720px so the course overview stays reachable from the
    // global chrome. "Početna" and "O aplikaciji" remain hidden on mobile
    // (Brand carries Home, footer carries About).
    await page.goto('/');
    const kursLink = page
      .getByRole('navigation', { name: 'Glavna navigacija' })
      .getByRole('link', { name: 'Kurs' });
    await expect(kursLink).toBeVisible();
    await kursLink.click();
    await expect(page).toHaveURL(new RegExp(`/course/${COURSE_ID}$`));
  });

  test('course overview renders eight eras', async ({ page }) => {
    await page.goto(`/course/${COURSE_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const eraCards = page.getByRole('link', { name: /^Epoha [IVX]+:/ });
    await expect(eraCards).toHaveCount(8);
  });

  test('lesson reader shows day, sidebar, timeline, and toggles completion', async ({ page }) => {
    await page.goto(`/course/${COURSE_ID}/lesson/${DAY_1_LESSON_ID}`);

    // "DAN 001" is in the DOM twice — the LessonContextHeader (single-column
    // layouts) and the LessonHeader eyebrow (desktop). Exactly one is visible
    // per layout; filter to it.
    await expect(
      page.getByText(/DAN 001/).filter({ visible: true }).first(),
    ).toBeVisible();
    // Navigation surfaces differ by layout. Desktop (two-column): the inline
    // reader timeline is visible above the article. Single-column (≤1024px):
    // the inline timeline is hidden (`display:none`, so it's out of the a11y
    // tree too); the "Sadržaj" button reveals the course outline drawer.
    const contentsButton = page.getByRole('button', {
      name: /Otvori sadržaj/,
    });
    const timeline = page.getByRole('navigation', {
      name: 'Vremenska osa epoha',
    });
    if (await contentsButton.isVisible()) {
      await contentsButton.click();
      const drawer = page.getByRole('dialog', { name: 'Sadržaj kursa' });
      await expect(drawer).toBeVisible();
      await page.getByRole('button', { name: 'Zatvori' }).click();
      await expect(drawer).toBeHidden();
    } else {
      await expect(timeline).toBeVisible();
    }

    const markBtn = page.getByRole('button', { name: /^Završi$/ });
    await expect(markBtn).toBeVisible();
    await markBtn.click();

    await expect(
      page.getByRole('button', { name: /^Završeno$/ }),
    ).toBeVisible();
  });

  test('completion persists across reload', async ({ page }) => {
    await page.goto(`/course/${COURSE_ID}/lesson/${AUTHORED_LESSON_ID}`);
    await page.getByRole('button', { name: /^Završi$/ }).click();
    await expect(
      page.getByRole('button', { name: /^Završeno$/ }),
    ).toBeVisible();

    await page.reload();

    await expect(
      page.getByRole('button', { name: /^Završeno$/ }),
    ).toBeVisible();
  });

  test('placeholder lesson shows upcoming state and hides completion', async ({
    page,
  }) => {
    await page.goto(`/course/${COURSE_ID}/lesson/${PLACEHOLDER_LESSON_ID}`);
    await expect(page.getByText('Ova lekcija je u pripremi.')).toBeVisible();
    // Completion must not be possible for an unavailable lesson.
    await expect(
      page.getByRole('button', { name: /^Završi$/ }),
    ).toHaveCount(0);
  });

  test('about page renders and is reachable from the footer', async ({ page }) => {
    // Footer is mounted in the root layout, so the link is present on every
    // route — exercise it from the home page.
    await page.goto('/');
    const footer = page.getByRole('contentinfo');
    await expect(footer).toBeVisible();
    await footer.getByRole('link', { name: 'O aplikaciji' }).click();
    await expect(page).toHaveURL(/\/o-aplikaciji$/);
    await expect(
      page.getByRole('heading', { level: 1, name: /Tihi vodič kroz istoriju Srbije/ }),
    ).toBeVisible();
    // The #izvori anchor is the deep-link target the footer's "Izvori" link
    // points at; it must exist as a heading on the page.
    await expect(
      page.getByRole('heading', { level: 2, name: 'O izvorima' }),
    ).toBeVisible();
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

    // The timeline marker is the horizontal-rail element — present on every
    // viewport, but display:none on the ≤720px vertical layout (the current
    // era's node stands in for it there). `toBeAttached` + getComputedStyle
    // works regardless of display, since this asserts a CSS property, not
    // visibility.
    const marker = page.locator(
      '[class*="HistoricalTimeline_marker"], [class*="HistoricalTimeline"] [class*="marker"]',
    ).first();
    await expect(marker).toBeAttached();

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
