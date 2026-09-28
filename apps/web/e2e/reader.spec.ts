import { expect, test } from '@playwright/test';

const COURSE_ID = 'istorija-srbije-365';
const LESSON = `/course/${COURSE_ID}/lesson/day-001`;

test.describe('History 365 — reader chrome', () => {
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
