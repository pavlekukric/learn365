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
      await expect(page.getByRole('navigation', { name: 'Breadcrumbs' })).toBeHidden();
      // The minutes are derived from the text (Phase 11), so only the shape is asserted.
      await expect(page.locator('article').getByText(/Praistorija i antika · \d+ min/)).toBeVisible();
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
      // Desktop: the title sits high — the era strip no longer precedes it.
      expect(metrics.h1Top as number).toBeLessThan(320);
      await expect(page.getByRole('navigation', { name: 'Breadcrumbs' })).toBeVisible();
      const strip = page.getByRole('navigation', { name: 'Vremenska osa epoha' });
      await expect(strip).toBeVisible();
      const stripAboveTitle = await page.evaluate(() => {
        const strip = document.querySelector('nav[aria-label="Vremenska osa epoha"]');
        const h1 = document.querySelector('h1');
        return (
          !!strip && !!h1 && strip.getBoundingClientRect().top < h1.getBoundingClientRect().top
        );
      });
      expect(stripAboveTitle).toBe(false);
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
      const outline = box(document.querySelector('nav[aria-label="Sadržaj kursa"]')?.closest('aside') ?? null);
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

  test('the sticky header names the day once and the divider repeats nothing', async ({
    page,
  }) => {
    await page.goto(LESSON);
    const contentsButton = page.getByRole('button', { name: /Otvori sadržaj/ });
    test.skip(!(await contentsButton.isVisible()), 'Desktop two-column layout — no context header');

    // One counter with a denominator: the labelled progress. The day is bare.
    await expect(page.getByText('Dan 001', { exact: true })).toBeVisible();
    await expect(page.getByText(/Dan 001 \/ 365/)).toHaveCount(0);
    await expect(page.getByRole('status').filter({ hasText: /Pročitano \d+ \/ 365/ })).toBeVisible();

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
});
