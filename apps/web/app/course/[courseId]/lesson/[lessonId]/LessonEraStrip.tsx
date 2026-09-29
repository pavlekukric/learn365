'use client';

import type { EraId } from '@learn365/content';
import { HistoricalTimeline } from '@learn365/ui-web';

import { useEraTimeline } from '@/lib/progress/useEraTimeline';

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
  const { eras, eraStats, eraHref } = useEraTimeline(courseId);
  return (
    <HistoricalTimeline
      eras={eras}
      currentLesson={{ eraId, year }}
      eraHref={eraHref}
      eraStats={eraStats}
    />
  );
}
