import type { Journal } from './journal';
import type { Marker } from './marker';
import type { PendingQueue } from './pendingQueue';
import { liveTabIds } from './tabLock';
import { SYNC_USER_HEADER } from './wire';

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
 *   3. **Every local change** is in this tab's pending queue for the user
 *      (`pendingQueue.ts`, written by the journal from the moment the store
 *      exists — Phase 23). The engine applies every tab's queue on top of
 *      every snapshot it loads, adopts the queues of closed tabs, and sends
 *      its own: debounced `PATCH <endpoint>` per course, acked (subtracted)
 *      on success, so a change made while the request was in flight stays
 *      queued. One retry after `retryMs`; a
 *      second failure waits for the next change, `online`, or the tab
 *      becoming visible again. A queue left by a closed tab, an outage or
 *      an expired session goes out on the next visit.
 *
 * Applying a snapshot never queues a change, `dispose()` (sign-out, unmount)
 * stops sending but leaves the queue in storage, and the queues of other
 * accounts are deleted at start — never sent.
 *
 * Every call names the user it is for (`SYNC_USER_HEADER`, review
 * 2026-10-03 P1 item 2). A 401 (the session ended) or 409 (the cookie now
 * belongs to another account) pauses the engine with the queue kept for
 * this user and calls `onSessionLost`, so the app re-asks `/api/me` and
 * takes the sign-out or account-switch path; `online`, the tab becoming
 * visible or `flush()` try again. A 400 / 413 / 422 means the server will
 * never take that delta: it is dropped (and reported) instead of blocking
 * the course's queue forever.
 */
export interface SyncAdapter<Delta> {
  /** `/api/me/progress` or `/api/me/bookmarks`. */
  readonly endpoint: string;
  readonly marker: Marker;
  /** Report one delta per changed course (the journal's input); returns the unsubscribe function. */
  subscribe(onDelta: (courseId: string, delta: Delta) => void): () => void;
  /** The local snapshot for `POST …/sync` (without `courseId`). */
  readLocal(courseId: string): Record<string, unknown>;
  /** Replace the local course with the server's answer, re-applying `pending` on top. Throws on a bad payload. */
  applyRemote(courseId: string, remote: unknown, pending: Delta | undefined): void;
  /** The `PATCH` body. */
  serializeDelta(courseId: string, delta: Delta): Record<string, unknown>;
}

export interface SyncEngineOptions<Delta> {
  readonly adapter: SyncAdapter<Delta>;
  readonly queue: PendingQueue<Delta>;
  readonly journal: Journal;
  readonly courseIds: readonly string[];
  readonly userId: string;
  readonly fetchImpl?: typeof fetch;
  readonly debounceMs?: number;
  readonly retryMs?: number;
  readonly onError?: (error: unknown) => void;
  /** Ids of the live tabs (`tabLock.ts`); `null` when unknown. */
  readonly liveTabs?: () => Promise<ReadonlySet<string> | null>;
  /** The server answered 401 / 409: this tab no longer syncs for the signed-in account. */
  readonly onSessionLost?: (status: 401 | 409) => void;
}

export interface SyncHandle {
  dispose(): void;
  /** Resolves once the initial load (sync or get) has finished, success or not. */
  readonly settled: Promise<void>;
  /** Send the queue now; resolves when the attempt ends (sent or failed). */
  flush(): Promise<void>;
}

type Timer = ReturnType<typeof setTimeout>;

const sessionLost = (status: number): status is 401 | 409 => status === 401 || status === 409;

/** The server refuses the request itself: sending the same delta again can never succeed. */
const refused = (status: number): boolean => status === 400 || status === 413 || status === 422;

