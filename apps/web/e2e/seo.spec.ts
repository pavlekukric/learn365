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
