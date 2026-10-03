import Link from 'next/link';

import { formatDayEyebrow } from '@learn365/core';

import { IconArrow } from '../../icons/IconArrow.js';
import { IconArrowLeft } from '../../icons/IconArrowLeft.js';
import { IconCheck } from '../../icons/IconCheck.js';

import styles from './CompletedFooter.module.css';
import { completionMoment } from './completionMoment.js';

export interface CompletedFooterNext {
  href: string;
  dayNumber: number;
  title: string;
  /** Era/section label rendered as small editorial context under the title. */
  eraLabel?: string;
  readingTimeMinutes?: number;
}

export interface CompletedFooterPrev {
  href: string;
  dayNumber: number;
  title: string;
}

interface CompletedFooterProps {
  /** Day number of the lesson the user just completed. */
  completedDayNumber: number;
  /** Course-wide completed count *after* this completion (so at least 1). */
  completedCount: number;
  /** Total lessons in the course (typically 365). */
  totalLessons: number;
  next: CompletedFooterNext | null;
  prev: CompletedFooterPrev | null;
  /**
   * Where to continue when there is no next lesson but the course is not
   * finished — the shared resume lesson (the earliest unread day). Omitted,
   * the card opens the course overview instead.
   */
  resume?: CompletedFooterNext | null | undefined;
  /** Course overview — the end-of-course link, and the fallback above. */
  courseHref: string;
}

/**
 * Footer shown after the user marks a lesson complete. Promotes "what's
 * next" to the primary action and demotes "go back" to a quiet text link.
 *
 * Editorial, not gamified — one human sentence that acknowledges the day,
 * the labelled count underneath (so the reader sees the number move without
 * hunting for it in the chrome), a serif title on a paper card, a chevron.
 * No XP, no streaks, no percentages. What the sentence says follows the
 * lesson's position and the course's state (`completionMoment`); on the
 * last day at 365 / 365 it becomes the course's quiet finish: a heading,
 * one line and a way back to the course. Every other lesson keeps its next
 * card once the course is done, for the re-reader.
 *
 * One column, one left edge (Phase 21): the sentence, the card and the
 * previous link all start where the completion button above them starts.
 */
export function CompletedFooter({
  completedDayNumber,
  completedCount,
  totalLessons,
  next,
  prev,
  resume,
  courseHref,
}: CompletedFooterProps) {
  const moment = completionMoment({
    dayNumber: completedDayNumber,
    isLastLesson: next === null,
    completedCount,
    totalLessons,
  });

  return (
    <div className={styles.wrap}>
      {/* Not a live region: it mounts already filled, which screen readers
       * often skip. `LessonFooter` speaks the moment through its own
       * persistent region instead (review 2026-10-03 item 7). */}
      <div className={styles.moment}>
        {moment.kind === 'finished' ? (
          <>
            <p className={styles.finishHeading}>
              <IconCheck className={styles.check} />
              <span>{moment.heading}</span>
            </p>
            <p className={styles.finishLine}>{moment.line}</p>
          </>
        ) : (
          <p className={styles.momentLine}>
            <IconCheck className={styles.check} />
            <span>{moment.line}</span>
          </p>
        )}
        <p className={`tiny mono ${styles.momentCount}`}>
          Pročitano {completedCount} / {totalLessons}
          {moment.kind === 'day' && moment.note !== undefined ? ` · ${moment.note}` : null}
        </p>
      </div>

      {moment.kind === 'finished' ? (
        <Link href={courseHref} className={styles.courseLink}>
          <span>Otvori kurs</span>
          <IconArrow className={styles.courseLinkArrow} />
        </Link>
      ) : moment.kind === 'lastDay' ? (
        resume ? (
          <LessonCard
            eyebrow={`Nastavi · ${formatDayEyebrow(resume.dayNumber)}`}
            lesson={resume}
            meta={moment.remaining}
          />
        ) : (
          <Link href={courseHref} className={styles.nextCard}>
            <span className={`tiny mono ${styles.eyebrow}`}>{moment.remaining}</span>
            <span className={styles.nextTitle}>Otvori kurs</span>
            <IconArrow className={styles.arrow} />
          </Link>
        )
      ) : next ? (
        <LessonCard
          eyebrow={`Sledeća lekcija · ${formatDayEyebrow(next.dayNumber)}`}
          lesson={next}
        />
      ) : null}

      {prev ? (
        <Link href={prev.href} className={styles.prevLink}>
          <IconArrowLeft className={styles.prevArrow} />
          <span className={`tiny mono ${styles.prevLabel}`}>
            {formatDayEyebrow(prev.dayNumber)}
          </span>
          <span className={styles.prevTitle}>{prev.title}</span>
        </Link>
      ) : null}
    </div>
  );
}

/** The primary paper card: eyebrow, serif title, a quiet meta line, an arrow. */
function LessonCard({
  eyebrow,
  lesson,
  meta,
}: {
  eyebrow: string;
  lesson: CompletedFooterNext;
  /** Replaces the era / reading-time line (the "how many remain" note). */
  meta?: string;
}) {
  const metaText =
    meta ??
    [
      lesson.eraLabel,
      lesson.readingTimeMinutes !== undefined
        ? `${String(lesson.readingTimeMinutes)} min čitanja`
        : null,
    ]
      .filter(Boolean)
      .join(' · ');
  return (
    <Link href={lesson.href} className={styles.nextCard}>
      <span className={`tiny mono ${styles.eyebrow}`}>{eyebrow}</span>
      <span className={styles.nextTitle}>{lesson.title}</span>
      {metaText ? <span className={`tiny mono ${styles.meta}`}>{metaText}</span> : null}
      <IconArrow className={styles.arrow} />
    </Link>
  );
}
