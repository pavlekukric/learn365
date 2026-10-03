import { afterEach, describe, expect, it } from 'vitest';

import { createProgressStore, DEFAULT_STORAGE_KEY } from '@learn365/core';

import { bookmarksDeltaCodec, subtractBookmarksDelta } from './bookmarkAdapter';
import { memoryMarker } from './marker';
import { createPendingQueue, pendingQueueKeys, type QueueStorage } from './pendingQueue';
import {
  createProgressAdapter,
  progressDeltaCodec,
  subtractProgressDelta,
  type ProgressDelta,
} from './progressAdapter';
import { createStoreSync, followOtherTabs } from './storeSync';
import { TAB_ID } from './tabLock';

const COURSE = 'istorija-srbije-365';

function memoryStorage(): QueueStorage & Storage {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
    clear: () => {
      data.clear();
    },
    key: (index) => [...data.keys()][index] ?? null,
    get length() {
      return data.size;
    },
  };
}

const delta = (
  complete: string[],
  uncomplete: string[] = [],
  lastOpened?: string | null,
): ProgressDelta =>
  lastOpened === undefined
    ? { complete: new Set(complete), uncomplete: new Set(uncomplete) }
    : { complete: new Set(complete), uncomplete: new Set(uncomplete), lastOpened };

describe('delta subtraction (ack)', () => {
  it('keeps what changed after the send', () => {
    expect(subtractProgressDelta(delta(['a', 'b'], [], 'b'), delta(['a'], [], 'a'))).toEqual(
      delta(['b'], [], 'b'),
    );
    // Sent "complete a", then the reader un-read it: the un-read stays.
    expect(subtractProgressDelta(delta([], ['a']), delta(['a']))).toEqual(delta([], ['a']));
    expect(
      progressDeltaCodec.isEmpty(
        subtractProgressDelta(delta(['a'], [], null), delta(['a'], [], null)),
      ),
    ).toBe(true);
    expect(
      subtractBookmarksDelta(
        { add: new Set(['x', 'y']), remove: new Set() },
        { add: new Set(['x']), remove: new Set() },
      ),
    ).toEqual({ add: new Set(['y']), remove: new Set() });
  });

  it('round-trips through JSON and rejects junk', () => {
    const value = delta(['a'], ['b'], null);
    expect(
      progressDeltaCodec.fromJSON(JSON.parse(JSON.stringify(progressDeltaCodec.toJSON(value)))),
    ).toEqual(value);
    expect(progressDeltaCodec.fromJSON({ complete: [1] })).toBeNull();
    expect(bookmarksDeltaCodec.fromJSON({ add: ['x'], remove: [] })).toEqual({
      add: new Set(['x']),
      remove: new Set(),
    });
  });
});

describe('pending queue', () => {
  it('merges per course, acks exactly what was sent, and lists its keys', () => {
    const storage = memoryStorage();
    const queue = createPendingQueue('progress', progressDeltaCodec, () => storage);
    queue.add('u1', COURSE, delta(['a']));
    queue.add('u1', COURSE, delta(['b']));
    queue.add('u2', COURSE, delta(['z']));
    expect(queue.read('u1').get(COURSE)).toEqual(delta(['a', 'b']));
    queue.ack('u1', COURSE, delta(['a']));
    expect(queue.read('u1').get(COURSE)).toEqual(delta(['b']));
    queue.ack('u1', COURSE, delta(['b']));
    expect(queue.read('u1').size).toBe(0);
    expect(pendingQueueKeys(storage)).toEqual([`learn365:cloud:pending:v1:progress:u2:${TAB_ID}`]);
    queue.clearOthers('u1');
    expect(pendingQueueKeys(storage)).toEqual([]);
  });

  it('one key per tab: two tabs never write the same key; orphans are adopted', () => {
    const storage = memoryStorage();
    const a = createPendingQueue('progress', progressDeltaCodec, () => storage, 'tab-a');
    const b = createPendingQueue('progress', progressDeltaCodec, () => storage, 'tab-b');
    a.add('u1', COURSE, delta(['a']));
    b.add('u1', COURSE, delta(['b']));
    a.ack('u1', COURSE, delta(['a']));
    expect(b.read('u1').get(COURSE)).toEqual(delta(['b']));
    a.add('u1', COURSE, delta(['c']));
    expect(b.readAll('u1').get(COURSE)).toEqual(delta(['b', 'c']));
    b.adoptOrphans('u1', new Set(['tab-a', 'tab-b']));
    expect(b.read('u1').get(COURSE)).toEqual(delta(['b']));
    b.adoptOrphans('u1', new Set(['tab-b'])); // tab A closed
    expect(b.read('u1').get(COURSE)).toEqual(delta(['c', 'b']));
    expect(pendingQueueKeys(storage)).toEqual(['learn365:cloud:pending:v1:progress:u1:tab-b']);
  });

  it('keeps working in memory when storage refuses writes', () => {
    const storage = memoryStorage();
    storage.setItem = () => {
      throw new Error('quota');
    };
    const queue = createPendingQueue('progress', progressDeltaCodec, () => storage);
    queue.add('u1', COURSE, delta(['a']));
    expect(queue.read('u1').get(COURSE)).toEqual(delta(['a']));
  });
});

