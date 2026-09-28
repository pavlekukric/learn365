'use client';

import type { CourseId } from '@learn365/content';
import { formatJourneyDay } from '@learn365/core';
import { CourseProgress } from '@learn365/ui-web';

import { useResumeLesson } from '@/lib/progress/useResumeLesson';

interface CourseOverviewProgressProps {
  courseId: CourseId;
  totalLessons: number;
}

export function CourseOverviewProgress({ courseId, totalLessons }: CourseOverviewProgressProps) {
  // Same resume rule as the Home hero CTA, the recommended card and the
  // daily anchor, so every surface opens the same lesson and names the same
  // day: `journeyDay` is the resume lesson's day (null for a fresh user —
  // the card renders its start state instead).
  const { completed, lesson, journeyDay } = useResumeLesson(courseId);

  return (
    <CourseProgress
      completed={completed}
      total={totalLessons}
      journeyDayLabel={journeyDay === null ? null : formatJourneyDay(journeyDay)}
      lesson={
        lesson
          ? {
              day: lesson.dayNumber,
              title: lesson.title,
              readingTimeMinutes: lesson.readingTimeMinutes,
            }
          : null
      }
      href={lesson ? `/course/${courseId}/lesson/${lesson.id}` : null}
    />
  );
}
