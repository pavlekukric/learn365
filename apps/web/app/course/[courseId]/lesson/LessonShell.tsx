'use client';

import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  getLessonById,
  getLessons,
  getSections,
  type CourseId,
  type EraId,
  type LessonSummary,
  type SectionId,
} from '@learn365/content';
import { CourseSidebar, HistoricalTimeline, MobileLessonDrawer } from '@learn365/ui-web';

import { useProgressStore } from '@/lib/progress/ProgressStoreProvider';
import { useEraTimeline } from '@/lib/progress/useEraTimeline';

import { LessonContextHeader } from './LessonContextHeader';
import styles from './LessonShell.module.css';
import { ReadingProgress } from './ReadingProgress';

interface LessonShellProps {
  courseId: CourseId;
  /** The lesson page: the server-rendered reader. */
  children: ReactNode;
}

/**
 * Resolves the open lesson from the route and frames the page with the
 * course chrome. An id the navigation index does not know gets no chrome —
 * the router's 404 owns that case.
 */
export function LessonShell({ courseId, children }: LessonShellProps) {
  const { lessonId } = useParams<{ lessonId?: string }>();
  const lesson = lessonId === undefined ? null : getLessonById(courseId, lessonId);
  if (lesson === null) return <>{children}</>;
  return (
    <LessonFrame courseId={courseId} lesson={lesson}>
      {children}
    </LessonFrame>
  );
}

interface LessonFrameProps {
  courseId: CourseId;
  lesson: LessonSummary;
  children: ReactNode;
}

function LessonFrame({ courseId, lesson, children }: LessonFrameProps) {
  const markOpened = useProgressStore((state) => state.markOpened);
  const completedSet = useProgressStore(
    (state) => state.byCourse[courseId]?.completedLessonIds ?? null,
  );

  const { eras, eraStats, eraHref } = useEraTimeline(courseId);
  const sections = useMemo(() => getSections(courseId), [courseId]);
  const lessons = useMemo(() => getLessons(courseId), [courseId]);

  const [openSectionIds, setOpenSectionIds] = useState<ReadonlySet<SectionId>>(
    () => new Set([lesson.sectionId]),
  );
  const [openEraIds, setOpenEraIds] = useState<ReadonlySet<EraId>>(
    () => new Set([lesson.eraId]),
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  // The section the shell opened by itself for the open lesson (not by hand).
  // Moving to a lesson in another section closes it again, so a run of
  // "next" does not leave a trail of expanded sections behind (review
  // 2026-09-30, item 15).
  const [autoSectionId, setAutoSectionId] = useState<SectionId | null>(lesson.sectionId);

  // The lesson changed under a shell that stays mounted (previous / next, a
  // row in the outline). Its era and section are opened in the same render —
  // state adjusted while rendering, not in an effect — so the row exists by
  // the time the sidebar looks for it; whatever the reader opened by hand
  // stays open. The drawer closes: the reader chose where to go.
  const [shownLessonId, setShownLessonId] = useState(lesson.id);
  if (shownLessonId !== lesson.id) {
    setShownLessonId(lesson.id);
    setDrawerOpen(false);
    if (lesson.sectionId !== autoSectionId) {
      const nextOpen = new Set(openSectionIds);
      if (autoSectionId !== null) nextOpen.delete(autoSectionId);
      const opensNow = !nextOpen.has(lesson.sectionId);
      nextOpen.add(lesson.sectionId);
      setOpenSectionIds(nextOpen);
      setAutoSectionId(opensNow ? lesson.sectionId : null);
    }
    if (!openEraIds.has(lesson.eraId)) {
      setOpenEraIds(new Set(openEraIds).add(lesson.eraId));
    }
  }

  useEffect(() => {
    markOpened(courseId, lesson.id);
  }, [courseId, lesson.id, markOpened]);

  const handleToggleSection = useCallback((id: SectionId) => {
    // A section the reader toggles by hand is theirs: it is no longer closed
    // when the lesson moves on.
    setAutoSectionId((auto) => (auto === id ? null : auto));
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
    (l: LessonSummary) => `/course/${courseId}/lesson/${l.id}`,
    [courseId],
  );

  const completedIds = useMemo(() => completedSet ?? new Set<string>(), [completedSet]);

  const sidebarProps = {
    eras,
    sections,
    lessons,
    currentLessonId: lesson.id,
    completedIds,
    openSectionIds,
    onToggleSection: handleToggleSection,
    openEraIds,
    onToggleEra: handleToggleEra,
    lessonHref,
  };

  return (
    <div className={styles.layout}>
      {/* The outline comes first in the DOM (15–30 controls on desktop):
       * this link, first in <main>, lets a keyboard reader skip it. */}
      <a href="#lesson-reader" className="skip-link">
        Preskoči na tekst lekcije
      </a>
      {/* Keyed by lesson: the hairline starts from zero on every lesson. */}
      <ReadingProgress key={lesson.id} />
      <aside className={styles.sidebarColumn}>
        <CourseSidebar {...sidebarProps} revealCurrent />
      </aside>

      <div id="lesson-reader" tabIndex={-1} className={styles.readerColumn}>
        <LessonContextHeader
          dayNumber={lesson.dayNumber}
          completedCount={completedIds.size}
          totalLessons={lessons.length}
          onOpenContents={() => {
            setDrawerOpen(true);
          }}
        />
        {children}
      </div>

      <MobileLessonDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
        }}
      >
        {/* The era rail opens the drawer — the one era timeline a phone has
         * on the lesson page. It scrolls with the outline beneath it. */}
        <CourseSidebar
          {...sidebarProps}
          lead={
            // The two eyebrows are for the eye; each `nav` beneath carries
            // its own accessible name.
            <div className={styles.drawerLead}>
              <div className={styles.drawerRail}>
                <p className={`eyebrow ${styles.drawerEyebrow}`} aria-hidden="true">
                  Vremenska osa
                </p>
                <HistoricalTimeline
                  variant="compact"
                  eras={eras}
                  currentLesson={{ eraId: lesson.eraId, year: lesson.year }}
                  eraHref={eraHref}
                  eraStats={eraStats}
                />
              </div>
              <p className={`eyebrow ${styles.drawerEyebrow}`} aria-hidden="true">
                Sadržaj
              </p>
            </div>
          }
        />
      </MobileLessonDrawer>
    </div>
  );
}
