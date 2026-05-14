'use client';

import { useState } from 'react';

import {
  getEras,
  getLessonsByEra,
  getLessonsBySection,
  getSectionsByEra,
  type CourseId,
  type LessonId,
  type Section,
  type SectionId,
} from '@learn365/content';
import {
  isCompleted,
  lastOpenedLessonId,
  progressForLessons,
  type ProgressState,
} from '@learn365/core';
import { CourseCard, IconChev, LessonNavItem } from '@learn365/ui-web';

import { useProgressStore } from '@/lib/progress/ProgressStoreProvider';

import styles from './CourseOverviewEras.module.css';

interface CourseOverviewErasProps {
  courseId: CourseId;
}

function formatDay(day: number): string {
  return `D${String(day).padStart(3, '0')}`;
}

interface SectionAccordionRowProps {
  courseId: CourseId;
  section: Section;
  isOpen: boolean;
  onToggle: () => void;
  progressState: ProgressState;
  currentLessonId: LessonId | null;
}

/**
 * A lesson group rendered as a calm accordion row: collapsed by default,
 * the whole header toggles its daily lessons open inline. The daily
 * lessons are reused `LessonNavItem`s so completion / active state comes
 * from the existing progress logic — no new data is introduced here.
 */
function SectionAccordionRow({
  courseId,
  section,
  isOpen,
  onToggle,
  progressState,
  currentLessonId,
}: SectionAccordionRowProps) {
  const lessons = getLessonsBySection(courseId, section.id);
  const count = section.endDay - section.startDay + 1;
  const panelId = `era-section-${section.id}`;

  return (
    <li className={styles.sectionItem}>
      <button
        type="button"
        className={`${styles.sectionRow} ${isOpen ? styles.sectionRowOpen : ''}`}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span
          className={`${styles.chev} ${isOpen ? styles.chevOpen : ''}`}
          aria-hidden="true"
        >
          <IconChev />
        </span>
        <span className={styles.sectionMeta}>
          <span className={`tiny mono ${styles.sectionDays}`}>
            {formatDay(section.startDay)}–{formatDay(section.endDay)}
          </span>
          <span className={styles.sectionTitle}>{section.title}</span>
        </span>
        <span className={`tiny mono ${styles.sectionCount}`}>{count}</span>
      </button>

      {isOpen ? (
        <ol id={panelId} className={styles.lessons}>
          {lessons.map((lesson) => {
            const state =
              lesson.id === currentLessonId
                ? 'active'
                : isCompleted(progressState, courseId, lesson.id)
                  ? 'completed'
                  : 'idle';
            return (
              <li key={lesson.id}>
                <LessonNavItem
                  lesson={lesson}
                  state={state}
                  href={`/course/${courseId}/lesson/${lesson.id}`}
                />
              </li>
            );
          })}
        </ol>
      ) : null}
    </li>
  );
}

export function CourseOverviewEras({ courseId }: CourseOverviewErasProps) {
  const eras = getEras(courseId);
  const lastId = useProgressStore((state) => lastOpenedLessonId(state, courseId));
  const progressState = useProgressStore((state) => state);
  // Single-open accordion: at most one lesson group is expanded at a time,
  // which keeps the Course page scannable on mobile and desktop alike.
  const [openSectionId, setOpenSectionId] = useState<SectionId | null>(null);

  return (
    <div className={styles.list}>
      {eras.map((era) => {
        const eraLessons = getLessonsByEra(courseId, era.id);
        const sections = getSectionsByEra(courseId, era.id);
        const { done, total } = progressForLessons(
          progressState,
          courseId,
          eraLessons.map((l) => l.id),
        );
        const isAllDone = total > 0 && done === total;
        const isCurrent =
          !isAllDone && lastId !== null && eraLessons.some((l) => l.id === lastId);
        const firstLessonId = eraLessons[0]?.id;
        const href = firstLessonId
          ? `/course/${courseId}/lesson/${firstLessonId}`
          : `/course/${courseId}`;

        return (
          <article key={era.id} className={styles.era}>
            <CourseCard
              era={era}
              totalLessons={total}
              completedLessons={done}
              isCurrent={isCurrent}
              isAllDone={isAllDone}
              href={href}
            />
            <div className={styles.eraChildren}>
              <p className={`body ${styles.eraDescription}`}>{era.description}</p>
              <ul className={styles.sections}>
                {sections.map((section) => (
                  <SectionAccordionRow
                    key={section.id}
                    courseId={courseId}
                    section={section}
                    isOpen={openSectionId === section.id}
                    onToggle={() =>
                      setOpenSectionId((prev) =>
                        prev === section.id ? null : section.id,
                      )
                    }
                    progressState={progressState}
                    currentLessonId={lastId}
                  />
                ))}
              </ul>
            </div>
          </article>
        );
      })}
    </div>
  );
}
