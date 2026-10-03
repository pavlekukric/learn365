import Link from 'next/link';

import { formatDayEyebrow } from '@learn365/core';

import { IconArrow } from '../../icons/IconArrow.js';
import { IconArrowLeft } from '../../icons/IconArrowLeft.js';

import styles from './PreviousNextLessonNavigation.module.css';

interface AdjacentLessonLink {
  title: string;
  dayNumber: number;
  href: string;
  /** Optional metadata used only by the post-completion footer; ignored
   * here, but accepted so the same prev/next props can flow into either
   * component without callers building two shapes. */
  eraLabel?: string;
  readingTimeMinutes?: number;
}

interface PreviousNextLessonNavigationProps {
  prev: AdjacentLessonLink | null;
  next: AdjacentLessonLink | null;
}

export function PreviousNextLessonNavigation({ prev, next }: PreviousNextLessonNavigationProps) {
  return (
    <nav className={styles.row} aria-label="Prethodna i sledeća lekcija">
      {prev ? (
        <Link href={prev.href} className={`${styles.link} ${styles.prev}`}>
          <span className={`tiny mono ${styles.label}`}>
            <IconArrowLeft className={styles.arrow} />
            {formatDayEyebrow(prev.dayNumber)}
          </span>
          <span className={`small ${styles.title}`}>{prev.title}</span>
        </Link>
      ) : (
        <span className={`${styles.link} ${styles.prev} ${styles.disabled}`} aria-disabled="true">
          <span className={`tiny mono ${styles.label}`}>Početak kursa</span>
          <span className={`small ${styles.title}`}>Ovo je prva lekcija</span>
        </span>
      )}

      <span className={styles.divider} aria-hidden="true" />

      {next ? (
        <Link href={next.href} className={`${styles.link} ${styles.next}`}>
          <span className={`tiny mono ${styles.label}`}>
            {formatDayEyebrow(next.dayNumber)}
            <IconArrow className={styles.arrow} />
          </span>
          <span className={`small ${styles.title}`}>{next.title}</span>
        </Link>
      ) : (
        <span className={`${styles.link} ${styles.next} ${styles.disabled}`} aria-disabled="true">
          <span className={`tiny mono ${styles.label}`}>Kraj kursa</span>
          <span className={`small ${styles.title}`}>Ovo je poslednja lekcija</span>
        </span>
      )}
    </nav>
  );
}
