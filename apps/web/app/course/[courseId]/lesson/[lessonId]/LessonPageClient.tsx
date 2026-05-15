'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  getEras,
  getLessons,
  getSections,
  type CourseId,
  type Era,
  type EraId,
  type Lesson,
  type Section,
  type SectionId,
} from '@learn365/content';
import { isCompleted } from '@learn365/core';
import {
  CourseSidebar,
  type EraStat,
  LessonReader,
  MobileLessonDrawer,
} from '@learn365/ui-web';

import { useProgressStore } from '@/lib/progress/ProgressStoreProvider';

import { LessonContextHeader } from './LessonContextHeader';
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
  const [openEraIds, setOpenEraIds] = useState<ReadonlySet<EraId>>(
    () => new Set([era.id]),
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

  // Keep the current lesson's era expanded when the user navigates across eras.
  useEffect(() => {
    setOpenEraIds((prev) => {
      if (prev.has(era.id)) return prev;
      const nextSet = new Set(prev);
      nextSet.add(era.id);
      return nextSet;
    });
  }, [era.id]);

  const handleToggleSection = useCallback((id: SectionId) => {
    setOpenSectionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleEra = useCallback((id: EraId) => {
    setOpenEraIds((prev) => {
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

  // Per-era lesson + completion counts for the timeline's proportional widths
  // and progress fill. Derived from the already-loaded lessons + progress set.
  const eraStats = useMemo(() => {
    const map = new Map<EraId, EraStat>();
    for (const e of eras) {
      const eraLessons = lessons.filter((l) => l.eraId === e.id);
      const completed = completedSet
        ? eraLessons.reduce(
            (acc, l) => (completedSet.has(l.id) ? acc + 1 : acc),
            0,
          )
        : 0;
      map.set(e.id, {
        lessonCount: eraLessons.length,
        completedCount: completed,
      });
    }
    return map;
  }, [eras, lessons, completedSet]);

  const breadcrumbs = useMemo(
    () => [
      { label: 'Početna', href: '/' },
      { label: courseTitle, href: `/course/${courseId}` },
      { label: era.title, href: eraHref(era.id) },
      { label: `DAN ${String(lesson.dayNumber).padStart(3, '0')}` },
    ],
    [courseTitle, courseId, era.title, era.id, eraHref, lesson.dayNumber],
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
    openEraIds,
    onToggleEra: handleToggleEra,
    lessonHref,
  };

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebarColumn}>
        <CourseSidebar {...sidebarProps} />
      </aside>

      <div className={styles.readerColumn}>
        <LessonContextHeader
          dayNumber={lesson.dayNumber}
          totalDays={lessons.length}
          eraLabel={era.title}
          completedCount={completedSet?.size ?? 0}
          totalLessons={lessons.length}
          onOpenContents={() => {
            setDrawerOpen(true);
          }}
        />

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
          eraStats={eraStats}
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
