'use client';

import { useMemo } from 'react';

import { getLessons, type CourseId, type Lesson } from '@learn365/content';
import { findResumeLesson, lastOpenedLessonId } from '@learn365/core';

import { useProgressStore } from './ProgressStoreProvider';

export interface ResumeState {
  /** Completed-lesson count for the course. */
  readonly completed: number;
  /** Total lessons in the course (typically 365). */
  readonly total: number;
  /**
   * `true` once at least one lesson is completed. This is the only thing
   * that flips a surface from "start" to "continue" — merely opening a
   * lesson never counts as progress, so a "0 / 365" counter is never shown
   * next to a "Nastavi" label.
   */
  readonly hasStarted: boolean;
  /**
   * The lesson a start / continue action should open.
   *   - fresh user → Day 1
   *   - started   → `findResumeLesson` (the unfinished lesson the reader
   *                 left, else the next unread day — never a finished one)
   *   - all done  → `null`
   */
  readonly lesson: Lesson | null;
}

/**
 * One resume rule for every "where do I continue?" surface (Home hero CTA,
 * Home recommended-lesson card, Course overview progress card). Keeping the
 * resolution here means the three can never point at different lessons.
 */
export function useResumeLesson(courseId: CourseId): ResumeState {
  const completedSet = useProgressStore(
    (state) => state.byCourse[courseId]?.completedLessonIds ?? null,
  );
  const lastId = useProgressStore((state) => lastOpenedLessonId(state, courseId));

  return useMemo(() => {
    const lessons = getLessons(courseId);
    const completed = completedSet?.size ?? 0;
    const hasStarted = completed > 0;
    const lesson = hasStarted
      ? findResumeLesson(lessons, completedSet, lastId)
      : (lessons[0] ?? null);
    return { completed, total: lessons.length, hasStarted, lesson };
  }, [courseId, completedSet, lastId]);
}
