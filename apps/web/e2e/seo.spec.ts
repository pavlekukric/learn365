import { expect, test } from '@playwright/test';

const COURSE_ID = 'istorija-srbije-365';
const ORIGIN = 'https://istorija365.com';

test.describe('Istorija 365 — SEO surface', () => {
  test('every public page declares its canonical URL on the production origin', async ({
    page,
  }) => {
    // Next strips the trailing slash from the root canonical.
    for (const path of [
      '/',
      `/course/${COURSE_ID}`,
      `/course/${COURSE_ID}/lesson/day-001`,
      '/o-aplikaciji',
    ]) {
      await page.goto(path);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        path === '/' ? ORIGIN : ORIGIN + path,
      );
    }
  });

  test('sitemap lists the course, all 365 lessons and no account page', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.ok()).toBe(true);
    const xml = await response.text();
    expect(xml).toContain(`<loc>${ORIGIN}/course/${COURSE_ID}</loc>`);
    expect(xml.match(/\/lesson\/day-\d{3}<\/loc>/g)).toHaveLength(365);
    expect(xml).not.toContain('/prijava');
    expect(xml).not.toContain('/nalog');
    // Every lesson carries the day its JSON last changed (lesson-dates.json).
    expect(xml.match(/\/lesson\/day-\d{3}<\/loc>\s*<lastmod>\d{4}-\d{2}-\d{2}/g)).toHaveLength(365);
  });

  test('a lesson is an article with a modified time, and its breadcrumb names real places', async ({
    page,
  }) => {
    await page.goto(`/course/${COURSE_ID}/lesson/day-001`);
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      'content',
      `${ORIGIN}/course/${COURSE_ID}/lesson/day-001`,
    );
    await expect(page.locator('meta[property="article:modified_time"]')).toHaveAttribute(
      'content',
      /^\d{4}-\d{2}-\d{2}/,
    );
    await expect(page.locator('meta[property="article:section"]')).toHaveCount(1);

    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const data = blocks.flatMap((text) => JSON.parse(text) as Record<string, unknown>[]);
    const article = data.find((d) => Array.isArray(d['@type']));
    expect(article?.['dateModified']).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const trail = data.find((d) => d['@type'] === 'BreadcrumbList') as
      | { itemListElement: { item: string }[] }
      | undefined;
    const items = trail?.itemListElement.map((i) => i.item) ?? [];
    expect(items).toHaveLength(5);
    // Day 1 used to list its own URL three times (era, section, lesson).
    expect(new Set(items).size).toBe(items.length);
    expect(items.filter((i) => i.includes('/lesson/'))).toEqual([
      `${ORIGIN}/course/${COURSE_ID}/lesson/day-001`,
    ]);
    // The era and section items are anchors that exist on the course overview.
    const anchors = items.filter((i) => i.includes('#')).map((i) => i.split('#')[1] ?? '');
    expect(anchors).toHaveLength(2);
    await page.goto(`/course/${COURSE_ID}`);
    for (const id of anchors) await expect(page.locator(`[id="${id}"]`)).toHaveCount(1);
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website');
  });

  test('noindex pages do not claim to be Home in their share preview', async ({ page }) => {
    for (const path of ['/stranica-koja-ne-postoji', '/prijava']) {
      await page.goto(path);
      await expect(page.locator('meta[property="og:url"]')).toHaveCount(0);
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    }
  });

  test('robots allows reading and keeps crawlers out of the API and account pages', async ({
    request,
  }) => {
    const response = await request.get('/robots.txt');
    expect(response.ok()).toBe(true);
    const text = await response.text();
    expect(text).toContain('Disallow: /api/');
    expect(text).toContain('Disallow: /prijava');
    expect(text).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`);
  });
});
