import type {
  CourseId,
  Era,
  Lesson,
  LessonId,
  Section,
  SectionId,
} from '@learn365/content';

import { ProgressBar } from '../../primitives/ProgressBar/ProgressBar.js';
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
  lessonHref,
}: CourseSidebarProps) {
  const total = lessons.length;
  const completed = lessons.reduce(
    (acc, l) => (completedIds.has(l.id) ? acc + 1 : acc),
    0,
  );
  const progressValue = total > 0 ? completed / total : 0;

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
        <div className={styles.progress}>
          <ProgressBar
            value={progressValue}
            size="thin"
            ariaLabel="Ukupni napredak"
            ariaValueText={`${String(completed)} od ${String(total)} završeno`}
          />
          <span className={`tiny mono ${styles.progressMeta}`}>
            {String(completed).padStart(3, '0')} / {total}
          </span>
        </div>
      </header>

      <div className={styles.body}>
        {eras.map((era) => {
          const eraSections = sectionsByEra.get(era.id) ?? [];
          return (
            <EraGroup key={era.id} era={era}>
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
