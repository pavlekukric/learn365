import type { ReactNode } from 'react';

import type { LessonHeading } from '@learn365/content';

import { Breadcrumbs, type BreadcrumbItem } from '../../primitives/Breadcrumbs/Breadcrumbs.js';
import { LessonHeader } from '../LessonHeader/LessonHeader.js';

import styles from './LessonReader.module.css';

interface LessonReaderProps {
  lesson: LessonHeading;
  /** Location trail: ancestor links only (Home · course · era · section). */
  breadcrumbs: readonly BreadcrumbItem[];
  /** Short era label, shown in the header eyebrow on single-column layouts. */
  eraShort?: string | undefined;
  /**
   * The rendered article — `LessonBody` plus the closing `LessonSources` /
   * `LessonTrustLine`. Ignored for placeholder lessons, which render the
   * "Uskoro" state instead.
   */
  article: ReactNode;
  /** Save-for-later control (`LessonBookmarkButton`), forwarded to the header. */
  bookmark?: ReactNode;
  /** What follows the article: `LessonFooter` (completion, prev / next). */
  footer: ReactNode;
  /** Era strip (`HistoricalTimeline`) — shown after the footer, two-column layouts only. */
  timeline?: ReactNode;
}

/**
 * The reader's frame: trail, header, article, footer, era strip. It has no
 * state and no handlers, so the lesson page renders it — and the whole
 * article with it — on the server; the three parts that depend on the reader
 * (bookmark, footer, era strip) arrive as nodes, each a client island of the
 * caller's.
 */
export function LessonReader({
  lesson,
  breadcrumbs,
  eraShort,
  article,
  bookmark,
  footer,
  timeline,
}: LessonReaderProps) {
  const isUpcoming = lesson.isPlaceholder === true;

  return (
    <article className={styles.reader}>
      {/* Location trail — desktop only. On single-column layouts the sticky
       * context header + the eyebrow era prefix carry location, and the
       * section is one tap away in the "Sadržaj" drawer, so the trail would
       * only delay the first sentence. */}
      <div className={styles.breadcrumbs}>
        <Breadcrumbs items={breadcrumbs} />
      </div>
      <LessonHeader lesson={lesson} eraShort={eraShort} bookmark={bookmark} />
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
        // Body, then sources + byline / last-reviewed date at the end —
        // where a reader judging the text looks for it.
        article
      )}
      {footer}
      {/* Era timeline — desktop / two-column only, *after* the article so the
       * title is the first thing under the breadcrumb. On single-column
       * layouts it is hidden and reached through the "Sadržaj" drawer.
       * `display:none` also drops it from the a11y tree, so there is no
       * duplicate `nav` landmark. */}
      {timeline !== undefined && timeline !== null ? (
        <div className={styles.timelineInline}>{timeline}</div>
      ) : null}
    </article>
  );
}
