'use client';

import { useEffect, useRef } from 'react';

import type {
  Era,
  EraId,
  LessonId,
  LessonSummary,
  Section,
  SectionId,
} from '@learn365/content';

import { EraGroup } from '../EraGroup/EraGroup.js';
import { SectionAccordion } from '../SectionAccordion/SectionAccordion.js';

import { revealScrollTop } from './revealScroll.js';

import styles from './CourseSidebar.module.css';

interface CourseSidebarProps {
  eras: readonly Era[];
  sections: readonly Section[];
  lessons: readonly LessonSummary[];
  currentLessonId: LessonId | null;
  completedIds: ReadonlySet<LessonId>;
  openSectionIds: ReadonlySet<SectionId>;
  onToggleSection: (id: SectionId) => void;
  /**
   * Eras currently expanded in the sidebar. Mirror of the openSectionIds
   * pattern: state lives in the parent so the same set can be reused across
   * the desktop sidebar and the mobile drawer instance.
   */
  openEraIds: ReadonlySet<EraId>;
  onToggleEra: (id: EraId) => void;
  /** Builder returning the href for a lesson within the course. */
  lessonHref: (lesson: LessonSummary) => string;
  /**
   * Keep the current lesson's row in view: on mount and whenever the current
   * lesson changes, a row outside the visible part of the list is centred in
   * it. Only the list scrolls, never the page. For the always-visible desktop
   * sidebar; the drawer scrolls to the row itself when it opens.
   */
  revealCurrent?: boolean;
}

export function CourseSidebar({
  eras,
  sections,
  lessons,
  currentLessonId,
  completedIds,
  openSectionIds,
  onToggleSection,
  openEraIds,
  onToggleEra,
  lessonHref,
  revealCurrent = false,
}: CourseSidebarProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const revealedOnceRef = useRef(false);

  useEffect(() => {
    if (!revealCurrent || currentLessonId === null) return;
    const list = listRef.current;
    const row = list?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!list || !row) return;
    const listBox = list.getBoundingClientRect();
    const rowBox = row.getBoundingClientRect();
    const top = revealScrollTop({
      listTop: listBox.top,
      listHeight: list.clientHeight,
      scrollTop: list.scrollTop,
      rowTop: rowBox.top,
      rowHeight: rowBox.height,
    });
    // The first reveal (a lesson opened from a link) is a jump; later ones
    // (previous / next under the persistent shell) glide.
    const glide =
      revealedOnceRef.current && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    revealedOnceRef.current = true;
    if (top === null) return;
    list.scrollTo({ top, behavior: glide ? 'smooth' : 'auto' });
  }, [revealCurrent, currentLessonId]);

  const sectionsByEra = new Map<string, Section[]>();
  for (const section of sections) {
    const list = sectionsByEra.get(section.eraId) ?? [];
    list.push(section);
    sectionsByEra.set(section.eraId, list);
  }
  for (const list of sectionsByEra.values()) {
    list.sort((a, b) => a.order - b.order);
  }

  const lessonsBySection = new Map<string, LessonSummary[]>();
  for (const lesson of lessons) {
    const list = lessonsBySection.get(lesson.sectionId) ?? [];
    list.push(lesson);
    lessonsBySection.set(lesson.sectionId, list);
  }
  for (const list of lessonsBySection.values()) {
    list.sort((a, b) => a.order - b.order);
  }

  return (
    <nav className={styles.sidebar} aria-label="Sadržaj kursa">
      <div ref={listRef} className={styles.body}>
        {eras.map((era) => {
          const eraSections = sectionsByEra.get(era.id) ?? [];
          return (
            <EraGroup
              key={era.id}
              era={era}
              isOpen={openEraIds.has(era.id)}
              onToggle={() => {
                onToggleEra(era.id);
              }}
            >
              {eraSections.map((section) => {
                const sectionLessons = lessonsBySection.get(section.id) ?? [];
                return (
                  <SectionAccordion
                    key={section.id}
                    section={section}
                    lessons={sectionLessons}
                    currentLessonId={currentLessonId}
                    completedIds={completedIds}
                    isOpen={openSectionIds.has(section.id)}
                    onToggle={() => {
                      onToggleSection(section.id);
                    }}
                    lessonHref={lessonHref}
                  />
                );
              })}
            </EraGroup>
          );
        })}
      </div>
    </nav>
  );
}
