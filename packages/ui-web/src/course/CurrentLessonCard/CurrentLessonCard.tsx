import Link from 'next/link';

import { formatDayEyebrow } from '@learn365/core';

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

export function CurrentLessonCard({
  lesson,
  state,
  href,
}: CurrentLessonCardProps) {
  return (
    <Link href={href} className={styles.card}>
      <span className={`tiny mono ${styles.eyebrow}`}>
        {formatDayEyebrow(lesson.day)} · {lesson.eraShort}
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
