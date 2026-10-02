import type { Marker } from './marker';
import type { PendingQueue } from './pendingQueue';

/**
 * Records every local store change into the pending queue from the moment
 * the store exists (Phase 23) — before `/api/me` has answered and before
 * any sync engine runs, so a lesson marked read in the first second of a
 * visit is queued too, not only changes the engine happened to see.
 *
 * A change is queued for the account a running engine names, else the one
 * the cloud marker names (the last account this browser synced with). With
 * neither — a reader who never signed in here — nothing is queued: the
 * first sign-in's union (`POST …/sync`) carries the whole local copy.
 *
 * Changes that are not the reader's — an account snapshot being applied, a
 * rehydrate after another tab wrote storage, a sign-out clearing the store
 * — run inside `external()` and are not queued.
 */
export interface Journal {
  setActiveUser(userId: string | null): void;
  external<T>(fn: () => T): T;
  onRecorded(listener: (courseId: string) => void): () => void;
  dispose(): void;
}

export interface JournalOptions<Delta> {
  /** The adapter's store subscription: one delta per changed course. */
  readonly subscribe: (onDelta: (courseId: string, delta: Delta) => void) => () => void;
  readonly queue: PendingQueue<Delta>;
  readonly marker: Marker;
}

export function createJournal<Delta>({ subscribe, queue, marker }: JournalOptions<Delta>): Journal {
  let activeUser: string | null = null;
  let externalDepth = 0;
  const listeners = new Set<(courseId: string) => void>();

  const unsubscribe = subscribe((courseId, delta) => {
    if (externalDepth > 0) return;
    const userId = activeUser ?? marker.read();
    if (userId === null) return;
    queue.add(userId, courseId, delta);
    for (const listener of listeners) listener(courseId);
  });

  return {
    setActiveUser(userId) {
      activeUser = userId;
    },
    external(fn) {
      externalDepth += 1;
      try {
        return fn();
      } finally {
        externalDepth -= 1;
      }
    },
    onRecorded(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dispose() {
      unsubscribe();
      listeners.clear();
    },
  };
}
