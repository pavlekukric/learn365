'use client';

import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import type { StoreApi } from 'zustand';
import { useStore } from 'zustand';

import {
  BOOKMARKS_STORAGE_KEY,
  createBookmarkStore,
  type BookmarkStoreState,
} from '@learn365/core';

import {
  createBookmarkAdapter,
  bookmarksDeltaCodec,
  type BookmarksDelta,
} from '@/lib/sync/bookmarkAdapter';
import { createStoreSync, followOtherTabs, type StoreSync } from '@/lib/sync/storeSync';

import { createLocalStorageAdapter } from './localStorageAdapter';

type BookmarkStore = StoreApi<BookmarkStoreState>;

interface BookmarkStoreValue {
  readonly store: BookmarkStore;
  readonly sync: StoreSync<BookmarksDelta>;
}

const BookmarkStoreContext = createContext<BookmarkStoreValue | null>(null);

export function BookmarkStoreProvider({ children }: { children: ReactNode }) {
  const valueRef = useRef<BookmarkStoreValue | null>(null);
  if (valueRef.current === null) {
    const store = createBookmarkStore({
      storage: createLocalStorageAdapter(),
    });
    // Phase 23: the journal subscribes with the store, before any page
    // effect runs, so every signed-in change is queued from the first one.
    valueRef.current = {
      store,
      sync: createStoreSync('bookmarks', createBookmarkAdapter(store), bookmarksDeltaCodec),
    };
  }
  const { store, sync } = valueRef.current;
  useEffect(
    () => followOtherTabs(store, BOOKMARKS_STORAGE_KEY, sync.journal, () => ({ byCourse: {} })),
    [store, sync],
  );
  return (
    <BookmarkStoreContext.Provider value={valueRef.current}>
      {children}
    </BookmarkStoreContext.Provider>
  );
}

/** The raw store, for code that subscribes outside React (cloud sync). */
export function useBookmarkStoreApi(): BookmarkStore {
  return useStoreValue().store;
}

/** The store's sync glue (adapter, pending queue, journal) for `CloudSync`. */
export function useBookmarkSync(): StoreSync<BookmarksDelta> {
  return useStoreValue().sync;
}

function useStoreValue(): BookmarkStoreValue {
  const value = useContext(BookmarkStoreContext);
  if (value === null) {
    throw new Error('useBookmarkStoreApi must be used inside <BookmarkStoreProvider>.');
  }
  return value;
}

export function useBookmarkStore<T>(selector: (state: BookmarkStoreState) => T): T {
  return useStore(useBookmarkStoreApi(), selector);
}
