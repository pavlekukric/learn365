'use client';

import { completedCount, isCompleted } from '@learn365/core';
import { LessonFooter, type LessonFooterLink } from '@learn365/ui-web';

import { useSignInPrompt } from '@/lib/auth/useSignInPrompt';
import { useProgressStore } from '@/lib/progress/ProgressStoreProvider';
import { useResumeLesson } from '@/lib/progress/useResumeLesson';

interface LessonCompletionProps {
  courseId: string;
  lessonId: string;
  dayNumber: number;
  totalLessons: number;
  isUpcoming: boolean;
  prev: LessonFooterLink | null;
  next: LessonFooterLink | null;
  courseHref: string;
}

/**
 * The lesson footer, wired to the progress store, the shared resume rule
 * and the sign-in ask. With the bookmark toggle it is all of the lesson page
 * that runs in the browser; the article above it is server-rendered.
 */
export function LessonCompletion({
  courseId,
  lessonId,
  dayNumber,
  totalLessons,
  isUpcoming,
  prev,
  next,
  courseHref,
}: LessonCompletionProps) {
  const completed = useProgressStore((state) => isCompleted(state, courseId, lessonId));
  const done = useProgressStore((state) => completedCount(state, courseId));
  const toggleComplete = useProgressStore((state) => state.toggleComplete);
  const signInPrompt = useSignInPrompt(courseId, lessonId);
  // After the course's last lesson there is no "next": the footer offers the
  // resume lesson instead (the earliest unread day), the same one Home and
  // the overview name.
  const { lesson: resumeLesson } = useResumeLesson(courseId);
  const resume: LessonFooterLink | null =
    next === null && resumeLesson !== null && resumeLesson.id !== lessonId
      ? {
          title: resumeLesson.title,
          dayNumber: resumeLesson.dayNumber,
          href: `/course/${courseId}/lesson/${resumeLesson.id}`,
        }
      : null;

  return (
    <LessonFooter
      dayNumber={dayNumber}
      isUpcoming={isUpcoming}
      isCompleted={completed}
      onToggleComplete={() => {
        toggleComplete(courseId, lessonId);
      }}
      completedCount={done}
      totalLessons={totalLessons}
      prev={prev}
      next={next}
      resume={resume}
      courseHref={courseHref}
      signInPrompt={
        signInPrompt.show
          ? { href: signInPrompt.href, onDismiss: signInPrompt.dismiss }
          : undefined
      }
    />
  );
}
