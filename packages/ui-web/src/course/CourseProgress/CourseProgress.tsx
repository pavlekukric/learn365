import Link from 'next/link';

import { formatDayEyebrow } from '@learn365/core';

import { IconArrow } from '../../icons/IconArrow.js';
import { CompletionDot } from '../../primitives/CompletionDot/CompletionDot.js';
import { ProgressRing } from '../../primitives/ProgressRing/ProgressRing.js';
import { clamp01 } from '../../_internal/progressMath.js';

import styles from './CourseProgress.module.css';

interface MiniLesson {
  day: number;
  title: string;
  readingTimeMinutes?: number;
}

interface CourseProgressProps {
  completed: number;
  total: number;
  /**
   * The single "where am I" lesson the canonical row links to. For a fresh
   * user this is Day 1 (recommended start); for an in-progress user it is
   * the resume target resolved by the adapter (the unfinished lesson the
   * reader left, else the next unread day). `null` once the course is done.
   */
  lesson: MiniLesson | null;
  href: string | null;
  /**
   * Journey-day eyebrow, e.g. `'Tvoj 4. dan'`. Pass `null` for a fresh user
   * (`completedCount === 0`) — the card then renders its start state: no
   * ring, no score, one clear "Počni od Dana 1" action.
   * Mirrors the framing established by `HomeDailyAnchor` (Phase 7.8) so the
   * two surfaces speak the same daily-ritual register.
   */
  journeyDayLabel: string | null;
}

function readingMeta(minutes: number | undefined): string | null {
  return minutes === undefined ? null : `${String(minutes)} min čitanja`;
}

export function CourseProgress({
  completed,
  total,
  lesson,
  href,
  journeyDayLabel,
}: CourseProgressProps) {
  const hasStarted = journeyDayLabel !== null;

  // Fresh user: an empty 0% ring is a deflating first impression. Show the
  // lesson to open and one unmistakable way in instead.
  if (!hasStarted) {
    if (!lesson) return null;
    const meta = readingMeta(lesson.readingTimeMinutes);
    return (
      <article className={`${styles.card} ${styles.cardIdle}`}>
        <div className={styles.idleText}>
          <span className={`tiny mono ${styles.rowLabel}`}>Počni · {formatDayEyebrow(lesson.day)}</span>
          <span className={styles.idleTitle}>{lesson.title}</span>
          {meta ? <span className={`tiny mono ${styles.rowMeta}`}>{meta}</span> : null}
        </div>
        <Link href={href ?? '#'} className={styles.startCta} aria-disabled={href === null}>
          Počni od Dana {lesson.day}
          <IconArrow className={styles.ctaArrow} />
        </Link>
      </article>
    );
  }

  const value = total > 0 ? clamp01(completed / total) : 0;
  const meta = lesson
    ? [formatDayEyebrow(lesson.day), readingMeta(lesson.readingTimeMinutes)].filter(Boolean).join(' · ')
    : null;

  return (
    <article className={styles.card}>
      {/* The ring counts lessons, not percent: 1 / 365 rounds to "0%", which
       * would erase the first win. The arc still shows the year. */}
      <div className={styles.ringBlock}>
        <ProgressRing
          value={value}
          size={120}
          stroke={6}
          label={`Pročitano ${String(completed)} od ${String(total)} lekcija`}
        >
          <span className={styles.ringCenter}>
            <span className={styles.ringCount}>{completed}</span>
            <span className={`tiny mono ${styles.ringOf}`}>od {total}</span>
          </span>
        </ProgressRing>
      </div>

      <div className={styles.rows}>
        {lesson ? (
          <Link href={href ?? '#'} className={styles.row} aria-disabled={href === null}>
            <CompletionDot state="active" />
            <span className={styles.rowText}>
              <span className={`tiny mono ${styles.rowLabel}`}>{journeyDayLabel}</span>
              <span className={styles.rowTitle}>{lesson.title}</span>
              {meta ? <span className={`tiny mono ${styles.rowMeta}`}>{meta}</span> : null}
            </span>
            <span className={styles.rowAction}>
              <span className={styles.rowActionLabel}>Nastavi</span>
              <IconArrow className={styles.rowArrow} />
            </span>
          </Link>
        ) : (
          <p className={styles.allDone}>Sve lekcije su pročitane.</p>
        )}
      </div>
    </article>
  );
}
