'use client';

import Link from 'next/link';
import type { Route } from 'next';

import { IconArrowLeft, IconMenu, ProgressBar } from '@learn365/ui-web';

import styles from './LessonContextHeader.module.css';

interface LessonContextHeaderProps {
  /** Where the back button goes — the course overview page. */
  backHref: Route;
  dayNumber: number;
  totalDays: number;
  /** Current era / period label, e.g. "Praistorija i antika". */
  eraLabel: string;
  completedCount: number;
  totalLessons: number;
  /** Opens the "Sadržaj" drawer (timeline + course outline). */
  onOpenContents: () => void;
}

function formatDay(day: number): string {
  return String(day).padStart(3, '0');
}

/**
 * Compact, sticky lesson context header — shown on single-column layouts
 * (≤1024px) in place of the inline timeline. Keeps the lesson page content-first:
 * back + contents affordances, the day position, the current era, and total
 * progress, all in two calm rows. The full timeline is reached via "Sadržaj".
 */
export function LessonContextHeader({
  backHref,
  dayNumber,
  totalDays,
  eraLabel,
  completedCount,
  totalLessons,
  onOpenContents,
}: LessonContextHeaderProps) {
  const progressValue = totalLessons > 0 ? completedCount / totalLessons : 0;

  return (
    <div className={styles.header}>
      <div className={styles.topRow}>
        <Link href={backHref} className={styles.backLink}>
          <IconArrowLeft />
          <span>Nazad</span>
        </Link>

        <span className={`tiny mono ${styles.day}`}>
          DAN {formatDay(dayNumber)} / {totalDays}
        </span>

        <button
          type="button"
          className={styles.contentsButton}
          onClick={onOpenContents}
          aria-label="Otvori sadržaj"
        >
          <IconMenu />
          <span>Sadržaj</span>
        </button>
      </div>

      <div className={styles.metaRow}>
        <span className={styles.era}>{eraLabel}</span>
        <div className={styles.progress}>
          <span className={styles.bar}>
            <ProgressBar
              value={progressValue}
              size="thin"
              ariaLabel="Ukupni napredak"
              ariaValueText={`${String(completedCount)} od ${String(totalLessons)} završeno`}
            />
          </span>
          <span className={`tiny mono ${styles.progressMeta}`}>
            {completedCount} / {totalLessons}
          </span>
        </div>
      </div>
    </div>
  );
}
