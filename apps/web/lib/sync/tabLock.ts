/**
 * Which tabs are alive (Phase 23). Every tab holds a Web Lock named after
 * its random id for as long as its document lives; the browser releases it
 * when the tab closes or reloads. A sync engine can then tell a pending
 * queue left by a closed tab (adopt and send it) from one a live tab is
 * still writing (leave it to that tab).
 */
const LOCK_PREFIX = 'learn365:tab:';

function randomId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
}

/** This document's id; a reload or a duplicated tab gets a new one. */
export const TAB_ID = randomId();

interface LockManagerLike {
  request(name: string, callback: () => Promise<void>): Promise<void>;
  query(): Promise<{ held?: { name?: string }[] }>;
}

function lockManager(): LockManagerLike | null {
  if (typeof navigator === 'undefined') return null;
  const locks = (navigator as { locks?: LockManagerLike }).locks;
  return locks ?? null;
}

let held = false;

/** Take this tab's lock (once); it is never released while the tab lives. */
export function holdTabLock(): void {
  if (held) return;
  const locks = lockManager();
  if (locks === null) return;
  held = true;
  void locks
    .request(`${LOCK_PREFIX}${TAB_ID}`, () => new Promise<void>(() => undefined))
    .catch(() => undefined);
}

/** Ids of the tabs alive right now, or `null` when the browser cannot tell. */
export async function liveTabIds(): Promise<Set<string> | null> {
  const locks = lockManager();
  if (locks === null) return null;
  try {
    const { held: locksHeld = [] } = await locks.query();
    const ids = new Set<string>([TAB_ID]);
    for (const lock of locksHeld) {
      if (lock.name?.startsWith(LOCK_PREFIX)) ids.add(lock.name.slice(LOCK_PREFIX.length));
    }
    return ids;
  } catch {
    return null;
  }
}
