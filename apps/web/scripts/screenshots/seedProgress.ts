import type { Page } from '@playwright/test';

/**
 * Seeds the Zustand `progress` store via localStorage before the page boots,
 * so screenshots can capture "with progress" states deterministically.
 *
 * Key shape mirrors `@learn365/core` (`store.ts`): `learn365:progress:v1`,
 * persisted with `{ state: { byCourse }, version }`. `completedLessonIds`
 * persists as an array on disk and is revived to a Set on hydration.
 */

const STORAGE_KEY = 'learn365:progress:v1';
const SCHEMA_VERSION = 1;

export interface SeedOptions {
  readonly courseId: string;
  readonly completedLessonIds: readonly string[];
  readonly lastOpenedLessonId?: string | null;
}

export async function seedProgress(page: Page, opts: SeedOptions): Promise<void> {
  const payload = {
    state: {
      byCourse: {
        [opts.courseId]: {
          completedLessonIds: [...opts.completedLessonIds],
          lastOpenedLessonId: opts.lastOpenedLessonId ?? null,
          updatedAt: '2026-05-17T09:00:00.000Z',
        },
      },
    },
    version: SCHEMA_VERSION,
  };

  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, value);
    },
    { key: STORAGE_KEY, value: JSON.stringify(payload) },
  );
}

export async function clearProgress(page: Page): Promise<void> {
  await page.addInitScript((key) => {
    window.localStorage.removeItem(key);
  }, STORAGE_KEY);
}
