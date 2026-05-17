export type {
  Course,
  CourseId,
  Era,
  EraId,
  Language,
  Lesson,
  LessonBlock,
  LessonId,
  LessonState,
  Script,
  Section,
  SectionId,
  UserProgress,
} from './types.js';

export {
  getAllCourseIds,
  getCourse,
  getEraById,
  getEraForLesson,
  getEraForSection,
  getEras,
  getLessonById,
  getLessons,
  getLessonsByEra,
  getLessonsBySection,
  getNextLesson,
  getPrevLesson,
  getSectionById,
  getSectionForLesson,
  getSections,
  getSectionsByEra,
} from './registry.js';

// `loadCourseFromFiles` + the file-tree validator use `node:fs` and must
// not leak into any client bundle. They are exposed only via the
// `@learn365/content/loader` sub-entry, consumed by the codegen script
// and the validator binary.
