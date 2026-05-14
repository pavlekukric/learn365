import Link from 'next/link';

import type { Era } from '@learn365/content';

import { IconArrow } from '../../icons/IconArrow.js';
import { IconCheck } from '../../icons/IconCheck.js';
import { Chip } from '../../primitives/Chip/Chip.js';
import { ProgressBar } from '../../primitives/ProgressBar/ProgressBar.js';

import styles from './CourseCard.module.css';

interface CourseCardProps {
  era: Era;
  totalLessons: number;
  completedLessons: number;
  isCurrent: boolean;
  isAllDone: boolean;
  href: string;
}

export function CourseCard({
  era,
  totalLessons,
  completedLessons,
  isCurrent,
  isAllDone,
  href,
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
      </span>

      <span className={styles.progressBlock}>
        <ProgressBar
          value={progress}
          size="thin"
          ariaLabel={`${era.title} napredak`}
          ariaValueText={`${String(completedLessons)} od ${String(totalLessons)}`}
        />
        <span className={styles.progressMeta}>
          <span className={`tiny mono ${styles.count}`}>
            {String(completedLessons).padStart(3, '0')} / {totalLessons}
          </span>
          {isCurrent ? <Chip variant="accent">u toku</Chip> : null}
        </span>
      </span>

      <span className={styles.statusIcon} aria-hidden="true">
        {isAllDone ? <IconCheck className={styles.checkIcon} /> : <IconArrow />}
      </span>
    </Link>
  );
}
