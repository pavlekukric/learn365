import { boolean, index, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Phase 8 schema. Content (courses, eras, sections, lessons) does not live
 * here — ids are the stable strings from `@learn365/content` and the server
 * validates them against the package. Everything hangs off `users` with
 * `on delete cascade`, so deleting an account is one statement.
 *
 * Edit → `pnpm --filter @learn365/web db:generate` → commit the SQL under
 * `migrations/`. Migrations are applied at server start (instrumentation.ts).
 */

const timestampTz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** Google's stable subject id — the only identity key we rely on. */
  googleSub: text('google_sub').notNull().unique(),
  email: text('email').notNull(),
  name: text('name'),
  pictureUrl: text('picture_url'),
  createdAt: timestampTz('created_at').notNull().defaultNow(),
  lastSeenAt: timestampTz('last_seen_at'),
  /**
   * May open `/pregled`, the owner's accounts overview (Phase 16). Set by
   * hand on the box (`docs/DEPLOY.md` §15); no code path writes it.
   */
  isAdmin: boolean('is_admin').notNull().default(false),
});

export const sessions = pgTable(
  'sessions',
  {
    /** SHA-256 (hex) of the cookie token; the token itself is never stored. */
    id: text('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestampTz('expires_at').notNull(),
    createdAt: timestampTz('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('sessions_user_id_idx').on(table.userId),
    index('sessions_expires_at_idx').on(table.expiresAt),
  ],
);

export const courseProgress = pgTable(
  'course_progress',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    courseId: text('course_id').notNull(),
    lastOpenedLessonId: text('last_opened_lesson_id'),
    updatedAt: timestampTz('updated_at').notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.courseId] })],
);

export const lessonCompletions = pgTable(
  'lesson_completions',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    courseId: text('course_id').notNull(),
    lessonId: text('lesson_id').notNull(),
    completedAt: timestampTz('completed_at').notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.courseId, table.lessonId] })],
);

export const bookmarks = pgTable(
  'bookmarks',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    courseId: text('course_id').notNull(),
    lessonId: text('lesson_id').notNull(),
    createdAt: timestampTz('created_at').notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.courseId, table.lessonId] })],
);

export type UserRow = typeof users.$inferSelect;
export type SessionRow = typeof sessions.$inferSelect;
