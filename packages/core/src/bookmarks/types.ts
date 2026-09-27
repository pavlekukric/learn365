import type { CourseId, LessonId } from '@learn365/content/types';

/**
 * Platform-provided storage adapter for bookmarks. Identical shape to
 * `ProgressStorage` so the same SSR-safe `localStorage` adapter pattern
 * carries over verbatim; kept as a separate named type because the
 * persistence keys (and, in Phase 8, the backend endpoints) are distinct.
 */
export interface BookmarkStorage {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
  removeItem(key: string): Promise<void> | void;
}

/** Per-course bookmark record. The store keeps `lessonIds` as a Set in
 *  memory; the persistence layer flattens it to an array for JSON. */
export interface CourseBookmarks {
  readonly lessonIds: ReadonlySet<LessonId>;
  readonly updatedAt: string;
}

/** Array form of `CourseBookmarks`: the wire shape and what `replaceCourseBookmarks` takes. */
export interface CourseBookmarksSnapshot {
  readonly lessonIds: readonly LessonId[];
  readonly updatedAt: string;
}

/** Full in-memory state shape. */
export interface BookmarkState {
  readonly byCourse: Readonly<Record<CourseId, CourseBookmarks>>;
}

/** Action surface exposed by the store. */
export interface BookmarkActions {
  toggleBookmark(courseId: CourseId, lessonId: LessonId): void;
  clearCourse(courseId: CourseId): void;
  /** Apply a snapshot wholesale (cloud sync); `updatedAt` is taken from the snapshot. */
  replaceCourseBookmarks(courseId: CourseId, snapshot: CourseBookmarksSnapshot): void;
}

export type BookmarkStoreState = BookmarkState & BookmarkActions;

/** Default persistence key. Separate from `progress` so the future backend
 *  can ship `/api/bookmarks` independently of `/api/progress`. */
export const BOOKMARKS_STORAGE_KEY = 'learn365:bookmarks:v1';

/** Current schema version for migration handling. */
export const BOOKMARKS_SCHEMA_VERSION = 1;
