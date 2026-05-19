import type { Lesson, LessonByline } from '@learn365/content';

import { Flourish } from '../../primitives/Flourish/Flourish.js';

import styles from './LessonHeader.module.css';

interface LessonHeaderProps {
  lesson: Lesson;
}

export function LessonHeader({ lesson }: LessonHeaderProps) {
  const isPlaceholder = lesson.isPlaceholder === true;
  const trustLine = formatTrustLine(lesson.byline, lesson.lastReviewedAt);

  return (
    <header className={styles.header}>
      {/* DAN + era are already carried by the breadcrumb and (on desktop)
       * the inline timeline above. The eyebrow keeps only the two facts
       * those surfaces don't: how long the read is, and when it happened.
       * Placeholder lessons have a stubbed reading time and an interpolated
       * year that aren't real facts yet, so we suppress the line entirely —
       * the "Uskoro" card below the title carries the intent. */}
      {isPlaceholder ? null : (
        <p className={`tiny mono ${styles.eyebrow}`}>
          {`${String(lesson.readingTimeMinutes)} min čitanja · ${lesson.dateLabel ?? `${String(lesson.year)}.`}`}
        </p>
      )}
      <h1 className="reader-title">{lesson.title}</h1>
      {lesson.subtitle ? <p className="lede">{lesson.subtitle}</p> : null}
      {/* Trust line — byline + last-reviewed date, in the same mono-uppercase
       * register as the reading-time eyebrow. Rendered only if the lesson
       * carries at least one of the two; no generic course-wide fallback. */}
      {!isPlaceholder && trustLine !== null ? (
        <p className={`tiny mono ${styles.trust}`}>{trustLine}</p>
      ) : null}
      <Flourish />
    </header>
  );
}

function formatTrustLine(
  byline: LessonByline | undefined,
  lastReviewedAt: string | undefined,
): string | null {
  const parts: string[] = [];
  if (byline?.author !== undefined && byline.author.length > 0) {
    parts.push(`NAPISAO: ${byline.author}`);
  }
  if (byline?.reviewer !== undefined && byline.reviewer.length > 0) {
    parts.push(`PREGLEDAO: ${byline.reviewer}`);
  }
  if (lastReviewedAt !== undefined) {
    parts.push(`POSLEDNJI PREGLED: ${formatReviewDate(lastReviewedAt)}`);
  }
  return parts.length === 0 ? null : parts.join(' · ');
}

function formatReviewDate(iso: string): string {
  // The loader has already validated the YYYY-MM-DD shape, so this Date
  // call is safe. We render via the Serbian locale to match the rest of
  // the editorial chrome.
  const date = new Date(`${iso}T00:00:00Z`);
  return new Intl.DateTimeFormat('sr-RS', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
