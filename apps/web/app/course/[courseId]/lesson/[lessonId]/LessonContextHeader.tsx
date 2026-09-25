'use client';

import { IconMenu } from '@learn365/ui-web';

import styles from './LessonContextHeader.module.css';

interface LessonContextHeaderProps {
  dayNumber: number;
  totalDays: number;
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
 * (≤1024px) in place of the sidebar and the inline era timeline.
 *
 * One row (post-2026-09-25): "Sadržaj" on the LEFT (the drawer slides in
 * from the left, so the trigger sits on the same side), the day position in
 * the centre, and the labelled course progress (`Pročitano N / 365`) on the
 * right. The era no longer lives here — the lesson header's eyebrow carries
 * it on single-column layouts, so the sticky chrome stays as short as it
 * can while keeping every fact the owner asked to keep visible.
 */
export function LessonContextHeader({
  dayNumber,
  totalDays,
  completedCount,
  totalLessons,
  onOpenContents,
}: LessonContextHeaderProps) {
  return (
    <div className={styles.header}>
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
        Dan {formatDay(dayNumber)} / {totalDays}
      </span>

      <span
        className={`tiny mono ${styles.metaRow}`}
        aria-label={`Pročitano ${String(completedCount)} od ${String(totalLessons)} lekcija`}
      >
        Pročitano {completedCount} / {totalLessons}
      </span>
    </div>
  );
}
