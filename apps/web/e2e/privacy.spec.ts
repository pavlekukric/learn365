import { expect, test } from '@playwright/test';

/**
 * The privacy page and the Content-Security-Policy tell one story: the only
 * foreign script this site lets a browser run is Cloudflare Web Analytics,
 * and `/privatnost` says that visits are counted. Change one, change both.
 */
const STATISTICS_ORIGIN = 'https://static.cloudflareinsights.com';

test.describe('History 365 — privacy and what the page may load', () => {
  test('the policy allows the visit-statistics script and no other foreign script', async ({
    request,
  }) => {
    const response = await request.get('/');
    const csp = response.headers()['content-security-policy'] ?? '';
    const scriptSrc = csp
      .split(';')
      .map((directive) => directive.trim())
      .find((directive) => directive.startsWith('script-src '));
    expect(scriptSrc).toBeDefined();
    const foreign = (scriptSrc ?? '')
      .split(/\s+/)
      .slice(1)
      .filter((source) => source.startsWith('http'));
    expect(foreign).toEqual([STATISTICS_ORIGIN]);
    // The beacon reports to this origin (`/cdn-cgi/rum`): nothing foreign to connect to.
    expect(csp).toContain("connect-src 'self'");
    expect(csp).not.toMatch(/connect-src[^;]*https?:/);
  });

  test('/privatnost says that visits are counted, and how', async ({ page }) => {
    await page.goto('/privatnost');
    await expect(page.getByRole('heading', { level: 2, name: 'Statistika poseta' })).toBeVisible();
    const section = page.locator('section[aria-labelledby="statistika"]');
    await expect(section).toContainText('Cloudflare Web Analytics');
    await expect(section).toContainText('bez kolačića');
    // The sentence that was true before statistics were allowed is gone.
    await expect(page.getByText(/Nemamo analitiku/)).toHaveCount(0);
    await expect(page.getByText(/ništa ne napušta tvoj pregledač/)).toHaveCount(0);
  });
});
