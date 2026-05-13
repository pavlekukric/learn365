/** Clamp an arbitrary number into the [0, 1] range. NaN maps to 0. */
export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/** Convert a 0..1 value into a rounded percentage integer (0..100). */
export function toPercentInt(value: number): number {
  return Math.round(clamp01(value) * 100);
}
