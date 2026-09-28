'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  getEras,
  getLessons,
  getLessonsByEra,
  getLessonsBySection,
  getSectionsByEra,
  type CourseId,
  type EraId,
  type LessonId,
  type Section,
  type SectionId,
} from '@learn365/content';
import {
  findActiveLocation,
  formatDayRange,
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

/**
 * Serbian count label for lessons. Plural rules: 1/21/31… → "lekcija",
 * 2–4/22–24… → "lekcije", everything else → "lekcija". Section sizes are
 * 10–20 so this resolves to "lekcija" in practice, but the helper keeps the
 * grammar correct if section ranges ever change.
 */
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
  progressState: ProgressState;
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
 */
function SectionAccordionRow({
  courseId,
  section,
  isOpen,
  onToggle,
  progressState,
  currentLessonId,
  done,
  total,
}: SectionAccordionRowProps) {
  const lessons = getLessonsBySection(courseId, section.id);
  const panelId = `era-section-${section.id}`;
  // When the section is closed and the user has progress in it, surface a
  // compact "done / total" count instead of the static lesson-count label —
  // it answers "how far am I in this group?" without expanding the panel.
  const collapsedMeta =
    !isOpen && total > 0 && done > 0
      ? `${String(done)} / ${String(total)}`
      : lessonCountLabel(total);

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
        <span className={`tiny ${styles.sectionCount}`}>{collapsedMeta}</span>
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
  const allLessons = useMemo(() => getLessons(courseId), [courseId]);
  const lastId = useProgressStore((state) => lastOpenedLessonId(state, courseId));
  const completedSet = useProgressStore(
    (state) => state.byCourse[courseId]?.completedLessonIds ?? null,
  );
  const progressState = useProgressStore((state) => state);

  // "Where is the user?" — drives which era + section open by default and
  // which lesson row shows the active accent in the expanded section. Shared
  // selector so the lesson sidebar and this page always agree.
  const active = useMemo(
    () => findActiveLocation(allLessons, completedSet, lastId),
    [allLessons, completedSet, lastId],
  );

  // First-time visitor signal — `findActiveLocation` falls back to lesson 1
  // when neither `lastOpenedLessonId` nor a completed set exists, which on
  // this page would auto-expand Era I into an editorial wall of nested
  // panels. On the lesson reader that fallback is right (the sidebar must
  // surface *some* active position); on the course overview it works against
  // the "8 calm editorial blocks" register that the always-visible era
  // descriptions establish. So we keep `active` available for the sidebar's
  // selector and just suppress the auto-open here when there's no real
  // progress to point at.
  const hasRealProgress = lastId !== null || (completedSet !== null && completedSet.size > 0);

  // Era + section accordion state. We can't just seed with `useState(active)`
  // because the persisted progress store hydrates *after* first render — at
  // that moment `lastOpenedLessonId` is still null, so `active` collapses to
  // Era I. Seeding with that and never re-reading would strand the user on
  // Era I even after the store reports they're on Era II. Solution: keep an
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
        const { done, total } = progressForLessons(
          progressState,
          courseId,
          eraLessons.map((l) => l.id),
        );
        const isAllDone = total > 0 && done === total;
        const isCurrent = !isAllDone && lastId !== null && eraLessons.some((l) => l.id === lastId);
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
                setUserToggledEra(true);
                setUserToggledSection(true);
                setOpenEraId((prev) => {
                  const next = prev === era.id ? null : era.id;
                  // Reset the section accordion when we move between eras
                  // so an unrelated section from the prior era doesn't
                  // appear pre-expanded inside the newly opened one.
                  setOpenSectionId(
                    next !== null && next === active?.eraId ? active.sectionId : null,
                  );
                  return next;
                });
              }}
            />
            {isOpen ? (
              <div id={panelId} className={styles.eraChildren}>
                <ul className={styles.sections}>
                  {sections.map((section) => {
                    const sectionLessons = getLessonsBySection(courseId, section.id);
                    const { done: sectionDone, total: sectionTotal } = progressForLessons(
                      progressState,
                      courseId,
                      sectionLessons.map((l) => l.id),
                    );
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
                        progressState={progressState}
                        currentLessonId={lastId}
                        done={sectionDone}
                        total={sectionTotal}
                      />
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
