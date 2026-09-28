import { expect, test } from '@playwright/test';

const COURSE_ID = 'istorija-srbije-365';
const PROGRESS_KEY = 'learn365:progress:v1';

const STARTED_SEED = JSON.stringify({
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
});

test.describe('History 365 — first impression', () => {
  test('home explains the ritual to a first-time visitor, then retires the block', async ({
    page,
  }) => {
    await page.goto('/');
    const how = page.getByRole('region', { name: 'Tri koraka, tvojim tempom.' });
    await expect(how).toBeVisible();
    await expect(how.getByText('Otvori lekciju')).toBeVisible();
    await expect(how.getByText(/„Dan” je redni broj lekcije/)).toBeVisible();
    // The hero CTA still leads.
    await expect(page.getByRole('link', { name: /Započni kurs/ })).toBeVisible();

    // Once something is completed the block is gone — the daily anchor
    // takes its place.
    await page.addInitScript(({ key, value }) => window.localStorage.setItem(key, value), {
      key: PROGRESS_KEY,
      value: STARTED_SEED,
    });
    await page.goto('/');
    await expect(page.getByRole('region', { name: 'Tri koraka, tvojim tempom.' })).toHaveCount(0);
    await expect(page.getByText('Tvoj 2. dan')).toBeVisible();
  });

  test('pages carry share-preview metadata', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      /\/og\/istorija-srbije-365\.jpg$/,
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      /Istorija Srbije 365/,
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image',
    );
    // A shared lesson link names the day and the lesson.
    await page.goto(`/course/${COURSE_ID}/lesson/day-001`);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      /^Dan 1: Lepenski Vir/,
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      /\/og\/istorija-srbije-365\.jpg$/,
    );
  });

  test('about page carries the same how-it-works steps and no contradictory claims', async ({
    page,
  }) => {
    await page.goto('/o-aplikaciji');
    await expect(page.getByRole('heading', { level: 2, name: 'Kako funkcioniše' })).toBeVisible();
    await expect(page.getByText('Sutra nastavi gde si stao')).toBeVisible();
    await expect(page.getByText(/Ne navodimo bibliografiju/)).toHaveCount(0);
    await expect(page.getByText(/u fazi izgradnje kursa/)).toHaveCount(0);
    await expect(page.getByText(/Premium/)).toHaveCount(0);
    // No invented editorial team, and a contact address on the production domain.
    await expect(page.getByText(/Tim History 365/)).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'kontakt@istorija365.com' })).toHaveAttribute(
      'href',
      'mailto:kontakt@istorija365.com',
    );
  });
});
