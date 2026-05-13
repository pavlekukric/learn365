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
}: CourseProgressProps) {
  const value = total > 0 ? completed / total : 0;
  const pct = toPercentInt(clamp01(value));

  return (
    <article className={styles.card}>
      <div className={styles.ringBlock}>
        <ProgressRing value={value} size={120} stroke={6}>
          <span className={styles.ringValue}>{pct}%</span>
        </ProgressRing>
        <p className={`tiny mono ${styles.ringMeta}`}>
          {String(completed).padStart(3, '0')} / {total} završeno
        </p>
      </div>

      <div className={styles.rows}>
        {currentLesson ? (
          <Link
            href={currentHref ?? '#'}
            className={styles.row}
            aria-disabled={currentHref === null}
          >
            <CompletionDot state="active" />
            <span className={styles.rowText}>
              <span className={`tiny mono ${styles.rowLabel}`}>AKTUELNO · {currentLesson.eraShort}</span>
              <span className={styles.rowTitle}>{currentLesson.title}</span>
            </span>
            <span className={`tiny mono ${styles.rowDay}`}>{formatDay(currentLesson.day)}</span>
          </Link>
        ) : null}

        {nextLesson ? (
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
