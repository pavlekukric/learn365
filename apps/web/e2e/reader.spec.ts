import { expect, test } from '@playwright/test';

const COURSE_ID = 'istorija-srbije-365';
const LESSON = `/course/${COURSE_ID}/lesson/day-001`;

test.describe('Istorija 365 — reader chrome', () => {
  test('the first sentence arrives early and chrome stays short', async ({ page }) => {
    await page.goto(LESSON);
    const contentsButton = page.getByRole('button', { name: /Otvori sadržaj/ });
    const singleColumn = await contentsButton.isVisible();

    const metrics = await page.evaluate(() => {
      const top = (el: Element | null) =>
        el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : null;
      const paragraphs = Array.from(document.querySelectorAll('article p')).filter(
        (p) => (p.textContent ?? '').trim().length > 80,
      );
      return {
        h1Top: top(document.querySelector('h1')),
        firstParagraphTop: top(paragraphs[0] ?? null),
        viewportH: window.innerHeight,
      };
    });

    if (singleColumn) {
      // Mobile: title and first paragraph both land on the first screen.
      expect(metrics.h1Top).not.toBeNull();
      expect(metrics.firstParagraphTop).not.toBeNull();
      expect(metrics.firstParagraphTop as number).toBeLessThan(metrics.viewportH * 0.75);
      // No breadcrumb trail and no tick row on phones; the era rides in the eyebrow.
      await expect(page.getByRole('navigation', { name: 'Putanja' })).toBeHidden();
      // The minutes are derived from the text (Phase 11), so only the shape is asserted.
      await expect(
        page.locator('article').getByText(/Praistorija i antika · \d+ min/),
      ).toBeVisible();
      // Sticky chrome (TopBar + context header) stays under a third of the screen.
      const chromeHeight = await page.evaluate(() => {
        const sticky = Array.from(document.querySelectorAll<HTMLElement>('header, div')).filter(
          (el) => {
            const cs = getComputedStyle(el);
            return (
              (cs.position === 'sticky' || cs.position === 'fixed') &&
              el.getBoundingClientRect().width > 200 &&
              el.getBoundingClientRect().height > 20
            );
          },
        );
        return sticky.reduce((acc, el) => acc + el.getBoundingClientRect().height, 0);
      });
      expect(chromeHeight).toBeLessThan(metrics.viewportH / 3);
    } else {
      // Desktop: the title sits high, under the breadcrumb trail, and the
      // first sentence near the middle of the fold — it was at y ≈ 614 before
      // the header lost its default margins (review 2026-10-03 item 6).
      expect(metrics.h1Top as number).toBeLessThan(320);
      expect(metrics.firstParagraphTop as number).toBeLessThan(500);
      await expect(page.getByRole('navigation', { name: 'Putanja' })).toBeVisible();
      // No era strip under the article any more (Phase 13 D5, 2026-09-30):
      // the outline beside it names the eras.
      await expect(page.getByRole('navigation', { name: 'Vremenska osa epoha' })).toHaveCount(0);
    }
  });

  test('trust line sits with the sources, not in the header', async ({ page }) => {
    await page.goto(LESSON);
    const trust = page.locator('article').getByText(/POSLEDNJI PREGLED/);
    await expect(trust).toBeVisible();
    const order = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      const sources = document.getElementById('lesson-sources-heading');
      const trust = Array.from(document.querySelectorAll('article p')).find((p) =>
        /POSLEDNJI PREGLED/.test(p.textContent ?? ''),
      );
      if (!h1 || !sources || !trust) return null;
      return {
        trustBelowSources: trust.getBoundingClientRect().top > sources.getBoundingClientRect().top,
        trustBelowTitle: trust.getBoundingClientRect().top > h1.getBoundingClientRect().top + 400,
      };
    });
    expect(order).toEqual({ trustBelowSources: true, trustBelowTitle: true });
  });

  test('previous / next keeps the outline where the reader left it', async ({ page }) => {
    // Phase 15 — the outline lives in the lesson layout, which survives
    // navigation between lessons. Desktop two-column layout only.
    await page.goto(`/course/${COURSE_ID}/lesson/day-040`);
    const contentsButton = page.getByRole('button', { name: /Otvori sadržaj/ });
    test.skip(await contentsButton.isVisible(), 'Single-column layout — the outline is a drawer');

    const outline = page.getByRole('navigation', { name: 'Sadržaj kursa' });
    const eraThree = outline.getByRole('button', { name: /EPOHA III / });
    await expect(eraThree).toHaveAttribute('aria-expanded', 'false');
    await eraThree.click();
    await expect(eraThree).toHaveAttribute('aria-expanded', 'true');

    await page
      .getByRole('navigation', { name: 'Prethodna i sledeća lekcija' })
      .getByRole('link')
      .last()
      .click();
    await expect(page).toHaveURL(/\/lesson\/day-041$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Doseljavanje Slovena');

    // What the reader opened by hand is still open, and the new lesson's row
    // is the current one and in view.
    await expect(eraThree).toHaveAttribute('aria-expanded', 'true');
    const current = outline.locator('a[aria-current="page"]');
    await expect(current).toContainText('041');
    await expect(current).toBeInViewport();
  });

  test('a lesson deep in the course opens with its row in view', async ({ page }) => {
    // Day 340 closes Era VII: six era rows and six section rows sit above its
    // row, so without the reveal it would open below the sidebar's fold.
    await page.goto(`/course/${COURSE_ID}/lesson/day-340`);
    const contentsButton = page.getByRole('button', { name: /Otvori sadržaj/ });
    test.skip(await contentsButton.isVisible(), 'Single-column layout — the drawer scrolls itself');

    const current = page
      .getByRole('navigation', { name: 'Sadržaj kursa' })
      .locator('a[aria-current="page"]');
    await expect(current).toContainText('340');
    await expect(current).toBeInViewport({ ratio: 1 });
    // The list scrolled, the page did not.
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test('on a wide window the reader shares the masthead frame', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Desktop frame');
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(LESSON);

    const frame = await page.evaluate(() => {
      const box = (el: Element | null) => el?.getBoundingClientRect() ?? null;
      const brand = box(document.querySelector('header a[href="/"]'));
      // The sidebar column (the `aside`), not the `nav` inside its scroller.
      const outline = box(
        document.querySelector('nav[aria-label="Sadržaj kursa"]')?.closest('aside') ?? null,
      );
      const article = box(document.querySelector('article'));
      if (!brand || !outline || !article) return null;
      return {
        brandLeft: Math.round(brand.left),
        outlineLeft: Math.round(outline.left),
        gutter: Math.round(article.left - outline.right),
        overflow: document.documentElement.scrollWidth - window.innerWidth,
      };
    });
    expect(frame).not.toBeNull();
    if (!frame) return;
    // 1920 − 1440 = 480: the frame starts 240 px in, the brand 40 px further.
    expect(frame.outlineLeft).toBeGreaterThanOrEqual(240);
    expect(frame.outlineLeft).toBeLessThanOrEqual(242);
    expect(frame.brandLeft - frame.outlineLeft).toBeLessThanOrEqual(40);
    expect(frame.gutter).toBeGreaterThanOrEqual(64);
    expect(frame.gutter).toBeLessThanOrEqual(80);
    expect(frame.overflow).toBeLessThanOrEqual(0);
  });

  test('after the next-lesson card, focus starts at the new lesson title', async ({ page }) => {
    await page.goto(LESSON);
    await page.getByRole('button', { name: /^Označi kao pročitano$/ }).click();
    await page.getByRole('link', { name: /Sledeća lekcija · DAN 002/ }).click();
    await expect(page).toHaveURL(/day-002$/);
    await expect(page.locator('#lesson-reader h1')).toBeFocused();
  });

  test('after a lesson chosen in the drawer, focus starts at the new lesson title', async ({
    page,
  }) => {
    await page.goto(LESSON);
    const contentsButton = page.getByRole('button', { name: /Otvori sadržaj/ });
    test.skip(!(await contentsButton.isVisible()), 'Desktop two-column layout — no drawer');
    await contentsButton.click();
    await page.getByRole('dialog', { name: 'Sadržaj kursa' }).locator('a[href$="day-002"]').click();
    await expect(page).toHaveURL(/day-002$/);
    await expect(page.locator('#lesson-reader h1')).toBeFocused();
  });

  test('the sticky header names the day once and the divider repeats nothing', async ({ page }) => {
    await page.goto(LESSON);
    const contentsButton = page.getByRole('button', { name: /Otvori sadržaj/ });
    test.skip(!(await contentsButton.isVisible()), 'Desktop two-column layout — no context header');

    // One counter with a denominator: the labelled progress. The day is bare.
    await expect(page.getByText('Dan 001', { exact: true })).toBeVisible();
    await expect(page.getByText(/Dan 001 \/ 365/)).toHaveCount(0);
    // A counter, not a live region (review 2026-10-03 item 7): it would
    // announce 0 → N on every load. Screen readers get the spelled-out count.
    const counter = page.locator('[class*="LessonContextHeader_metaRow"]');
    await expect(counter).toBeVisible();
    await expect(counter).toContainText(/Pročitano \d+ \/ 365/);
    await expect(counter.getByText(/^Pročitano \d+ od 365 lekcija$/)).toHaveCount(1);
    await expect(page.getByRole('status').filter({ hasText: /Pročitano/ })).toHaveCount(0);

    // ≤ 720 px the header divider is a plain rule: the date is said once, by
    // the eyebrow.
    const viewport = page.viewportSize();
    if (viewport !== null && viewport.width <= 720) {
      await expect(page.locator('[class*="LessonTimeline_markerLabel"]')).toBeHidden();
      await expect(page.locator('[class*="LessonTimeline_line"]')).toBeVisible();
    }
  });

  test('the drawer opens with the era rail and closes when a lesson is chosen', async ({
    page,
  }) => {
    await page.goto(LESSON);
    const contentsButton = page.getByRole('button', { name: /Otvori sadržaj/ });
    test.skip(!(await contentsButton.isVisible()), 'Desktop two-column layout — no drawer');

    await contentsButton.click();
    const drawer = page.getByRole('dialog', { name: 'Sadržaj kursa' });
    await expect(drawer).toBeVisible();

    // The rail: eight eras, the open lesson's era marked, above the outline.
    const rail = drawer.getByRole('navigation', { name: 'Vremenska osa epoha' });
    await expect(rail.getByRole('link')).toHaveCount(8);
    await expect(rail.locator('a[aria-current="true"]')).toContainText('Praistorija');
    const railAboveOutline = await drawer.evaluate((el) => {
      const railEl = el.querySelector('nav[aria-label="Vremenska osa epoha"]');
      const outlineEl = el.querySelector('nav[aria-label="Sadržaj kursa"]');
      return (
        !!railEl &&
        !!outlineEl &&
        railEl.getBoundingClientRect().bottom <= outlineEl.getBoundingClientRect().top
      );
    });
    expect(railAboveOutline).toBe(true);

    // Choosing a lesson navigates and closes the drawer — the shell that owns
    // it stays mounted, so it has to close itself.
    await drawer.getByRole('link', { name: /Život u Lepenskom Viru/ }).click();
    await expect(page).toHaveURL(/\/lesson\/day-002$/);
    await expect(drawer).toBeHidden();
    await expect(page.getByText('Dan 002', { exact: true })).toBeVisible();
  });

  test('sidebar / drawer era rows use the short era label', async ({ page }) => {
    await page.goto(LESSON);
    const contentsButton = page.getByRole('button', { name: /Otvori sadržaj/ });
    if (await contentsButton.isVisible()) await contentsButton.click();
    const outline = page.getByRole('navigation', { name: 'Sadržaj kursa' }).first();
    await expect(
      outline.getByRole('button', { name: /EPOHA I Praistorija i antika/ }),
    ).toBeVisible();
    await expect(outline.getByRole('button', { name: /doseljavanje Slovena/ })).toHaveCount(0);
  });

  test('the completion is spoken by one region that starts empty', async ({ page }) => {
    // Review 2026-10-03 item 7: the moment used to mount as an already
    // filled `role="status"`, and the counters announced 0 → N on load.
    await page.goto(LESSON, { waitUntil: 'networkidle' });
    const regions = page.locator('[role="status"]');
    await expect(regions).toHaveCount(1);
    const region = page.locator('article footer [role="status"]');
    await expect(region).toHaveText('');

    await page.getByRole('button', { name: /^Označi kao pročitano$/ }).click();
    await expect(region).toHaveText('Prvi dan je iza tebe. Pročitano 1 od 365.');
    // The visible moment is plain text, not a second region.
    await expect(regions).toHaveCount(1);

    await page.getByRole('button', { name: /^Pročitano$/ }).click();
    await expect(region).toHaveText('Lekcija više nije označena kao pročitana.');
  });

  test('a read lesson opened again says nothing on load', async ({ page }) => {
    await page.addInitScript(
      (value) => window.localStorage.setItem('learn365:progress:v1', value),
      JSON.stringify({
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
      }),
    );
    await page.goto(LESSON, { waitUntil: 'networkidle' });
    await expect(page.getByRole('button', { name: /^Pročitano$/ })).toBeVisible();
    await expect(page.locator('article footer [role="status"]')).toHaveText('');
  });

  test('the breadcrumb names the era and section without opening a lesson', async ({ page }) => {
    await page.goto(`/course/${COURSE_ID}/lesson/day-150`);
    const trail = page.getByRole('navigation', { name: 'Putanja' });
    test.skip(!(await trail.isVisible()), 'Single-column layout — no breadcrumb trail');
    // Home and the course are links; the era and section are plain text
    // (they used to open Day 106 / Day 139 — review 2026-10-03 item 18).
    await expect(trail.getByRole('link')).toHaveCount(2);
    await expect(trail.getByText('Despotovina', { exact: true })).toBeVisible();
    await expect(trail.getByText('Posle pada i nasleđe', { exact: true })).toBeVisible();
    await expect(trail.locator('[aria-current]')).toHaveCount(0);
  });

  test('the outline skip link lands on the title, and only where there is an outline', async ({
    page,
  }) => {
    await page.goto(LESSON, { waitUntil: 'networkidle' });
    const skip = page.getByRole('link', { name: 'Preskoči na tekst lekcije' });
    const contentsButton = page.getByRole('button', { name: /Otvori sadržaj/ });
    if (await contentsButton.isVisible()) {
      // Phones / tablets: no outline beside the article, nothing to skip.
      await expect(skip).toBeHidden();
      return;
    }
    await skip.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#lesson-reader h1')).toBeFocused();
  });

  test('an era the shell opened closes again when the lesson moves on', async ({ page }) => {
    await page.goto(`/course/${COURSE_ID}/lesson/day-045`, { waitUntil: 'networkidle' });
    const contentsButton = page.getByRole('button', { name: /Otvori sadržaj/ });
    test.skip(await contentsButton.isVisible(), 'Single-column layout — the outline is a drawer');

    const outline = page.getByRole('navigation', { name: 'Sadržaj kursa' });
    const eraOne = outline.getByRole('button', { name: /^EPOHA I / });
    const eraTwo = outline.getByRole('button', { name: /^EPOHA II / });
    await expect(eraOne).toHaveAttribute('aria-expanded', 'true');
    await expect(eraTwo).toHaveAttribute('aria-expanded', 'false');

    await page
      .getByRole('navigation', { name: 'Prethodna i sledeća lekcija' })
      .getByRole('link')
      .last()
      .click();
    await expect(page).toHaveURL(/\/lesson\/day-046$/);
    await expect(eraTwo).toHaveAttribute('aria-expanded', 'true');
    await expect(eraOne).toHaveAttribute('aria-expanded', 'false');
  });

  test('the contents trigger is a full touch target', async ({ page }) => {
    await page.goto(LESSON);
    const contentsButton = page.getByRole('button', { name: /Otvori sadržaj/ });
    test.skip(!(await contentsButton.isVisible()), 'Desktop two-column layout — no drawer');
    const box = await contentsButton.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  });

  test('a drawer closed by widening the window hands focus to the title', async ({ page }) => {
    await page.goto(LESSON, { waitUntil: 'networkidle' });
    const contentsButton = page.getByRole('button', { name: /Otvori sadržaj/ });
    test.skip(!(await contentsButton.isVisible()), 'Desktop two-column layout — no drawer');
    await contentsButton.click();
    await expect(page.getByRole('dialog', { name: 'Sadržaj kursa' })).toBeVisible();
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.getByRole('dialog', { name: 'Sadržaj kursa' })).toHaveCount(0);
    await expect(page.locator('#lesson-reader h1')).toBeFocused();
  });

  test('a portrait figure is capped in height and keeps its caption at its width', async ({
    page,
  }) => {
    // Day 231 carries the 1440×2141 era-6 portrait (review 2026-10-03 P2 9).
    await page.goto(`/course/${COURSE_ID}/lesson/day-231`);
    const figure = page.locator('article figure').first();
    const image = figure.locator('img');
    await image.scrollIntoViewIfNeeded();
    await expect(image).toHaveJSProperty('complete', true);
    const box = await image.boundingBox();
    const figureBox = await figure.boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    expect(figureBox).not.toBeNull();
    expect(viewport).not.toBeNull();
    if (!box || !figureBox || !viewport) return;
    expect(box.height).toBeLessThanOrEqual(Math.min(0.8 * viewport.height, 720) + 2);
    expect(Math.abs(box.width - figureBox.width)).toBeLessThanOrEqual(1);
  });
});
