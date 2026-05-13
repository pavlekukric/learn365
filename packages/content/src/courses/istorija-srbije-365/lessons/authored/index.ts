import type { Lesson, LessonId } from '../../../../types.js';

/**
 * Hand-authored lessons that override the corresponding stub at module
 * load time. Each new lesson is added here as it's written.
 *
 * Phase 1 substep 6 seeds 6 lessons (Day 1, 7, 31, 106, 200, 305).
 * Until then the map is empty and every lesson renders as a stub.
 */
export const authoredLessons: Readonly<Record<LessonId, Lesson>> = {};
