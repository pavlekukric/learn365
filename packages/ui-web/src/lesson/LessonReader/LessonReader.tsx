'use client';

import { useEffect, useRef } from 'react';

import type { Era, EraId, Lesson, Section } from '@learn365/content';

import { Breadcrumbs, type BreadcrumbItem } from '../../primitives/Breadcrumbs/Breadcrumbs.js';
import { CompletedFooter } from '../CompletedFooter/CompletedFooter.js';
import { HistoricalTimeline, type EraStat } from '../HistoricalTimeline/HistoricalTimeline.js';
import { LessonBody } from '../LessonBody/LessonBody.js';
import { LessonHeader, type LessonBookmarkAction } from '../LessonHeader/LessonHeader.js';
import { LessonSources } from '../LessonSources/LessonSources.js';
import { LessonTrustLine } from '../LessonTrustLine/LessonTrustLine.js';
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
  /** Short era label, shown in the header eyebrow on single-column layouts. */
  eraShort?: string | undefined;
  isCompleted: boolean;
  onToggleComplete: () => void;
  /** Course-wide completed count, shown in the post-completion moment. */
  completedCount: number;
  /** Total lessons in the course (typically 365). */
  totalLessons: number;
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
  eraShort,
  isCompleted,
  onToggleComplete,
  completedCount,
  totalLessons,
  prev,
  next,
  courseHref,
  eraHref,
  eraStats,
  bookmarkAction,
}: LessonReaderProps) {
  void section; // section data is reflected in breadcrumbs; reserved for future use.

  const isUpcoming = lesson.isPlaceholder === true;

  // When the reader *just* completed the lesson, bring the completion moment
  // and the next-lesson card into view — on a phone the footer that appears
  // under the button is otherwise easy to miss. Only on the false→true edge,
  // never on first paint of an already-completed lesson.
  const completedWrapRef = useRef<HTMLDivElement>(null);
  const wasCompletedRef = useRef(isCompleted);
  useEffect(() => {
    const justCompleted = isCompleted && !wasCompletedRef.current;
    wasCompletedRef.current = isCompleted;
    if (!justCompleted) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    completedWrapRef.current?.scrollIntoView({
      behavior: reduce ? 'auto' : 'smooth',
      block: 'nearest',
    });
  }, [isCompleted]);

  return (
    <article className={styles.reader}>
      {/* Location trail — desktop only. On single-column layouts the sticky
       * context header + the eyebrow era prefix carry location, and the
       * section is one tap away in the "Sadržaj" drawer, so the trail would
       * only delay the first sentence. */}
      <div className={styles.breadcrumbs}>
        <Breadcrumbs items={breadcrumbs} />
      </div>
      <LessonHeader lesson={lesson} eraShort={eraShort} bookmarkAction={bookmarkAction} />
      {isUpcoming ? (
        <div className={styles.upcoming} role="status">
          <span className={`eyebrow ${styles.upcomingEyebrow}`}>Uskoro</span>
          <p className={styles.upcomingTitle}>Ova lekcija je u pripremi.</p>
          <p className={`small ${styles.upcomingNote}`}>
            Sadržaj za ovaj dan još nije objavljen. Kurs se postepeno popunjava — vrati se ovamo
            uskoro.
          </p>
        </div>
      ) : (
        <LessonBody blocks={lesson.content} />
      )}
      {!isUpcoming && lesson.sources !== undefined && lesson.sources.length > 0 ? (
        <LessonSources sources={lesson.sources} />
      ) : null}
      {/* Byline / last-reviewed date sits with the sources, at the end —
       * where a reader judging the text looks for it. */}
      {isUpcoming ? null : (
        <LessonTrustLine byline={lesson.byline} lastReviewedAt={lesson.lastReviewedAt} />
      )}
      <footer className={styles.footer}>
        {isUpcoming ? null : (
          <MarkAsCompletedButton isCompleted={isCompleted} onClick={onToggleComplete} />
        )}
        {/* Pre-completion: symmetric prev/next. Post-completion: a stronger
         * "what's next" moment that promotes the next lesson to the primary
         * action and demotes "previous" to a small text link. Placeholders
         * (which can't be completed) always get the symmetric footer. */}
        {isCompleted && !isUpcoming ? (
          <div ref={completedWrapRef} className={styles.completedWrap}>
            <CompletedFooter
              completedDayNumber={lesson.dayNumber}
              completedCount={completedCount}
              totalLessons={totalLessons}
              next={next}
              prev={prev}
              courseHref={courseHref}
            />
          </div>
        ) : (
          <PreviousNextLessonNavigation prev={prev} next={next} />
        )}
      </footer>
      {/* Era timeline — desktop / two-column only, *after* the article so the
       * title is the first thing under the breadcrumb. On single-column
       * layouts it is hidden and reached through the "Sadržaj" drawer.
       * `display:none` also drops it from the a11y tree, so there is no
       * duplicate `nav` landmark. */}
      <div className={styles.timelineInline}>
        <HistoricalTimeline
          eras={eras}
          currentLesson={{ eraId: era.id, year: lesson.year }}
          eraHref={eraHref}
          eraStats={eraStats}
        />
      </div>
    </article>
  );
}
