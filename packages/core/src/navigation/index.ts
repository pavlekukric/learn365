import type { Lesson, LessonId } from '@learn365/content/types';

/**
 * Find the previous lesson in a sorted lesson list, or null if the
 * current lesson is the first (or not in the list).
 *
 * Callers pass the full course lesson list, already sorted by `dayNumber`.
 * Sorting is the caller's responsibility — typically a `content` helper.
 */
export function findPrevLesson(
  lessons: readonly Lesson[],
  currentLessonId: LessonId,
): Lesson | null {
  const idx = lessons.findIndex((l) => l.id === currentLessonId);
  if (idx <= 0) return null;
  return lessons[idx - 1] ?? null;
}

/** Find the next lesson in a sorted lesson list, or null if last. */
export function findNextLesson(
  lessons: readonly Lesson[],
  currentLessonId: LessonId,
): Lesson | null {
  const idx = lessons.findIndex((l) => l.id === currentLessonId);
  if (idx < 0 || idx === lessons.length - 1) return null;
  return lessons[idx + 1] ?? null;
}

/** Derived lesson display state. Pure, no React. */
export type LessonViewState = 'completed' | 'active' | 'not_started';

export function lessonViewState(args: {
  isCompleted: boolean;
  isActive: boolean;
}): LessonViewState {
  if (args.isCompleted) return 'completed';
  if (args.isActive) return 'active';
  return 'not_started';
}
