import type { CourseId, LessonId } from '@learn365/content/types';

/**
 * The platform-provided storage adapter. `apps/web` supplies a
 * `localStorage`-backed implementation; `apps/mobile` (later) supplies
 * an `AsyncStorage` one. Sync and async signatures are both supported.
 *
 * Matches zustand's `StateStorage` shape but is named for our domain.
 */
export interface ProgressStorage {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
  removeItem(key: string): Promise<void> | void;
}

/** Per-course progress record. The store keeps these in memory as Sets;
 *  the persistence layer flattens to arrays for JSON. */
export interface CourseProgress {
  readonly completedLessonIds: ReadonlySet<LessonId>;
  readonly lastOpenedLessonId: LessonId | null;
  readonly updatedAt: string;
}

/** Full in-memory state shape. */
export interface ProgressState {
  readonly byCourse: Readonly<Record<CourseId, CourseProgress>>;
}

/** Action surface exposed by the store. */
export interface ProgressActions {
  toggleComplete(courseId: CourseId, lessonId: LessonId): void;
  markOpened(courseId: CourseId, lessonId: LessonId): void;
  resetCourse(courseId: CourseId): void;
}

export type ProgressStoreState = ProgressState & ProgressActions;

/** Default persistence key. `apps/web` and `apps/mobile` may override. */
export const DEFAULT_STORAGE_KEY = 'learn365:progress:v1';

/** Current schema version for migration handling. */
export const PROGRESS_SCHEMA_VERSION = 1;
