import type { CourseId, LessonId } from '@learn365/content/types';

import type { ProgressState } from './types.js';

export interface ProgressBreakdown {
  readonly done: number;
  readonly total: number;
  readonly pct: number;
}

export interface CourseProgressBreakdown extends ProgressBreakdown {
  readonly remaining: number;
}

function safePct(done: number, total: number): number {
  if (total <= 0) return 0;
  return (done / total) * 100;
}

/** Did the user complete this lesson? */
export function isCompleted(
  state: ProgressState,
  courseId: CourseId,
  lessonId: LessonId,
): boolean {
  return state.byCourse[courseId]?.completedLessonIds.has(lessonId) ?? false;
}

/** Total completed-lesson count for a course (regardless of section/era). */
export function completedCount(state: ProgressState, courseId: CourseId): number {
  return state.byCourse[courseId]?.completedLessonIds.size ?? 0;
}

/** Last lesson the user opened in this course, if any. */
export function lastOpenedLessonId(
  state: ProgressState,
  courseId: CourseId,
): LessonId | null {
  return state.byCourse[courseId]?.lastOpenedLessonId ?? null;
}

/**
 * Progress breakdown for an arbitrary lesson-id list — used by callers
 * that already know which lessons belong to the section/era they care
 * about (typically derived from `@learn365/content` helpers).
 */
export function progressForLessons(
  state: ProgressState,
  courseId: CourseId,
  lessonIds: readonly LessonId[],
): ProgressBreakdown {
  const completed = state.byCourse[courseId]?.completedLessonIds;
  if (!completed) {
    return { done: 0, total: lessonIds.length, pct: 0 };
  }
  let done = 0;
  for (const id of lessonIds) {
    if (completed.has(id)) done += 1;
  }
  return { done, total: lessonIds.length, pct: safePct(done, lessonIds.length) };
}

/** Convenience alias for section progress — semantically identical. */
export const sectionProgress = progressForLessons;
/** Convenience alias for era progress — semantically identical. */
export const eraProgress = progressForLessons;

/**
 * Whole-course breakdown. `totalLessons` is taken from the `Course`
 * record (typically 365), so the store doesn't need to know how big
 * the course is.
 */
export function courseProgress(
  state: ProgressState,
  courseId: CourseId,
  totalLessons: number,
): CourseProgressBreakdown {
  const done = completedCount(state, courseId);
  return {
    done,
    total: totalLessons,
    pct: safePct(done, totalLessons),
    remaining: Math.max(0, totalLessons - done),
  };
}
