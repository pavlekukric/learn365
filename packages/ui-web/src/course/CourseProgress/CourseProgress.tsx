import Link from 'next/link';

import { CompletionDot } from '../../primitives/CompletionDot/CompletionDot.js';
import { ProgressRing } from '../../primitives/ProgressRing/ProgressRing.js';
import { clamp01, toPercentInt } from '../../_internal/progressMath.js';

import styles from './CourseProgress.module.css';

interface MiniLesson {
  day: number;
  title: string;
}

interface CourseProgressProps {
  completed: number;
  total: number;
  /**
   * The single "where am I" lesson the canonical row links to. For a fresh
   * user this is Day 1 (recommended start); for an in-progress user it is
   * the current/last-opened lesson resolved by the adapter.
   */
  lesson: MiniLesson | null;
  href: string | null;
  /**
   * Journey-day eyebrow, e.g. `'Tvoj 4. dan'`. Pass `null` for a fresh user
   * (`completedCount === 0`) — the row falls back to a `ZAPOČNI` kicker.
   * Mirrors the framing established by `HomeDailyAnchor` (Phase 7.8) so the
   * two surfaces speak the same daily-ritual register.
   */
  journeyDayLabel: string | null;
}

function formatDay(day: number): string {
  return `DAN ${String(day).padStart(3, '0')}`;
}

export function CourseProgress({
  completed,
  total,
  lesson,
  href,
  journeyDayLabel,
}: CourseProgressProps) {
  const value = total > 0 ? completed / total : 0;
  const pct = toPercentInt(clamp01(value));
  const hasStarted = journeyDayLabel !== null;
  const kicker = journeyDayLabel ?? 'ZAPOČNI';

  return (
    <article className={styles.card}>
      <div className={styles.ringBlock}>
        <ProgressRing value={value} size={120} stroke={6}>
          <span
            className={`${styles.ringValue} ${pct === 0 ? styles.ringValueZero : ''}`}
          >
            {pct}%
          </span>
        </ProgressRing>
      </div>

      <div className={styles.rows}>
        {lesson ? (
          <Link
            href={href ?? '#'}
            className={styles.row}
            aria-disabled={href === null}
          >
            <CompletionDot state={hasStarted ? 'active' : 'idle'} />
            <span className={styles.rowText}>
              <span className={`tiny mono ${styles.rowLabel}`}>{kicker}</span>
              <span className={styles.rowTitle}>{lesson.title}</span>
            </span>
            <span className={`tiny mono ${styles.rowDay}`}>{formatDay(lesson.day)}</span>
          </Link>
        ) : null}
      </div>
    </article>
  );
}
