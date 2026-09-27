/**
 * Small pure helpers shared by the progress and bookmark merge logic and by
 * the web app's cloud-sync layer. No I/O, no React, no store knowledge.
 */

/** The "never" timestamp a snapshot carries before anything was recorded. */
export const EPOCH_ISO = '1970-01-01T00:00:00.000Z';

function toMillis(iso: string): number {
  const millis = Date.parse(iso);
  return Number.isNaN(millis) ? Number.NEGATIVE_INFINITY : millis;
}

/**
 * Compare two ISO timestamps: negative when `a` is earlier, positive when
 * later, `0` when equal or both unparseable. Unparseable values sort first.
 */
export function compareTimestamps(a: string, b: string): number {
  const ma = toMillis(a);
  const mb = toMillis(b);
  if (ma === mb) return 0;
  return ma < mb ? -1 : 1;
}

export function laterTimestamp(a: string, b: string): string {
  return compareTimestamps(a, b) >= 0 ? a : b;
}

export interface SetDiff<T> {
  readonly added: readonly T[];
  readonly removed: readonly T[];
}

/** What changed between two id sets; either side may be absent (empty). */
export function diffSets<T>(
  prev: ReadonlySet<T> | undefined,
  next: ReadonlySet<T> | undefined,
): SetDiff<T> {
  const added: T[] = [];
  const removed: T[] = [];
  if (next) {
    for (const id of next) {
      if (!prev?.has(id)) added.push(id);
    }
  }
  if (prev) {
    for (const id of prev) {
      if (!next?.has(id)) removed.push(id);
    }
  }
  return { added, removed };
}

/** Union that keeps `base` order first, then new ids in `extra` order. */
export function unionIds<T>(base: readonly T[], extra: readonly T[]): T[] {
  const seen = new Set<T>(base);
  const out = [...base];
  for (const id of extra) {
    if (!seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}
