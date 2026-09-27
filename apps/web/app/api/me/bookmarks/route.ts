import type { NextRequest, NextResponse } from 'next/server';

import { guardApi } from '@/lib/server/auth/guard';
import { applyBookmarksDelta, getCourseBookmarks } from '@/lib/server/bookmarks/repository';
import {
  PayloadTooLargeError,
  apiBadRequest,
  jsonNoStore,
  noContent,
  readJsonBody,
} from '@/lib/server/http';
import { asRecord, parseCourseId, parseLessonIds } from '@/lib/server/progress/validation';
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
    return jsonNoStore({ error: 'unavailable' }, 503);
  }
}

/** A delta from the browser: `{ courseId, add?, remove? }`. */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
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
  const add = parseLessonIds(courseId, body['add']);
  const remove = parseLessonIds(courseId, body['remove']);
  if (add === null || remove === null) return apiBadRequest('lessonIds');

  const dropped = add.dropped + remove.dropped;
  if (dropped > 0) {
    console.warn(`[bookmarks] dropped ${String(dropped)} unknown lesson id(s) for ${courseId}`);
  }

  try {
    await applyBookmarksDelta(guarded.db, guarded.user.id, courseId, { add: add.ids, remove: remove.ids });
    return noContent();
  } catch (error) {
    console.error('[bookmarks] delta failed', error);
    return jsonNoStore({ error: 'unavailable' }, 503);
  }
}
