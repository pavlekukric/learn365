'use client';

import { useCallback, useMemo } from 'react';

import { getEras, getLessons, type EraId } from '@learn365/content';
import { HistoricalTimeline, type EraStat } from '@learn365/ui-web';

import { useProgressStore } from '@/lib/progress/ProgressStoreProvider';

interface LessonEraStripProps {
  courseId: string;
  /** Era and representative year of the open lesson — where the marker sits. */
  eraId: EraId;
  year: number;
}

/**
 * The eight-era strip under the article (two-column layouts). A client island
 * because its fill and its completed stations come from the reader's progress.
 */
export function LessonEraStrip({ courseId, eraId, year }: LessonEraStripProps) {
  const completedSet = useProgressStore(
    (state) => state.byCourse[courseId]?.completedLessonIds ?? null,
  );
  const eras = useMemo(() => getEras(courseId), [courseId]);
  const lessons = useMemo(() => getLessons(courseId), [courseId]);

  // Per-era lesson + completion counts for the timeline's proportional widths
  // and progress fill.
  const eraStats = useMemo(() => {
    const map = new Map<EraId, EraStat>();
    for (const era of eras) {
      const eraLessons = lessons.filter((l) => l.eraId === era.id);
      const completed = completedSet
        ? eraLessons.reduce((acc, l) => (completedSet.has(l.id) ? acc + 1 : acc), 0)
        : 0;
      map.set(era.id, { lessonCount: eraLessons.length, completedCount: completed });
    }
    return map;
  }, [eras, lessons, completedSet]);

  const eraHref = useCallback(
    (id: EraId) => {
      const firstInEra = lessons.find((l) => l.eraId === id);
      return firstInEra ? `/course/${courseId}/lesson/${firstInEra.id}` : `/course/${courseId}`;
    },
    [courseId, lessons],
  );

  return (
    <HistoricalTimeline
      eras={eras}
      currentLesson={{ eraId, year }}
      eraHref={eraHref}
      eraStats={eraStats}
    />
  );
}
