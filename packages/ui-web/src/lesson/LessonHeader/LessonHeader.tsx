import type { Lesson } from '@learn365/content';

import { Flourish } from '../../primitives/Flourish/Flourish.js';

import styles from './LessonHeader.module.css';

interface LessonHeaderProps {
  lesson: Lesson;
}

export function LessonHeader({ lesson }: LessonHeaderProps) {
  return (
    <header className={styles.header}>
      <p className={`tiny mono ${styles.eyebrow}`}>
        {/* DAN + era are already carried by the breadcrumb and (on desktop)
         * the inline timeline above. The eyebrow keeps only the two facts
         * those surfaces don't: how long the read is, and when it happened. */}
        {`${String(lesson.readingTimeMinutes)} min čitanja · ${lesson.dateLabel ?? `${String(lesson.year)}.`}`}
      </p>
      <h1 className="reader-title">{lesson.title}</h1>
      {lesson.subtitle ? <p className="lede">{lesson.subtitle}</p> : null}
      <Flourish />
    </header>
  );
}
