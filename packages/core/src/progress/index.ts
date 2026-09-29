export {
  DEFAULT_STORAGE_KEY,
  PROGRESS_SCHEMA_VERSION,
  type CourseProgress,
  type CourseProgressSnapshot,
  type ProgressActions,
  type ProgressState,
  type ProgressStorage,
  type ProgressStoreState,
} from './types.js';

export { createProgressStore, type CreateProgressStoreOptions } from './store.js';

export {
  completedCount,
  courseProgress,
  isCompleted,
  lastOpenedLessonId,
  progressForLessons,
  type CourseProgressBreakdown,
  type ProgressBreakdown,
} from './selectors.js';

export { EMPTY_PROGRESS_SNAPSHOT, mergeCourseProgress, toProgressSnapshot } from './merge.js';
