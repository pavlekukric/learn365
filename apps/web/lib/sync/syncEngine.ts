import type { Marker } from './marker';

/**
 * The browser side of cloud sync, independent of which store it drives.
 *
 * Lifecycle per signed-in session and store:
 *   1. **First contact** for this browser — no marker at all — `POST
 *      <endpoint>/sync` with the local snapshot; the account unions it in
 *      and returns the canonical state, which replaces the local copy. Then
 *      the marker is written.
 *   2. **Every later load** — `GET <endpoint>?courseId=…` and replace local:
 *      the account is authoritative across devices. A marker naming a
 *      *different* user takes this path too (a previous reader's local
 *      state must never be unioned into this account) and is rewritten
 *      once the load succeeds.
 *   3. **Every local change** — the adapter reports a delta per course; the
 *      engine coalesces for `debounceMs` and sends `PATCH <endpoint>`. One
 *      retry after `retryMs`; a second failure waits for the next change or
 *      the browser's `online` event. Changes made while a snapshot is in
 *      flight are re-applied on top of it and still flushed.
 *
 * Applying a snapshot never echoes back as a delta, and `dispose()` (sign-
 * out, unmount) drops anything still queued.
 */
export interface SyncAdapter<Delta> {
  /** `/api/me/progress` or `/api/me/bookmarks`. */
  readonly endpoint: string;
  readonly marker: Marker;
  /** Report one delta per changed course; returns the unsubscribe function. */
  subscribe(onDelta: (courseId: string, delta: Delta) => void): () => void;
  /** The local snapshot for `POST …/sync` (without `courseId`). */
  readLocal(courseId: string): Record<string, unknown>;
  /** Replace the local course with the server's answer, re-applying `pending` on top. Throws on a bad payload. */
  applyRemote(courseId: string, remote: unknown, pending: Delta | undefined): void;
  /** Fold a newer delta into an older one. */
  mergeDelta(into: Delta, next: Delta): Delta;
  /** The `PATCH` body. */
  serializeDelta(courseId: string, delta: Delta): Record<string, unknown>;
}

export interface SyncEngineOptions<Delta> {
  readonly adapter: SyncAdapter<Delta>;
  readonly courseIds: readonly string[];
  readonly userId: string;
  readonly fetchImpl?: typeof fetch;
  readonly debounceMs?: number;
  readonly retryMs?: number;
  readonly onError?: (error: unknown) => void;
}

export interface SyncHandle {
  dispose(): void;
  /** Resolves once the initial load (sync or get) has finished, success or not. */
  readonly settled: Promise<void>;
}

type Timer = ReturnType<typeof setTimeout>;

export function startSync<Delta>(options: SyncEngineOptions<Delta>): SyncHandle {
  const { adapter, courseIds, userId } = options;
  const fetchImpl: typeof fetch = options.fetchImpl ?? ((input, init) => fetch(input, init));
  const debounceMs = options.debounceMs ?? 250;
  const retryMs = options.retryMs ?? 2000;
  const courses = new Set(courseIds);
  const pending = new Map<string, Delta>();

  let disposed = false;
  let ready = false;
  let applying = false;
  let inFlight = false;
  let retryArmed = false;
  let flushTimer: Timer | null = null;
  let retryTimer: Timer | null = null;

  const report = (error: unknown): void => {
    options.onError?.(error);
  };

  const call = (method: 'GET' | 'POST' | 'PATCH', url: string, body?: unknown): Promise<Response> => {
    const init: RequestInit = { method, credentials: 'same-origin', cache: 'no-store' };
    if (body !== undefined) {
      init.headers = { 'Content-Type': 'application/json' };
      init.body = JSON.stringify(body);
      init.keepalive = true;
    }
    return fetchImpl(url, init);
  };

  const schedule = (): void => {
    if (!ready || disposed || inFlight || flushTimer !== null || pending.size === 0) return;
    flushTimer = setTimeout(() => {
      flushTimer = null;
      void flush();
    }, debounceMs);
  };

  const record = (courseId: string, delta: Delta): void => {
    if (disposed || applying || !courses.has(courseId)) return;
    const existing = pending.get(courseId);
    pending.set(courseId, existing === undefined ? delta : adapter.mergeDelta(existing, delta));
    schedule();
  };

  const flush = async (): Promise<void> => {
    if (disposed || inFlight || pending.size === 0) return;
    inFlight = true;
    const batch = [...pending.entries()];
    pending.clear();
    let failed = false;
    for (const [courseId, delta] of batch) {
      if (disposed) break;
      try {
        const response = await call('PATCH', adapter.endpoint, adapter.serializeDelta(courseId, delta));
        if (!response.ok) throw new Error(`${adapter.endpoint} PATCH answered ${String(response.status)}`);
      } catch (error) {
        failed = true;
        report(error);
        const newer = pending.get(courseId);
        pending.set(courseId, newer === undefined ? delta : adapter.mergeDelta(delta, newer));
      }
    }
    inFlight = false;
    if (disposed) return;
    if (!failed) {
      retryArmed = false;
      schedule();
      return;
    }
    if (!retryArmed) {
      retryArmed = true;
      retryTimer = setTimeout(() => {
        retryTimer = null;
        void flush();
      }, retryMs);
    } else {
      // Two failures in a row: keep the queue, wait for a change or `online`.
      retryArmed = false;
    }
  };

  const onOnline = (): void => {
    void flush();
  };
  if (typeof window !== 'undefined') window.addEventListener('online', onOnline);

  const unsubscribe = adapter.subscribe(record);

  const initial = async (): Promise<void> => {
    // Union only when this browser has never been merged into any account.
    // A marker naming another user means a previous reader's local state is
    // still here (their session ended without `Odjava`); the account replaces
    // it instead of absorbing it.
    const previous = adapter.marker.read();
    const migrate = previous === null;
    let complete = true;
    for (const courseId of courseIds) {
      if (disposed) return;
      try {
        const response = migrate
          ? await call('POST', `${adapter.endpoint}/sync`, { courseId, ...adapter.readLocal(courseId) })
          : await call('GET', `${adapter.endpoint}?courseId=${encodeURIComponent(courseId)}`);
        if (!response.ok) {
          throw new Error(`${adapter.endpoint} ${migrate ? 'sync' : 'get'} answered ${String(response.status)}`);
        }
        const remote: unknown = await response.json();
        if (disposed) return;
        applying = true;
        try {
          adapter.applyRemote(courseId, remote, pending.get(courseId));
        } finally {
          applying = false;
        }
      } catch (error) {
        complete = false;
        report(error);
      }
    }
    if (disposed) return;
    if (previous !== userId && complete) adapter.marker.write(userId);
    // Even after a failed load, changes made now should reach the account
    // once it answers again — the next load re-reads it either way.
    ready = true;
    schedule();
  };

  const settled = initial();

  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    unsubscribe();
    if (flushTimer !== null) clearTimeout(flushTimer);
    if (retryTimer !== null) clearTimeout(retryTimer);
    if (typeof window !== 'undefined') window.removeEventListener('online', onOnline);
    pending.clear();
  };

  return { dispose, settled };
}
