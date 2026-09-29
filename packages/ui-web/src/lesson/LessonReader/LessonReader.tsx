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
}

/**
 * The reader's frame: trail, header, article, footer. It has no
 * state and no handlers, so the lesson page renders it — and the whole
 * article with it — on the server; the three parts that depend on the reader
 * (bookmark, footer) arrive as nodes, each a client island of the
 * caller's.
 */
export function LessonReader({
  lesson,
  breadcrumbs,
  eraShort,
  article,
  bookmark,
  footer,
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
      {/* No era strip under the footer any more (Phase 13 D5, decided
       * 2026-09-30): on desktop the outline beside the article already names
       * every era, and the strip could only show numerals. The compact rail
       * stays at the top of the mobile drawer. */}
    </article>
  );
}
