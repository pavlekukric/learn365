import type { NextRequest, NextResponse } from 'next/server';

import { guardApi } from '@/lib/server/auth/guard';
import {
  PayloadTooLargeError,
  apiBadRequest,
  jsonNoStore,
  noContent,
  readJsonBody,
} from '@/lib/server/http';
import { applyProgressDelta, getCourseProgress } from '@/lib/server/progress/repository';
import {
  asRecord,
  parseCourseId,
  parseLastOpened,
  parseLessonIds,
} from '@/lib/server/progress/validation';
import type { ProgressWire } from '@/lib/sync/wire';

export const dynamic = 'force-dynamic';

/** The account's progress for one course — the browser replaces its local copy with this. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const guarded = await guardApi(request, { mutating: false });
  if (!('user' in guarded)) return guarded;

  const courseId = parseCourseId(request.nextUrl.searchParams.get('courseId'));
  if (courseId === null) return apiBadRequest('courseId');

  try {
    const snapshot = await getCourseProgress(guarded.db, guarded.user.id, courseId);
    return jsonNoStore<ProgressWire>({ courseId, ...snapshot });
  } catch (error) {
    console.error('[progress] read failed', error);
    return jsonNoStore({ error: 'unavailable' }, 503);
  }
}

/** A delta from the browser: `{ courseId, complete?, uncomplete?, lastOpenedLessonId? }`. */
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
  const complete = parseLessonIds(courseId, body['complete']);
  const uncomplete = parseLessonIds(courseId, body['uncomplete']);
  if (complete === null || uncomplete === null) return apiBadRequest('lessonIds');
  const lastOpenedLessonId = parseLastOpened(courseId, body['lastOpenedLessonId']);

  const dropped = complete.dropped + uncomplete.dropped;
  if (dropped > 0) {
    console.warn(`[progress] dropped ${String(dropped)} unknown lesson id(s) for ${courseId}`);
  }

  try {
    await applyProgressDelta(guarded.db, guarded.user.id, courseId, {
      complete: complete.ids,
      uncomplete: uncomplete.ids,
      ...(lastOpenedLessonId !== undefined ? { lastOpenedLessonId } : {}),
    });
    return noContent();
  } catch (error) {
    console.error('[progress] delta failed', error);
    return jsonNoStore({ error: 'unavailable' }, 503);
  }
}
