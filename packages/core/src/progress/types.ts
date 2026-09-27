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

/**
 * The same record with arrays instead of a Set: JSON-friendly, so it is
 * what crosses the wire to and from the cloud (Phase 8) and what
 * `replaceCourseProgress` accepts. Mirrors `UserProgress` in the content
 * model field for field.
 */
export interface CourseProgressSnapshot {
  readonly completedLessonIds: readonly LessonId[];
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
  /** Apply a snapshot wholesale (cloud sync); `updatedAt` is taken from the snapshot. */
  replaceCourseProgress(courseId: CourseId, snapshot: CourseProgressSnapshot): void;
}

export type ProgressStoreState = ProgressState & ProgressActions;

/** Default persistence key. `apps/web` and `apps/mobile` may override. */
export const DEFAULT_STORAGE_KEY = 'learn365:progress:v1';

/** Current schema version for migration handling. */
export const PROGRESS_SCHEMA_VERSION = 1;
