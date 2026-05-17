import type { EraId, Lesson, LessonId, SectionId } from '@learn365/content/types';

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

/**
 * "Where is the user in the course right now?" — used by both the Course
 * overview (to pick which era/section to default-expand) and the lesson
 * sidebar (to pick which section to keep open) so the two surfaces always
 * agree.
 *
 * Resolution order:
 *   1. `lastOpenedLessonId` if it points to a real lesson in this course
 *   2. otherwise the first lesson not in `completedIds`
 *   3. otherwise the first lesson in the course
 *
 * Returns `null` only when the lesson list is empty, which should be
 * impossible in practice — the caller can safely narrow with `?.`.
 */
export interface ActiveLocation {
  readonly lessonId: LessonId;
  readonly sectionId: SectionId;
  readonly eraId: EraId;
}

export function findActiveLocation(
  lessons: readonly Lesson[],
  completedIds: ReadonlySet<LessonId> | null,
  lastOpenedLessonId: LessonId | null,
): ActiveLocation | null {
  if (lessons.length === 0) return null;

  if (lastOpenedLessonId !== null) {
    const last = lessons.find((l) => l.id === lastOpenedLessonId);
    if (last) {
      return { lessonId: last.id, sectionId: last.sectionId, eraId: last.eraId };
    }
  }

  if (completedIds && completedIds.size > 0) {
    const firstIncomplete = lessons.find((l) => !completedIds.has(l.id));
    if (firstIncomplete) {
      return {
        lessonId: firstIncomplete.id,
        sectionId: firstIncomplete.sectionId,
        eraId: firstIncomplete.eraId,
      };
    }
  }

  const first = lessons[0];
  if (!first) return null;
  return { lessonId: first.id, sectionId: first.sectionId, eraId: first.eraId };
}
