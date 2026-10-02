import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createJournal } from './journal';
import { memoryMarker, type Marker } from './marker';
import { createPendingQueue, type DeltaCodec, type QueueStorage } from './pendingQueue';
import { startSync, type SyncAdapter } from './syncEngine';

interface Delta {
  readonly items: readonly string[];
}

interface Call {
  readonly method: string;
  readonly url: string;
  readonly body: unknown;
}

function fakeFetch(handler: (call: Call) => Response | Promise<Response>) {
  const calls: Call[] = [];
  const impl = (async (input: string | URL | Request, init?: RequestInit) => {
    const call: Call = {
      method: init?.method ?? 'GET',
      url: String(input),
      body: typeof init?.body === 'string' ? (JSON.parse(init.body) as unknown) : undefined,
    };
    calls.push(call);
    return handler(call);
  }) as unknown as typeof fetch;
  return { impl, calls };
}

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });
const noContent = () => new Response(null, { status: 204 });
const fail = () => new Response('nope', { status: 500 });

const codec: DeltaCodec<Delta> = {
  merge: (into, next) => ({ items: [...new Set([...into.items, ...next.items])] }),
  subtract: (queued, sent) => ({ items: queued.items.filter((item) => !sent.items.includes(item)) }),
  isEmpty: (delta) => delta.items.length === 0,
  toJSON: (delta) => delta.items,
  fromJSON: (value) => (Array.isArray(value) ? { items: value as string[] } : null),
};

/** A `localStorage` stand-in shared by "tabs" and "visits". */
function memoryStorage(): QueueStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
    key: (index) => [...data.keys()][index] ?? null,
    get length() {
      return data.size;
    },
  };
}

function fakeAdapter(marker: Marker = memoryMarker()) {
  let emit: ((courseId: string, delta: Delta) => void) | null = null;
  const applied: { courseId: string; remote: unknown; pending: Delta | undefined }[] = [];
  const adapter: SyncAdapter<Delta> & {
    emit(courseId: string, ...items: string[]): void;
    applied: typeof applied;
  } = {
    endpoint: '/api/me/thing',
    marker,
    applied,
    subscribe(onDelta) {
      emit = onDelta;
      return () => {
        emit = null;
      };
    },
    emit(courseId, ...items) {
      emit?.(courseId, { items });
    },
    readLocal: () => ({ local: true }),
    applyRemote(courseId, remote, pending) {
      applied.push({ courseId, remote, pending });
      // A store would notify subscribers here; it must not be queued.
      emit?.(courseId, { items: ['echo'] });
    },
    serializeDelta: (courseId, delta) => ({ courseId, items: delta.items }),
  };
  return adapter;
}

/** One "page": store glue over shared storage, like `createStoreSync`. */
let tabs = 0;

