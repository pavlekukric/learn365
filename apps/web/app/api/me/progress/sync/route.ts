import type { NextRequest, NextResponse } from 'next/server';

import { EPOCH_ISO } from '@learn365/core';

import { guardApi } from '@/lib/server/auth/guard';
import { PayloadTooLargeError, apiBadRequest, jsonNoStore, readJsonBody } from '@/lib/server/http';
import { syncCourseProgress } from '@/lib/server/progress/repository';
import {
  asRecord,
  parseCourseId,
  parseIsoTimestamp,
  parseLastOpened,
  parseLessonIds,
} from '@/lib/server/progress/validation';
import type { ProgressWire } from '@/lib/sync/wire';

export const dynamic = 'force-dynamic';

/**
 * First contact between a browser and the account: the local snapshot is
 * merged into the account (union of completions, last-opened from the newer
 * side) and the canonical result comes back. Runs once per (browser, user).
 */
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
  const completed = parseLessonIds(courseId, body['completedLessonIds']);
  if (completed === null) return apiBadRequest('completedLessonIds');
  if (completed.dropped > 0) {
    console.warn(`[progress] sync dropped ${String(completed.dropped)} unknown lesson id(s) for ${courseId}`);
  }

  try {
    const snapshot = await syncCourseProgress(guarded.db, guarded.user.id, courseId, {
      completedLessonIds: completed.ids,
      lastOpenedLessonId: parseLastOpened(courseId, body['lastOpenedLessonId']) ?? null,
      updatedAt: parseIsoTimestamp(body['updatedAt']) ?? EPOCH_ISO,
    });
    return jsonNoStore<ProgressWire>({ courseId, ...snapshot });
  } catch (error) {
    console.error('[progress] sync failed', error);
    return jsonNoStore({ error: 'unavailable' }, 503);
  }
}
