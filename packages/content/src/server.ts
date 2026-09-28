import 'server-only';

import { articles as istorijaSrbijeArticles } from './courses/istorija-srbije-365/articles.js';
import type { CourseId, LessonArticle, LessonId } from './types.js';

/**
 * `@learn365/content/server` — the lesson *articles* (body, sources, byline,
 * review date, metadata copy), which are ~800 kB gzip for the first course
 * and must never reach a client bundle. The `server-only` marker makes a
 * client import a build error, the same guard `apps/web/lib/server/**`
 * relies on. Summaries and every lookup helper stay on the main entry.
 */
const articlesByCourse: Readonly<
  Record<CourseId, Readonly<Record<LessonId, LessonArticle>>>
> = {
  'istorija-srbije-365': istorijaSrbijeArticles,
};

export function getLessonArticle(courseId: CourseId, lessonId: LessonId): LessonArticle | null {
  return articlesByCourse[courseId]?.[lessonId] ?? null;
}
