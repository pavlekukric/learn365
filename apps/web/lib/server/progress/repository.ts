import 'server-only';

import { and, eq, inArray } from 'drizzle-orm';

import { EPOCH_ISO, mergeCourseProgress, type CourseProgressSnapshot } from '@learn365/core';

import type { Db } from '../db/client';
import { courseProgress, lessonCompletions } from '../db/schema';

/**
 * Cloud progress per (user, course). Completions are rows; the last opened
 * lesson and `updated_at` live on `course_progress`. Every write goes
 * through a transaction so a delta is applied whole or not at all.
 */
export async function getCourseProgress(
  db: Db,
  userId: string,
  courseId: string,
): Promise<CourseProgressSnapshot> {
  const scope = and(eq(lessonCompletions.userId, userId), eq(lessonCompletions.courseId, courseId));
  const completions = await db
    .select({ lessonId: lessonCompletions.lessonId })
    .from(lessonCompletions)
    .where(scope)
    .orderBy(lessonCompletions.completedAt, lessonCompletions.lessonId);
  const [meta] = await db
    .select()
    .from(courseProgress)
    .where(and(eq(courseProgress.userId, userId), eq(courseProgress.courseId, courseId)))
    .limit(1);
  return {
    completedLessonIds: completions.map((row) => row.lessonId),
    lastOpenedLessonId: meta?.lastOpenedLessonId ?? null,
    updatedAt: meta?.updatedAt.toISOString() ?? EPOCH_ISO,
  };
}

export interface ProgressDelta {
  readonly complete: readonly string[];
  readonly uncomplete: readonly string[];
  /** Absent = unchanged; `null` = cleared. */
  readonly lastOpenedLessonId?: string | null;
}

async function touchMeta(
  db: Db,
  userId: string,
  courseId: string,
  lastOpenedLessonId: string | null | undefined,
  now: Date,
): Promise<void> {
  const set =
    lastOpenedLessonId === undefined ? { updatedAt: now } : { lastOpenedLessonId, updatedAt: now };
  await db
    .insert(courseProgress)
    .values({ userId, courseId, lastOpenedLessonId: lastOpenedLessonId ?? null, updatedAt: now })
    .onConflictDoUpdate({ target: [courseProgress.userId, courseProgress.courseId], set });
}

/** Idempotent: completing twice or un-completing something absent is a no-op. */
export async function applyProgressDelta(
  db: Db,
  userId: string,
  courseId: string,
  delta: ProgressDelta,
  now: Date = new Date(),
): Promise<void> {
  const uncomplete = delta.uncomplete.filter((id) => !delta.complete.includes(id));
  if (delta.complete.length === 0 && uncomplete.length === 0 && delta.lastOpenedLessonId === undefined) {
    return;
  }
  await db.transaction(async (tx) => {
    if (delta.complete.length > 0) {
      await tx
        .insert(lessonCompletions)
        .values(delta.complete.map((lessonId) => ({ userId, courseId, lessonId, completedAt: now })))
        .onConflictDoNothing();
    }
    if (uncomplete.length > 0) {
      await tx
        .delete(lessonCompletions)
        .where(
          and(
            eq(lessonCompletions.userId, userId),
            eq(lessonCompletions.courseId, courseId),
            inArray(lessonCompletions.lessonId, uncomplete),
          ),
        );
    }
    await touchMeta(tx, userId, courseId, delta.lastOpenedLessonId, now);
  });
}

/**
 * First contact between a browser's local progress and the account: union
 * of completions, last-opened from the newer side (`mergeCourseProgress`).
 * Returns the canonical post-merge state with the server's own timestamp.
 */
export async function syncCourseProgress(
  db: Db,
  userId: string,
  courseId: string,
  local: CourseProgressSnapshot,
  now: Date = new Date(),
): Promise<CourseProgressSnapshot> {
  await db.transaction(async (tx) => {
    const remote = await getCourseProgress(tx, userId, courseId);
    const merged = mergeCourseProgress(local, remote);
    const known = new Set(remote.completedLessonIds);
    const additions = merged.completedLessonIds.filter((id) => !known.has(id));
    if (additions.length > 0) {
      await tx
        .insert(lessonCompletions)
        .values(additions.map((lessonId) => ({ userId, courseId, lessonId, completedAt: now })))
        .onConflictDoNothing();
    }
    await touchMeta(tx, userId, courseId, merged.lastOpenedLessonId, now);
  });
  return getCourseProgress(db, userId, courseId);
}
