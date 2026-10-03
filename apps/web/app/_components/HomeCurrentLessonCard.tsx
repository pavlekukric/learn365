'use client';

import { getEraForLesson, getLessons, type CourseId } from '@learn365/content';
import { CurrentLessonCard } from '@learn365/ui-web';

import { useResumeLesson } from '@/lib/progress/useResumeLesson';

interface HomeCurrentLessonCardProps {
  courseId: CourseId;
}

/**
 * The single recommended lesson on Home. Target and state come from the
 * shared `useResumeLesson` rule: the next lesson after the last one read —
 * never one the reader already finished.
 *
 * A first-time visitor does not see it: the hero's `Počni kurs` already
 * opens Day 1, and a second start action under the three steps only
 * repeated it (review 2026-10-03 item 6). The card is still prerendered, as
 * `data-newcomer="reserve"` — out of the flow for a newcomer, an invisible
 * box for a returning reader until the store has rendered their card — so
 * nothing moves when it appears (lib/progress/prePaint.ts).
 *
 * Once the whole course is read the card offers Day 1 again, in its `done`
 * state: the calm way back in for a re-reader.
 */
export function HomeCurrentLessonCard({ courseId }: HomeCurrentLessonCardProps) {
  const { hasStarted, lesson: resume } = useResumeLesson(courseId);

  const allDone = hasStarted && resume === null;
  const all = getLessons(courseId);
  const lesson = resume ?? all[0] ?? null;
  if (!lesson) return null;

  const era = getEraForLesson(courseId, lesson.id);
  const state = allDone ? 'done' : hasStarted ? 'active' : 'idle';
  const href = `/course/${courseId}/lesson/${lesson.id}`;

  return (
    <div data-newcomer-wrap data-newcomer={hasStarted ? undefined : 'reserve'}>
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
