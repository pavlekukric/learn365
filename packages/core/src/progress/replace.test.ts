import { describe, expect, it } from 'vitest';

import { createProgressStore, type ProgressStorage } from './index.js';

class InMemoryStorage implements ProgressStorage {
  private readonly data = new Map<string, string>();
  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
  raw(key: string): string | null {
    return this.getItem(key);
  }
}

const COURSE = 'istorija-srbije-365';
const fixedNow = () => '2026-09-27T10:00:00.000Z';

describe('replaceCourseProgress', () => {
  it('overwrites a course with the snapshot, keeping other courses', () => {
    const storage = new InMemoryStorage();
    const store = createProgressStore({ storage, now: fixedNow });
    store.getState().toggleComplete(COURSE, 'day-050');
    store.getState().toggleComplete('other-course', 'x-001');

    store.getState().replaceCourseProgress(COURSE, {
      completedLessonIds: ['day-001', 'day-002'],
      lastOpenedLessonId: 'day-003',
      updatedAt: '2026-09-20T00:00:00.000Z',
    });

    const course = store.getState().byCourse[COURSE];
    expect(course?.completedLessonIds).toEqual(new Set(['day-001', 'day-002']));
    expect(course?.completedLessonIds.has('day-050')).toBe(false);
    expect(course?.lastOpenedLessonId).toBe('day-003');
    expect(course?.updatedAt).toBe('2026-09-20T00:00:00.000Z');
    expect(store.getState().byCourse['other-course']?.completedLessonIds.has('x-001')).toBe(true);
  });

  it('persists the replaced snapshot as arrays', () => {
    const storage = new InMemoryStorage();
    const store = createProgressStore({ storage, now: fixedNow });
    store.getState().replaceCourseProgress(COURSE, {
      completedLessonIds: ['day-007'],
      lastOpenedLessonId: null,
      updatedAt: fixedNow(),
    });
    const persisted = JSON.parse(storage.raw('learn365:progress:v1') ?? '{}') as {
      state: { byCourse: Record<string, { completedLessonIds: string[] }> };
    };
    expect(persisted.state.byCourse[COURSE]?.completedLessonIds).toEqual(['day-007']);
  });
});
