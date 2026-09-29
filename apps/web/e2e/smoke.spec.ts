import { expect, test } from '@playwright/test';

const COURSE_ID = 'istorija-srbije-365';
const DAY_1_LESSON_ID = 'day-001';
// A second hand-authored (completable) lesson, distinct from day 1.
const AUTHORED_LESSON_ID = 'day-007';

test.describe('Istorija 365 — smoke', () => {
  test('home renders hero + CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // Fresh session has no progress, so the state-aware hero CTA reads
    // "Počni kurs" and links to the first lesson.
    await expect(page.getByRole('link', { name: /Počni kurs/ })).toBeVisible();
  });

  test('home daily anchor reflects idle vs in-progress state', async ({ page }) => {
    // Idle: fresh session has no completions. The Danas region renders the
    // framing line and exposes no "Tvoj N. dan" eyebrow.
    await page.goto('/');
    const anchor = page.getByRole('region', { name: 'Danas' });
    await expect(anchor).toBeVisible();
    await expect(anchor.getByText('Pred tobom je 365 dana kroz srpsku istoriju.')).toBeVisible();
    await expect(anchor.getByText(/Tvoj \d+\. dan/)).toHaveCount(0);

    // In-progress: seed one completion via the persisted progress key, then
    // re-navigate. Counter must read "Tvoj 2. dan" (the resume lesson's day).
    const seed = {
      state: {
        byCourse: {
          [COURSE_ID]: {
            completedLessonIds: ['day-001'],
            lastOpenedLessonId: 'day-001',
            updatedAt: '2026-05-19T09:00:00.000Z',
          },
        },
      },
      version: 1,
    };
    await page.addInitScript(({ key, value }) => window.localStorage.setItem(key, value), {
      key: 'learn365:progress:v1',
      value: JSON.stringify(seed),
    });
    await page.goto('/');
    await expect(
      page.getByRole('region', { name: 'Danas' }).getByText('Tvoj 2. dan'),
    ).toBeVisible();
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
    // Post-2026-09-25 each era card is a disclosure button (opens its
    // sections) with one labelled action link beside it.
    const eraCards = page.getByRole('button', { name: /^EPOHA [IVX]+ / });
    await expect(eraCards).toHaveCount(8);
    await expect(page.getByRole('link', { name: /^Počni: / })).toHaveCount(8);
  });

  test('course progress consolidates to one canonical row + journey-day eyebrow', async ({
    page,
  }) => {
    // Phase 7.9 — the CourseProgress card carries one canonical "where am
    // I" row (no "Sledeće" sibling), the eyebrow speaks the same journey
    // language as the Phase 7.8 Home anchor, and the per-era cards no
    // longer render a "u toku" accent chip.
    await page.goto(`/course/${COURSE_ID}`);

    // Idle (fresh session): kicker reads "Počni · DAN 001"; no SLEDEĆE row exists;
    // no NASTAVI fallback to the prior framing.
    await expect(page.getByText(/^Počni · DAN 001$/)).toBeVisible();
    await expect(page.getByText('SLEDEĆE')).toHaveCount(0);
    await expect(page.getByText('NASTAVI')).toHaveCount(0);
    // No era card carries the dropped "u toku" accent chip.
    await expect(page.getByText('u toku')).toHaveCount(0);

    // In-progress: seed one completion via the persisted progress key and
    // reload; the eyebrow flips to "Tvoj 2. dan" (the resume lesson's day,
    // shared with HomeDailyAnchor through useResumeLesson).
    const seed = {
      state: {
        byCourse: {
          [COURSE_ID]: {
            completedLessonIds: ['day-001'],
            lastOpenedLessonId: 'day-001',
            updatedAt: '2026-05-19T09:00:00.000Z',
          },
        },
      },
      version: 1,
    };
    await page.addInitScript(({ key, value }) => window.localStorage.setItem(key, value), {
      key: 'learn365:progress:v1',
      value: JSON.stringify(seed),
    });
    await page.goto(`/course/${COURSE_ID}`);
    await expect(page.getByText(/Tvoj 2\. dan/i)).toBeVisible();
    // The Sledeće row stays dropped even after the user starts progressing.
    await expect(page.getByText('SLEDEĆE')).toHaveCount(0);
  });

  test('lesson reader shows day, sidebar, timeline, and toggles completion', async ({ page }) => {
    await page.goto(`/course/${COURSE_ID}/lesson/${DAY_1_LESSON_ID}`);

    // The day position is surfaced per layout: single-column (≤1024px) shows
    // "Dan 001" in the sticky LessonContextHeader; desktop shows the
    // active "001" row in the always-visible sidebar. (It is no longer a
    // breadcrumb crumb.) Match whichever the current layout renders visible.
    await expect(
      page
        .getByText(/Dan 001|^001$/)
        .filter({ visible: true })
        .first(),
    ).toBeVisible();
    // Navigation surfaces differ by layout. Desktop (two-column): the course
    // outline sits beside the article (no era strip since 2026-09-30).
    // Single-column (≤1024px): the "Sadržaj" button reveals the drawer.
    const contentsButton = page.getByRole('button', {
      name: /Otvori sadržaj/,
    });
    const outline = page.getByRole('navigation', { name: 'Sadržaj kursa' });
    if (await contentsButton.isVisible()) {
      await contentsButton.click();
      const drawer = page.getByRole('dialog', { name: 'Sadržaj kursa' });
      await expect(drawer).toBeVisible();
      await page.getByRole('button', { name: 'Zatvori' }).click();
      await expect(drawer).toBeHidden();
    } else {
      await expect(outline).toBeVisible();
    }

    const markBtn = page.getByRole('button', { name: /^Označi kao pročitano$/ });
    await expect(markBtn).toBeVisible();
    await markBtn.click();

    await expect(page.getByRole('button', { name: /^Pročitano$/ })).toBeVisible();
  });

  test('lesson meta row stays visible while scrolling (single-column)', async ({ page }) => {
    // On single-column layouts (≤1024px) the LessonContextHeader's secondary
    // meta row (era + total progress) stays visible as the reader scrolls — the
    // header is sticky and no longer collapses on scroll-down. On the desktop
    // two-column layout the header is display:none, so this is a no-op there;
    // gate on the contents button's presence (the single-column marker).
    await page.goto(`/course/${COURSE_ID}/lesson/${DAY_1_LESSON_ID}`);

    const contentsButton = page.getByRole('button', { name: /Otvori sadržaj/ });
    if (!(await contentsButton.isVisible())) {
      test.skip(true, 'Desktop two-column layout — meta row is N/A');
    }

    // Rendered height is the deterministic probe for visibility.
    const metaRow = page.locator('[class*="LessonContextHeader_metaRow"]');
    const metaHeight = async () => (await metaRow.boundingBox())?.height ?? 0;

    expect(await metaHeight()).toBeGreaterThan(0);

    // Scroll well down the article; the meta row must remain visible (and the
    // contents trigger reachable) throughout.
    await page.evaluate(() => window.scrollBy(0, 240));
    await page.evaluate(() => window.scrollBy(0, 240));
    await expect.poll(metaHeight).toBeGreaterThan(0);
    await expect(contentsButton).toBeVisible();
  });

  test('course overview restores scroll position on return from a lesson', async ({ page }) => {
    // Phase 7.6 — returning to the course page restores the prior scroll
    // position instead of resetting to the top. Next's built-in restoration
    // misses here because the era accordion settles after hydration, so a
    // dedicated CourseScrollRestore component owns the save + settle-aware
    // restore. Seed progress so the page is tall + an era auto-expands.
    const seed = {
      state: {
        byCourse: {
          [COURSE_ID]: {
            completedLessonIds: ['day-001', 'day-002', 'day-003'],
            lastOpenedLessonId: 'day-200',
            updatedAt: '2026-05-19T09:00:00.000Z',
          },
        },
      },
      version: 1,
    };
    await page.addInitScript(({ key, value }) => window.localStorage.setItem(key, value), {
      key: 'learn365:progress:v1',
      value: JSON.stringify(seed),
    });

    await page.goto(`/course/${COURSE_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Scroll to a known offset and confirm it was persisted before leaving.
    // The save listener attaches after hydration, so retry the scroll (toggling
    // 0 → 1000 to guarantee a fresh scroll event each time) until the debounced
    // write lands — this rides out hydration timing under parallel load.
    const SCROLL_KEY = `learn365:course-scroll:${COURSE_ID}`;
    let saved = -1;
    for (let i = 0; i < 20 && saved < 800; i++) {
      await page.evaluate(() => {
        window.scrollTo(0, 0);
        window.scrollTo(0, 1000);
      });
      await page.waitForTimeout(200);
      saved = await page.evaluate(
        (k) => Number(window.sessionStorage.getItem(k) ?? -1),
        SCROLL_KEY,
      );
    }
    const target = await page.evaluate(() => window.scrollY);
    // Only meaningful where the page actually scrolls to the offset.
    if (target < 200 || saved < 200) {
      test.skip(true, 'Course page not scrollable to the offset on this profile');
    }

    // Leave to a lesson by direct navigation. Clicking an on-page lesson link
    // would make Playwright scroll that link into view first, moving the page
    // off the saved offset before we leave — an artifact of the harness, not of
    // real use (a user clicks a link already in their viewport). The save was
    // confirmed above, so a direct navigation faithfully exercises the return.
    await page.goto(`/course/${COURSE_ID}/lesson/${DAY_1_LESSON_ID}`);

    // Return via the in-page breadcrumb "Kurs" link (a forward navigation,
    // the case Next resets to top).
    await expect(page.getByRole('link', { name: 'Kurs' }).first()).toBeVisible();
    await Promise.all([
      page.waitForURL(new RegExp(`/course/${COURSE_ID}$`)),
      page.getByRole('link', { name: 'Kurs' }).first().click(),
    ]);

    // The restore is settle-aware (waits for client content height), so poll.
    await expect
      .poll(async () => page.evaluate(() => window.scrollY), { timeout: 5000 })
      .toBeGreaterThan(target - 150);
  });

  test('completion persists across reload', async ({ page }) => {
    await page.goto(`/course/${COURSE_ID}/lesson/${AUTHORED_LESSON_ID}`);
    await page.getByRole('button', { name: /^Označi kao pročitano$/ }).click();
    await expect(page.getByRole('button', { name: /^Pročitano$/ })).toBeVisible();

    await page.reload();

    await expect(page.getByRole('button', { name: /^Pročitano$/ })).toBeVisible();
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
    await expect(page.getByRole('heading', { level: 2, name: 'O izvorima' })).toBeVisible();
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
    // Home carries the rail (the lesson page's strip is gone, 2026-09-30).
    await page.goto('/');

    // The timeline marker is the horizontal-rail element — present on every
    // viewport, but display:none on the ≤720px vertical layout (the current
    // era's node stands in for it there). `toBeAttached` + getComputedStyle
    // works regardless of display, since this asserts a CSS property, not
    // visibility.
    const marker = page
      .locator(
        '[class*="HistoricalTimeline_marker"], [class*="HistoricalTimeline"] [class*="marker"]',
      )
      .first();
    await expect(marker).toBeAttached();

    const transitionDuration = await marker.evaluate(
      (el) => window.getComputedStyle(el).transitionDuration,
    );
    // globals.css collapses every transition to 0.01ms under reduced motion.
    // Browsers normalise that to "1e-05s"; either form (or a literal "0s") is fine.
    const durationMs =
      Number.parseFloat(transitionDuration) * (transitionDuration.endsWith('ms') ? 1 : 1000);
    expect(durationMs).toBeLessThan(1);

    await context.close();
  });
});
