'use client';

import {
  getEras,
  getLessonsByEra,
  getSectionsByEra,
  type CourseId,
} from '@learn365/content';
import {
  lastOpenedLessonId,
  progressForLessons,
} from '@learn365/core';
import { CourseCard } from '@learn365/ui-web';

import { useProgressStore } from '@/lib/progress/ProgressStoreProvider';

import styles from './CourseOverviewEras.module.css';

interface CourseOverviewErasProps {
  courseId: CourseId;
}

export function CourseOverviewEras({ courseId }: CourseOverviewErasProps) {
  const eras = getEras(courseId);
  const lastId = useProgressStore((state) => lastOpenedLessonId(state, courseId));
  const progressState = useProgressStore((state) => state);

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
                {sections.map((section) => {
                  const count = section.endDay - section.startDay + 1;
                  const padStart = String(section.startDay).padStart(3, '0');
                  const padEnd = String(section.endDay).padStart(3, '0');
                  return (
                    <li key={section.id} className={styles.sectionRow}>
                      <span className={`tiny mono ${styles.sectionDays}`}>
                        D{padStart}–D{padEnd}
                      </span>
                      <span className={styles.sectionTitle}>{section.title}</span>
                      <span className={`tiny mono ${styles.sectionCount}`}>{count}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </article>
        );
      })}
    </div>
  );
}
