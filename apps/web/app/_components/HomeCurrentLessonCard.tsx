'use client';

import { getEraForLesson, getLessons, type CourseId } from '@learn365/content';
import { CurrentLessonCard } from '@learn365/ui-web';

import { useResumeLesson } from '@/lib/progress/useResumeLesson';

interface HomeCurrentLessonCardProps {
  courseId: CourseId;
}

/**
 * The single recommended lesson on Home. Target and state come from the
 * shared `useResumeLesson` rule: Day 1 for a fresh user, otherwise the
 * unfinished / next unread lesson — never one the reader already finished.
 * When the whole course is complete the card shows the final day in its
 * `done` state instead of disappearing.
 */
export function HomeCurrentLessonCard({ courseId }: HomeCurrentLessonCardProps) {
  const { hasStarted, lesson: resume } = useResumeLesson(courseId);

  const allDone = hasStarted && resume === null;
  const all = getLessons(courseId);
  const lesson = resume ?? all[all.length - 1] ?? null;
  if (!lesson) return null;

  const era = getEraForLesson(courseId, lesson.id);
  const state = allDone ? 'done' : hasStarted ? 'active' : 'idle';
  const href = `/course/${courseId}/lesson/${lesson.id}`;

  return (
    <div data-newcomer-wrap data-newcomer={hasStarted ? undefined : 'inline'}>
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
    </div>
  );
}
