interface EraSpan {
  readonly id: string;
  readonly yearStart: number;
  readonly yearEnd: number;
}

interface EraStat {
  readonly lessonCount: number;
  readonly completedCount: number;
}

/**
 * Normalize a list of non-negative weights into percentages that sum to 100.
 * Non-finite or non-positive weights are treated as 0; a degenerate total
 * (all zero / empty) falls back to equal shares so callers never divide by
 * zero.
 */
export function bandWeightPercents(weights: readonly number[]): number[] {
  const n = weights.length;
  if (n === 0) return [];
  const safe = weights.map((w) => (Number.isFinite(w) && w > 0 ? w : 0));
  const total = safe.reduce((sum, w) => sum + w, 0);
  if (total <= 0) return safe.map(() => 100 / n);
  return safe.map((w) => (w / total) * 100);
}

/**
 * Compute the marker's position (0..100) along the timeline. The marker lives
 * inside the era whose `id` matches `currentEraId`, offset within that era's
 * band by `year`.
 *
 * `weights` (typically per-era lesson counts) make the bands proportional;
 * when omitted, or when its length doesn't match `eras`, the bands are
 * treated as equal-width.
 *
 * Falls back to 0 when the era is unknown or the list is empty.
 */
export function markerPositionPercent(
  eras: readonly EraSpan[],
  currentEraId: string,
  year: number,
  weights?: readonly number[],
): number {
  if (eras.length === 0) return 0;
  const idx = eras.findIndex((e) => e.id === currentEraId);
  if (idx < 0) return 0;
  const era = eras[idx];
  if (!era) return 0;

  const span = Math.max(1, era.yearEnd - era.yearStart);
  const localRaw = (year - era.yearStart) / span;
  const local = localRaw < 0 ? 0 : localRaw > 1 ? 1 : localRaw;

  const bandWidths =
    weights && weights.length === eras.length
      ? bandWeightPercents(weights)
      : eras.map(() => 100 / eras.length);

  let offset = 0;
  for (let i = 0; i < idx; i += 1) {
    offset += bandWidths[i] ?? 0;
  }
  return offset + local * (bandWidths[idx] ?? 0);
}

/**
 * The fraction (0..100) of the course the user has completed — total completed
 * lessons over total lessons. Because the rail's bands are weighted by lesson
 * count, this percentage maps directly onto the rail as a progress fill.
 *
 * `completedCount` is clamped to `lessonCount` per era so stale/over-counted
 * input can't push the fill past 100.
 */
export function timelineFillPercent(stats: readonly EraStat[]): number {
  let total = 0;
  let done = 0;
  for (const s of stats) {
    const count =
      Number.isFinite(s.lessonCount) && s.lessonCount > 0 ? s.lessonCount : 0;
    const completed =
      Number.isFinite(s.completedCount) && s.completedCount > 0
        ? s.completedCount
        : 0;
    total += count;
    done += Math.min(completed, count);
  }
  if (total <= 0) return 0;
  return (done / total) * 100;
}
