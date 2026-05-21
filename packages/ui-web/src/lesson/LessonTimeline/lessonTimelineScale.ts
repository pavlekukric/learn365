/**
 * Scale math for the editorial lesson-timeline divider.
 *
 * This is deliberately NOT an academic, globally-proportional timeline. A
 * single linear axis from ~9500 BCE to today would crush every historical
 * lesson into the far right and make the divider unreadable. Instead we render
 * a small, local window of round year ticks centred on the current lesson, with
 * one marker for "you are roughly here". Approximate orientation is the goal.
 */

/** A computed scale: a handful of round tick years + the marker position. */
export interface LessonTimelineScale {
  /** 5 round year values, ascending. Negative = BCE. */
  readonly ticks: readonly number[];
  /** Marker position along the window, 0..100 (%). */
  readonly markerPercent: number;
}

/**
 * Display ceiling for the tick window. The course runs to the present, so we
 * never want the window to trail off into far-future round numbers — at most
 * one tick may sit just past this cap.
 */
const DISPLAY_MAX_YEAR = 2030;

const TICK_COUNT = 5;

/**
 * Pick a "nice" round step (in years) for the tick spacing based on how deep in
 * time the lesson sits. Recent/medieval history reads century-by-century;
 * antiquity and prehistory need progressively broader bands so the labels stay
 * short and uncrowded.
 */
function pickStep(year: number): number {
  const magnitude = Math.abs(year);
  if (magnitude < 2500) return 100;
  if (magnitude < 7000) return 1000;
  return 2000;
}

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/**
 * Build the tick window + marker position for a lesson year.
 *
 * The window is `TICK_COUNT` round ticks (step chosen by magnitude), centred on
 * the year so the marker lands near the middle. A soft cap keeps the window
 * from extending more than one step past the present day. Returns `null` for a
 * non-finite year so callers can fall back to a plain divider.
 */
export function buildLessonTimelineScale(year: number): LessonTimelineScale | null {
  if (!Number.isFinite(year)) return null;

  const step = pickStep(year);
  const span = (TICK_COUNT - 1) * step;

  // Centre the window on the year, then nudge left so we never show more than
  // one round tick beyond the display ceiling.
  const centredStart = Math.round(year / step) * step - 2 * step;
  const maxStart = Math.ceil(DISPLAY_MAX_YEAR / step) * step - span;
  const start = Math.min(centredStart, maxStart);

  const ticks = Array.from({ length: TICK_COUNT }, (_, i) => start + i * step);
  const markerPercent = clamp(((year - start) / span) * 100, 0, 100);

  return { ticks, markerPercent };
}

/**
 * Compact Serbian label for a tick year. CE years are the bare numeral; BCE
 * years carry a short "p. n. e." suffix. Matches the editorial register of the
 * desktop timeline rail.
 */
export function formatTickYear(year: number): string {
  if (year < 0) return `${String(Math.abs(year))} p. n. e.`;
  return String(year);
}
