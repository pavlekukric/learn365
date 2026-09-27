import { describe, expect, it } from 'vitest';

import { createBookmarkStore, type BookmarkStorage } from '@learn365/core';

import {
  createBookmarkAdapter,
  mergeBookmarksDelta,
  parseBookmarksWire,
  withPendingBookmarks,
  type BookmarksDelta,
} from './bookmarkAdapter';
import { memoryMarker } from './marker';

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

const COURSE = 'istorija-srbije-365';
const T = '2026-09-27T10:00:00.000Z';

function setup() {
  const store = createBookmarkStore({ storage: new InMemoryStorage(), now: () => T });
  const adapter = createBookmarkAdapter(store, memoryMarker());
  const deltas: { courseId: string; delta: BookmarksDelta }[] = [];
  adapter.subscribe((courseId, delta) => deltas.push({ courseId, delta }));
  return { store, adapter, deltas };
}

describe('bookmark adapter', () => {
  it('reports saves, removals and a cleared course as deltas', () => {
    const { store, deltas } = setup();
    store.getState().toggleBookmark(COURSE, 'day-001');
    store.getState().toggleBookmark(COURSE, 'day-002');
    store.getState().toggleBookmark(COURSE, 'day-001');
    store.getState().clearCourse(COURSE);
    expect(deltas).toEqual([
      { courseId: COURSE, delta: { add: new Set(['day-001']), remove: new Set() } },
      { courseId: COURSE, delta: { add: new Set(['day-002']), remove: new Set() } },
      { courseId: COURSE, delta: { add: new Set(), remove: new Set(['day-001']) } },
      { courseId: COURSE, delta: { add: new Set(), remove: new Set(['day-002']) } },
    ]);
  });

  it('reads local, applies remote with pending on top, serialises deltas', () => {
    const { store, adapter } = setup();
    store.getState().toggleBookmark(COURSE, 'day-007');
    expect(adapter.readLocal(COURSE)).toEqual({ lessonIds: ['day-007'], updatedAt: T });

    adapter.applyRemote(
      COURSE,
      { courseId: COURSE, lessonIds: ['day-001', 'day-002'], updatedAt: T },
      { add: new Set(['day-009']), remove: new Set(['day-002']) },
    );
    expect(store.getState().byCourse[COURSE]?.lessonIds).toEqual(new Set(['day-001', 'day-009']));
    expect(() => adapter.applyRemote(COURSE, { lessonIds: 'x' }, undefined)).toThrow();

    expect(adapter.serializeDelta(COURSE, { add: new Set(['a']), remove: new Set(['b']) })).toEqual({
      courseId: COURSE,
      add: ['a'],
      remove: ['b'],
    });
  });

  it('merges deltas newest-wins and validates wire payloads', () => {
    expect(
      mergeBookmarksDelta(
        { add: new Set(['a', 'b']), remove: new Set(['c']) },
        { add: new Set(['c']), remove: new Set(['a']) },
      ),
    ).toEqual({ add: new Set(['b', 'c']), remove: new Set(['a']) });
    expect(withPendingBookmarks({ lessonIds: ['a'], updatedAt: T }, { add: new Set(['b']), remove: new Set(['a']) })).toEqual({
      lessonIds: ['b'],
      updatedAt: T,
    });
    expect(parseBookmarksWire({ lessonIds: ['a'], updatedAt: T })).toEqual({ lessonIds: ['a'], updatedAt: T });
    expect(parseBookmarksWire({ lessonIds: [1], updatedAt: T })).toBeNull();
    expect(parseBookmarksWire({ lessonIds: [], updatedAt: 3 })).toBeNull();
  });
});
