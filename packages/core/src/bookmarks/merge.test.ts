import { describe, expect, it } from 'vitest';

import { EMPTY_BOOKMARKS_SNAPSHOT, mergeCourseBookmarks, toBookmarksSnapshot } from './merge.js';
import { createBookmarkStore, type BookmarkStorage } from './index.js';

const T1 = '2026-09-01T10:00:00.000Z';
const T2 = '2026-09-02T10:00:00.000Z';

class InMemoryStorage implements BookmarkStorage {
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
}

describe('bookmarks merge', () => {
  it('flattens and unions with the later timestamp', () => {
    expect(toBookmarksSnapshot({ lessonIds: new Set(['day-002']), updatedAt: T1 })).toEqual({
      lessonIds: ['day-002'],
      updatedAt: T1,
    });
    expect(toBookmarksSnapshot(undefined)).toBe(EMPTY_BOOKMARKS_SNAPSHOT);
    expect(
      mergeCourseBookmarks(
        { lessonIds: ['day-009', 'day-001'], updatedAt: T2 },
        { lessonIds: ['day-001', 'day-004'], updatedAt: T1 },
      ),
    ).toEqual({ lessonIds: ['day-001', 'day-004', 'day-009'], updatedAt: T2 });
  });

  it('replaceCourseBookmarks overwrites one course wholesale', () => {
    const store = createBookmarkStore({ storage: new InMemoryStorage(), now: () => T1 });
    store.getState().toggleBookmark('c', 'day-050');
    store.getState().replaceCourseBookmarks('c', { lessonIds: ['day-001'], updatedAt: T2 });
    expect(store.getState().byCourse['c']).toEqual({ lessonIds: new Set(['day-001']), updatedAt: T2 });
  });
});
