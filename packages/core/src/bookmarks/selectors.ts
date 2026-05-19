import type { CourseId, LessonId } from '@learn365/content/types';

import type { BookmarkState } from './types.js';

/** Did the user bookmark this lesson? */
export function isBookmarked(
  state: BookmarkState,
  courseId: CourseId,
  lessonId: LessonId,
): boolean {
  return state.byCourse[courseId]?.lessonIds.has(lessonId) ?? false;
}

/** Total bookmark count for a course. */
export function bookmarkCount(state: BookmarkState, courseId: CourseId): number {
  return state.byCourse[courseId]?.lessonIds.size ?? 0;
}

/**
 * Bookmarked lesson ids for a course, in insertion order. Returns a fresh
 * array each call so callers can use it as a `useMemo`/`useSyncExternalStore`
 * dependency without worrying about referential aliasing of the underlying
 * Set.
 */
export function bookmarkedLessonIds(
  state: BookmarkState,
  courseId: CourseId,
): readonly LessonId[] {
  const set = state.byCourse[courseId]?.lessonIds;
  return set ? Array.from(set) : [];
}
