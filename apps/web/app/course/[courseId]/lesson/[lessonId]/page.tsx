import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import {
  getAllCourseIds,
  getCourse,
  getEraForLesson,
  getLessonById,
  getLessons,
  getLessonsByEra,
  getLessonsBySection,
  getNextLesson,
  getPrevLesson,
  getSectionForLesson,
  type Course,
  type LessonArticle,
  type LessonHeading,
  type LessonSummary,
} from '@learn365/content';
import { getLessonArticle } from '@learn365/content/server';
import { formatDayProse } from '@learn365/core';
import {
  LessonBody,
  LessonReader,
  LessonSources,
  LessonTrustLine,
  type LessonFooterLink,
} from '@learn365/ui-web';

import { truncateDescription } from '@/lib/seo/description';
import { lessonJsonLd } from '@/lib/seo/jsonLd';
import { shareMetadata } from '@/lib/seo/metadata';
import { StructuredData } from '@/lib/seo/StructuredData';

import { LessonBookmarkToggle } from './LessonBookmarkToggle';
import { LessonCompletion } from './LessonCompletion';

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

function lessonPath(courseId: string, lessonId: string): string {
  return `/course/${courseId}/lesson/${lessonId}`;
}

/** What the footer needs for prev / next: the link plus the small editorial
 * facts the completion card surfaces — which era the next lesson belongs
 * to, and how long it takes to read. */
function adjacent(courseId: string, lesson: LessonSummary | null): LessonFooterLink | null {
  if (!lesson) return null;
  const era = getEraForLesson(courseId, lesson.id);
  return {
    title: lesson.title,
    dayNumber: lesson.dayNumber,
    href: lessonPath(courseId, lesson.id),
    ...(era ? { eraLabel: era.eraShort } : {}),
    ...(lesson.isPlaceholder === true ? {} : { readingTimeMinutes: lesson.readingTimeMinutes }),
  };
}

/** The meta description: the summary (most run past 160 characters, so it is
 * cut at a word boundary), else the subtitle, else the day and the course. */
function lessonDescription(
  course: Course,
  lesson: LessonSummary,
  article: Pick<LessonArticle, 'summary' | 'subtitle'>,
): string {
  return truncateDescription(
    article.summary ??
      article.subtitle ??
      `${formatDayProse(lesson.dayNumber)} od ${String(course.totalLessons)} · ${course.title}`,
  );
}

/** Share-preview metadata per lesson: a shared lesson link should say which
 * day and which lesson it is, not just the site name. */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { courseId, lessonId } = await params;
  const course = getCourse(courseId);
  const lesson = getLessonById(courseId, lessonId);
  const article = getLessonArticle(courseId, lessonId);
  if (!course || !lesson || !article) return {};
  const title = `${formatDayProse(lesson.dayNumber)}: ${lesson.title}`;
  const description = lessonDescription(course, lesson, article);
  return {
    title,
    description,
    ...shareMetadata({
      title,
      description,
      path: lessonPath(course.id, lesson.id),
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
  if (!era || !section) notFound();

  const courseHref = `/course/${course.id}`;
  const firstInEra = getLessonsByEra(courseId, era.id)[0];
  const firstInSection = getLessonsBySection(courseId, section.id)[0];

  // What the reader's header needs beyond the summary: the two editorial
  // header facts travel with the open lesson only, never in the index.
  const heading: LessonHeading = {
    ...lesson,
    ...(article.subtitle !== undefined ? { subtitle: article.subtitle } : {}),
    ...(article.dateLabel !== undefined ? { dateLabel: article.dateLabel } : {}),
  };

  // Breadcrumb carries location hierarchy only (course · era · section). The
  // day number is intentionally NOT a crumb — it would duplicate the dedicated
  // day indicator (mobile context header / the sidebar's active row), and a
  // within-section position doesn't belong in a location trail.
  //
  // On the page the era and the section are plain text: they have no page
  // of their own, and as links they opened the era's / section's first
  // lesson — Day 1 from any lesson of Era I (review 2026-10-03 item 18).
  // The structured-data trail keeps its URLs until real era / section
  // pages exist (review item 9).
  const jsonLdBreadcrumbs = [
    { label: 'Početna', href: '/' },
    { label: course.title, href: courseHref },
    { label: era.eraShort, href: firstInEra ? lessonPath(course.id, firstInEra.id) : courseHref },
    {
      label: section.title,
      href: firstInSection ? lessonPath(course.id, firstInSection.id) : courseHref,
    },
  ];
  const breadcrumbs = [
    { label: 'Početna', href: '/' },
    { label: course.title, href: courseHref },
    { label: era.eraShort },
    { label: section.title, current: false },
  ];

  // The whole reader is rendered here, on the server (Phase 15): the lesson
  // text has no interactivity, and keeping it out of the client components
  // keeps the corpus out of the JS bundle. The course chrome around it is the
  // layout's (`LessonShell`); the three nodes below are the page's islands.
  return (
    <LessonReader
      lesson={heading}
      breadcrumbs={breadcrumbs}
      eraShort={era.eraShort}
      bookmark={<LessonBookmarkToggle courseId={course.id} lessonId={lesson.id} />}
      article={
        <>
          <LessonBody blocks={article.content} />
          {article.sources !== undefined && article.sources.length > 0 ? (
            <LessonSources sources={article.sources} />
          ) : null}
          <LessonTrustLine byline={article.byline} lastReviewedAt={article.lastReviewedAt} />
          <StructuredData
            data={lessonJsonLd({
              title: lesson.title,
              description: lessonDescription(course, lesson, article),
              path: lessonPath(course.id, lesson.id),
              dayNumber: lesson.dayNumber,
              readingTimeMinutes: lesson.readingTimeMinutes,
              course: { title: course.title, path: courseHref },
              ...(article.byline?.author !== undefined ? { author: article.byline.author } : {}),
              ...(article.lastReviewedAt !== undefined
                ? { lastReviewedAt: article.lastReviewedAt }
                : {}),
              breadcrumbs: jsonLdBreadcrumbs,
            })}
          />
        </>
      }
      footer={
        <LessonCompletion
          courseId={course.id}
          lessonId={lesson.id}
          dayNumber={lesson.dayNumber}
          totalLessons={course.totalLessons}
          isUpcoming={lesson.isPlaceholder === true}
          prev={adjacent(courseId, getPrevLesson(courseId, lesson.id))}
          next={adjacent(courseId, getNextLesson(courseId, lesson.id))}
          courseHref={courseHref}
        />
      }
    />
  );
}
