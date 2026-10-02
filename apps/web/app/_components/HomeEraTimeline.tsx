'use client';

import {
  getEras,
  getLessons,
  getLessonsByEra,
  type CourseId,
  type EraId,
} from '@learn365/content';
import { progressForLessons } from '@learn365/core';
import { HistoricalTimeline, type EraStat } from '@learn365/ui-web';

import { useProgressStore } from '@/lib/progress/ProgressStoreProvider';
import { useResumeLesson } from '@/lib/progress/useResumeLesson';

interface HomeEraTimelineProps {
  courseId: CourseId;
}

/**
 * Home's visual "taste" of the journey: the 8 eras rendered as the
 * `HistoricalTimeline` journey rail. The full era → section → lesson
 * navigation tree lives only on the Course overview — Home stays a calm,
 * visual landing surface rather than a second copy of the course page.
 *
 * The marker sits on the resume lesson (`useResumeLesson`) — the lesson the
 * card above opens and "Tvoj N. dan" names, so Home and the course overview
 * agree on where the reader is. A fresh visitor gets Day 1; once every
 * lesson is read, the last one. `eraStats` feeds the rail's proportional
 * band widths and completion fill.
 */
export function HomeEraTimeline({ courseId }: HomeEraTimelineProps) {
  const eras = getEras(courseId);
  const { lesson: resume } = useResumeLesson(courseId);
  const progressState = useProgressStore((state) => state);

  const lessons = getLessons(courseId);
  const markerLesson = resume ?? lessons.at(-1) ?? null;

  if (!markerLesson || eras.length === 0) return null;

  const eraStats = new Map<EraId, EraStat>(
    eras.map((era) => {
      const { done, total } = progressForLessons(
        progressState,
        courseId,
        getLessonsByEra(courseId, era.id).map((l) => l.id),
      );
      return [era.id, { lessonCount: total, completedCount: done }];
    }),
  );

  const eraHref = (eraId: EraId): string => {
    const firstInEra = lessons.find((l) => l.eraId === eraId);
    return firstInEra
      ? `/course/${courseId}/lesson/${firstInEra.id}`
      : `/course/${courseId}`;
  };

  return (
    <HistoricalTimeline
      eras={eras}
      currentLesson={{ eraId: markerLesson.eraId, year: markerLesson.year }}
      eraHref={eraHref}
      eraStats={eraStats}
      variant="home"
    />
  );
}
