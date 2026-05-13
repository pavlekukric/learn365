import Link from 'next/link';

import styles from './PreviousNextLessonNavigation.module.css';

interface AdjacentLessonLink {
  title: string;
  dayNumber: number;
  href: string;
}

interface PreviousNextLessonNavigationProps {
  prev: AdjacentLessonLink | null;
  next: AdjacentLessonLink | null;
}

function formatDay(day: number): string {
  return String(day).padStart(3, '0');
}

export function PreviousNextLessonNavigation({
  prev,
  next,
}: PreviousNextLessonNavigationProps) {
  return (
    <nav className={styles.row} aria-label="Prethodna i sledeća lekcija">
      {prev ? (
        <Link href={prev.href} className={styles.link}>
          <span className={`tiny mono ${styles.label}`}>← DAN {formatDay(prev.dayNumber)}</span>
          <span className={`small ${styles.title}`}>{prev.title}</span>
        </Link>
      ) : (
        <span className={`${styles.link} ${styles.disabled}`} aria-disabled="true">
          <span className={`tiny mono ${styles.label}`}>Početak kursa</span>
        </span>
      )}
      {next ? (
        <Link href={next.href} className={`${styles.link} ${styles.right}`}>
          <span className={`tiny mono ${styles.label}`}>DAN {formatDay(next.dayNumber)} →</span>
          <span className={`small ${styles.title}`}>{next.title}</span>
        </Link>
      ) : (
        <span
          className={`${styles.link} ${styles.right} ${styles.disabled}`}
          aria-disabled="true"
        >
          <span className={`tiny mono ${styles.label}`}>Kraj kursa</span>
        </span>
      )}
    </nav>
  );
}
