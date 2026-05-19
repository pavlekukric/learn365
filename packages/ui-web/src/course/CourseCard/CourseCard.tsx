import Link from 'next/link';

import type { Era } from '@learn365/content';

import { IconArrow } from '../../icons/IconArrow.js';
import { IconCheck } from '../../icons/IconCheck.js';
import { ProgressBar } from '../../primitives/ProgressBar/ProgressBar.js';

import styles from './CourseCard.module.css';

interface CourseCardProps {
  era: Era;
  totalLessons: number;
  completedLessons: number;
  isCurrent: boolean;
  isAllDone: boolean;
  href: string;
  /**
   * Optional editorial paragraph. When provided, the card reads as an
   * editorial block (eyebrow + title + years + description + progress) rather
   * than a navigation row. Rendered as a span (not p) because the card is a
   * Link and paragraphs cannot be descendants of interactive elements.
   */
  description?: string;
}

export function CourseCard({
  era,
  totalLessons,
  completedLessons,
  isCurrent,
  isAllDone,
  href,
  description,
}: CourseCardProps) {
  const progress = totalLessons > 0 ? completedLessons / totalLessons : 0;
  const cls = [
    styles.card,
    isCurrent ? styles.current : null,
    isAllDone ? styles.done : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Link href={href} className={cls} aria-label={`Epoha ${era.num}: ${era.title}`}>
      <span className={`tiny mono ${styles.num}`}>EPOHA {era.num}</span>

      <span className={styles.titleBlock}>
        <span className={`h3 ${styles.title}`}>{era.title}</span>
        <span className={`tiny mono ${styles.years}`}>{era.yearsLabel}</span>
        {description ? (
          <span className={`small ${styles.description}`}>{description}</span>
        ) : null}
      </span>

      <span className={styles.progressBlock}>
        <span className={styles.progressMeta}>
          <span className={`tiny mono ${styles.count}`}>
            {completedLessons} / {totalLessons}
          </span>
        </span>
        <ProgressBar
          value={progress}
          size="thin"
          ariaLabel={`${era.title} napredak`}
          ariaValueText={`${String(completedLessons)} od ${String(totalLessons)}`}
        />
      </span>

      <span className={styles.statusIcon} aria-hidden="true">
        {isAllDone ? <IconCheck className={styles.checkIcon} /> : <IconArrow />}
      </span>
    </Link>
  );
}
