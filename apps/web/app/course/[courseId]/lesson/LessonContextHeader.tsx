'use client';

import { padDay } from '@learn365/core';
import { IconMenu } from '@learn365/ui-web';

import styles from './LessonContextHeader.module.css';

interface LessonContextHeaderProps {
  dayNumber: number;
  completedCount: number;
  totalLessons: number;
  /** Opens the "Sadržaj" drawer (timeline + course outline). */
  onOpenContents: () => void;
  /** Whether that drawer is open — the trigger's `aria-expanded`. */
  drawerOpen: boolean;
  /** id of the drawer's dialog panel — the trigger's `aria-controls`. */
  drawerId: string;
}

/**
 * Compact, sticky lesson context header — shown on single-column layouts
 * (≤1024px) in place of the sidebar and the inline era timeline.
 *
 * One row (post-2026-09-25): "Sadržaj" on the LEFT (the drawer slides in
 * from the left, so the trigger sits on the same side), the day position in
 * the centre, and the labelled course progress (`Pročitano N / 365`) on the
 * right. The day is a bare `Dan 003` (Phase 15): the course's length is said
 * once, by the count beside it. The era no longer lives here — the lesson
 * header's eyebrow carries it on single-column layouts, so the sticky chrome
 * stays as short as it can while keeping every fact the owner asked to keep
 * visible.
 */
export function LessonContextHeader({
  dayNumber,
  completedCount,
  totalLessons,
  onOpenContents,
  drawerOpen,
  drawerId,
}: LessonContextHeaderProps) {
  return (
    <div className={styles.header}>
      <button
        type="button"
        className={styles.contentsButton}
        onClick={onOpenContents}
        aria-label="Otvori sadržaj"
        // Says what the button opens and whether it is open. The panel
        // exists only while open; axe and the ARIA spec accept a dangling
        // aria-controls while aria-expanded is false.
        aria-haspopup="dialog"
        aria-expanded={drawerOpen}
        aria-controls={drawerId}
      >
        {/* The button is the 44 px hit area; the pill inside is what shows. */}
        <span className={styles.contentsPill}>
          <IconMenu />
          <span className={styles.contentsLabel}>Sadržaj</span>
        </span>
      </button>

      <span className={`tiny mono ${styles.day}`}>Dan {padDay(dayNumber)}</span>

      {/* A counter, not a live region: it renders 0 on the server and N
       * once the store hydrates, so `role="status"` announced 0 → N on
       * every load (review 2026-10-03 item 7). "1 / 365" for the eye,
       * "1 od 365 lekcija" for a screen reader. */}
      <span className={`tiny mono ${styles.metaRow}`}>
        <span aria-hidden="true">
          Pročitano {completedCount} / {totalLessons}
        </span>
        <span className="visually-hidden">
          {`Pročitano ${String(completedCount)} od ${String(totalLessons)} lekcija`}
        </span>
      </span>
    </div>
  );
}
