'use client';

import { IconMenu, ProgressBar } from '@learn365/ui-web';

import styles from './LessonContextHeader.module.css';

interface LessonContextHeaderProps {
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
 * (≤1024px) in place of the inline timeline.
 *
 * Top row mirrors the drawer it controls: "Sadržaj" on the LEFT (the drawer
 * slides in from the left, so the trigger should sit on the same side), with
 * the day position in the center. There is no explicit "Nazad" action — the
 * sticky TopBar carries a "Kurs" link, the breadcrumbs above the article
 * carry "Početna · Kurs · Era", and the browser/PWA back gesture remains.
 *
 * Bottom row carries quiet context (current era + total progress) and is
 * unchanged from the previous version.
 */
export function LessonContextHeader({
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
        <button
          type="button"
          className={styles.contentsButton}
          onClick={onOpenContents}
          aria-label="Otvori sadržaj"
        >
          <IconMenu />
          <span>Sadržaj</span>
        </button>

        <span className={`tiny mono ${styles.day}`}>
          DAN {formatDay(dayNumber)} / {totalDays}
        </span>

        {/* Right cell intentionally empty — keeps the day visually centered
          * via the grid template, and leaves the toolbar calm. */}
        <span aria-hidden="true" className={styles.spacer} />
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
