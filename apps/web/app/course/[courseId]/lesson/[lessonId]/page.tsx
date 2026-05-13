import { notFound } from 'next/navigation';

import {
  getCourse,
  getEraForLesson,
  getLessonById,
  getNextLesson,
  getPrevLesson,
  getSectionForLesson,
} from '@learn365/content';

import { LessonReader } from './LessonReader';

interface PageProps {
  params: Promise<{ courseId: string; lessonId: string }>;
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

  return (
    <LessonReader
      courseId={course.id}
      lesson={lesson}
      eraTitle={era?.title ?? null}
      sectionTitle={section?.title ?? null}
      prev={prev ? { id: prev.id, title: prev.title, dayNumber: prev.dayNumber } : null}
      next={next ? { id: next.id, title: next.title, dayNumber: next.dayNumber } : null}
    />
  );
}
