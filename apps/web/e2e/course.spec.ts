import { expect, test } from '@playwright/test';

const COURSE_ID = 'istorija-srbije-365';

test.describe('Istorija 365 — course overview', () => {
  test('era card: the card opens its sections, the one link opens the right lesson', async ({
    page,
  }) => {
    // The whole outline is in the server HTML now; wait for hydration before
    // clicking, or the click lands on a button React has not wired yet.
    await page.goto(`/course/${COURSE_ID}`, { waitUntil: 'networkidle' });
    const card = page.getByRole('button', {
      name: 'EPOHA I Praistorija, antika i doseljavanje Slovena',
    });
    await expect(card).toHaveAttribute('aria-expanded', 'false');
    await card.click();
    await expect(card).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('button', { name: /Praistorija Podunavlja/ })).toBeVisible();
    // No stray standalone "Pokaži odeljke" button outside the cards.
    await expect(page.getByRole('button', { name: /^Pokaži odeljke/ })).toHaveCount(0);
    // The explicit action opens Day 1 for a fresh user.
    await expect(
      page.getByRole('link', { name: 'Počni: Praistorija, antika i doseljavanje Slovena' }),
    ).toHaveAttribute('href', `/course/${COURSE_ID}/lesson/day-001`);
  });

  test('era action resumes at the first unread lesson once the era has progress', async ({
    page,
  }) => {
    const seed = JSON.stringify({
      state: {
        byCourse: {
          [COURSE_ID]: {
            completedLessonIds: ['day-001', 'day-002'],
            lastOpenedLessonId: 'day-002',
            updatedAt: '2026-05-19T09:00:00.000Z',
          },
        },
      },
      version: 1,
    });
    await page.addInitScript(({ key, value }) => window.localStorage.setItem(key, value), {
      key: 'learn365:progress:v1',
      value: seed,
    });
    await page.goto(`/course/${COURSE_ID}`);
    await expect(
      page.getByRole('link', { name: 'Nastavi: Praistorija, antika i doseljavanje Slovena' }),
    ).toHaveAttribute('href', `/course/${COURSE_ID}/lesson/day-003`);
  });

  test('phones: the era label stacks above the title and the text takes the full width', async ({
    page,
  }) => {
    // Review 2026-10-03 item 8: beside `EPOHA I` each description was
    // squeezed into a ~230 px column.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/course/${COURSE_ID}`, { waitUntil: 'networkidle' });
    const card = page.getByRole('button', {
      name: 'EPOHA I Praistorija, antika i doseljavanje Slovena',
    });
    const box = async (selector: string) => {
      const b = await card.locator(selector).boundingBox();
      expect(b).not.toBeNull();
      return b ?? { x: 0, y: 0, width: 0, height: 0 };
    };
    const num = await box('[id$="-num"]');
    const title = await box('[id$="-title"]');
    const desc = await box('[id$="-desc"]');
    const toggle = (await card.boundingBox()) ?? { x: 0, y: 0, width: 0, height: 0 };
    expect(num.y + num.height).toBeLessThanOrEqual(title.y + 1);
    expect(Math.abs(num.x - title.x)).toBeLessThanOrEqual(1);
    // The description spans the card's content box, not a column beside the label.
    expect(Math.abs(desc.x - toggle.x)).toBeLessThanOrEqual(1);
    expect(desc.width).toBeGreaterThan(toggle.width - 2);
  });

  test('bookmark toggle is labelled on desktop and explains where saved lessons live', async ({
    page,
  }) => {
    await page.goto(`/course/${COURSE_ID}/lesson/day-001`);
    const toggle = page.getByRole('button', { name: 'Sačuvaj lekciju' });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('title', /strani kursa/);
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    // One name in both states (WCAG 2.5.3); aria-pressed carries the state.
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: 'Sačuvaj lekciju' })).toBeVisible();
  });
});
