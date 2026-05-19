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

export function useBookmarkStore<T>(selector: (state: BookmarkStoreState) => T): T {
  const store = useContext(BookmarkStoreContext);
  if (store === null) {
    throw new Error('useBookmarkStore must be used inside <BookmarkStoreProvider>.');
  }
  return useStore(store, selector);
}
