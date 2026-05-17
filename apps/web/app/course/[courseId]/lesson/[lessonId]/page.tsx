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
    ...(lesson.isPlaceholder === true
      ? {}
      : { readingTimeMinutes: lesson.readingTimeMinutes }),
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

  return (
    <LessonPageClient
      courseId={course.id}
      courseTitle={course.title}
      lesson={lesson}
      era={era}
      section={section}
      prev={adjacent(courseId, prev)}
      next={adjacent(courseId, next)}
    />
  );
}