describe('journal + other tabs', () => {
  const realWindow = (globalThis as { window?: unknown }).window;
  afterEach(() => {
    (globalThis as { window?: unknown }).window = realWindow;
  });

  function tab(storage: Storage, marker = memoryMarker('u1')) {
    const store = createProgressStore({ storage });
    const sync = createStoreSync(
      'progress',
      createProgressAdapter(store, marker),
      progressDeltaCodec,
    );
    return { store, sync };
  }

  it('queues a reader change for the marker account, and nothing for applied snapshots', () => {
    const storage = memoryStorage();
    const { store, sync } = tab(storage);
    const queue = createPendingQueue('progress', progressDeltaCodec, () => window.localStorage);
    (globalThis as { window?: unknown }).window = { localStorage: storage };
    store.getState().toggleComplete(COURSE, 'day-001');
    expect(queue.read('u1').get(COURSE)?.complete).toEqual(new Set(['day-001']));
    sync.journal.external(() => {
      store.getState().resetCourse(COURSE);
    });
    expect(queue.read('u1').get(COURSE)?.uncomplete.size).toBe(0);
  });

  it('a write in another tab rehydrates this one without queuing; a removed key empties it', () => {
    const storage = memoryStorage();
    const target = new EventTarget();
    (globalThis as { window?: unknown }).window = Object.assign(target, { localStorage: storage });

    const a = tab(storage);
    const b = tab(storage);
    const stop = followOtherTabs(b.store, DEFAULT_STORAGE_KEY, b.sync.journal, () => ({
      byCourse: {},
    }));

    a.store.getState().toggleComplete(COURSE, 'day-001');
    const fire = (newValue: string | null) => {
      target.dispatchEvent(
        Object.assign(new Event('storage'), {
          key: DEFAULT_STORAGE_KEY,
          newValue,
          storageArea: storage,
        }),
      );
    };
    fire(storage.getItem(DEFAULT_STORAGE_KEY));
    expect(b.store.getState().byCourse[COURSE]?.completedLessonIds.has('day-001')).toBe(true);

    // Tab B reads Day 2: storage now holds both, not B's stale copy.
    b.store.getState().toggleComplete(COURSE, 'day-002');
    const stored = JSON.parse(storage.getItem(DEFAULT_STORAGE_KEY) ?? '{}') as {
      state: { byCourse: Record<string, { completedLessonIds: string[] }> };
    };
    expect(stored.state.byCourse[COURSE]?.completedLessonIds.sort()).toEqual([
      'day-001',
      'day-002',
    ]);

    // Only the readers' own changes are queued (a: day-001, b: day-002), once each.
    const queue = createPendingQueue('progress', progressDeltaCodec, () => storage);
    expect(queue.readAll('u1').get(COURSE)?.complete).toEqual(new Set(['day-001', 'day-002']));

    storage.removeItem(DEFAULT_STORAGE_KEY);
    fire(null);
    expect(b.store.getState().byCourse).toEqual({});
    stop();
  });
});
