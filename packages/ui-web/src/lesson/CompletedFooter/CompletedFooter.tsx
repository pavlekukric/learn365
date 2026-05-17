import Link from 'next/link';

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
  next: CompletedFooterNext | null;
  prev: CompletedFooterPrev | null;
  /** Where to send the user when there is no next lesson (end-of-course). */
  courseHref: string;
}

function formatDay(day: number): string {
  return String(day).padStart(3, '0');
}

/**
 * Footer shown after the user marks a lesson complete. Promotes "what's
 * next" to the primary action and demotes "go back" to a quiet text link.
 *
 * Editorial, not gamified — a single calm confirmation line, a serif title
 * on a paper card, and a chevron. No XP, no streaks, no percentages.
 */
export function CompletedFooter({
  completedDayNumber,
  next,
  prev,
  courseHref,
}: CompletedFooterProps) {
  return (
    <div className={styles.wrap}>
      <p className={`tiny mono ${styles.confirmation}`}>
        <IconCheck className={styles.check} />
        <span>DAN {formatDay(completedDayNumber)} završeno.</span>
      </p>

      {next ? (
        <Link href={next.href} className={styles.nextCard}>
          <span className={`tiny mono ${styles.eyebrow}`}>
            Sledeća lekcija · DAN {formatDay(next.dayNumber)}
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
          <span className={styles.nextTitle}>
            Završio si poslednju lekciju ovog dela kursa.
          </span>
          <span className={`small ${styles.endLink}`}>
            Otvori kurs <IconArrow className={styles.arrow} />
          </span>
        </Link>
      )}

      {prev ? (
        <Link href={prev.href} className={styles.prevLink}>
          <IconArrowLeft className={styles.prevArrow} />
          <span className={`tiny mono ${styles.prevLabel}`}>
            DAN {formatDay(prev.dayNumber)}
          </span>
          <span className={styles.prevTitle}>{prev.title}</span>
        </Link>
      ) : null}
    </div>
  );
}
