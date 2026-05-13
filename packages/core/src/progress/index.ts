export {
  DEFAULT_STORAGE_KEY,
  PROGRESS_SCHEMA_VERSION,
  type CourseProgress,
  type ProgressActions,
  type ProgressState,
  type ProgressStorage,
  type ProgressStoreState,
} from './types.js';

export { createProgressStore, type CreateProgressStoreOptions } from './store.js';

export {
  completedCount,
  courseProgress,
  eraProgress,
  isCompleted,
  lastOpenedLessonId,
  progressForLessons,
  sectionProgress,
  type CourseProgressBreakdown,
  type ProgressBreakdown,
} from './selectors.js';
