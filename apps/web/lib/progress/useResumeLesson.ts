'use client';

import { useMemo } from 'react';

import { getLessons, type CourseId, type LessonSummary } from '@learn365/content';
import { findResumeLesson } from '@learn365/core';

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
   *   - started   → `findResumeLesson`: the first unread day after the
   *                 highest-numbered completed one, else the earliest unread
   *                 day. Merely opening a lesson never moves it (Phase 21).
   *   - all done  → `null`
   */
  readonly lesson: LessonSummary | null;
  /**
   * N in "Tvoj N. dan": the day of the lesson the reader is about to open,
   * so the ritual eyebrow and the `DAN nnn` on the card beneath it always
   * agree. `total` once everything is read; `null` before the first
   * completion (the surfaces render their idle framing instead).
   */
  readonly journeyDay: number | null;
}

/**
 * One resume rule for every "where do I continue?" surface (Home hero CTA,
 * Home recommended-lesson card, Home daily anchor, Home era rail marker,
 * Course overview progress card and its highlighted tree row, the lesson
 * footer after the course's last day). Keeping the resolution here means
 * they can never point at different lessons or count different days.
 *
 * Reads completions only — `lastOpenedLessonId` is not an input — so a
 * lesson browsed from the outline does not become "Tvoj N. dan".
 */
export function useResumeLesson(courseId: CourseId): ResumeState {
  const completedSet = useProgressStore(
    (state) => state.byCourse[courseId]?.completedLessonIds ?? null,
  );

  return useMemo(() => {
    const lessons = getLessons(courseId);
    const completed = completedSet?.size ?? 0;
    const hasStarted = completed > 0;
    const lesson = hasStarted ? findResumeLesson(lessons, completedSet) : (lessons[0] ?? null);
    const journeyDay = hasStarted ? (lesson?.dayNumber ?? lessons.length) : null;
    return { completed, total: lessons.length, hasStarted, lesson, journeyDay };
  }, [courseId, completedSet]);
}
