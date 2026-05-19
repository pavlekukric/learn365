import type { BookmarkStorage } from '@learn365/core';

/**
 * Web `BookmarkStorage` adapter backed by `window.localStorage`. Mirrors
 * the shape and SSR safety of `createLocalStorageAdapter` in `progress/`.
 */
export function createLocalStorageAdapter(): BookmarkStorage {
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
