'use client';

import { createContext, useContext, useRef, type ReactNode } from 'react';
import type { StoreApi } from 'zustand';
import { useStore } from 'zustand';

import {
  createBookmarkStore,
  type BookmarkStoreState,
} from '@learn365/core';

import { createLocalStorageAdapter } from './localStorageAdapter';

type BookmarkStore = StoreApi<BookmarkStoreState>;

const BookmarkStoreContext = createContext<BookmarkStore | null>(null);

export function BookmarkStoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<BookmarkStore | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createBookmarkStore({
      storage: createLocalStorageAdapter(),
    });
  }
  return (
    <BookmarkStoreContext.Provider value={storeRef.current}>
      {children}
    </BookmarkStoreContext.Provider>
  );
}

/** The raw store, for code that subscribes outside React (cloud sync). */
export function useBookmarkStoreApi(): BookmarkStore {
  const store = useContext(BookmarkStoreContext);
  if (store === null) {
    throw new Error('useBookmarkStoreApi must be used inside <BookmarkStoreProvider>.');
  }
  return store;
}

export function useBookmarkStore<T>(selector: (state: BookmarkStoreState) => T): T {
  return useStore(useBookmarkStoreApi(), selector);
}