function setup(marker: Marker = memoryMarker(), storage = memoryStorage()) {
  tabs += 1;
  const tabId = `tab-${String(tabs)}`;
  const adapter = fakeAdapter(marker);
  const queue = createPendingQueue('progress', codec, () => storage, tabId);
  const journal = createJournal({ subscribe: (onDelta) => adapter.subscribe(onDelta), queue, marker });
  // Only this "tab" is alive: every other tab's queue is an orphan.
  const liveTabs = () => Promise.resolve(new Set([tabId]));
  return { adapter, queue, journal, storage, marker, liveTabs };
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('startSync', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('first contact: POSTs the local snapshot to …/sync, applies the answer, writes the marker', async () => {
    const marker = memoryMarker(null);
    const page = setup(marker);
    const { adapter } = page;
    const { impl, calls } = fakeFetch(() => ok({ remote: 1 }));
    const handle = startSync({ ...page, courseIds: ['c1'], userId: 'u1', fetchImpl: impl, debounceMs: 0 });
    await handle.settled;

    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual({ method: 'POST', url: '/api/me/thing/sync', body: { courseId: 'c1', local: true } });
    expect(adapter.applied).toEqual([{ courseId: 'c1', remote: { remote: 1 }, pending: undefined }]);
    expect(marker.value).toBe('u1');
    handle.dispose();
  });

  it('later loads: GETs the account state when the marker already names the user', async () => {
    const page = setup(memoryMarker('u1'));
    const { impl, calls } = fakeFetch(() => ok({ remote: 2 }));
    const handle = startSync({ ...page, courseIds: ['c1'], userId: 'u1', fetchImpl: impl, debounceMs: 0 });
    await handle.settled;
    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual(['GET /api/me/thing?courseId=c1']);
    handle.dispose();
  });

  it('marker names another user: GETs (never unions the previous reader) and rewrites the marker', async () => {
    const marker = memoryMarker('u1');
    const page = setup(marker);
    const { adapter } = page;
    const { impl, calls } = fakeFetch(() => ok({ remote: 3 }));
    const handle = startSync({ ...page, courseIds: ['c1'], userId: 'u2', fetchImpl: impl, debounceMs: 0 });
    await handle.settled;
    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual(['GET /api/me/thing?courseId=c1']);
    expect(adapter.applied).toEqual([{ courseId: 'c1', remote: { remote: 3 }, pending: undefined }]);
    expect(marker.value).toBe('u2');
    handle.dispose();
  });

  it('marker names another user and the load fails: keeps the old marker', async () => {
    const marker = memoryMarker('u1');
    const page = setup(marker);
    const { impl } = fakeFetch(() => fail());
    const handle = startSync({
      ...page,
      courseIds: ['c1'],
      userId: 'u2',
      fetchImpl: impl,
      debounceMs: 0,
      onError: () => undefined,
    });
    await handle.settled;
    expect(marker.value).toBe('u1');
    handle.dispose();
  });

  it('coalesces local deltas into one PATCH and never echoes an applied snapshot', async () => {
    const page = setup(memoryMarker('u1'));
    const { adapter } = page;
    const { impl, calls } = fakeFetch((call) => (call.method === 'GET' ? ok({}) : noContent()));
    const handle = startSync({ ...page, courseIds: ['c1'], userId: 'u1', fetchImpl: impl, debounceMs: 0 });
    await handle.settled;
    calls.length = 0;

    adapter.emit('c1', 'a');
    adapter.emit('c1', 'b');
    adapter.emit('other', 'ignored');
    await tick();
    await tick();

    expect(calls).toEqual([{ method: 'PATCH', url: '/api/me/thing', body: { courseId: 'c1', items: ['a', 'b'] } }]);
    handle.dispose();
  });

  it('keeps a change made while the load is in flight and re-applies it on top', async () => {
    const page = setup(memoryMarker('u1'));
    const { adapter } = page;
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const { impl, calls } = fakeFetch(async (call) => {
      if (call.method === 'GET') {
        await gate;
        return ok({ remote: 3 });
      }
      return noContent();
    });
    const handle = startSync({ ...page, courseIds: ['c1'], userId: 'u1', fetchImpl: impl, debounceMs: 0 });
    adapter.emit('c1', 'during');
    release();
    await handle.settled;
    await tick();
    await tick();

    expect(adapter.applied[0]?.pending).toEqual({ items: ['during'] });
    expect(calls.filter((c) => c.method === 'PATCH')).toEqual([
      { method: 'PATCH', url: '/api/me/thing', body: { courseId: 'c1', items: ['during'] } },
    ]);
    handle.dispose();
  });

  it('re-queues a failed PATCH and retries once after retryMs', async () => {
    const page = setup(memoryMarker('u1'));
    const { adapter } = page;
    let patches = 0;
    const { impl, calls } = fakeFetch((call) => {
      if (call.method === 'GET') return ok({});
      patches += 1;
      return patches === 1 ? fail() : noContent();
    });
    const errors: unknown[] = [];
    const handle = startSync({
      ...page,
      courseIds: ['c1'],
      userId: 'u1',
      fetchImpl: impl,
      debounceMs: 0,
      retryMs: 50,
      onError: (error) => errors.push(error),
    });
    await handle.settled;
    adapter.emit('c1', 'x');
    await tick();
    await tick();
    expect(patches).toBe(1);
    expect(errors).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(60);
    await tick();
    expect(patches).toBe(2);
    expect(calls.filter((c) => c.method === 'PATCH').map((c) => c.body)).toEqual([
      { courseId: 'c1', items: ['x'] },
      { courseId: 'c1', items: ['x'] },
    ]);
    handle.dispose();
  });

  it('does not write the marker when the first contact fails, but still flushes later changes', async () => {
    const marker = memoryMarker(null);
    const page = setup(marker);
    const { adapter } = page;
    const { impl, calls } = fakeFetch((call) => (call.method === 'POST' ? fail() : noContent()));
    const handle = startSync({ ...page, courseIds: ['c1'], userId: 'u1', fetchImpl: impl, debounceMs: 0 });
    await handle.settled;
    expect(marker.value).toBeNull();
    expect(adapter.applied).toHaveLength(0);

    adapter.emit('c1', 'later');
    await tick();
    await tick();
    expect(calls.filter((c) => c.method === 'PATCH')).toHaveLength(1);
    handle.dispose();
  });

  it('dispose stops sending but keeps the queue in storage', async () => {
    const page = setup(memoryMarker('u1'));
    const { impl, calls } = fakeFetch((call) => (call.method === 'GET' ? ok({}) : noContent()));
    const handle = startSync({ ...page, courseIds: ['c1'], userId: 'u1', fetchImpl: impl, debounceMs: 50 });
    await handle.settled;
    page.adapter.emit('c1', 'kept');
    handle.dispose();
    await vi.advanceTimersByTimeAsync(100);
    expect(calls.filter((c) => c.method === 'PATCH')).toHaveLength(0);
    expect(page.queue.read('u1').get('c1')).toEqual({ items: ['kept'] });
  });

  it('a change made before the engine starts (before /api/me) is queued and sent', async () => {
    const page = setup(memoryMarker('u1'));
    page.adapter.emit('c1', 'early');
    const { impl, calls } = fakeFetch((call) => (call.method === 'GET' ? ok({ remote: 1 }) : noContent()));
    const handle = startSync({ ...page, courseIds: ['c1'], userId: 'u1', fetchImpl: impl, debounceMs: 0 });
    await handle.settled;
    await tick();
    await tick();
    expect(page.adapter.applied[0]?.pending).toEqual({ items: ['early'] });
    expect(calls.filter((c) => c.method === 'PATCH').map((c) => c.body)).toEqual([{ courseId: 'c1', items: ['early'] }]);
    expect(page.queue.read('u1').size).toBe(0);
    handle.dispose();
  });

  it('an outage, the tab closed, the next visit: the queue is applied over GET and sent', async () => {
    const storage = memoryStorage();
    const first = setup(memoryMarker('u1'), storage);
    const down = fakeFetch((call) => (call.method === 'GET' ? ok({}) : new Response('down', { status: 503 })));
    const one = startSync({
      ...first,
      courseIds: ['c1'],
      userId: 'u1',
      fetchImpl: down.impl,
      debounceMs: 0,
      retryMs: 10,
      onError: () => undefined,
    });
    await one.settled;
    first.adapter.emit('c1', 'offline');
    await vi.advanceTimersByTimeAsync(50);
    expect(down.calls.filter((c) => c.method === 'PATCH')).toHaveLength(2);
    one.dispose(); // the tab closes

    const second = setup(memoryMarker('u1'), storage);
    const up = fakeFetch((call) => (call.method === 'GET' ? ok({ remote: 2 }) : noContent()));
    const two = startSync({ ...second, courseIds: ['c1'], userId: 'u1', fetchImpl: up.impl, debounceMs: 0 });
    await two.settled;
    await tick();
    await tick();
    expect(second.adapter.applied[0]?.pending).toEqual({ items: ['offline'] });
    expect(up.calls.filter((c) => c.method === 'PATCH').map((c) => c.body)).toEqual([
      { courseId: 'c1', items: ['offline'] },
    ]);
    expect(storage.data.size).toBe(0);
    two.dispose();
  });

  it('a change made while a PATCH is in flight stays queued and goes out next', async () => {
    const page = setup(memoryMarker('u1'));
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let patches = 0;
    const { impl, calls } = fakeFetch(async (call) => {
      if (call.method === 'GET') return ok({});
      patches += 1;
      if (patches === 1) await gate;
      return noContent();
    });
    const handle = startSync({ ...page, courseIds: ['c1'], userId: 'u1', fetchImpl: impl, debounceMs: 0 });
    await handle.settled;
    page.adapter.emit('c1', 'a');
    await tick();
    page.adapter.emit('c1', 'b');
    release();
    await tick();
    await tick();
    await tick();
    expect(calls.filter((c) => c.method === 'PATCH').map((c) => c.body)).toEqual([
      { courseId: 'c1', items: ['a'] },
      { courseId: 'c1', items: ['b'] },
    ]);
    expect(page.queue.read('u1').size).toBe(0);
    handle.dispose();
  });

  it('never sends another account\'s queue, and deletes it on sign-in', async () => {
    const storage = memoryStorage();
    const page = setup(memoryMarker('u1'), storage);
    page.adapter.emit('c1', 'from-u1'); // queued for u1 (the marker)
    const { impl, calls } = fakeFetch((call) => (call.method === 'GET' ? ok({}) : noContent()));
    const handle = startSync({ ...page, courseIds: ['c1'], userId: 'u2', fetchImpl: impl, debounceMs: 0 });
    await handle.settled;
    await tick();
    expect(page.adapter.applied[0]?.pending).toBeUndefined();
    expect(calls.filter((c) => c.method === 'PATCH')).toHaveLength(0);
    expect(page.queue.read('u1').size).toBe(0);
    handle.dispose();
  });

  it('a live tab keeps its own queue; a closed tab\'s queue is adopted', async () => {
    const storage = memoryStorage();
    const other = setup(memoryMarker('u1'), storage);
    other.adapter.emit('c1', 'theirs');
    const page = setup(memoryMarker('u1'), storage);
    const otherTab = [...storage.data.keys()][0]?.split(':').at(-1) ?? '';
    const ownTab = 'tab-' + String(tabs);
    let alive = new Set([ownTab, otherTab]);
    const { impl, calls } = fakeFetch((call) => (call.method === 'GET' ? ok({}) : noContent()));
    const handle = startSync({
      ...page,
      liveTabs: () => Promise.resolve(alive),
      courseIds: ['c1'],
      userId: 'u1',
      fetchImpl: impl,
      debounceMs: 0,
    });
    await handle.settled;
    await tick();
    // Applied over the snapshot, but left to the live tab to send.
    expect(page.adapter.applied[0]?.pending).toEqual({ items: ['theirs'] });
    expect(calls.filter((c) => c.method === 'PATCH')).toHaveLength(0);

    alive = new Set([ownTab]); // the other tab closes
    page.adapter.emit('c1', 'mine');
    await tick();
    await tick();
    await tick();
    expect(calls.filter((c) => c.method === 'PATCH').map((c) => c.body)).toEqual([
      { courseId: 'c1', items: ['theirs', 'mine'] },
    ]);
    expect(storage.data.size).toBe(0);
    handle.dispose();
  });

  it('no marker and no engine: nothing is queued (the first union carries it)', () => {
    const page = setup(memoryMarker(null));
    page.adapter.emit('c1', 'anon');
    expect(page.storage.data.size).toBe(0);
  });

  it('flush() sends the queue now', async () => {
    const page = setup(memoryMarker('u1'));
    const { impl, calls } = fakeFetch((call) => (call.method === 'GET' ? ok({}) : noContent()));
    const handle = startSync({ ...page, courseIds: ['c1'], userId: 'u1', fetchImpl: impl, debounceMs: 10_000 });
    await handle.settled;
    page.adapter.emit('c1', 'now');
    await handle.flush();
    expect(calls.filter((c) => c.method === 'PATCH')).toHaveLength(1);
    handle.dispose();
  });
});
