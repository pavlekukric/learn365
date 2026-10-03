import { NextResponse, type NextRequest } from 'next/server';

import { guardApi } from '@/lib/server/auth/guard';
import { applyBookmarksDelta, getCourseBookmarks } from '@/lib/server/bookmarks/repository';
import {
  apiBadRequest,
  apiUnavailable,
  jsonNoStore,
  noContent,
  readJsonRecord,
} from '@/lib/server/http';
import { parseCourseId, parseLessonIds } from '@/lib/server/validation';
import type { BookmarksWire } from '@/lib/sync/wire';

export const dynamic = 'force-dynamic';

/** The account's saved lessons for one course. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const guarded = await guardApi(request, { mutating: false });
  if (!('user' in guarded)) return guarded;

  const courseId = parseCourseId(request.nextUrl.searchParams.get('courseId'));
  if (courseId === null) return apiBadRequest('courseId');

  try {
    const snapshot = await getCourseBookmarks(guarded.db, guarded.user.id, courseId);
    return jsonNoStore<BookmarksWire>({ courseId, ...snapshot });
  } catch (error) {
    console.error('[bookmarks] read failed', error);
    return apiUnavailable();
  }
}

/** A delta from the browser: `{ courseId, add?, remove? }`. */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const guarded = await guardApi(request, { mutating: true });
  if (!('user' in guarded)) return guarded;

  const body = await readJsonRecord(request);
  if (body instanceof NextResponse) return body;

  const courseId = parseCourseId(body['courseId']);
  if (courseId === null) return apiBadRequest('courseId');
  const add = parseLessonIds(courseId, body['add']);
  const remove = parseLessonIds(courseId, body['remove']);
  if (add === null || remove === null) return apiBadRequest('lessonIds');

  const dropped = add.dropped + remove.dropped;
  if (dropped > 0) {
    console.warn(`[bookmarks] dropped ${String(dropped)} unknown lesson id(s) for ${courseId}`);
  }

  try {
    await applyBookmarksDelta(guarded.db, guarded.user.id, courseId, {
      add: add.ids,
      remove: remove.ids,
    });
    return noContent();
  } catch (error) {
    console.error('[bookmarks] delta failed', error);
    return apiUnavailable();
  }
}
