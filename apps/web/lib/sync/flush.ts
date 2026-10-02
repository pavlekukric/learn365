import type { SyncHandle } from './syncEngine';

/** The running sync engines (registered by `CloudSync`), so `Odjava` can send the queue first. */
export const runningSync = new Set<SyncHandle>();

/**
 * Best-effort: send every queued change now, waiting at most `timeoutMs`
 * (the sign-out button must never hang). Resolves either way.
 */
export function flushCloudSync(timeoutMs = 2000): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const all = Promise.all([...runningSync].map((handle) => handle.flush())).then(() => undefined);
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, timeoutMs);
  });
  return Promise.race([all, timeout]).finally(() => {
    clearTimeout(timer);
  });
}
