import Link from 'next/link';

import { CompletionDot } from '../../primitives/CompletionDot/CompletionDot.js';

import styles from './CurrentLessonCard.module.css';

type LessonState = 'idle' | 'active' | 'done';

interface CurrentLessonCardProps {
  lesson: {
    day: number;
    title: string;
    readingTimeMinutes: number;
    eraShort: string;
  };
  state: LessonState;
  href: string;
}

function formatDay(day: number): string {
  return String(day).padStart(3, '0');
}

export function CurrentLessonCard({
  lesson,
  state,
  href,
}: CurrentLessonCardProps) {
  return (
    <Link href={href} className={styles.card}>
      <span className={`tiny mono ${styles.eyebrow}`}>
        DAN {formatDay(lesson.day)} · {lesson.eraShort}
      </span>
      <span className={styles.title}>{lesson.title}</span>
      <span className={styles.foot}>
        <CompletionDot state={state} />
        <span className={`tiny mono ${styles.meta}`}>
          {lesson.readingTimeMinutes} min čitanja
        </span>
      </span>
    </Link>
  );
}
