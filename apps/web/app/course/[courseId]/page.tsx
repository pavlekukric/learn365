import { notFound } from 'next/navigation';

import { getCourse } from '@learn365/content';
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

  return (
    <div className={`shell ${styles.page}`}>
      {/*
        Course overview is a navigation tool, not a second landing page — the
        header stays compact (eyebrow + title only). The state-aware
        start/continue action lives on the CourseProgress card below.
      */}
      <header className={styles.header}>
        <Eyebrow>Kurs</Eyebrow>
        <h1 className="h1">{course.title}</h1>
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
