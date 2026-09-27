import type { LessonId } from '@learn365/content/types';

import { EPOCH_ISO, laterTimestamp, unionIds } from '../sync/index.js';

import type { CourseBookmarks, CourseBookmarksSnapshot } from './types.js';

export const EMPTY_BOOKMARKS_SNAPSHOT: CourseBookmarksSnapshot = {
  lessonIds: [],
  updatedAt: EPOCH_ISO,
};

/** Flatten a store record (Set) to the wire shape (array). */
export function toBookmarksSnapshot(bookmarks: CourseBookmarks | undefined): CourseBookmarksSnapshot {
  if (bookmarks === undefined) return EMPTY_BOOKMARKS_SNAPSHOT;
  return { lessonIds: Array.from(bookmarks.lessonIds), updatedAt: bookmarks.updatedAt };
}

/** Union of both sides (remote order first), later `updatedAt`. */
export function mergeCourseBookmarks(
  local: CourseBookmarksSnapshot,
  remote: CourseBookmarksSnapshot,
): CourseBookmarksSnapshot {
  return {
    lessonIds: unionIds<LessonId>(remote.lessonIds, local.lessonIds),
    updatedAt: laterTimestamp(remote.updatedAt, local.updatedAt),
  };
}
