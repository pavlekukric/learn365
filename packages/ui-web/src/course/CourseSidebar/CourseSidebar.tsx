import type {
  CourseId,
  Era,
  EraId,
  Lesson,
  LessonId,
  Section,
  SectionId,
} from '@learn365/content';

import { EraGroup } from '../EraGroup/EraGroup.js';
import { SectionAccordion } from '../SectionAccordion/SectionAccordion.js';

import styles from './CourseSidebar.module.css';

interface CourseSidebarProps {
  course: { id: CourseId; title: string };
  eras: readonly Era[];
  sections: readonly Section[];
  lessons: readonly Lesson[];
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
  lessonHref: (lesson: Lesson) => string;
}

export function CourseSidebar({
  course,
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
}: CourseSidebarProps) {
  const sectionsByEra = new Map<string, Section[]>();
  for (const section of sections) {
    const list = sectionsByEra.get(section.eraId) ?? [];
    list.push(section);
    sectionsByEra.set(section.eraId, list);
  }
  for (const list of sectionsByEra.values()) {
    list.sort((a, b) => a.order - b.order);
  }

  const lessonsBySection = new Map<string, Lesson[]>();
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
      <header className={styles.header}>
        <span className={`tiny mono ${styles.kicker}`}>KURS</span>
        <p className={styles.courseTitle}>{course.title}</p>
      </header>

      <div className={styles.body}>
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
