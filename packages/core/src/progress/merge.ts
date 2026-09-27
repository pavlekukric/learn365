import type { LessonId } from '@learn365/content/types';

import { EPOCH_ISO, compareTimestamps, unionIds } from '../sync/index.js';

import type { CourseProgress, CourseProgressSnapshot } from './types.js';

/** An empty snapshot: nothing completed, nothing opened, never updated. */
export const EMPTY_PROGRESS_SNAPSHOT: CourseProgressSnapshot = {
  completedLessonIds: [],
  lastOpenedLessonId: null,
  updatedAt: EPOCH_ISO,
};

/** Flatten a store record (Set) to the wire shape (array). */
export function toProgressSnapshot(progress: CourseProgress | undefined): CourseProgressSnapshot {
  if (progress === undefined) return EMPTY_PROGRESS_SNAPSHOT;
  return {
    completedLessonIds: Array.from(progress.completedLessonIds),
    lastOpenedLessonId: progress.lastOpenedLessonId,
    updatedAt: progress.updatedAt,
  };
}

/**
 * Reconcile the progress a browser holds with what the account holds — used
 * once per (browser, user) when a reader signs in with local progress, and
 * by the server behind `POST /api/me/progress/sync`.
 *
 * - `completedLessonIds`: union. Completion is monotonic for this purpose.
 * - `lastOpenedLessonId`: from the side with the later `updatedAt`, falling
 *   back to the other side when that one is `null`. Ties go to `remote`.
 * - `updatedAt`: the later of the two.
 */
export function mergeCourseProgress(
  local: CourseProgressSnapshot,
  remote: CourseProgressSnapshot,
): CourseProgressSnapshot {
  const localIsNewer = compareTimestamps(local.updatedAt, remote.updatedAt) > 0;
  const primary = localIsNewer ? local : remote;
  const secondary = localIsNewer ? remote : local;
  return {
    completedLessonIds: unionIds<LessonId>(remote.completedLessonIds, local.completedLessonIds),
    lastOpenedLessonId: primary.lastOpenedLessonId ?? secondary.lastOpenedLessonId,
    updatedAt: primary.updatedAt,
  };
}
