import type { ReactNode } from 'react';

import type { LessonHeading } from '@learn365/content';

import { Flourish } from '../../primitives/Flourish/Flourish.js';
import { LessonTimeline } from '../LessonTimeline/LessonTimeline.js';

import styles from './LessonHeader.module.css';

interface LessonHeaderProps {
  /** Summary plus `subtitle` / `dateLabel` — the open lesson, from the server page. */
  lesson: LessonHeading;
  /**
   * Short era label (e.g. "Praistorija i antika"). Shown in the eyebrow on
   * single-column layouts only, where there is no sidebar or breadcrumb to
   * carry the era; hidden on desktop to avoid repeating the breadcrumb.
   */
  eraShort?: string | undefined;
  /**
   * Save-for-later control (`LessonBookmarkButton`), pinned top-right. A node,
   * not callbacks: the header renders on the server and the toggle is the
   * caller's client island. Ignored for placeholder lessons.
   */
  bookmark?: ReactNode;
}

export function LessonHeader({ lesson, eraShort, bookmark }: LessonHeaderProps) {
  const isPlaceholder = lesson.isPlaceholder === true;

  return (
    <header className={styles.header}>
      {/* The day position is carried by the dedicated "Dan 004" indicator
       * (mobile context header) or the sidebar's active row (desktop). The
       * eyebrow keeps the two facts those surfaces don't — how long the read
       * is, and when it happened — plus the era on single-column layouts.
       * Placeholder lessons have a stubbed reading time and an interpolated
       * year that aren't real facts yet, so the line is suppressed — the
       * "Uskoro" card below the title carries the intent. */}
      {isPlaceholder ? null : (
        <p className={`tiny mono ${styles.eyebrow}`}>
          {eraShort ? <span className={styles.eraMobile}>{eraShort} · </span> : null}
          {`${String(lesson.readingTimeMinutes)} min čitanja · ${lesson.dateLabel ?? `${String(lesson.year)}.`}`}
        </p>
      )}
      <h1 className="reader-title">{lesson.title}</h1>
      {lesson.subtitle ? <p className="lede">{lesson.subtitle}</p> : null}
      {/* Byline / last-reviewed date moved to the end of the article
       * (`LessonTrustLine`, next to Izvori) so the first sentence arrives
       * sooner — especially on a phone. */}
      {/* Editorial timeline divider for authored lessons — shows roughly where
       * the lesson sits in historical time. Placeholders fall back to the plain
       * decorative flourish: their interpolated year isn't a real fact yet. */}
      {isPlaceholder ? (
        <Flourish />
      ) : (
        <LessonTimeline year={lesson.year} label={lesson.dateLabel} />
      )}
      {/* Placeholder lessons aren't bookmarkable — there's nothing to come
       * back to yet. */}
      {isPlaceholder ? null : bookmark}
    </header>
  );
}
