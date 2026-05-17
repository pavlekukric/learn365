import Link from 'next/link';

import type { Lesson } from '@learn365/content';

import { CompletionDot } from '../../primitives/CompletionDot/CompletionDot.js';

import styles from './LessonNavItem.module.css';

export type LessonNavItemState = 'idle' | 'active' | 'completed';

interface LessonNavItemProps {
  lesson: Lesson;
  state: LessonNavItemState;
  href: string;
}

function formatDay(day: number): string {
  return `D${String(day).padStart(3, '0')}`;
}

export function LessonNavItem({ lesson, state, href }: LessonNavItemProps) {
  const isPlaceholder = lesson.isPlaceholder === true;
  const dotState: 'idle' | 'active' | 'done' =
    state === 'completed' ? 'done' : state;
  const cls = [
    styles.row,
    styles[`state_${state}`],
    isPlaceholder ? styles.placeholder : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Link
      href={href}
      className={cls}
      aria-current={state === 'active' ? 'page' : undefined}
      aria-label={isPlaceholder ? `${lesson.title} — uskoro dostupno` : undefined}
    >
      <CompletionDot state={dotState} />
      <span className={`tiny mono ${styles.day}`}>{formatDay(lesson.dayNumber)}</span>
      <span className={styles.title}>{lesson.title}</span>
      {/* Placeholder rows omit the trailing meta cell entirely — the italic,
       * faded row styling carries the "not yet available" meaning, and an
       * aria-label keeps the state accessible without a visible chip. */}
      {isPlaceholder ? null : (
        <span className={`tiny mono ${styles.meta}`}>
          {lesson.readingTimeMinutes} min
        </span>
      )}
    </Link>
  );
}
