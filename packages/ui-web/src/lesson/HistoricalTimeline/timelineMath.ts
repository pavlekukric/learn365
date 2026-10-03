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
 * The smallest share of the rail any era band may take (Phase 13). Below it a
 * short label (`eraShort`) cannot fit on two lines even on a wide Home rail;
 * 9 % is the smallest share at which "Savremena Srbija" fits at 14 px on a
 * 1440 px Home rail (text box ≥ 78 px). Today only era VIII (25 of 365
 * lessons) is raised.
 */
export const MIN_BAND_SHARE = 0.09;

/**
 * Raise every weight below `minShare` of the total to that floor. The result
 * feeds the CSS band widths, the marker and the fill alike, so the three
 * always agree — unlike a pixel `min-width` the maths cannot see. Non-finite
 * or non-positive weights count as 0; an all-zero list is returned as is.
 */
export function flooredWeights(
  weights: readonly number[],
  minShare: number = MIN_BAND_SHARE,
): number[] {
  const safe = weights.map((w) => (Number.isFinite(w) && w > 0 ? w : 0));
  const total = safe.reduce((sum, w) => sum + w, 0);
  if (total <= 0 || minShare <= 0) return safe;
  const floor = total * minShare;
  return safe.map((w) => Math.max(w, floor));
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
 * The fraction (0..100) of the rail the progress fill covers. Each era
 * contributes its completed fraction times its band weight, so the fill ends
 * exactly where the bands say it should. Without `weights` (or with a
 * mismatched length) the lesson counts are the weights, which reduces to
 * "total completed over total lessons" — the pre-Phase-13 formula.
 *
 * `completedCount` is clamped to `lessonCount` per era so stale/over-counted
 * input can't push the fill past 100.
 */
export function timelineFillPercent(
  stats: readonly EraStat[],
  weights?: readonly number[],
): number {
  const useWeights = weights !== undefined && weights.length === stats.length;
  let totalWeight = 0;
  let filled = 0;
  stats.forEach((s, i) => {
    const count = Number.isFinite(s.lessonCount) && s.lessonCount > 0 ? s.lessonCount : 0;
    const completed =
      Number.isFinite(s.completedCount) && s.completedCount > 0 ? s.completedCount : 0;
    const rawWeight = useWeights ? (weights[i] ?? 0) : count;
    const weight = Number.isFinite(rawWeight) && rawWeight > 0 ? rawWeight : 0;
    const fraction = count > 0 ? Math.min(completed, count) / count : 0;
    totalWeight += weight;
    filled += fraction * weight;
  });
  if (totalWeight <= 0) return 0;
  return (filled / totalWeight) * 100;
}
