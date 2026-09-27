/**
 * Remembers which account a browser's local state was last merged into, so
 * the union-merge (`POST …/sync`) runs once per (browser, user) and every
 * later load takes the account's state as authoritative (`GET`).
 */
export interface Marker {
  read(): string | null;
  write(userId: string): void;
}

export function localStorageMarker(key: string): Marker {
  return {
    read() {
      if (typeof window === 'undefined') return null;
      try {
        const raw = window.localStorage.getItem(key);
        if (raw === null) return null;
        const parsed: unknown = JSON.parse(raw);
        const userId =
          parsed !== null && typeof parsed === 'object'
            ? (parsed as { userId?: unknown }).userId
            : undefined;
        return typeof userId === 'string' ? userId : null;
      } catch {
        return null;
      }
    },
    write(userId) {
      if (typeof window === 'undefined') return;
      try {
        window.localStorage.setItem(key, JSON.stringify({ userId, syncedAt: new Date().toISOString() }));
      } catch {
        // private mode / quota — the merge simply runs again next load.
      }
    },
  };
}

/** In-memory marker for tests. */
export function memoryMarker(initial: string | null = null): Marker & { value: string | null } {
  const marker = {
    value: initial,
    read() {
      return marker.value;
    },
    write(userId: string) {
      marker.value = userId;
    },
  };
  return marker;
}
