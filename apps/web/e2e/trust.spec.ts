import { expect, test } from '@playwright/test';

/**
 * The trust layer (review 2026-10-03 P1 4): one truthful line under every
 * lesson, the „Literatura i provera" page it links to, and the error report
 * that only exists when `NEXT_PUBLIC_REPORT_EMAIL` is set — the e2e build
 * leaves it unset, so here the link must be absent.
 */
const COURSE_ID = 'istorija-srbije-365';
const READING_LIST = `/course/${COURSE_ID}/literatura`;

test.describe('Istorija 365 — trust layer', () => {
  test('every lesson closes with the check note and a link to its era’s reading list', async ({
    page,
  }) => {
    // Day 150: no `Izvori` block, era III — the note does not depend on sources.
    await page.goto(`/course/${COURSE_ID}/lesson/day-150`);
    const note = page.getByTestId('lesson-trust-note');
    await expect(note).toBeVisible();
    await expect(note).toContainText('Pripremljeno uz AI, uređeno ručno');
    await expect(note).toContainText('septembru i oktobru 2026');
    // The stale 19.05.2026 date is gone, and no reviewer is named.
    await expect(page.locator('article')).not.toContainText('POSLEDNJI PREGLED');
    await expect(page.locator('article')).not.toContainText('PREGLEDAO');

    const readingList = note.getByRole('link', { name: 'Literatura i provera' });
    await expect(readingList).toHaveAttribute(
      'href',
      `${READING_LIST}#era-knez-lazar-i-despotovina`,
    );
    await readingList.click();
    await expect(page).toHaveURL(new RegExp(`${READING_LIST}#era-knez-lazar-i-despotovina$`));
    await expect(
      page.getByRole('heading', { level: 2, name: 'Posle Nemanjića: knez Lazar i Despotovina' }),
    ).toBeInViewport();
  });

  test('without NEXT_PUBLIC_REPORT_EMAIL there is no „Prijavi grešku” link', async ({ page }) => {
    await page.goto(`/course/${COURSE_ID}/lesson/day-001`);
    await expect(page.getByTestId('lesson-trust-note')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Prijavi grešku' })).toHaveCount(0);
    await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
  });

  test('the reading list states the method and lists all eight eras', async ({ page }) => {
    await page.goto(READING_LIST);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Kako su proverene činjenice');
    await expect(
      page.getByRole('heading', { level: 2, name: 'Kako je tekst proveren' }),
    ).toBeVisible();
    await expect(page.getByText(/To nije recenzija istoričara/)).toBeVisible();

    const contents = page.getByRole('navigation', { name: 'Po epohama' });
    await expect(contents.getByRole('link')).toHaveCount(8);
    await expect(page.locator('section[id^="era-"]')).toHaveCount(8);
    // Every era names at least one work.
    for (const section of await page.locator('section[id^="era-"]').all()) {
      expect(await section.locator('li').count()).toBeGreaterThan(0);
    }
  });

  test('About links the reading list and no longer calls it „u pripremi”', async ({ page }) => {
    await page.goto('/o-aplikaciji');
    await expect(page.locator('main')).not.toContainText('u pripremi');
    await page.getByRole('link', { name: 'Literatura i provera, po epohama' }).click();
    await expect(page).toHaveURL(new RegExp(`${READING_LIST}$`));
  });
});
