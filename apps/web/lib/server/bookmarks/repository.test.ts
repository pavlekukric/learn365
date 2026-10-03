import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { EPOCH_ISO } from '@learn365/core';

import { openTestDb } from '../../../test/db';
import { upsertGoogleUser } from '../auth/users';
import type { DbConnection } from '../db/client';

import { applyBookmarksDelta, getCourseBookmarks, syncCourseBookmarks } from './repository';

const COURSE = 'istorija-srbije-365';
const T1 = new Date('2026-09-20T10:00:00.000Z');
const T2 = new Date('2026-09-21T10:00:00.000Z');

describe('bookmarks repository', () => {
  let connection: DbConnection;
  let userId: string;

  beforeAll(async () => {
    connection = await openTestDb();
    const user = await upsertGoogleUser(connection.db, {
      sub: 'sub-bookmarks',
      email: 'b@example.com',
      name: null,
      picture: null,
    });
    userId = user.id;
  });

  afterAll(async () => {
    await connection.close();
  });

  it('starts empty and applies deltas idempotently', async () => {
    const db = connection.db;
    expect(await getCourseBookmarks(db, userId, COURSE)).toEqual({
      lessonIds: [],
      updatedAt: EPOCH_ISO,
    });

    await applyBookmarksDelta(db, userId, COURSE, { add: ['day-005', 'day-001'], remove: [] }, T1);
    await applyBookmarksDelta(db, userId, COURSE, { add: ['day-005'], remove: ['day-404'] }, T2);
    // Same created_at → ordered by lesson id; the re-add did not bump day-005.
    expect(await getCourseBookmarks(db, userId, COURSE)).toEqual({
      lessonIds: ['day-001', 'day-005'],
      updatedAt: T1.toISOString(),
    });

    await applyBookmarksDelta(db, userId, COURSE, { add: [], remove: ['day-005'] }, T2);
    expect((await getCourseBookmarks(db, userId, COURSE)).lessonIds).toEqual(['day-001']);

    // Present in both lists → kept (the newer intent is "saved").
    await applyBookmarksDelta(db, userId, COURSE, { add: ['day-001'], remove: ['day-001'] }, T2);
    expect((await getCourseBookmarks(db, userId, COURSE)).lessonIds).toEqual(['day-001']);
  });

  it('sync unions local and account bookmarks', async () => {
    const merged = await syncCourseBookmarks(
      connection.db,
      userId,
      COURSE,
      { lessonIds: ['day-009', 'day-001'], updatedAt: '2026-09-25T00:00:00.000Z' },
      T2,
    );
    expect(merged.lessonIds).toEqual(['day-001', 'day-009']);
    expect(merged.updatedAt).toBe(T2.toISOString());
  });
});
