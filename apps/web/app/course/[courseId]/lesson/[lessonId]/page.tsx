import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import {
  getAllCourseIds,
  getCourse,
  getEraForLesson,
  getLessonById,
  getLessons,
  getNextLesson,
  getPrevLesson,
  getSectionForLesson,
  type LessonHeading,
  type LessonSummary,
} from '@learn365/content';
import { getLessonArticle } from '@learn365/content/server';
import { LessonBody, LessonSources, LessonTrustLine } from '@learn365/ui-web';

import { shareMetadata } from '@/lib/seo/metadata';

import { LessonPageClient } from './LessonPageClient';

interface PageProps {
  params: Promise<{ courseId: string; lessonId: string }>;
}

/**
 * Every lesson is prerendered at build time (Phase 9). The page is a pure
 * function of the content registry — progress and the session hydrate on
 * the client — so there is nothing left to compute per request, and
 * `dynamicParams = false` turns any id outside the registry into a router
 * 404 instead of a render.
 */
export const dynamicParams = false;

export function generateStaticParams(): { courseId: string; lessonId: string }[] {
  return getAllCourseIds().flatMap((courseId) =>
    getLessons(courseId).map((lesson) => ({ courseId, lessonId: lesson.id })),
  );
}

/** Shape the client (and the post-completion footer) needs for prev/next.
 * Extends the previous {id, title, dayNumber} with the small editorial
 * facts the completion card surfaces: which era the next lesson belongs
 * to, and how long it takes to read. */
function adjacent(
  courseId: string,
  lesson: LessonSummary | null,
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
  const article = getLessonArticle(courseId, lessonId);
  if (!course || !lesson || !article) return {};
  const title = `Dan ${String(lesson.dayNumber)}: ${lesson.title}`;
  const description =
    article.summary ??
    article.subtitle ??
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
  // The article (body, sources, byline, subtitle, …) lives on the server-only
  // entry; the summary above is the client-safe navigation record.
  const article = getLessonArticle(courseId, lessonId);
  if (!course || !lesson || !article) notFound();

  const era = getEraForLesson(courseId, lesson.id);
  const section = getSectionForLesson(courseId, lesson.id);
  const prev = getPrevLesson(courseId, lesson.id);
  const next = getNextLesson(courseId, lesson.id);

  if (!era || !section) notFound();

  // What the reader's header needs beyond the summary: the two editorial
  // header facts travel with the open lesson only, never in the index.
  const heading: LessonHeading = {
    ...lesson,
    ...(article.subtitle !== undefined ? { subtitle: article.subtitle } : {}),
    ...(article.dateLabel !== undefined ? { dateLabel: article.dateLabel } : {}),
  };

  // The lesson text is rendered here, on the server, and handed to the client
  // reader as a finished node: the body has no interactivity, and keeping it
  // out of the client component keeps the corpus out of the JS bundle.
  const articleNode = (
    <>
      <LessonBody blocks={article.content} />
      {article.sources !== undefined && article.sources.length > 0 ? (
        <LessonSources sources={article.sources} />
      ) : null}
      <LessonTrustLine byline={article.byline} lastReviewedAt={article.lastReviewedAt} />
    </>
  );

  return (
    <LessonPageClient
      courseId={course.id}
      courseTitle={course.title}
      lesson={heading}
      article={articleNode}
      era={era}
      section={section}
      prev={adjacent(courseId, prev)}
      next={adjacent(courseId, next)}
    />
  );
}
