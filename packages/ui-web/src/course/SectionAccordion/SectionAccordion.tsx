import { useId } from 'react';

import type { LessonId, LessonSummary, Section } from '@learn365/content';
import { formatDayRange } from '@learn365/core';

import { IconChev } from '../../icons/IconChev.js';
import { LessonNavItem } from '../LessonNavItem/LessonNavItem.js';

import styles from './SectionAccordion.module.css';

interface SectionAccordionProps {
  section: Section;
  lessons: readonly LessonSummary[];
  currentLessonId: LessonId | null;
  completedIds: ReadonlySet<LessonId>;
  isOpen: boolean;
  onToggle: () => void;
  /** Builder returning the href for a lesson within the parent course. */
  lessonHref: (lesson: LessonSummary) => string;
}

export function SectionAccordion({
  section,
  lessons,
  currentLessonId,
  completedIds,
  isOpen,
  onToggle,
  lessonHref,
}: SectionAccordionProps) {
  const panelId = useId();
  const completedCount = lessons.reduce(
    (acc, l) => (completedIds.has(l.id) ? acc + 1 : acc),
    0,
  );
  const containsCurrent =
    currentLessonId !== null && lessons.some((l) => l.id === currentLessonId);

  const headerCls = [
    styles.header,
    isOpen ? styles.open : null,
    containsCurrent ? styles.containsCurrent : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={styles.section}>
      <button
        type="button"
        className={headerCls}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span className={`${styles.chev} ${isOpen ? styles.chevOpen : ''}`} aria-hidden="true">
          <IconChev />
        </span>
        <span className={styles.titleBlock}>
          <span className={styles.title}>{section.title}</span>
          <span className={`tiny mono ${styles.range}`}>
            {formatDayRange(section.startDay, section.endDay)}
          </span>
        </span>
        <span className={`tiny mono ${styles.counter}`}>
          {completedCount} / {lessons.length}
        </span>
      </button>

      {isOpen ? (
        <ol id={panelId} className={styles.lessons}>
          {lessons.map((lesson) => {
            const state =
              lesson.id === currentLessonId
                ? 'active'
                : completedIds.has(lesson.id)
                  ? 'completed'
                  : 'idle';
            return (
              <li key={lesson.id}>
                <LessonNavItem lesson={lesson} state={state} href={lessonHref(lesson)} />
              </li>
            );
          })}
        </ol>
      ) : null}
    </section>
  );
}
