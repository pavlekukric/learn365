import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { memoryMarker } from './marker';
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

function fakeAdapter(marker = memoryMarker()) {
  let emit: ((courseId: string, delta: Delta) => void) | null = null;
  const applied: { courseId: string; remote: unknown; pending: Delta | undefined }[] = [];
  const adapter: SyncAdapter<Delta> & {
    emit(courseId: string, ...items: string[]): void;
    applied: typeof applied;
    unsubscribed: boolean;
  } = {
    endpoint: '/api/me/thing',
    marker,
    unsubscribed: false,
    applied,
    subscribe(onDelta) {
      emit = onDelta;
      return () => {
        adapter.unsubscribed = true;
        emit = null;
      };
    },
    emit(courseId, ...items) {
      emit?.(courseId, { items });
    },
    readLocal: () => ({ local: true }),
    applyRemote(courseId, remote, pending) {
      applied.push({ courseId, remote, pending });
      // A store would notify subscribers here; the engine must ignore it.
      emit?.(courseId, { items: ['echo'] });
    },
    mergeDelta: (into, next) => ({ items: [...into.items, ...next.items] }),
    serializeDelta: (courseId, delta) => ({ courseId, items: delta.items }),
  };
  return adapter;
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
    const adapter = fakeAdapter(marker);
    const { impl, calls } = fakeFetch(() => ok({ remote: 1 }));
    const handle = startSync({ adapter, courseIds: ['c1'], userId: 'u1', fetchImpl: impl, debounceMs: 0 });
    await handle.settled;

    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual({ method: 'POST', url: '/api/me/thing/sync', body: { courseId: 'c1', local: true } });
    expect(adapter.applied).toEqual([{ courseId: 'c1', remote: { remote: 1 }, pending: undefined }]);
    expect(marker.value).toBe('u1');
    handle.dispose();
  });

  it('later loads: GETs the account state when the marker already names the user', async () => {
    const adapter = fakeAdapter(memoryMarker('u1'));
    const { impl, calls } = fakeFetch(() => ok({ remote: 2 }));
    const handle = startSync({ adapter, courseIds: ['c1'], userId: 'u1', fetchImpl: impl, debounceMs: 0 });
    await handle.settled;
    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual(['GET /api/me/thing?courseId=c1']);
    handle.dispose();
  });

  it('marker names another user: GETs (never unions the previous reader) and rewrites the marker', async () => {
    const marker = memoryMarker('u1');
    const adapter = fakeAdapter(marker);
    const { impl, calls } = fakeFetch(() => ok({ remote: 3 }));
    const handle = startSync({ adapter, courseIds: ['c1'], userId: 'u2', fetchImpl: impl, debounceMs: 0 });
    await handle.settled;
    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual(['GET /api/me/thing?courseId=c1']);
    expect(adapter.applied).toEqual([{ courseId: 'c1', remote: { remote: 3 }, pending: undefined }]);
    expect(marker.value).toBe('u2');
    handle.dispose();
  });

  it('marker names another user and the load fails: keeps the old marker', async () => {
    const marker = memoryMarker('u1');
    const adapter = fakeAdapter(marker);
    const { impl } = fakeFetch(() => fail());
    const handle = startSync({
      adapter,
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
    const adapter = fakeAdapter(memoryMarker('u1'));
    const { impl, calls } = fakeFetch((call) => (call.method === 'GET' ? ok({}) : noContent()));
    const handle = startSync({ adapter, courseIds: ['c1'], userId: 'u1', fetchImpl: impl, debounceMs: 0 });
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
    const adapter = fakeAdapter(memoryMarker('u1'));
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
    const handle = startSync({ adapter, courseIds: ['c1'], userId: 'u1', fetchImpl: impl, debounceMs: 0 });
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
    const adapter = fakeAdapter(memoryMarker('u1'));
    let patches = 0;
    const { impl, calls } = fakeFetch((call) => {
      if (call.method === 'GET') return ok({});
      patches += 1;
      return patches === 1 ? fail() : noContent();
    });
    const errors: unknown[] = [];
    const handle = startSync({
      adapter,
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
    const adapter = fakeAdapter(marker);
    const { impl, calls } = fakeFetch((call) => (call.method === 'POST' ? fail() : noContent()));
    const handle = startSync({ adapter, courseIds: ['c1'], userId: 'u1', fetchImpl: impl, debounceMs: 0 });
    await handle.settled;
    expect(marker.value).toBeNull();
    expect(adapter.applied).toHaveLength(0);

    adapter.emit('c1', 'later');
    await tick();
    await tick();
    expect(calls.filter((c) => c.method === 'PATCH')).toHaveLength(1);
    handle.dispose();
  });

  it('dispose unsubscribes and drops the queue', async () => {
    const adapter = fakeAdapter(memoryMarker('u1'));
    const { impl, calls } = fakeFetch((call) => (call.method === 'GET' ? ok({}) : noContent()));
    const handle = startSync({ adapter, courseIds: ['c1'], userId: 'u1', fetchImpl: impl, debounceMs: 0 });
    await handle.settled;
    adapter.emit('c1', 'gone');
    handle.dispose();
    await tick();
    await tick();
    expect(adapter.unsubscribed).toBe(true);
    expect(calls.filter((c) => c.method === 'PATCH')).toHaveLength(0);
  });
});
