'use client';

import {
  getLessonById,
  getLessons,
  type CourseId,
} from '@learn365/content';
import {
  completedCount,
  lastOpenedLessonId,
} from '@learn365/core';
import { CourseProgress } from '@learn365/ui-web';

import { useProgressStore } from '@/lib/progress/ProgressStoreProvider';

interface CourseOverviewProgressProps {
  courseId: CourseId;
  totalLessons: number;
}

export function CourseOverviewProgress({
  courseId,
  totalLessons,
}: CourseOverviewProgressProps) {
  const completed = useProgressStore((state) => completedCount(state, courseId));
  const lastId = useProgressStore((state) => lastOpenedLessonId(state, courseId));

  const allLessons = getLessons(courseId);
  const completedSet = useProgressStore(
    (state) => state.byCourse[courseId]?.completedLessonIds ?? null,
  );

  // Completion-driven: a fresh user (nothing completed) is pointed at Day 1 as
  // a recommended start, not told a peeked-at lesson is already "AKTUELNO".
  const hasStarted = completed > 0;
  const currentLesson =
    hasStarted && lastId
      ? (getLessonById(courseId, lastId) ?? allLessons[0] ?? null)
      : (allLessons[0] ?? null);

  let nextLesson = null;
  if (currentLesson) {
    const idx = allLessons.findIndex((l) => l.id === currentLesson.id);
    for (let i = idx + 1; i < allLessons.length; i += 1) {
      const candidate = allLessons[i];
      if (!candidate) continue;
      if (!completedSet?.has(candidate.id)) {
        nextLesson = candidate;
        break;
      }
    }
  }

  return (
    <CourseProgress
      completed={completed}
      total={totalLessons}
      hasStarted={hasStarted}
      currentLesson={
        currentLesson
          ? {
              day: currentLesson.dayNumber,
              title: currentLesson.title,
              eraShort: currentLesson.eraId.toUpperCase(),
            }
          : null
      }
      nextLesson={
        nextLesson
          ? { day: nextLesson.dayNumber, title: nextLesson.title }
          : null
      }
      currentHref={
        currentLesson ? `/course/${courseId}/lesson/${currentLesson.id}` : null
      }
      nextHref={nextLesson ? `/course/${courseId}/lesson/${nextLesson.id}` : null}
    />
  );
}
