import Link from 'next/link';

import type { LessonSummary } from '@learn365/content';
import { padDay } from '@learn365/core';

import { CompletionDot } from '../../primitives/CompletionDot/CompletionDot.js';

import styles from './LessonNavItem.module.css';

interface LessonNavItemProps {
  lesson: LessonSummary;
  /**
   * "You are here": the open lesson in the outline, the resume lesson on the
   * course overview. Tinted row, accent bar.
   */
  active: boolean;
  /**
   * Read. Independent of `active` (Phase 21): the row the reader is on can
   * be read too, and then keeps the tint and shows the check.
   */
  completed: boolean;
  href: string;
  /**
   * `false` where the active row is not the page being viewed (the course
   * overview's "you are here" row): same look, no `aria-current="page"`.
   */
  isCurrentPage?: boolean;
}

export function LessonNavItem({
  lesson,
  active,
  completed,
  href,
  isCurrentPage = true,
}: LessonNavItemProps) {
  const isPlaceholder = lesson.isPlaceholder === true;
  const dotState: 'idle' | 'active' | 'done' = completed ? 'done' : active ? 'active' : 'idle';
  const cls = [
    styles.row,
    completed ? styles.completed : null,
    active ? styles.active : null,
    isPlaceholder ? styles.placeholder : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Link
      href={href}
      className={cls}
      aria-current={active && isCurrentPage ? 'page' : undefined}
      aria-label={isPlaceholder ? `${lesson.title} — uskoro dostupno` : undefined}
    >
      <CompletionDot state={dotState} />
      <span className={`tiny mono ${styles.day}`}>{padDay(lesson.dayNumber)}</span>
      <span className={styles.title}>{lesson.title}</span>
      {/* The dot is decoration (`aria-hidden`); the state is said in words —
       * on the active row too. */}
      {completed ? <span className="visually-hidden">, pročitano</span> : null}
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
