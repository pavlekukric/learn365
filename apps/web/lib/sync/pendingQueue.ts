import { TAB_ID } from './tabLock';

/**
 * Changes not yet acknowledged by the account, kept in `localStorage`
 * (Phase 23, review 2026-10-01 P1 item 4). Before this the sync engine held
 * them in memory only, so a reload inside the debounce, a closed tab during
 * an outage or offline, or an expired session dropped them — the next
 * load's `GET` then overwrote the local copy.
 *
 * Key: `learn365:cloud:pending:v1:<kind>:<userId>:<tabId>` → `{ [courseId]: delta }`.
 * **One key per tab, written only by that tab.** `localStorage` is not
 * transactional across tabs (each renderer has its own cached copy), so a
 * shared key's read-modify-write in two tabs could drop one tab's change.
 * Each tab sends and acks its own key; a key whose tab is gone (closed,
 * reloaded — `tabLock.ts`) is adopted by the next engine that starts or
 * flushes, and sent from there. Deltas are idempotent sets, so a change
 * sent twice is harmless.
 *
 * Only an account's own queues are ever replayed; queues of other accounts
 * are deleted when an engine starts for a different user, never sent.
 */
export const PENDING_QUEUE_PREFIX = 'learn365:cloud:pending:v1:';

/** How one store's delta is stored and folded. */
export interface DeltaCodec<Delta> {
  /** Fold a newer delta into an older one. */
  merge(into: Delta, next: Delta): Delta;
  /** `queued` minus what `sent` already delivered; changes made since stay. */
  subtract(queued: Delta, sent: Delta): Delta;
  isEmpty(delta: Delta): boolean;
  toJSON(delta: Delta): unknown;
  /** `null` for a malformed entry (it is dropped). */
  fromJSON(value: unknown): Delta | null;
}

/** The subset of `Storage` the queue needs (injectable for tests). */
export type QueueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'>;

export interface PendingQueue<Delta> {
  /** This tab's queue for `userId`. */
  read(userId: string): Map<string, Delta>;
  /** Every tab's queue for `userId`, merged (to re-apply over a snapshot). */
  readAll(userId: string): Map<string, Delta>;
  add(userId: string, courseId: string, delta: Delta): void;
  ack(userId: string, courseId: string, sent: Delta): void;
  /**
   * Move the queues of `userId` left by tabs not in `liveTabs` into this
   * tab's queue. `null` (the browser cannot tell) adopts every other tab's.
   */
  adoptOrphans(userId: string, liveTabs: ReadonlySet<string> | null): void;
  /** Delete the queues of every account except `userId`. */
  clearOthers(userId: string): void;
}

function browserStorage(): QueueStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** Every pending-queue key in `storage` (for sign-out). */
export function pendingQueueKeys(storage: QueueStorage | null = browserStorage()): string[] {
  if (storage === null) return [];
  const keys: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key?.startsWith(PENDING_QUEUE_PREFIX)) keys.push(key);
  }
  return keys;
}

export function createPendingQueue<Delta>(
  kind: 'progress' | 'bookmarks',
  codec: DeltaCodec<Delta>,
  getStorage: () => QueueStorage | null = browserStorage,
  tabId: string = TAB_ID,
): PendingQueue<Delta> {
  const prefix = `${PENDING_QUEUE_PREFIX}${kind}:`;
  const userPrefix = (userId: string) => `${prefix}${userId}:`;
  const ownKey = (userId: string) => `${userPrefix(userId)}${tabId}`;
  // Where storage is missing or refuses a write (private mode, quota), this
  // tab's queue lives here for this visit, so the engine still sends it.
  const memory = new Map<string, string>();

  const parse = (raw: string | null): Map<string, Delta> => {
    const result = new Map<string, Delta>();
    if (raw === null) return result;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (parsed === null || typeof parsed !== 'object') return result;
      for (const [courseId, value] of Object.entries(parsed as Record<string, unknown>)) {
        const delta = codec.fromJSON(value);
        if (delta !== null && !codec.isEmpty(delta)) result.set(courseId, delta);
      }
    } catch {
      // unreadable — treated as empty
    }
    return result;
  };

  const readKey = (key: string): Map<string, Delta> => {
    let raw = memory.get(key) ?? null;
    if (raw === null) {
      try {
        raw = getStorage()?.getItem(key) ?? null;
      } catch {
        raw = null;
      }
    }
    return parse(raw);
  };

  const removeKey = (key: string): void => {
    memory.delete(key);
    try {
      getStorage()?.removeItem(key);
    } catch {
      // ignore
    }
  };

  const writeOwn = (userId: string, entries: Map<string, Delta>): void => {
    const key = ownKey(userId);
    if (entries.size === 0) {
      removeKey(key);
      return;
    }
    const body: Record<string, unknown> = {};
    for (const [courseId, delta] of entries) body[courseId] = codec.toJSON(delta);
    const raw = JSON.stringify(body);
    try {
      const storage = getStorage();
      if (storage === null) throw new Error('no storage');
      storage.setItem(key, raw);
      memory.delete(key);
    } catch {
      memory.set(key, raw);
    }
  };

  const mergeInto = (target: Map<string, Delta>, source: Map<string, Delta>): void => {
    for (const [courseId, delta] of source) {
      const existing = target.get(courseId);
      target.set(courseId, existing === undefined ? delta : codec.merge(existing, delta));
    }
  };

  const keysOf = (userId: string): string[] =>
    pendingQueueKeys(getStorage()).filter((key) => key.startsWith(userPrefix(userId)));

  return {
    read: (userId) => readKey(ownKey(userId)),

    readAll(userId) {
      const result = new Map<string, Delta>();
      const own = ownKey(userId);
      for (const key of keysOf(userId)) {
        if (key !== own) mergeInto(result, readKey(key));
      }
      // Own last: it is the newest view of this tab's changes.
      mergeInto(result, readKey(own));
      return result;
    },

    add(userId, courseId, delta) {
      if (codec.isEmpty(delta)) return;
      const entries = readKey(ownKey(userId));
      mergeInto(entries, new Map([[courseId, delta]]));
      writeOwn(userId, entries);
    },

    ack(userId, courseId, sent) {
      const entries = readKey(ownKey(userId));
      const queued = entries.get(courseId);
      if (queued === undefined) return;
      const rest = codec.subtract(queued, sent);
      if (codec.isEmpty(rest)) entries.delete(courseId);
      else entries.set(courseId, rest);
      writeOwn(userId, entries);
    },

    adoptOrphans(userId, liveTabs) {
      const own = ownKey(userId);
      const orphans = keysOf(userId).filter((key) => {
        if (key === own) return false;
        const owner = key.slice(userPrefix(userId).length);
        return liveTabs === null || !liveTabs.has(owner);
      });
      if (orphans.length === 0) return;
      // Orphans in no particular order, own queue last (its changes are the newest).
      const entries = new Map<string, Delta>();
      for (const key of orphans) mergeInto(entries, readKey(key));
      mergeInto(entries, readKey(own));
      writeOwn(userId, entries);
      for (const key of orphans) removeKey(key);
    },

    clearOthers(userId) {
      const keep = userPrefix(userId);
      for (const key of [...memory.keys()]) {
        if (!key.startsWith(keep)) memory.delete(key);
      }
      for (const key of pendingQueueKeys(getStorage())) {
        if (key.startsWith(prefix) && !key.startsWith(keep)) removeKey(key);
      }
    },
  };
}
