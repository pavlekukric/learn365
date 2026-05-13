interface EraSpan {
  readonly id: string;
  readonly yearStart: number;
  readonly yearEnd: number;
}

/**
 * Compute the marker's left-percent position (0..100) along an equal-width
 * timeline of `eras.length` bands. The marker lives inside the era whose `id`
 * matches `currentEraId`, with horizontal offset interpolated by `year`.
 *
 * Falls back to 0 when the era is unknown.
 */
export function markerPositionPercent(
  eras: readonly EraSpan[],
  currentEraId: string,
  year: number,
): number {
  if (eras.length === 0) return 0;
  const idx = eras.findIndex((e) => e.id === currentEraId);
  if (idx < 0) return 0;
  const era = eras[idx];
  if (!era) return 0;
  const span = Math.max(1, era.yearEnd - era.yearStart);
  const localRaw = (year - era.yearStart) / span;
  const local = localRaw < 0 ? 0 : localRaw > 1 ? 1 : localRaw;
  const bandWidth = 100 / eras.length;
  return idx * bandWidth + local * bandWidth;
}
