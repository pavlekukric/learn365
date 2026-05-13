import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getCourse, getLessons } from '@learn365/content';
import { Eyebrow } from '@learn365/ui-web';

import { CourseOverviewEras } from './_components/CourseOverviewEras';
import { CourseOverviewProgress } from './_components/CourseOverviewProgress';
import styles from './page.module.css';

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default async function CourseOverviewPage({ params }: PageProps) {
  const { courseId } = await params;
  const course = getCourse(courseId);
  if (!course) notFound();

  const allLessons = getLessons(course.id);
  const firstLessonId = allLessons[0]?.id;

  return (
    <div className={`shell ${styles.page}`}>
      <header className={styles.header}>
        <Eyebrow>Kurs</Eyebrow>
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

      <CourseOverviewProgress
        courseId={course.id}
        totalLessons={course.totalLessons}
      />

      <section className={styles.eras} aria-label="Epohe i odeljci">
        <header className={styles.erasHeader}>
          <Eyebrow>Sadržaj</Eyebrow>
          <h2 className="h2">Osam epoha, kroz 365 dana</h2>
        </header>
        <CourseOverviewEras courseId={course.id} />
      </section>
    </div>
  );
}
