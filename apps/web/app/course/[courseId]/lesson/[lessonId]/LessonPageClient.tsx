'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  getEras,
  getLessons,
  getSections,
  type CourseId,
  type Era,
  type Lesson,
  type Section,
  type SectionId,
} from '@learn365/content';
import { isCompleted } from '@learn365/core';
import {
  CourseSidebar,
  IconMenu,
  LessonReader,
  MobileLessonDrawer,
} from '@learn365/ui-web';

import { useProgressStore } from '@/lib/progress/ProgressStoreProvider';

import styles from './LessonPageClient.module.css';

interface AdjacentLesson {
  readonly id: string;
  readonly title: string;
  readonly dayNumber: number;
}

interface LessonPageClientProps {
  courseId: CourseId;
  courseTitle: string;
  lesson: Lesson;
  era: Era;
  section: Section;
  prev: AdjacentLesson | null;
  next: AdjacentLesson | null;
}

export function LessonPageClient({
  courseId,
  courseTitle,
  lesson,
  era,
  section,
  prev,
  next,
}: LessonPageClientProps) {
  const completed = useProgressStore((state) => isCompleted(state, courseId, lesson.id));
  const toggleComplete = useProgressStore((state) => state.toggleComplete);
  const markOpened = useProgressStore((state) => state.markOpened);
  const completedSet = useProgressStore(
    (state) => state.byCourse[courseId]?.completedLessonIds ?? null,
  );

  const eras = useMemo(() => getEras(courseId), [courseId]);
  const sections = useMemo(() => getSections(courseId), [courseId]);
  const lessons = useMemo(() => getLessons(courseId), [courseId]);

  const [openSectionIds, setOpenSectionIds] = useState<ReadonlySet<SectionId>>(
    () => new Set([section.id]),
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    markOpened(courseId, lesson.id);
  }, [courseId, lesson.id, markOpened]);

  // Keep the current lesson's section expanded when the user navigates.
  useEffect(() => {
    setOpenSectionIds((prev) => {
      if (prev.has(section.id)) return prev;
      const nextSet = new Set(prev);
      nextSet.add(section.id);
      return nextSet;
    });
  }, [section.id]);

  const handleToggleSection = useCallback((id: SectionId) => {
    setOpenSectionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const lessonHref = useCallback(
    (l: Lesson) => `/course/${courseId}/lesson/${l.id}`,
    [courseId],
  );

  const eraHref = useCallback(
    (eraId: string) => {
      const firstInEra = lessons.find((l) => l.eraId === eraId);
      return firstInEra
        ? `/course/${courseId}/lesson/${firstInEra.id}`
        : `/course/${courseId}`;
    },
    [courseId, lessons],
  );

  const breadcrumbs = useMemo(
    () => [
      { label: 'Početna', onClick: undefined },
      { label: courseTitle, onClick: undefined },
      { label: era.title, onClick: undefined },
      { label: `Dan ${String(lesson.dayNumber).padStart(3, '0')}` },
    ],
    [courseTitle, era.title, lesson.dayNumber],
  );

  const sidebarProps = {
    course: { id: courseId, title: courseTitle },
    eras,
    sections,
    lessons,
    currentLessonId: lesson.id,
    completedIds: completedSet ?? new Set<string>(),
    openSectionIds,
    onToggleSection: handleToggleSection,
    lessonHref,
  };

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebarColumn}>
        <CourseSidebar {...sidebarProps} />
      </aside>

      <div className={styles.readerColumn}>
        <div className={styles.mobileBar}>
          <button
            type="button"
            className={styles.outlineButton}
            onClick={() => {
              setDrawerOpen(true);
            }}
            aria-label="Otvori sadržaj kursa"
          >
            <IconMenu />
            <span>Sadržaj</span>
          </button>
          <span className={`tiny mono ${styles.mobileBarMeta}`}>
            DAN {String(lesson.dayNumber).padStart(3, '0')} · {era.eraShort}
          </span>
        </div>

        <LessonReader
          lesson={lesson}
          era={era}
          section={section}
          eras={eras}
          breadcrumbs={breadcrumbs}
          isCompleted={completed}
          onToggleComplete={() => {
            toggleComplete(courseId, lesson.id);
          }}
          prev={
            prev
              ? {
                  title: prev.title,
                  dayNumber: prev.dayNumber,
                  href: `/course/${courseId}/lesson/${prev.id}`,
                }
              : null
          }
          next={
            next
              ? {
                  title: next.title,
                  dayNumber: next.dayNumber,
                  href: `/course/${courseId}/lesson/${next.id}`,
                }
              : null
          }
          eraHref={eraHref}
        />
      </div>

      <MobileLessonDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
        }}
      >
        <CourseSidebar {...sidebarProps} />
      </MobileLessonDrawer>
    </div>
  );
}
