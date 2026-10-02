import type { StoreApi } from 'zustand';

import { createJournal, type Journal } from './journal';
import { createPendingQueue, type DeltaCodec, type PendingQueue } from './pendingQueue';
import type { SyncAdapter } from './syncEngine';
import { holdTabLock } from './tabLock';

/** Everything cloud sync needs for one store; created with the store (Phase 23). */
export interface StoreSync<Delta> {
  readonly adapter: SyncAdapter<Delta>;
  readonly queue: PendingQueue<Delta>;
  readonly journal: Journal;
}

export function createStoreSync<Delta>(
  kind: 'progress' | 'bookmarks',
  adapter: SyncAdapter<Delta>,
  codec: DeltaCodec<Delta>,
): StoreSync<Delta> {
  holdTabLock();
  const queue = createPendingQueue(kind, codec);
  const journal = createJournal({
    subscribe: (onDelta) => adapter.subscribe(onDelta),
    queue,
    marker: adapter.marker,
  });
  return { adapter, queue, journal };
}

interface Rehydratable {
  readonly persist?: { rehydrate(): Promise<void> | void };
}

/**
 * Two tabs (Phase 23): each tab holds the store in memory and writes all of
 * it on every change, so without this a change in tab B would write back
 * tab B's stale copy over what tab A just stored. When another tab writes
 * the store's persist key, rehydrate from it; when it removes the key (a
 * sign-out clears the stores), empty this tab's copy too, so a previous
 * reader's progress can never be written back without its marker. Neither
 * is queued: the other tab already queued its own changes.
 *
 * Returns the unsubscribe function.
 */
export function followOtherTabs<State>(
  store: StoreApi<State>,
  storageKey: string,
  journal: Journal,
  empty: () => Partial<State>,
): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const onStorage = (event: StorageEvent): void => {
    if (event.storageArea !== window.localStorage) return;
    // `key === null`: another tab called `localStorage.clear()`.
    if (event.key !== null && event.key !== storageKey) return;
    journal.external(() => {
      if (event.key === null || event.newValue === null) {
        store.setState(empty());
      } else {
        // zustand's persist rehydrates synchronously from localStorage, so
        // the change lands inside `external`.
        void (store as unknown as Rehydratable).persist?.rehydrate();
      }
    });
  };
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener('storage', onStorage);
  };
}
