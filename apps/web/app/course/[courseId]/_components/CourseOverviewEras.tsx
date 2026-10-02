'use client';

import { useEffect, useState } from 'react';

import {
  getEras,
  getLessonsByEra,
  getLessonsBySection,
  getSectionsByEra,
  type CourseId,
  type EraId,
  type LessonId,
  type Section,
  type SectionId,
} from '@learn365/content';
import { formatDayRange } from '@learn365/core';
import { CourseCard, IconChev, LessonNavItem } from '@learn365/ui-web';

import { useProgressStore } from '@/lib/progress/ProgressStoreProvider';
import { useResumeLesson } from '@/lib/progress/useResumeLesson';

import styles from './CourseOverviewEras.module.css';

interface CourseOverviewErasProps {
  courseId: CourseId;
}

/**
 * Serbian count label for lessons. Plural rules: 1/21/31… → "lekcija",
 * 2–4/22–24… → "lekcije", everything else → "lekcija". Section sizes are
 * 10–20 so this resolves to "lekcija" in practice, but the helper keeps the
 * grammar correct if section ranges ever change.
 */
/** How many of `lessons` are in the completed set. */
function countDone(
  completedSet: ReadonlySet<LessonId> | null,
  lessons: readonly { id: LessonId }[],
): number {
  if (completedSet === null) return 0;
  let done = 0;
  for (const lesson of lessons) if (completedSet.has(lesson.id)) done += 1;
  return done;
}

function lessonCountLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  const word = mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? 'lekcije' : 'lekcija';
  return `${String(n)} ${word}`;
}

interface SectionAccordionRowProps {
  courseId: CourseId;
  section: Section;
  isOpen: boolean;
  onToggle: () => void;
  completedSet: ReadonlySet<LessonId> | null;
  /** The resume lesson — the row tinted as "you are here". */
  currentLessonId: LessonId | null;
  /** Completion ratio for this section, used in the collapsed header meta. */
  done: number;
  total: number;
}

/**
 * A lesson group rendered as a calm accordion row: collapsed by default,
 * the whole header toggles its daily lessons open inline. The daily
 * lessons are reused `LessonNavItem`s so completion / active state comes
 * from the existing progress logic — no new data is introduced here.
 *
 * The lesson list is always rendered and only `hidden` while collapsed, so
 * the prerendered HTML carries the whole era → section → lesson tree for
 * crawlers (review 2026-09-30); what a reader sees is unchanged.
 */
function SectionAccordionRow({
  courseId,
  section,
  isOpen,
  onToggle,
  completedSet,
  currentLessonId,
  done,
  total,
}: SectionAccordionRowProps) {
  const lessons = getLessonsBySection(courseId, section.id);
  const panelId = `era-section-${section.id}`;
  // When the section is closed and the user has progress in it, surface a
  // compact "done / total" count instead of the static lesson-count label —
  // it answers "how far am I in this group?" without expanding the panel.
  const showRatio = !isOpen && total > 0 && done > 0;

  return (
    <li className={styles.sectionItem}>
      <button
        type="button"
        className={`${styles.sectionRow} ${isOpen ? styles.sectionRowOpen : ''}`}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span className={`${styles.chev} ${isOpen ? styles.chevOpen : ''}`} aria-hidden="true">
          <IconChev />
        </span>
        <span className={styles.sectionMeta}>
          <span className={`tiny mono ${styles.sectionDays}`}>
            {formatDayRange(section.startDay, section.endDay)}
          </span>
          <span className={styles.sectionTitle}>{section.title}</span>
        </span>
        <span className={`tiny ${styles.sectionCount}`}>
          {showRatio ? (
            <>
              {/* "4 / 9" for the eye, "4 od 9 pročitano" for a screen reader. */}
              <span aria-hidden="true">{`${String(done)} / ${String(total)}`}</span>
              <span className="visually-hidden">
                {`${String(done)} od ${String(total)} pročitano`}
              </span>
            </>
          ) : (
            lessonCountLabel(total)
          )}
        </span>
      </button>

      <ol id={panelId} className={styles.lessons} hidden={!isOpen}>
        {lessons.map((lesson) => (
          <li key={lesson.id}>
            <LessonNavItem
              lesson={lesson}
              active={lesson.id === currentLessonId}
              completed={completedSet?.has(lesson.id) ?? false}
              href={`/course/${courseId}/lesson/${lesson.id}`}
              // The overview marks where the reader is, but that row is
              // not the page being viewed.
              isCurrentPage={false}
            />
          </li>
        ))}
      </ol>
    </li>
  );
}

