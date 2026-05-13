import Link from 'next/link';

import { getCourse, getEras } from '@learn365/content';

import styles from './page.module.css';

const DEFAULT_COURSE_ID = 'istorija-srbije-365';

export default function HomePage() {
  const course = getCourse(DEFAULT_COURSE_ID);
  if (!course) {
    throw new Error(`Course "${DEFAULT_COURSE_ID}" is missing.`);
  }
  const eras = getEras(course.id);

  return (
    <div className={`shell ${styles.page}`}>
      <section className={styles.hero}>
        <p className="eyebrow">Premium · Istorijski</p>
        <h1 className="display">{course.title}</h1>
        <p className="lede">{course.subtitle}</p>
        <p className={`body ${styles.description}`}>{course.description}</p>

        <div className={styles.ctaRow}>
          <Link href={`/course/${course.id}`} className={styles.ctaPrimary}>
            Pregled kursa →
          </Link>
          <span className="tiny mono">
            {String(course.totalLessons).padStart(3, '0')} lekcija ·{' '}
            {course.estimatedMinutesPerLesson} min dnevno
          </span>
        </div>
      </section>

      <section className={styles.eras} aria-label="Epohe">
        <p className="eyebrow">Osam epoha</p>
        <ul className={styles.eraList}>
          {eras.map((era) => (
            <li key={era.id} className={styles.eraRow}>
              <span className={`tiny mono ${styles.eraNum}`}>{era.num}</span>
              <span className={`h3 ${styles.eraTitle}`}>{era.title}</span>
              <span className={`tiny mono ${styles.eraYears}`}>{era.yearsLabel}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
