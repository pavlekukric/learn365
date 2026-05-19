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

  // Completion-driven: a fresh user (nothing completed) is pointed at Day 1 as
  // a recommended start, not told a peeked-at lesson is already in progress.
  const hasStarted = completed > 0;
  const lesson =
    hasStarted && lastId
      ? (getLessonById(courseId, lastId) ?? allLessons[0] ?? null)
      : (allLessons[0] ?? null);

  // Journey-day eyebrow string, computed identically to HomeDailyAnchor
  // (Phase 7.8) so the two surfaces speak the same daily-ritual register.
  // Null for a fresh user — the row falls back to a `ZAPOČNI` kicker.
  const journeyDayLabel = hasStarted
    ? `Tvoj ${String(Math.min(completed + 1, totalLessons))}. dan`
    : null;

  return (
    <CourseProgress
      completed={completed}
      total={totalLessons}
      journeyDayLabel={journeyDayLabel}
      lesson={
        lesson ? { day: lesson.dayNumber, title: lesson.title } : null
      }
      href={lesson ? `/course/${courseId}/lesson/${lesson.id}` : null}
    />
  );
}
