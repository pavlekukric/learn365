import { beforeEach, describe, expect, it } from 'vitest';

import {
  DEFAULT_STORAGE_KEY,
  createProgressStore,
  type ProgressStorage,
} from './index.js';

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

const fixedNow = () => '2026-05-13T10:00:00.000Z';

describe('progress store', () => {
  let storage: InMemoryStorage;

  beforeEach(() => {
    storage = new InMemoryStorage();
  });

  it('starts with an empty byCourse map', () => {
    const store = createProgressStore({ storage, now: fixedNow });
    expect(store.getState().byCourse).toEqual({});
  });

  it('toggleComplete adds and removes lessons', () => {
    const store = createProgressStore({ storage, now: fixedNow });
    store.getState().toggleComplete('istorija-srbije-365', 'nemanjici-rani-001');
    expect(
      store.getState().byCourse['istorija-srbije-365']?.completedLessonIds.has(
        'nemanjici-rani-001',
      ),
    ).toBe(true);

    store.getState().toggleComplete('istorija-srbije-365', 'nemanjici-rani-001');
    expect(
      store.getState().byCourse['istorija-srbije-365']?.completedLessonIds.has(
        'nemanjici-rani-001',
      ),
    ).toBe(false);
  });

  it('markOpened updates lastOpenedLessonId once per change', () => {
    const store = createProgressStore({ storage, now: fixedNow });
    store.getState().markOpened('istorija-srbije-365', 'praistorija-001');
    expect(
      store.getState().byCourse['istorija-srbije-365']?.lastOpenedLessonId,
    ).toBe('praistorija-001');

    const before = store.getState().byCourse;
    store.getState().markOpened('istorija-srbije-365', 'praistorija-001');
    expect(store.getState().byCourse).toBe(before);
  });

  it('resetCourse drops a single course without touching others', () => {
    const store = createProgressStore({ storage, now: fixedNow });
    store.getState().toggleComplete('istorija-srbije-365', 'a');
    store.getState().toggleComplete('drugi-kurs', 'b');
    store.getState().resetCourse('istorija-srbije-365');
    expect(store.getState().byCourse['istorija-srbije-365']).toBeUndefined();
    expect(store.getState().byCourse['drugi-kurs']?.completedLessonIds.has('b')).toBe(
      true,
    );
  });

  it('persists Set<LessonId> as a JSON array', () => {
    const store = createProgressStore({ storage, now: fixedNow });
    store.getState().toggleComplete('istorija-srbije-365', 'a');
    store.getState().toggleComplete('istorija-srbije-365', 'b');

    const raw = storage.raw(DEFAULT_STORAGE_KEY);
    expect(raw).not.toBeNull();
    if (raw === null) return;
    const parsed = JSON.parse(raw) as {
      state: { byCourse: Record<string, { completedLessonIds: string[] }> };
    };
    const stored = parsed.state.byCourse['istorija-srbije-365']?.completedLessonIds;
    expect(Array.isArray(stored)).toBe(true);
    expect(new Set(stored)).toEqual(new Set(['a', 'b']));
  });

  it('rehydrates persisted arrays back into Sets', async () => {
    const first = createProgressStore({ storage, now: fixedNow });
    first.getState().toggleComplete('istorija-srbije-365', 'a');
    first.getState().toggleComplete('istorija-srbije-365', 'b');

    const rehydrated = createProgressStore({ storage, now: fixedNow });
    // zustand persist rehydration is sync when storage is sync, but the
    // store API resolves on next microtask in some cases — await it.
    type PersistedStore = ReturnType<typeof createProgressStore> & {
      persist?: { rehydrate?: () => Promise<void> | void };
    };
    await (rehydrated as PersistedStore).persist?.rehydrate?.();
    const set = rehydrated.getState().byCourse['istorija-srbije-365']?.completedLessonIds;
    expect(set).toBeInstanceOf(Set);
    expect(set?.has('a')).toBe(true);
    expect(set?.has('b')).toBe(true);
  });
});
