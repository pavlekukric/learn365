'use client';

import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

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

/** The drawer's dialog panel — what the "Sadržaj" trigger controls. */
const DRAWER_ID = 'lesson-contents-drawer';

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

  // Lesson to lesson (the next card, prev / next, a drawer row), the page
  // under the shell is replaced and focus would fall to <body>; Safari and
  // Firefox then restart Tab at the skip links on every lesson. Move it to
  // the new lesson's title (a never-ringed `tabIndex={-1}` target) so a
  // screen reader starts there. Not on the first load — the ref starts at
  // the first lesson, which also keeps Strict Mode's double effect quiet —
  // and not when the reader is moving through the desktop outline, which
  // stays mounted and keeps its own focus. The new title may not be in the
  // DOM yet when the shell sees the new id, and a drawer row closes the
  // drawer, which hands focus back to its trigger in the same moment — so
  // try once per frame (up to ~1 s) until the new lesson's h1 holds focus.
  const layoutRef = useRef<HTMLDivElement>(null);
  const focusedLessonIdRef = useRef(lesson.id);
  useEffect(() => {
    if (focusedLessonIdRef.current === lesson.id) return;
    focusedLessonIdRef.current = lesson.id;
    const focused = document.activeElement;
    const outline = layoutRef.current?.querySelector('aside');
    if (focused !== null && focused !== document.body && outline?.contains(focused)) return;
    const title = lesson.title;
    let frame = 0;
    let attempts = 0;
    const tryFocus = () => {
      const h1 = document.querySelector<HTMLElement>('#lesson-reader h1[tabindex]');
      if (h1 !== null && h1.textContent === title && !h1.closest('[inert]')) {
        h1.focus({ preventScroll: true });
        if (document.activeElement === h1) return;
      }
      attempts += 1;
      if (attempts < 60) frame = requestAnimationFrame(tryFocus);
    };
    frame = requestAnimationFrame(tryFocus);
    return () => cancelAnimationFrame(frame);
  }, [lesson.id, lesson.title]);

  // While the drawer is open the page behind it is inert, not only hidden
  // by `aria-modal` (older iOS VoiceOver and TalkBack still swipe past
  // that). Inside the frame the outline, the skip link and the reader column
  // take the `inert` prop, so the attribute is gone before the drawer hands
  // focus back to its trigger; outside it (the TopBar, the site footer)
  // every sibling on the way up to <body> is marked here.
  useEffect(() => {
    if (!drawerOpen) return;
    const marked: Element[] = [];
    let node: Element | null = layoutRef.current;
    while (node !== null && node !== document.body && node.parentElement !== null) {
      for (const sibling of Array.from(node.parentElement.children)) {
        if (sibling === node || sibling.hasAttribute('inert')) continue;
        if (sibling instanceof HTMLScriptElement || sibling instanceof HTMLStyleElement) continue;
        sibling.setAttribute('inert', '');
        marked.push(sibling);
      }
      node = node.parentElement;
    }
    return () => {
      for (const el of marked) el.removeAttribute('inert');
    };
  }, [drawerOpen]);

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
    <div ref={layoutRef} className={styles.layout}>
      {/* The outline comes first in the DOM (15–30 controls on desktop):
       * this link, first in <main>, lets a keyboard reader skip it. */}
      <a href="#lesson-reader" className="skip-link" inert={drawerOpen}>
        Preskoči na tekst lekcije
      </a>
      {/* Keyed by lesson: the hairline starts from zero on every lesson. */}
      <ReadingProgress key={lesson.id} />
      <aside className={styles.sidebarColumn} inert={drawerOpen}>
        <CourseSidebar {...sidebarProps} revealCurrent />
      </aside>

      <div id="lesson-reader" tabIndex={-1} className={styles.readerColumn} inert={drawerOpen}>
        <LessonContextHeader
          dayNumber={lesson.dayNumber}
          completedCount={completedIds.size}
          totalLessons={lessons.length}
          onOpenContents={() => {
            setDrawerOpen(true);
          }}
          drawerOpen={drawerOpen}
          drawerId={DRAWER_ID}
        />
        {children}
      </div>

      <MobileLessonDrawer
        id={DRAWER_ID}
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
