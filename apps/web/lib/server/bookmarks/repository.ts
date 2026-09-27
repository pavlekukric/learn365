import 'server-only';

import { and, eq, inArray } from 'drizzle-orm';

import { EPOCH_ISO, mergeCourseBookmarks, type CourseBookmarksSnapshot } from '@learn365/core';

import type { Db } from '../db/client';
import { bookmarks } from '../db/schema';

/**
 * Cloud bookmarks per (user, course): one row per saved lesson. `updatedAt`
 * on the wire is the newest `created_at` (a hint for the merge, not
 * authority — the merge is a plain union either way).
 */
export async function getCourseBookmarks(
  db: Db,
  userId: string,
  courseId: string,
): Promise<CourseBookmarksSnapshot> {
  const rows = await db
    .select({ lessonId: bookmarks.lessonId, createdAt: bookmarks.createdAt })
    .from(bookmarks)
    .where(and(eq(bookmarks.userId, userId), eq(bookmarks.courseId, courseId)))
    .orderBy(bookmarks.createdAt, bookmarks.lessonId);
  let latest: Date | null = null;
  for (const row of rows) {
    if (latest === null || row.createdAt.getTime() > latest.getTime()) latest = row.createdAt;
  }
  return {
    lessonIds: rows.map((row) => row.lessonId),
    updatedAt: latest?.toISOString() ?? EPOCH_ISO,
  };
}

export interface BookmarksDelta {
  readonly add: readonly string[];
  readonly remove: readonly string[];
}

/** Idempotent: saving twice or removing something absent is a no-op. */
export async function applyBookmarksDelta(
  db: Db,
  userId: string,
  courseId: string,
  delta: BookmarksDelta,
  now: Date = new Date(),
): Promise<void> {
  const remove = delta.remove.filter((id) => !delta.add.includes(id));
  if (delta.add.length === 0 && remove.length === 0) return;
  await db.transaction(async (tx) => {
    if (delta.add.length > 0) {
      await tx
        .insert(bookmarks)
        .values(delta.add.map((lessonId) => ({ userId, courseId, lessonId, createdAt: now })))
        .onConflictDoNothing();
    }
    if (remove.length > 0) {
      await tx
        .delete(bookmarks)
        .where(
          and(
            eq(bookmarks.userId, userId),
            eq(bookmarks.courseId, courseId),
            inArray(bookmarks.lessonId, remove),
          ),
        );
    }
  });
}

/** First contact: union of local and account bookmarks; returns the canonical state. */
export async function syncCourseBookmarks(
  db: Db,
  userId: string,
  courseId: string,
  local: CourseBookmarksSnapshot,
  now: Date = new Date(),
): Promise<CourseBookmarksSnapshot> {
  await db.transaction(async (tx) => {
    const remote = await getCourseBookmarks(tx, userId, courseId);
    const merged = mergeCourseBookmarks(local, remote);
    const known = new Set(remote.lessonIds);
    const additions = merged.lessonIds.filter((id) => !known.has(id));
    if (additions.length > 0) {
      await tx
        .insert(bookmarks)
        .values(additions.map((lessonId) => ({ userId, courseId, lessonId, createdAt: now })))
        .onConflictDoNothing();
    }
  });
  return getCourseBookmarks(db, userId, courseId);
}
