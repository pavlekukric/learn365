import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  getCourse,
  getEras,
  getLessons,
  getLessonsByEra,
  getSectionsByEra,
} from '@learn365/content';

import styles from './page.module.css';

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default async function CourseOverviewPage({ params }: PageProps) {
  const { courseId } = await params;
  const course = getCourse(courseId);
  if (!course) notFound();

  const eras = getEras(course.id);
  const allLessons = getLessons(course.id);
  const firstLessonId = allLessons[0]?.id;

  return (
    <div className={`shell ${styles.page}`}>
      <header className={styles.header}>
        <p className="eyebrow">Kurs</p>
        <h1 className="h1">{course.title}</h1>
        <p className="lede">{course.subtitle}</p>
        {firstLessonId ? (
          <Link
            href={`/course/${course.id}/lesson/${firstLessonId}`}
            className={styles.startLink}
          >
            Počni od Dana 001 →
          </Link>
        ) : null}
      </header>

      <section className={styles.eras} aria-label="Epohe i odeljci">
        {eras.map((era) => {
          const sections = getSectionsByEra(course.id, era.id);
          const eraLessons = getLessonsByEra(course.id, era.id);
          return (
            <article key={era.id} className={styles.era}>
              <header className={styles.eraHeader}>
                <p className={`tiny mono ${styles.eraNum}`}>EPOHA {era.num}</p>
                <h2 className="h2">{era.title}</h2>
                <p className={`small ${styles.eraMeta}`}>
                  {era.yearsLabel} · {eraLessons.length} lekcija
                </p>
                <p className={`body ${styles.eraDescription}`}>{era.description}</p>
              </header>

              <ul className={styles.sections}>
                {sections.map((section) => {
                  const count = section.endDay - section.startDay + 1;
                  return (
                    <li key={section.id} className={styles.sectionRow}>
                      <span className={`tiny mono ${styles.sectionDays}`}>
                        D{String(section.startDay).padStart(3, '0')}–D
                        {String(section.endDay).padStart(3, '0')}
                      </span>
                      <span className={`h3 ${styles.sectionTitle}`}>{section.title}</span>
                      <span className={`tiny mono ${styles.sectionCount}`}>{count}</span>
                    </li>
                  );
                })}
              </ul>
            </article>
          );
        })}
      </section>
    </div>
  );
}
