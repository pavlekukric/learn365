import Link from 'next/link';

import { getCourse } from '@learn365/content';
import { Eyebrow } from '@learn365/ui-web';

import { HomeCurrentLessonCard } from './_components/HomeCurrentLessonCard';
import { HomeErasList } from './_components/HomeErasList';
import styles from './page.module.css';

const DEFAULT_COURSE_ID = 'istorija-srbije-365';

export default function HomePage() {
  const course = getCourse(DEFAULT_COURSE_ID);
  if (!course) {
    throw new Error(`Course "${DEFAULT_COURSE_ID}" is missing.`);
  }

  return (
    <div className={`shell ${styles.page}`}>
      <section className={styles.hero}>
        <Eyebrow>Premium · Istorijski</Eyebrow>
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

      <section className={styles.current} aria-label="Vaša aktuelna lekcija">
        <HomeCurrentLessonCard courseId={course.id} />
      </section>

      <section className={styles.eras} aria-label="Osam epoha">
        <header className={styles.erasHeader}>
          <Eyebrow>Osam epoha</Eyebrow>
          <h2 className="h2">Putovanje kroz 365 dana</h2>
          <p className={`small ${styles.erasIntro}`}>
            Svaka epoha grupiše desetine kratkih lekcija, hronološki, kroz ključne ličnosti, mesta i ideje.
          </p>
        </header>
        <HomeErasList courseId={course.id} />
      </section>
    </div>
  );
}
