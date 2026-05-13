import type { ProgressStorage } from '@learn365/core';

/**
 * Web `ProgressStorage` adapter backed by `window.localStorage`.
 *
 * Returns a no-op shape on the server so the store can be instantiated
 * during SSR without throwing. Real reads/writes only happen in the
 * browser, which matches the v1 spec: progress is per-device.
 */
export function createLocalStorageAdapter(): ProgressStorage {
  const hasWindow = typeof window !== 'undefined';
  return {
    getItem(key) {
      if (!hasWindow) return null;
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem(key, value) {
      if (!hasWindow) return;
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // private mode or quota exceeded — silently drop.
      }
    },
    removeItem(key) {
      if (!hasWindow) return;
      try {
        window.localStorage.removeItem(key);
      } catch {
        // ignore
      }
    },
  };
}
