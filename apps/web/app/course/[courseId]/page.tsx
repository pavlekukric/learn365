import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getAllCourseIds, getCourse } from '@learn365/content';
import { Eyebrow } from '@learn365/ui-web';

import { shareMetadata } from '@/lib/seo/metadata';

import { CourseOverviewBookmarks } from './_components/CourseOverviewBookmarks';
import { CourseOverviewEras } from './_components/CourseOverviewEras';
import { CourseOverviewProgress } from './_components/CourseOverviewProgress';
import { CourseScrollRestore } from './CourseScrollRestore';
import styles from './page.module.css';

interface PageProps {
  params: Promise<{ courseId: string }>;
}

/** Prerendered at build time; unknown course ids are a router 404 (Phase 9). */
export const dynamicParams = false;

export function generateStaticParams(): { courseId: string }[] {
  return getAllCourseIds().map((courseId) => ({ courseId }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { courseId } = await params;
  const course = getCourse(courseId);
  if (!course) return {};
  return {
    title: course.title,
    description: course.description,
    ...shareMetadata({
      title: course.title,
      description: course.description,
      path: `/course/${course.id}`,
    }),
  };
}

export default async function CourseOverviewPage({ params }: PageProps) {
  const { courseId } = await params;
  const course = getCourse(courseId);
  if (!course) notFound();

  return (
    // `.shell` (gutters) and `.page` (vertical room) on separate elements: on
    // one element their paddings override each other and the stylesheet
    // order decides which survives (Phase 16).
    <div className="shell">
      <div className={styles.page}>
        {/* Restores the reader's scroll position on return within the session
         * (renders nothing). Next's built-in restoration misses here because the
         * era accordion settles after hydration. */}
        <CourseScrollRestore courseId={course.id} />
        {/*
        Course overview is a navigation tool, not a second landing page — the
        header stays compact (eyebrow + title + lede). The lede is sourced
        from `course.description` so the page stops reading empty without
        gaining a second hero; the state-aware start/continue action lives on
        the CourseProgress card below.
      */}
        <header className={styles.header}>
          <Eyebrow>Kurs</Eyebrow>
          <h1 className="h1">{course.title}</h1>
          <p className={`body ${styles.lede}`}>{course.description}</p>
        </header>

        <CourseOverviewProgress courseId={course.id} totalLessons={course.totalLessons} />

        <CourseOverviewBookmarks courseId={course.id} />

        <section className={styles.eras} aria-label="Epohe i odeljci">
          <header className={styles.erasHeader}>
            <Eyebrow>Sadržaj</Eyebrow>
            <h2 className="h2">Osam epoha, kroz 365 dana</h2>
          </header>
          <CourseOverviewEras courseId={course.id} />
        </section>
      </div>
    </div>
  );
}
