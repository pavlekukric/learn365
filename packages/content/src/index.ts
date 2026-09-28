export type {
  Course,
  CourseId,
  Era,
  EraId,
  Language,
  Lesson,
  LessonArticle,
  LessonArticleKey,
  LessonBlock,
  LessonByline,
  LessonHeading,
  LessonId,
  LessonState,
  LessonSummary,
  Script,
  Section,
  SectionId,
  Source,
  SourceKind,
  UserProgress,
} from './types.js';
export { LESSON_ARTICLE_KEYS } from './types.js';

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
  getReadingTimeRange,
  getSectionById,
  getSectionForLesson,
  getSections,
  getSectionsByEra,
} from './registry.js';

// `loadCourseFromFiles` + the file-tree validator use `node:fs` and must
// not leak into any client bundle. They are exposed only via the
// `@learn365/content/loader` sub-entry, consumed by the codegen script
// and the validator binary.
//
// The lesson *articles* (bodies, sources, bylines — the bulk of the corpus)
// are likewise kept off this entry: `getLessonArticle` lives on
// `@learn365/content/server`, which carries `import 'server-only'`.
