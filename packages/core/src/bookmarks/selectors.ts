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

// A WeakMap cache mapping each ReadonlySet<LessonId> snapshot to its
// frozen-array projection. The store creates a NEW Set on every
// `toggleBookmark` ([store.ts:55](./store.ts)), so cache lookups stay valid
// across reads of the same state but get invalidated on real mutations.
// Why this matters: `bookmarkedLessonIds` is consumed through
// `useSyncExternalStore` (via Zustand's `useStore`). React 19 enforces a
// strict identity check on the snapshot — returning a fresh `[]` every read
// triggers "Maximum update depth exceeded" because each render schedules
// another render. The cache makes the projection referentially stable.
const arrayCache = new WeakMap<ReadonlySet<LessonId>, readonly LessonId[]>();
const EMPTY: readonly LessonId[] = Object.freeze([]);

/**
 * Bookmarked lesson ids for a course, in insertion order. Referentially
 * stable across reads of the same state — safe to consume through
 * `useSyncExternalStore` without an external equality function.
 */
export function bookmarkedLessonIds(
  state: BookmarkState,
  courseId: CourseId,
): readonly LessonId[] {
  const set = state.byCourse[courseId]?.lessonIds;
  if (!set) return EMPTY;
  const cached = arrayCache.get(set);
  if (cached) return cached;
  const next = Object.freeze(Array.from(set)) as readonly LessonId[];
  arrayCache.set(set, next);
  return next;
}
