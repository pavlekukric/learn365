// Re-export the server-only lesson articles from the auto-generated module.
// Source of truth is `content/courses/istorija-srbije-365/` (JSON) —
// regenerate with `pnpm gen-content` after editing. Consumed only by
// `src/server.ts` (the `@learn365/content/server` entry).
export { articles, lessonModifiedAt } from './_generated.articles.js';
