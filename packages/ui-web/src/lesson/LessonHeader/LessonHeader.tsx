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
  const eyebrowBits = [
    `DAN ${formatDay(lesson.dayNumber)}`,
    era.eraShort,
    `${lesson.readingTimeMinutes} min čitanja`,
    lesson.dateLabel ?? `${String(lesson.year)}.`,
  ];

  return (
    <header className={styles.header}>
      <p className={`tiny mono ${styles.eyebrow}`}>{eyebrowBits.join(' · ')}</p>
      <h1 className="reader-title">{lesson.title}</h1>
      {lesson.subtitle ? <p className="lede">{lesson.subtitle}</p> : null}
      <Flourish />
    </header>
  );
}
