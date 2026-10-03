import { beforeEach, describe, expect, it } from 'vitest';

import { BOOKMARKS_STORAGE_KEY, createBookmarkStore, type BookmarkStorage } from './index.js';

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

  raw(key: string): string | null {
    return this.getItem(key);
  }
}

const fixedNow = () => '2026-05-19T10:00:00.000Z';

describe('bookmark store', () => {
  let storage: InMemoryStorage;

  beforeEach(() => {
    storage = new InMemoryStorage();
  });

  it('starts with an empty byCourse map', () => {
    const store = createBookmarkStore({ storage, now: fixedNow });
    expect(store.getState().byCourse).toEqual({});
  });

  it('toggleBookmark adds and removes lessons', () => {
    const store = createBookmarkStore({ storage, now: fixedNow });
    store.getState().toggleBookmark('istorija-srbije-365', 'nemanjici-rani-001');
    expect(
      store.getState().byCourse['istorija-srbije-365']?.lessonIds.has('nemanjici-rani-001'),
    ).toBe(true);

    store.getState().toggleBookmark('istorija-srbije-365', 'nemanjici-rani-001');
    expect(
      store.getState().byCourse['istorija-srbije-365']?.lessonIds.has('nemanjici-rani-001'),
    ).toBe(false);
  });

  it('preserves insertion order across multiple toggles', () => {
    const store = createBookmarkStore({ storage, now: fixedNow });
    store.getState().toggleBookmark('istorija-srbije-365', 'a');
    store.getState().toggleBookmark('istorija-srbije-365', 'b');
    store.getState().toggleBookmark('istorija-srbije-365', 'c');
    const ids = Array.from(store.getState().byCourse['istorija-srbije-365']?.lessonIds ?? []);
    expect(ids).toEqual(['a', 'b', 'c']);
  });

  it('clearCourse drops a single course without touching others', () => {
    const store = createBookmarkStore({ storage, now: fixedNow });
    store.getState().toggleBookmark('istorija-srbije-365', 'a');
    store.getState().toggleBookmark('drugi-kurs', 'b');
    store.getState().clearCourse('istorija-srbije-365');
    expect(store.getState().byCourse['istorija-srbije-365']).toBeUndefined();
    expect(store.getState().byCourse['drugi-kurs']?.lessonIds.has('b')).toBe(true);
  });

  it('persists Set<LessonId> as a JSON array', () => {
    const store = createBookmarkStore({ storage, now: fixedNow });
    store.getState().toggleBookmark('istorija-srbije-365', 'a');
    store.getState().toggleBookmark('istorija-srbije-365', 'b');

    const raw = storage.raw(BOOKMARKS_STORAGE_KEY);
    expect(raw).not.toBeNull();
    if (raw === null) return;
    const parsed = JSON.parse(raw) as {
      state: { byCourse: Record<string, { lessonIds: string[] }> };
    };
    const stored = parsed.state.byCourse['istorija-srbije-365']?.lessonIds;
    expect(Array.isArray(stored)).toBe(true);
    expect(new Set(stored)).toEqual(new Set(['a', 'b']));
  });

  it('rehydrates persisted arrays back into Sets', async () => {
    const first = createBookmarkStore({ storage, now: fixedNow });
    first.getState().toggleBookmark('istorija-srbije-365', 'a');
    first.getState().toggleBookmark('istorija-srbije-365', 'b');

    const rehydrated = createBookmarkStore({ storage, now: fixedNow });
    type PersistedStore = ReturnType<typeof createBookmarkStore> & {
      persist?: { rehydrate?: () => Promise<void> | void };
    };
    await (rehydrated as PersistedStore).persist?.rehydrate?.();
    const set = rehydrated.getState().byCourse['istorija-srbije-365']?.lessonIds;
    expect(set).toBeInstanceOf(Set);
    expect(set?.has('a')).toBe(true);
    expect(set?.has('b')).toBe(true);
  });
});
