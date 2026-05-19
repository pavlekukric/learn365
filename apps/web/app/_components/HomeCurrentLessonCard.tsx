'use client';

import {
  getEraForLesson,
  getLessonById,
  getLessons,
  type CourseId,
} from '@learn365/content';
import { completedCount, isCompleted, lastOpenedLessonId } from '@learn365/core';
import { CurrentLessonCard } from '@learn365/ui-web';

import { useProgressStore } from '@/lib/progress/ProgressStoreProvider';

interface HomeCurrentLessonCardProps {
  courseId: CourseId;
}

export function HomeCurrentLessonCard({ courseId }: HomeCurrentLessonCardProps) {
  const completedTotal = useProgressStore((state) =>
    completedCount(state, courseId),
  );
  const lastId = useProgressStore((state) => lastOpenedLessonId(state, courseId));
  const lastCompleted = useProgressStore((state) =>
    lastId ? isCompleted(state, courseId, lastId) : false,
  );

  // Completion-driven: until the user has completed at least one lesson the
  // card recommends starting from Day 1. Opening/peeking a lesson alone never
  // flips it into a "continue where you stopped" state — that would contradict
  // a "0 / 365" progress counter.
  const hasProgress = completedTotal > 0;
  const allLessons = getLessons(courseId);
  const lesson =
    hasProgress && lastId
      ? (getLessonById(courseId, lastId) ?? allLessons[0] ?? null)
      : (allLessons[0] ?? null);
  if (!lesson) return null;

  const era = getEraForLesson(courseId, lesson.id);
  const state = !hasProgress ? 'idle' : lastCompleted ? 'done' : 'active';
  const href = `/course/${courseId}/lesson/${lesson.id}`;

  return (
    <CurrentLessonCard
      lesson={{
        day: lesson.dayNumber,
        title: lesson.title,
        readingTimeMinutes: lesson.readingTimeMinutes,
        eraShort: era?.eraShort ?? '',
      }}
      state={state}
      href={href}
    />
  );
}