export function CourseOverviewEras({ courseId }: CourseOverviewErasProps) {
  const eras = getEras(courseId);
  const completedSet = useProgressStore(
    (state) => state.byCourse[courseId]?.completedLessonIds ?? null,
  );

  // "Where is the reader?" — the resume lesson, the same one the progress
  // card above names (`useResumeLesson`), so the tinted row, the open era
  // and section, and "Tvoj N. dan" always point at one lesson (review
  // 2026-10-01: the card said Dan 121 while the tree tinted row 120).
  //
  // Before the first completion the resume lesson is Day 1, which on this
  // page would auto-expand Era I into an editorial wall of nested panels —
  // against the "8 calm editorial blocks" register the always-visible era
  // descriptions establish. So nothing opens or tints until there is real
  // progress; once everything is read (`lesson === null`) nothing does
  // either.
  const { hasStarted, lesson: resume } = useResumeLesson(courseId);
  const active = hasStarted ? resume : null;
  const hasRealProgress = active !== null;

  // Era + section accordion state. We can't just seed with `useState(active)`
  // because the persisted progress store hydrates *after* first render — at
  // that moment the completed set is still empty, so `active` is null.
  // Seeding with that and never re-reading would leave every era closed
  // even after the store reports the reader is in Era II. Solution: keep an
  // override that tracks "user manually toggled," and otherwise sync to the
  // current `active` location via effect. Manual taps win once dirtied.
  const [userToggledEra, setUserToggledEra] = useState(false);
  const [userToggledSection, setUserToggledSection] = useState(false);
  const [openEraId, setOpenEraId] = useState<EraId | null>(null);
  const [openSectionId, setOpenSectionId] = useState<SectionId | null>(null);

  useEffect(() => {
    if (userToggledEra) return;
    if (!hasRealProgress) {
      setOpenEraId(null);
      return;
    }
    setOpenEraId(active?.eraId ?? null);
  }, [active?.eraId, userToggledEra, hasRealProgress]);

  useEffect(() => {
    if (userToggledSection) return;
    if (!hasRealProgress) {
      setOpenSectionId(null);
      return;
    }
    setOpenSectionId(active?.sectionId ?? null);
  }, [active?.sectionId, userToggledSection, hasRealProgress]);

  return (
    <div className={styles.list}>
      {eras.map((era) => {
        const eraLessons = getLessonsByEra(courseId, era.id);
        const sections = getSectionsByEra(courseId, era.id);
        const total = eraLessons.length;
        const done = countDone(completedSet, eraLessons);
        const isAllDone = total > 0 && done === total;
        const isCurrent = !isAllDone && active !== null && active.eraId === era.id;
        // The card's one action opens the first unread lesson of the era (or
        // its first lesson once everything is read) — "Počni" / "Nastavi".
        const targetLesson =
          eraLessons.find((l) => !(completedSet?.has(l.id) ?? false)) ?? eraLessons[0];
        const href = targetLesson
          ? `/course/${courseId}/lesson/${targetLesson.id}`
          : `/course/${courseId}`;
        const isOpen = openEraId === era.id;
        const panelId = `era-panel-${era.id}`;

        return (
          <article key={era.id} className={styles.era}>
            <CourseCard
              era={era}
              totalLessons={total}
              completedLessons={done}
              isCurrent={isCurrent}
              isAllDone={isAllDone}
              href={href}
              description={era.description}
              isOpen={isOpen}
              panelId={panelId}
              sectionCount={sections.length}
              onToggle={() => {
                const next = isOpen ? null : era.id;
                setUserToggledEra(true);
                setUserToggledSection(true);
                setOpenEraId(next);
                // Reset the section accordion when we move between eras so an
                // unrelated section from the prior era doesn't appear
                // pre-expanded inside the newly opened one.
                setOpenSectionId(next !== null && next === active?.eraId ? active.sectionId : null);
              }}
            />
            {/* Always rendered, `hidden` while collapsed — see SectionAccordionRow. */}
            <div id={panelId} className={styles.eraChildren} hidden={!isOpen}>
              <ul className={styles.sections}>
                {sections.map((section) => {
                  const sectionLessons = getLessonsBySection(courseId, section.id);
                  return (
                    <SectionAccordionRow
                      key={section.id}
                      courseId={courseId}
                      section={section}
                      isOpen={openSectionId === section.id}
                      onToggle={() => {
                        setUserToggledSection(true);
                        setOpenSectionId((prev) => (prev === section.id ? null : section.id));
                      }}
                      completedSet={completedSet}
                      currentLessonId={active?.id ?? null}
                      done={countDone(completedSet, sectionLessons)}
                      total={sectionLessons.length}
                    />
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
