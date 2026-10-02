import { formatDayProse } from '@learn365/core';

/**
 * What the post-completion footer says — decided by the lesson's position
 * in the course and by whether the course is finished, never by how many
 * lessons happen to be read (review 2026-10-01: Day 365 read first said
 * "Prvi dan je iza tebe." above "Kraj kursa").
 *
 *   - `finished`  every lesson is read: a short heading and one line, the
 *                 course's calm finish moment (no confetti, no score).
 *   - `lastDay`   the course's last lesson is read, others are not: say so,
 *                 and how many remain.
 *   - `day`       any other lesson: "Prvi dan je iza tebe." on Day 1,
 *                 otherwise "Dan N je iza tebe."
 */
export type CompletionMoment =
  | { readonly kind: 'finished'; readonly heading: string; readonly line: string }
  | { readonly kind: 'lastDay'; readonly line: string; readonly remaining: string }
  | { readonly kind: 'day'; readonly line: string };

/** Serbian count of lessons: 1 / 21 → "lekcija", 2–4 / 22–24 → "lekcije", else "lekcija". */
export function formatLessonCount(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  const word = mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? 'lekcije' : 'lekcija';
  return `${String(n)} ${word}`;
}

export function completionMoment(args: {
  /** Day number of the lesson just completed. */
  readonly dayNumber: number;
  /** `true` when the lesson is the course's last one (no next lesson). */
  readonly isLastLesson: boolean;
  /** Course-wide completed count after this completion. */
  readonly completedCount: number;
  readonly totalLessons: number;
}): CompletionMoment {
  const { dayNumber, isLastLesson, completedCount, totalLessons } = args;
  if (totalLessons > 0 && completedCount >= totalLessons) {
    return {
      kind: 'finished',
      heading: 'Kurs je završen.',
      line: `Svih ${String(totalLessons)} dana je iza tebe.`,
    };
  }
  if (isLastLesson) {
    return {
      kind: 'lastDay',
      line: 'Poslednja lekcija kursa je iza tebe.',
      remaining: `Do kraja kursa: još ${formatLessonCount(totalLessons - completedCount)}`,
    };
  }
  return {
    kind: 'day',
    line: dayNumber === 1 ? 'Prvi dan je iza tebe.' : `${formatDayProse(dayNumber)} je iza tebe.`,
  };
}
