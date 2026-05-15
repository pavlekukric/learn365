import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getCourse, getLessons } from '@learn365/content';
import { Eyebrow, JumpToDay } from '@learn365/ui-web';

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
      {/*
        Course overview is a navigation tool, not a second landing page — the
        header stays compact (eyebrow + title + a single "start from the
        beginning" action). The poetic course subtitle lives on Home only.
      */}
      <header className={styles.header}>
        <Eyebrow>Kurs</Eyebrow>
        <h1 className="h1">{course.title}</h1>
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
          <div className={styles.erasHeading}>
            <Eyebrow>Sadržaj</Eyebrow>
            <h2 className="h2">Osam epoha, kroz 365 dana</h2>
          </div>
          {/* Jump-to-day sits beside the section heading as a quiet utility —
            * it belongs with the era/lesson tree, not in the course hero. */}
          <div className={styles.jump}>
            <JumpToDay courseId={course.id} />
          </div>
        </header>
        <CourseOverviewEras courseId={course.id} />
      </section>
    </div>
  );
}
