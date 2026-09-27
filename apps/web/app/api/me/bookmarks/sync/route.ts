import type { NextRequest, NextResponse } from 'next/server';

import { EPOCH_ISO } from '@learn365/core';

import { guardApi } from '@/lib/server/auth/guard';
import { syncCourseBookmarks } from '@/lib/server/bookmarks/repository';
import { PayloadTooLargeError, apiBadRequest, jsonNoStore, readJsonBody } from '@/lib/server/http';
import {
  asRecord,
  parseCourseId,
  parseIsoTimestamp,
  parseLessonIds,
} from '@/lib/server/progress/validation';
import type { BookmarksWire } from '@/lib/sync/wire';

export const dynamic = 'force-dynamic';

/** First contact: local bookmarks are unioned into the account; the canonical set comes back. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const guarded = await guardApi(request, { mutating: true });
  if (!('user' in guarded)) return guarded;

  let body: Record<string, unknown> | null;
  try {
    body = asRecord(await readJsonBody(request));
  } catch (error) {
    if (error instanceof PayloadTooLargeError) return jsonNoStore({ error: 'too_large' }, 413);
    return apiBadRequest('json');
  }
  if (body === null) return apiBadRequest('body');

  const courseId = parseCourseId(body['courseId']);
  if (courseId === null) return apiBadRequest('courseId');
  const lessonIds = parseLessonIds(courseId, body['lessonIds']);
  if (lessonIds === null) return apiBadRequest('lessonIds');
  if (lessonIds.dropped > 0) {
    console.warn(`[bookmarks] sync dropped ${String(lessonIds.dropped)} unknown lesson id(s) for ${courseId}`);
  }

  try {
    const snapshot = await syncCourseBookmarks(guarded.db, guarded.user.id, courseId, {
      lessonIds: lessonIds.ids,
      updatedAt: parseIsoTimestamp(body['updatedAt']) ?? EPOCH_ISO,
    });
    return jsonNoStore<BookmarksWire>({ courseId, ...snapshot });
  } catch (error) {
    console.error('[bookmarks] sync failed', error);
    return jsonNoStore({ error: 'unavailable' }, 503);
  }
}
