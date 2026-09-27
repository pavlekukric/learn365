'use client';

import { createContext, useContext, useRef, type ReactNode } from 'react';
import type { StoreApi } from 'zustand';
import { useStore } from 'zustand';

import {
  createProgressStore,
  type ProgressStoreState,
} from '@learn365/core';

import { createLocalStorageAdapter } from './localStorageAdapter';

type ProgressStore = StoreApi<ProgressStoreState>;

const ProgressStoreContext = createContext<ProgressStore | null>(null);

export function ProgressStoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<ProgressStore | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createProgressStore({
      storage: createLocalStorageAdapter(),
    });
  }
  return (
    <ProgressStoreContext.Provider value={storeRef.current}>
      {children}
    </ProgressStoreContext.Provider>
  );
}

/** The raw store, for code that subscribes outside React (cloud sync). */
export function useProgressStoreApi(): ProgressStore {
  const store = useContext(ProgressStoreContext);
  if (store === null) {
    throw new Error('useProgressStoreApi must be used inside <ProgressStoreProvider>.');
  }
  return store;
}

export function useProgressStore<T>(selector: (state: ProgressStoreState) => T): T {
  return useStore(useProgressStoreApi(), selector);
}
