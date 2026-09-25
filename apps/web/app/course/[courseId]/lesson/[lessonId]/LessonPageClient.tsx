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
import { isBookmarked, isCompleted } from '@learn365/core';
import { CourseSidebar, type EraStat, LessonReader, MobileLessonDrawer } from '@learn365/ui-web';

import { useBookmarkStore } from '@/lib/bookmarks/BookmarkStoreProvider';
import { useProgressStore } from '@/lib/progress/ProgressStoreProvider';

import { LessonContextHeader } from './LessonContextHeader';
import styles from './LessonPageClient.module.css';
import { ReadingProgress } from './ReadingProgress';

interface AdjacentLesson {
  readonly id: string;
  readonly title: string;
  readonly dayNumber: number;
  readonly eraLabel?: string;
  readonly readingTimeMinutes?: number;
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
  const bookmarked = useBookmarkStore((state) => isBookmarked(state, courseId, lesson.id));
  const toggleBookmark = useBookmarkStore((state) => state.toggleBookmark);

  const eras = useMemo(() => getEras(courseId), [courseId]);
  const sections = useMemo(() => getSections(courseId), [courseId]);
  const lessons = useMemo(() => getLessons(courseId), [courseId]);

  const [openSectionIds, setOpenSectionIds] = useState<ReadonlySet<SectionId>>(
    () => new Set([section.id]),
  );
  const [openEraIds, setOpenEraIds] = useState<ReadonlySet<EraId>>(() => new Set([era.id]));
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

  const lessonHref = useCallback((l: Lesson) => `/course/${courseId}/lesson/${l.id}`, [courseId]);

  const eraHref = useCallback(
    (eraId: string) => {
      const firstInEra = lessons.find((l) => l.eraId === eraId);
      return firstInEra ? `/course/${courseId}/lesson/${firstInEra.id}` : `/course/${courseId}`;
    },
    [courseId, lessons],
  );

  const sectionHref = useCallback(
    (sectionId: SectionId) => {
      const firstInSection = lessons.find((l) => l.sectionId === sectionId);
      return firstInSection
        ? `/course/${courseId}/lesson/${firstInSection.id}`
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
        ? eraLessons.reduce((acc, l) => (completedSet.has(l.id) ? acc + 1 : acc), 0)
        : 0;
      map.set(e.id, {
        lessonCount: eraLessons.length,
        completedCount: completed,
      });
    }
    return map;
  }, [eras, lessons, completedSet]);

  // Breadcrumb carries location hierarchy only (course · era · section). The
  // day number is intentionally NOT a crumb — it would duplicate the dedicated
  // "Dan 004 / 365" indicator (mobile context header / desktop timeline), and
  // a within-section position doesn't belong in a location trail.
  const breadcrumbs = useMemo(
    () => [
      { label: 'Početna', href: '/' },
      { label: courseTitle, href: `/course/${courseId}` },
      { label: era.title, href: eraHref(era.id) },
      { label: section.title, href: sectionHref(section.id) },
    ],
    [courseTitle, courseId, era.title, era.id, eraHref, section.title, section.id, sectionHref],
  );

  const sidebarProps = {
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
      <ReadingProgress />
      <aside className={styles.sidebarColumn}>
        <CourseSidebar {...sidebarProps} />
      </aside>

      <div className={styles.readerColumn}>
        <LessonContextHeader
          dayNumber={lesson.dayNumber}
          totalDays={lessons.length}
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
          eraShort={era.eraShort}
          isCompleted={completed}
          completedCount={completedSet?.size ?? 0}
          totalLessons={lessons.length}
          onToggleComplete={() => {
            toggleComplete(courseId, lesson.id);
          }}
          prev={
            prev
              ? {
                  title: prev.title,
                  dayNumber: prev.dayNumber,
                  href: `/course/${courseId}/lesson/${prev.id}`,
                  ...(prev.eraLabel !== undefined ? { eraLabel: prev.eraLabel } : {}),
                  ...(prev.readingTimeMinutes !== undefined
                    ? { readingTimeMinutes: prev.readingTimeMinutes }
                    : {}),
                }
              : null
          }
          next={
            next
              ? {
                  title: next.title,
                  dayNumber: next.dayNumber,
                  href: `/course/${courseId}/lesson/${next.id}`,
                  ...(next.eraLabel !== undefined ? { eraLabel: next.eraLabel } : {}),
                  ...(next.readingTimeMinutes !== undefined
                    ? { readingTimeMinutes: next.readingTimeMinutes }
                    : {}),
                }
              : null
          }
          courseHref={`/course/${courseId}`}
          eraHref={eraHref}
          eraStats={eraStats}
          bookmarkAction={{
            isBookmarked: bookmarked,
            onToggle: () => {
              toggleBookmark(courseId, lesson.id);
            },
          }}
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
