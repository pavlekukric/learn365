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
  currentLesson: (MiniLesson & { eraShort: string }) | null;
  nextLesson: MiniLesson | null;
  currentHref: string | null;
  nextHref: string | null;
  /**
   * Whether the user has completed at least one lesson. Drives the "current"
   * row's framing: a fresh user is *recommended a starting point* ("ZA
   * POČETAK", idle dot) rather than told a lesson is already "AKTUELNO".
   */
  hasStarted: boolean;
}

function formatDay(day: number): string {
  return `DAN ${String(day).padStart(3, '0')}`;
}

export function CourseProgress({
  completed,
  total,
  currentLesson,
  nextLesson,
  currentHref,
  nextHref,
  hasStarted,
}: CourseProgressProps) {
  const value = total > 0 ? completed / total : 0;
  const pct = toPercentInt(clamp01(value));
  const currentKicker = hasStarted ? 'AKTUELNO' : 'ZA POČETAK';

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
        <p className={`tiny mono ${styles.ringMeta}`}>
          {completed} / {total} završeno
        </p>
      </div>

      <div className={styles.rows}>
        {currentLesson ? (
          <Link
            href={currentHref ?? '#'}
            className={styles.row}
            aria-disabled={currentHref === null}
          >
            <CompletionDot state={hasStarted ? 'active' : 'idle'} />
            <span className={styles.rowText}>
              <span className={`tiny mono ${styles.rowLabel}`}>
                {currentKicker} · {currentLesson.eraShort}
              </span>
              <span className={styles.rowTitle}>{currentLesson.title}</span>
            </span>
            <span className={`tiny mono ${styles.rowDay}`}>{formatDay(currentLesson.day)}</span>
          </Link>
        ) : null}

        {/* Empty state shows one confident "start here" row only; the parallel
         * SLEDEĆE row appears once the user has actually started progressing,
         * so it never competes with the entry point for a fresh visitor. */}
        {hasStarted && nextLesson ? (
          <Link
            href={nextHref ?? '#'}
            className={styles.row}
            aria-disabled={nextHref === null}
          >
            <CompletionDot state="idle" />
            <span className={styles.rowText}>
              <span className={`tiny mono ${styles.rowLabel}`}>SLEDEĆE</span>
              <span className={styles.rowTitle}>{nextLesson.title}</span>
            </span>
            <span className={`tiny mono ${styles.rowDay}`}>{formatDay(nextLesson.day)}</span>
          </Link>
        ) : null}
      </div>
    </article>
  );
}