export function startSync<Delta>(options: SyncEngineOptions<Delta>): SyncHandle {
  const { adapter, queue, journal, courseIds, userId } = options;
  const fetchImpl: typeof fetch = options.fetchImpl ?? ((input, init) => fetch(input, init));
  const debounceMs = options.debounceMs ?? 250;
  const retryMs = options.retryMs ?? 2000;
  const courses = new Set(courseIds);
  const liveTabs = options.liveTabs ?? liveTabIds;

  let disposed = false;
  let ready = false;
  /** After a 401 / 409, until `online`, visible or `flush()`. */
  let paused = false;
  let inFlight: Promise<void> | null = null;
  let retryArmed = false;
  let flushTimer: Timer | null = null;
  let retryTimer: Timer | null = null;

  const report = (error: unknown): void => {
    options.onError?.(error);
  };

  const call = (
    method: 'GET' | 'POST' | 'PATCH',
    url: string,
    body?: unknown,
  ): Promise<Response> => {
    const headers: Record<string, string> = { [SYNC_USER_HEADER]: userId };
    const init: RequestInit = { method, credentials: 'same-origin', cache: 'no-store', headers };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
      init.keepalive = true;
    }
    return fetchImpl(url, init);
  };

  /** Stop sending; the queue stays for `userId` — never sent to whoever is signed in now. */
  const loseSession = (status: 401 | 409, what: string): void => {
    paused = true;
    retryArmed = false;
    if (flushTimer !== null) clearTimeout(flushTimer);
    if (retryTimer !== null) clearTimeout(retryTimer);
    flushTimer = null;
    retryTimer = null;
    report(new Error(`${adapter.endpoint} ${what} answered ${String(status)}; sync paused`));
    options.onSessionLost?.(status);
  };

  const queued = (): [string, Delta][] =>
    [...queue.read(userId).entries()].filter(([courseId]) => courses.has(courseId));

  const schedule = (): void => {
    if (!ready || disposed || paused || inFlight !== null || flushTimer !== null) return;
    if (queued().length === 0) return;
    flushTimer = setTimeout(() => {
      flushTimer = null;
      void flush();
    }, debounceMs);
  };

  /**
   * Take over the queues of closed tabs. At start an unknown answer adopts
   * every other tab's queue (a browser without Web Locks); later only a
   * definite one does, so a live tab's queue is never taken while it writes.
   */
  const adopt = async (atStart: boolean): Promise<void> => {
    const live = await liveTabs();
    if (live === null && !atStart) return;
    queue.adoptOrphans(userId, live);
  };

  /** Resolves `true` when every queued course went through. */
  const send = async (): Promise<boolean> => {
    await adopt(false);
    if (disposed) return false;
    let failed = false;
    for (const [courseId, delta] of queued()) {
      if (disposed || paused) return false;
      try {
        const response = await call(
          'PATCH',
          adapter.endpoint,
          adapter.serializeDelta(courseId, delta),
        );
        if (sessionLost(response.status)) {
          loseSession(response.status, 'PATCH');
          return false;
        }
        const answered = `${adapter.endpoint} PATCH answered ${String(response.status)}`;
        if (refused(response.status)) {
          // Ack what was sent (changes made since stay queued) and say so.
          queue.ack(userId, courseId, delta);
          report(new Error(`${answered}; change dropped`));
          continue;
        }
        if (!response.ok) throw new Error(answered);
        queue.ack(userId, courseId, delta);
      } catch (error) {
        failed = true;
        report(error);
      }
    }
    if (disposed || paused) return false;
    if (!failed) {
      retryArmed = false;
      return true;
    }
    if (!retryArmed) {
      retryArmed = true;
      retryTimer = setTimeout(() => {
        retryTimer = null;
        void flush();
      }, retryMs);
    } else {
      // Two failures in a row: the queue stays (in storage too); the next
      // change, `online` or the tab becoming visible tries again.
      retryArmed = false;
    }
    return false;
  };

  const flush = (): Promise<void> => {
    if (disposed || !ready) return Promise.resolve();
    if (inFlight !== null) return inFlight;
    paused = false;
    if (flushTimer !== null) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    inFlight = send().then((sent) => {
      inFlight = null;
      // Changes made during the request go out next. After a failure the
      // retry timer (or the next change / `online` / visible) decides.
      if (sent) schedule();
    });
    return inFlight;
  };

  const onOnline = (): void => {
    void flush();
  };
  const onVisible = (): void => {
    if (document.visibilityState === 'visible') void flush();
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisible);
  }

  // Changes from now on are this user's, whatever the marker still says.
  journal.setActiveUser(userId);
  queue.clearOthers(userId);
  const stopListening = journal.onRecorded((courseId) => {
    if (courses.has(courseId)) schedule();
  });

  const initial = async (): Promise<void> => {
    // Union only when this browser has never been merged into any account.
    // A marker naming another user means a previous reader's local state is
    // still here (their session ended without `Odjava`); the account replaces
    // it instead of absorbing it.
    const previous = adapter.marker.read();
    const migrate = previous === null;
    await adopt(true);
    let complete = true;
    for (const courseId of courseIds) {
      if (disposed) return;
      try {
        const response = migrate
          ? await call('POST', `${adapter.endpoint}/sync`, {
              courseId,
              ...adapter.readLocal(courseId),
            })
          : await call('GET', `${adapter.endpoint}?courseId=${encodeURIComponent(courseId)}`);
        if (sessionLost(response.status)) {
          complete = false;
          loseSession(response.status, migrate ? 'sync' : 'get');
          break;
        }
        if (!response.ok) {
          throw new Error(
            `${adapter.endpoint} ${migrate ? 'sync' : 'get'} answered ${String(response.status)}`,
          );
        }
        const remote: unknown = await response.json();
        if (disposed) return;
        // Read the queues only now: they include changes made while the
        // request was in flight, in this tab or another one.
        const pending = queue.readAll(userId).get(courseId);
        journal.external(() => {
          adapter.applyRemote(courseId, remote, pending);
        });
      } catch (error) {
        complete = false;
        report(error);
      }
    }
    if (disposed) return;
    if (previous !== userId && complete) adapter.marker.write(userId);
    // Even after a failed load, queued changes should reach the account
    // once it answers again — the next load re-reads it either way.
    ready = true;
    if (!paused) void flush();
  };

  const settled = initial();

  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    stopListening();
    journal.setActiveUser(null);
    if (flushTimer !== null) clearTimeout(flushTimer);
    if (retryTimer !== null) clearTimeout(retryTimer);
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
    }
  };

  return { dispose, settled, flush };
}
