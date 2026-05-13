'use client';

import {
  getEras,
  getLessonsByEra,
  type CourseId,
} from '@learn365/content';
import { lastOpenedLessonId, progressForLessons } from '@learn365/core';
import { CourseCard } from '@learn365/ui-web';

import { useProgressStore } from '@/lib/progress/ProgressStoreProvider';

interface HomeErasListProps {
  courseId: CourseId;
}

export function HomeErasList({ courseId }: HomeErasListProps) {
  const eras = getEras(courseId);
  const lastId = useProgressStore((state) => lastOpenedLessonId(state, courseId));
  const progressState = useProgressStore((state) => state);

  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {eras.map((era) => {
        const eraLessons = getLessonsByEra(courseId, era.id);
        const lessonIds = eraLessons.map((l) => l.id);
        const { done, total } = progressForLessons(progressState, courseId, lessonIds);
        const isAllDone = total > 0 && done === total;
        const isCurrent =
          !isAllDone &&
          lastId !== null &&
          eraLessons.some((l) => l.id === lastId);
        const firstLessonId = eraLessons[0]?.id;
        const href = firstLessonId
          ? `/course/${courseId}/lesson/${firstLessonId}`
          : `/course/${courseId}`;
        return (
          <li key={era.id}>
            <CourseCard
              era={era}
              totalLessons={total}
              completedLessons={done}
              isCurrent={isCurrent}
              isAllDone={isAllDone}
              href={href}
            />
          </li>
        );
      })}
    </ul>
  );
}
