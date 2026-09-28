import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import {
  getCourse,
  getEraForLesson,
  getLessonById,
  getNextLesson,
  getPrevLesson,
  getSectionForLesson,
  type Lesson,
} from '@learn365/content';
import { LessonBody, LessonSources, LessonTrustLine } from '@learn365/ui-web';

import { shareMetadata } from '@/lib/seo/metadata';

import { LessonPageClient } from './LessonPageClient';

interface PageProps {
  params: Promise<{ courseId: string; lessonId: string }>;
}

/** Shape the client (and the post-completion footer) needs for prev/next.
 * Extends the previous {id, title, dayNumber} with the small editorial
 * facts the completion card surfaces: which era the next lesson belongs
 * to, and how long it takes to read. */
function adjacent(
  courseId: string,
  lesson: Lesson | null,
): {
  id: string;
  title: string;
  dayNumber: number;
  eraLabel?: string;
  readingTimeMinutes?: number;
} | null {
  if (!lesson) return null;
  const era = getEraForLesson(courseId, lesson.id);
  return {
    id: lesson.id,
    title: lesson.title,
    dayNumber: lesson.dayNumber,
    ...(era?.title !== undefined ? { eraLabel: era.title } : {}),
    ...(lesson.isPlaceholder === true ? {} : { readingTimeMinutes: lesson.readingTimeMinutes }),
  };
}

/** Share-preview metadata per lesson: a shared lesson link should say which
 * day and which lesson it is, not just the site name. */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { courseId, lessonId } = await params;
  const course = getCourse(courseId);
  const lesson = getLessonById(courseId, lessonId);
  if (!course || !lesson) return {};
  const title = `Dan ${String(lesson.dayNumber)}: ${lesson.title}`;
  const description =
    lesson.summary ??
    lesson.subtitle ??
    `Dan ${String(lesson.dayNumber)} od ${String(course.totalLessons)} · ${course.title}`;
  return {
    title,
    description,
    ...shareMetadata({
      title,
      description,
      path: `/course/${course.id}/lesson/${lesson.id}`,
    }),
  };
}

export default async function LessonPage({ params }: PageProps) {
  const { courseId, lessonId } = await params;
  const course = getCourse(courseId);
  const lesson = getLessonById(courseId, lessonId);
  if (!course || !lesson) notFound();

  const era = getEraForLesson(courseId, lesson.id);
  const section = getSectionForLesson(courseId, lesson.id);
  const prev = getPrevLesson(courseId, lesson.id);
  const next = getNextLesson(courseId, lesson.id);

  if (!era || !section) notFound();

  // The lesson text is rendered here, on the server, and handed to the client
  // reader as a finished node: the body has no interactivity, and keeping it
  // out of the client component keeps the corpus out of the JS bundle.
  const article = (
    <>
      <LessonBody blocks={lesson.content} />
      {lesson.sources !== undefined && lesson.sources.length > 0 ? (
        <LessonSources sources={lesson.sources} />
      ) : null}
      <LessonTrustLine byline={lesson.byline} lastReviewedAt={lesson.lastReviewedAt} />
    </>
  );

  return (
    <LessonPageClient
      courseId={course.id}
      courseTitle={course.title}
      lesson={lesson}
      article={article}
      era={era}
      section={section}
      prev={adjacent(courseId, prev)}
      next={adjacent(courseId, next)}
    />
  );
}
