import type { Era, Lesson } from '@learn365/content';

import { Flourish } from '../../primitives/Flourish/Flourish.js';

import styles from './LessonHeader.module.css';

interface LessonHeaderProps {
  lesson: Lesson;
  era: Era;
}

function formatDay(day: number): string {
  return String(day).padStart(3, '0');
}

export function LessonHeader({ lesson, era }: LessonHeaderProps) {
  return (
    <header className={styles.header}>
      <p className={`tiny mono ${styles.eyebrow}`}>
        {/* DAN + era are repeated in the sticky context header on single-column
         * layouts, so this leading group is hidden ≤1024px (its trailing
         * separator goes with it). Reading time + year stay — the context
         * header doesn't carry those. */}
        <span className={styles.eyebrowContext}>
          {`DAN ${formatDay(lesson.dayNumber)} · ${era.eraShort} · `}
        </span>
        {`${String(lesson.readingTimeMinutes)} min čitanja · ${lesson.dateLabel ?? `${String(lesson.year)}.`}`}
      </p>
      <h1 className="reader-title">{lesson.title}</h1>
      {lesson.subtitle ? <p className="lede">{lesson.subtitle}</p> : null}
      <Flourish />
    </header>
  );
}
