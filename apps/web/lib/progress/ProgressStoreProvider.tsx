'use client';

import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import type { StoreApi } from 'zustand';
import { useStore } from 'zustand';

import { DEFAULT_STORAGE_KEY, createProgressStore, type ProgressStoreState } from '@learn365/core';

import {
  createProgressAdapter,
  progressDeltaCodec,
  type ProgressDelta,
} from '@/lib/sync/progressAdapter';
import { createStoreSync, followOtherTabs, type StoreSync } from '@/lib/sync/storeSync';

import { createLocalStorageAdapter } from './localStorageAdapter';

type ProgressStore = StoreApi<ProgressStoreState>;

interface ProgressStoreValue {
  readonly store: ProgressStore;
  readonly sync: StoreSync<ProgressDelta>;
}

const ProgressStoreContext = createContext<ProgressStoreValue | null>(null);

export function ProgressStoreProvider({ children }: { children: ReactNode }) {
  const valueRef = useRef<ProgressStoreValue | null>(null);
  if (valueRef.current === null) {
    const store = createProgressStore({
      storage: createLocalStorageAdapter(),
    });
    // Phase 23: the journal subscribes with the store, before any page
    // effect runs, so every signed-in change is queued from the first one.
    valueRef.current = {
      store,
      sync: createStoreSync('progress', createProgressAdapter(store), progressDeltaCodec),
    };
  }
  const { store, sync } = valueRef.current;
  useEffect(
    () => followOtherTabs(store, DEFAULT_STORAGE_KEY, sync.journal, () => ({ byCourse: {} })),
    [store, sync],
  );
  return (
    <ProgressStoreContext.Provider value={valueRef.current}>
      {children}
    </ProgressStoreContext.Provider>
  );
}

/** The raw store, for code that subscribes outside React (cloud sync). */
export function useProgressStoreApi(): ProgressStore {
  return useStoreValue().store;
}

/** The store's sync glue (adapter, pending queue, journal) for `CloudSync`. */
export function useProgressSync(): StoreSync<ProgressDelta> {
  return useStoreValue().sync;
}

function useStoreValue(): ProgressStoreValue {
  const value = useContext(ProgressStoreContext);
  if (value === null) {
    throw new Error('useProgressStoreApi must be used inside <ProgressStoreProvider>.');
  }
  return value;
}

export function useProgressStore<T>(selector: (state: ProgressStoreState) => T): T {
  return useStore(useProgressStoreApi(), selector);
}
