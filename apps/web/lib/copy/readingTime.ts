import { getReadingTimeRange } from '@learn365/content';

import { DEFAULT_COURSE_ID } from '@/lib/defaultCourse';

/**
 * The reading-time promise, computed from the corpus (Phase 11).
 *
 * Every lesson's `readingTimeMinutes` is derived from its text by the content
 * loader, so the range across the course is the honest thing to promise. The
 * Home hero contract line, the how-it-works step and the About mission all
 * interpolate `READING_TIME_LABEL` — no surface carries a literal number of
 * minutes any more, and the label moves by itself when the corpus does.
 */

export interface ReadingTimeRange {
  readonly min: number;
  readonly max: number;
}

/** Serbian count word: 1 → "minut", everything else (2–4 paucal, 5+ genitive plural, ranges) → "minuta". */
function minutesWord(n: number): string {
  return n % 10 === 1 && n % 100 !== 11 ? 'minut' : 'minuta';
}

/** `5–7 minuta`; `6 minuta` when the range collapses; `1 minut` for one. */
export function formatReadingTimeRange(range: ReadingTimeRange): string {
  if (range.min === range.max) return `${String(range.min)} ${minutesWord(range.min)}`;
  return `${String(range.min)}–${String(range.max)} minuta`;
}

export function readingTimeLabel(courseId: string = DEFAULT_COURSE_ID): string {
  const range = getReadingTimeRange(courseId);
  if (!range) {
    throw new Error(`Course "${courseId}" has no authored lesson to derive a reading time from.`);
  }
  return formatReadingTimeRange(range);
}

/** The default course's range, formatted once at module load (e.g. `5–7 minuta`). */
export const READING_TIME_LABEL = readingTimeLabel();
