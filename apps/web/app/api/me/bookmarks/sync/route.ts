import { NextResponse, type NextRequest } from 'next/server';

import { EPOCH_ISO } from '@learn365/core';

import { guardApi } from '@/lib/server/auth/guard';
import { syncCourseBookmarks } from '@/lib/server/bookmarks/repository';
import { apiBadRequest, apiUnavailable, jsonNoStore, readJsonRecord } from '@/lib/server/http';
import { parseCourseId, parseIsoTimestamp, parseLessonIds } from '@/lib/server/validation';
import type { BookmarksWire } from '@/lib/sync/wire';

export const dynamic = 'force-dynamic';

/** First contact: local bookmarks are unioned into the account; the canonical set comes back. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const guarded = await guardApi(request, { mutating: true });
  if (!('user' in guarded)) return guarded;

  const body = await readJsonRecord(request);
  if (body instanceof NextResponse) return body;

  const courseId = parseCourseId(body['courseId']);
  if (courseId === null) return apiBadRequest('courseId');
  const lessonIds = parseLessonIds(courseId, body['lessonIds']);
  if (lessonIds === null) return apiBadRequest('lessonIds');
  if (lessonIds.dropped > 0) {
    console.warn(
      `[bookmarks] sync dropped ${String(lessonIds.dropped)} unknown lesson id(s) for ${courseId}`,
    );
  }

  try {
    const snapshot = await syncCourseBookmarks(guarded.db, guarded.user.id, courseId, {
      lessonIds: lessonIds.ids,
      updatedAt: parseIsoTimestamp(body['updatedAt']) ?? EPOCH_ISO,
    });
    return jsonNoStore<BookmarksWire>({ courseId, ...snapshot });
  } catch (error) {
    console.error('[bookmarks] sync failed', error);
    return apiUnavailable();
  }
}
