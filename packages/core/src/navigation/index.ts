import type { LessonId, LessonSummary } from '@learn365/content/types';

/**
 * Find the previous lesson in a sorted lesson list, or null if the
 * current lesson is the first (or not in the list).
 *
 * Callers pass the full course lesson list, already sorted by `dayNumber`.
 * Sorting is the caller's responsibility — typically a `content` helper.
 */
export function findPrevLesson(
  lessons: readonly LessonSummary[],
  currentLessonId: LessonId,
): LessonSummary | null {
  const idx = lessons.findIndex((l) => l.id === currentLessonId);
  if (idx <= 0) return null;
  return lessons[idx - 1] ?? null;
}

/** Find the next lesson in a sorted lesson list, or null if last. */
export function findNextLesson(
  lessons: readonly LessonSummary[],
  currentLessonId: LessonId,
): LessonSummary | null {
  const idx = lessons.findIndex((l) => l.id === currentLessonId);
  if (idx < 0 || idx === lessons.length - 1) return null;
  return lessons[idx + 1] ?? null;
}

/**
 * "Which lesson should *Nastavi* open?" — the single resume rule shared by
 * the Home hero CTA, the Home recommended-lesson card, the Home era rail,
 * the Course overview progress card and the overview's highlighted tree
 * row, so those surfaces can never disagree.
 *
 * Resume follows what the reader has *read*, not what they merely opened
 * (Phase 21, owner-approved): one curious tap on Day 250 must not move
 * "Tvoj N. dan" 247 days ahead. `lastOpenedLessonId` is still stored and
 * synced, but it no longer decides where the reader continues.
 *   1. nothing completed → the first lesson (Day 1)
 *   2. otherwise the first unread lesson after the highest-numbered
 *      completed one (the reader's frontier)
 *   3. if nothing after it is unread, the earliest unread lesson (the gaps
 *      left behind, e.g. after reading the course's last day first)
 *   4. `null` when every lesson is completed
 *
 * `lessons` must be sorted by `dayNumber`, as for the prev / next helpers.
 */
export function findResumeLesson(
  lessons: readonly LessonSummary[],
  completedIds: ReadonlySet<LessonId> | null,
): LessonSummary | null {
  const done = completedIds ?? new Set<LessonId>();
  let frontier = -1;
  for (let i = lessons.length - 1; i >= 0; i -= 1) {
    const candidate = lessons[i];
    if (candidate !== undefined && done.has(candidate.id)) {
      frontier = i;
      break;
    }
  }
  const afterFrontier = lessons.slice(frontier + 1).find((l) => !done.has(l.id));
  return afterFrontier ?? lessons.find((l) => !done.has(l.id)) ?? null;
}
