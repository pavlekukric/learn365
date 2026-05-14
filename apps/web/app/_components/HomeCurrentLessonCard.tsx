'use client';

import {
  getEraForLesson,
  getLessonById,
  getLessons,
  type CourseId,
} from '@learn365/content';
import { isCompleted, lastOpenedLessonId } from '@learn365/core';
import { CurrentLessonCard, Eyebrow } from '@learn365/ui-web';

import { useProgressStore } from '@/lib/progress/ProgressStoreProvider';

interface HomeCurrentLessonCardProps {
  courseId: CourseId;
}

/** Section label, derived from the card's actual state so its purpose is explicit. */
const LABEL_BY_STATE = {
  idle: 'Preporučeno za početak',
  active: 'Nastavi gde si stao',
  done: 'Nedavno završeno',
} as const;

export function HomeCurrentLessonCard({ courseId }: HomeCurrentLessonCardProps) {
  const lastId = useProgressStore((state) => lastOpenedLessonId(state, courseId));
  const completed = useProgressStore((state) =>
    lastId ? isCompleted(state, courseId, lastId) : false,
  );

  const allLessons = getLessons(courseId);
  const lesson = lastId ? getLessonById(courseId, lastId) : (allLessons[0] ?? null);
  if (!lesson) return null;

  const era = getEraForLesson(courseId, lesson.id);
  const state = completed ? 'done' : lastId ? 'active' : 'idle';
  const href = `/course/${courseId}/lesson/${lesson.id}`;

  return (
    <>
      <Eyebrow>{LABEL_BY_STATE[state]}</Eyebrow>
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
    </>
  );
}
