import type { Era, EraId, Lesson, Section } from '@learn365/content';

import { Breadcrumbs, type BreadcrumbItem } from '../../primitives/Breadcrumbs/Breadcrumbs.js';
import {
  HistoricalTimeline,
  type EraStat,
} from '../HistoricalTimeline/HistoricalTimeline.js';
import { LessonBody } from '../LessonBody/LessonBody.js';
import { LessonHeader } from '../LessonHeader/LessonHeader.js';
import { MarkAsCompletedButton } from '../MarkAsCompletedButton/MarkAsCompletedButton.js';
import { PreviousNextLessonNavigation } from '../PreviousNextLessonNavigation/PreviousNextLessonNavigation.js';

import styles from './LessonReader.module.css';

interface AdjacentLessonLink {
  title: string;
  dayNumber: number;
  href: string;
}

interface LessonReaderProps {
  lesson: Lesson;
  era: Era;
  section: Section;
  eras: readonly Era[];
  breadcrumbs: readonly BreadcrumbItem[];
  isCompleted: boolean;
  onToggleComplete: () => void;
  prev: AdjacentLessonLink | null;
  next: AdjacentLessonLink | null;
  /** Optional href builder for the timeline era bands. */
  eraHref?: (eraId: EraId) => string;
  /** Optional per-era stats for the timeline's proportional widths + progress. */
  eraStats?: ReadonlyMap<EraId, EraStat> | undefined;
}

export function LessonReader({
  lesson,
  era,
  section,
  eras,
  breadcrumbs,
  isCompleted,
  onToggleComplete,
  prev,
  next,
  eraHref,
  eraStats,
}: LessonReaderProps) {
  void section; // section data is reflected in breadcrumbs; reserved for future use.

  const isUpcoming = lesson.isPlaceholder === true;

  return (
    <article className={styles.reader}>
      <Breadcrumbs items={breadcrumbs} />
      {/* Inline timeline — desktop / two-column only. On single-column layouts
       * (≤1024px) it is hidden here and reached through the "Sadržaj" drawer,
       * so the lesson reads content-first. `display:none` also drops it from
       * the a11y tree, so there is no duplicate `nav` landmark. */}
      <div className={styles.timelineInline}>
        <HistoricalTimeline
          eras={eras}
          currentLesson={{ eraId: era.id, year: lesson.year }}
          eraHref={eraHref}
          eraStats={eraStats}
        />
      </div>
      <LessonHeader lesson={lesson} era={era} />
      {isUpcoming ? (
        <div className={styles.upcoming} role="status">
          <span className={`eyebrow ${styles.upcomingEyebrow}`}>Uskoro</span>
          <p className={styles.upcomingTitle}>Ova lekcija je u pripremi.</p>
          <p className={`small ${styles.upcomingNote}`}>
            Sadržaj za ovaj dan još nije objavljen. Kurs se postepeno
            popunjava — vrati se ovamo uskoro.
          </p>
        </div>
      ) : (
        <LessonBody blocks={lesson.content} />
      )}
      <footer className={styles.footer}>
        {isUpcoming ? null : (
          <MarkAsCompletedButton isCompleted={isCompleted} onClick={onToggleComplete} />
        )}
        <PreviousNextLessonNavigation prev={prev} next={next} />
      </footer>
    </article>
  );
}
