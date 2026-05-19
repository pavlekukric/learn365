import type { Era, EraId, Lesson, Section } from '@learn365/content';

import { Breadcrumbs, type BreadcrumbItem } from '../../primitives/Breadcrumbs/Breadcrumbs.js';
import { CompletedFooter } from '../CompletedFooter/CompletedFooter.js';
import {
  HistoricalTimeline,
  type EraStat,
} from '../HistoricalTimeline/HistoricalTimeline.js';
import { LessonBody } from '../LessonBody/LessonBody.js';
import { LessonHeader, type LessonBookmarkAction } from '../LessonHeader/LessonHeader.js';
import { LessonSources } from '../LessonSources/LessonSources.js';
import { MarkAsCompletedButton } from '../MarkAsCompletedButton/MarkAsCompletedButton.js';
import { PreviousNextLessonNavigation } from '../PreviousNextLessonNavigation/PreviousNextLessonNavigation.js';

import styles from './LessonReader.module.css';

interface AdjacentLessonLink {
  title: string;
  dayNumber: number;
  href: string;
  /** Era label (e.g. "Nemanjićka Srbija") rendered on the post-completion
   * next-lesson card. Optional so callers that don't have it pass nothing. */
  eraLabel?: string;
  readingTimeMinutes?: number;
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
  /** Href back to the course overview, used by the end-of-course footer
   * when there is no next lesson. */
  courseHref: string;
  /** Optional href builder for the timeline era bands. */
  eraHref?: (eraId: EraId) => string;
  /** Optional per-era stats for the timeline's proportional widths + progress. */
  eraStats?: ReadonlyMap<EraId, EraStat> | undefined;
  /** Save-for-later toggle, forwarded to the header. Omit for callers that
   * haven't wired bookmarks. */
  bookmarkAction?: LessonBookmarkAction | undefined;
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
  courseHref,
  eraHref,
  eraStats,
  bookmarkAction,
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
      <LessonHeader lesson={lesson} bookmarkAction={bookmarkAction} />
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
      {!isUpcoming && lesson.sources !== undefined && lesson.sources.length > 0 ? (
        <LessonSources sources={lesson.sources} />
      ) : null}
      <footer className={styles.footer}>
        {isUpcoming ? null : (
          <MarkAsCompletedButton isCompleted={isCompleted} onClick={onToggleComplete} />
        )}
        {/* Pre-completion: symmetric prev/next. Post-completion: a stronger
         * "what's next" moment that promotes the next lesson to the primary
         * action and demotes "previous" to a small text link. Placeholders
         * (which can't be completed) always get the symmetric footer. */}
        {isCompleted && !isUpcoming ? (
          <CompletedFooter
            completedDayNumber={lesson.dayNumber}
            next={next}
            prev={prev}
            courseHref={courseHref}
          />
        ) : (
          <PreviousNextLessonNavigation prev={prev} next={next} />
        )}
      </footer>
    </article>
  );
}
