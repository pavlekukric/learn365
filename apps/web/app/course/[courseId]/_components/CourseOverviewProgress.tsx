'use client';

import type { CourseId } from '@learn365/content';
import { CourseProgress } from '@learn365/ui-web';

import { useResumeLesson } from '@/lib/progress/useResumeLesson';

interface CourseOverviewProgressProps {
  courseId: CourseId;
  totalLessons: number;
}

export function CourseOverviewProgress({ courseId, totalLessons }: CourseOverviewProgressProps) {
  // Same resume rule as the Home hero CTA and recommended card, so the three
  // surfaces always open the same lesson (Day 1 for a fresh user; otherwise
  // the unfinished / next unread lesson — never one already completed).
  const { completed, hasStarted, lesson } = useResumeLesson(courseId);

  // Journey-day eyebrow string, computed identically to HomeDailyAnchor
  // (Phase 7.8) so the two surfaces speak the same daily-ritual register.
  // Null for a fresh user — the card renders its start state instead.
  const journeyDayLabel = hasStarted
    ? `Tvoj ${String(Math.min(completed + 1, totalLessons))}. dan`
    : null;

  return (
    <CourseProgress
      completed={completed}
      total={totalLessons}
      journeyDayLabel={journeyDayLabel}
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
