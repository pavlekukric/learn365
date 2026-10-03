'use client';

import { useCallback, useMemo } from 'react';

import { getEras, getLessons, type Era, type EraId } from '@learn365/content';
import type { EraStat } from '@learn365/ui-web';

import { courseHref, lessonHref } from '@/lib/routes';

import { useProgressStore } from './ProgressStoreProvider';

export interface EraTimeline {
  readonly eras: readonly Era[];
  /** Lesson and completion counts per era: band widths, fill, completed stations. */
  readonly eraStats: ReadonlyMap<EraId, EraStat>;
  /** Where an era's band leads: the era's first lesson. */
  readonly eraHref: (eraId: EraId) => string;
}

/**
 * What `HistoricalTimeline` needs on the lesson route — one source for the
 * strip under the article and the rail in the drawer.
 */
export function useEraTimeline(courseId: string): EraTimeline {
  const completedSet = useProgressStore(
    (state) => state.byCourse[courseId]?.completedLessonIds ?? null,
  );
  const eras = useMemo(() => getEras(courseId), [courseId]);
  const lessons = useMemo(() => getLessons(courseId), [courseId]);

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
    (eraId: EraId) => {
      const firstInEra = lessons.find((l) => l.eraId === eraId);
      return firstInEra ? lessonHref(courseId, firstInEra.id) : courseHref(courseId);
    },
    [courseId, lessons],
  );

  return { eras, eraStats, eraHref };
}
