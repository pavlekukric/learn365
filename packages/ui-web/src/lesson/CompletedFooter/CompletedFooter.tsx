import Link from 'next/link';
import type { ReactNode } from 'react';

import { formatDayEyebrow, formatDayProse } from '@learn365/core';

import { IconArrow } from '../../icons/IconArrow.js';
import { IconArrowLeft } from '../../icons/IconArrowLeft.js';
import { IconCheck } from '../../icons/IconCheck.js';

import styles from './CompletedFooter.module.css';

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
  /** Where to send the user when there is no next lesson (end-of-course). */
  courseHref: string;
  /** Optional block between the moment and the next-lesson card (the sign-in ask). */
  afterMoment?: ReactNode;
}

/**
 * Footer shown after the user marks a lesson complete. Promotes "what's
 * next" to the primary action and demotes "go back" to a quiet text link.
 *
 * Editorial, not gamified — one human sentence that acknowledges the day,
 * the labelled count underneath (so the reader sees the number move without
 * hunting for it in the chrome), a serif title on a paper card, a chevron.
 * No XP, no streaks, no percentages.
 */
export function CompletedFooter({
  completedDayNumber,
  completedCount,
  totalLessons,
  next,
  prev,
  courseHref,
  afterMoment,
}: CompletedFooterProps) {
  const isFirstWin = completedCount === 1;

  return (
    <div className={styles.wrap}>
      <div className={styles.moment} role="status">
        <p className={styles.momentLine}>
          <IconCheck className={styles.check} />
          <span>
            {isFirstWin
              ? 'Prvi dan je iza tebe.'
              : `${formatDayProse(completedDayNumber)} je iza tebe.`}
          </span>
        </p>
        <p className={`tiny mono ${styles.momentCount}`}>
          Pročitano {completedCount} / {totalLessons}
        </p>
      </div>

      {afterMoment}

      {next ? (
        <Link href={next.href} className={styles.nextCard}>
          <span className={`tiny mono ${styles.eyebrow}`}>
            Sledeća lekcija · {formatDayEyebrow(next.dayNumber)}
          </span>
          <span className={styles.nextTitle}>{next.title}</span>
          {(next.eraLabel ?? next.readingTimeMinutes !== undefined) ? (
            <span className={`tiny mono ${styles.meta}`}>
              {[
                next.eraLabel,
                next.readingTimeMinutes !== undefined
                  ? `${String(next.readingTimeMinutes)} min čitanja`
                  : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </span>
          ) : null}
          <IconArrow className={styles.arrow} />
        </Link>
      ) : (
        <Link href={courseHref} className={styles.endCard}>
          <span className={`tiny mono ${styles.eyebrow}`}>Kraj kursa</span>
          <span className={styles.nextTitle}>Poslednja lekcija kursa je iza tebe.</span>
          <span className={`small ${styles.endLink}`}>
            Otvori kurs <IconArrow className={styles.arrow} />
          </span>
        </Link>
      )}

      {prev ? (
        <Link href={prev.href} className={styles.prevLink}>
          <IconArrowLeft className={styles.prevArrow} />
          <span className={`tiny mono ${styles.prevLabel}`}>{formatDayEyebrow(prev.dayNumber)}</span>
          <span className={styles.prevTitle}>{prev.title}</span>
        </Link>
      ) : null}
    </div>
  );
}
