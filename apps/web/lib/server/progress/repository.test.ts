import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { EPOCH_ISO } from '@learn365/core';

import { openTestDb } from '../../../test/db';
import { upsertGoogleUser } from '../auth/users';
import type { DbConnection } from '../db/client';

import { applyProgressDelta, getCourseProgress, syncCourseProgress } from './repository';

const COURSE = 'istorija-srbije-365';
const T1 = new Date('2026-09-20T10:00:00.000Z');
const T2 = new Date('2026-09-21T10:00:00.000Z');

describe('progress repository', () => {
  let connection: DbConnection;
  let userId: string;

  beforeAll(async () => {
    connection = await openTestDb();
    const user = await upsertGoogleUser(connection.db, {
      sub: 'sub-progress',
      email: 'p@example.com',
      name: null,
      picture: null,
    });
    userId = user.id;
  });

  afterAll(async () => {
    await connection.close();
  });

  it('starts empty', async () => {
    expect(await getCourseProgress(connection.db, userId, COURSE)).toEqual({
      completedLessonIds: [],
      lastOpenedLessonId: null,
      updatedAt: EPOCH_ISO,
    });
  });

  it('applies deltas idempotently and tracks last opened', async () => {
    const db = connection.db;
    await applyProgressDelta(db, userId, COURSE, { complete: ['day-001', 'day-002'], uncomplete: [] }, T1);
    await applyProgressDelta(db, userId, COURSE, { complete: ['day-001'], uncomplete: ['day-404'] }, T1);
    await applyProgressDelta(db, userId, COURSE, { complete: [], uncomplete: [], lastOpenedLessonId: 'day-003' }, T2);

    const snapshot = await getCourseProgress(db, userId, COURSE);
    expect(snapshot.completedLessonIds).toEqual(['day-001', 'day-002']);
    expect(snapshot.lastOpenedLessonId).toBe('day-003');
    expect(snapshot.updatedAt).toBe(T2.toISOString());

    await applyProgressDelta(db, userId, COURSE, { complete: [], uncomplete: ['day-001'] }, T2);
    expect((await getCourseProgress(db, userId, COURSE)).completedLessonIds).toEqual(['day-002']);

    // A lesson in both lists is treated as completed (the newer intent).
    await applyProgressDelta(db, userId, COURSE, { complete: ['day-001'], uncomplete: ['day-001'] }, T2);
    expect((await getCourseProgress(db, userId, COURSE)).completedLessonIds).toEqual(['day-002', 'day-001']);

    // Nothing to do → no row churn, timestamp untouched.
    await applyProgressDelta(db, userId, COURSE, { complete: [], uncomplete: [] }, new Date('2030-01-01'));
    expect((await getCourseProgress(db, userId, COURSE)).updatedAt).toBe(T2.toISOString());
  });

  it('sync unions completions and takes last-opened from the newer side', async () => {
    const db = connection.db;
    const merged = await syncCourseProgress(
      db,
      userId,
      COURSE,
      { completedLessonIds: ['day-010', 'day-002'], lastOpenedLessonId: 'day-011', updatedAt: '2026-09-25T00:00:00.000Z' },
      new Date('2026-09-26T00:00:00.000Z'),
    );
    expect(merged.completedLessonIds).toEqual(['day-002', 'day-001', 'day-010']);
    expect(merged.lastOpenedLessonId).toBe('day-011');
    expect(merged.updatedAt).toBe('2026-09-26T00:00:00.000Z');

    // Older local snapshot: the account's last-opened wins, completions still union.
    const again = await syncCourseProgress(
      db,
      userId,
      COURSE,
      { completedLessonIds: ['day-020'], lastOpenedLessonId: 'day-000', updatedAt: '2020-01-01T00:00:00.000Z' },
      new Date('2026-09-27T00:00:00.000Z'),
    );
    expect(again.completedLessonIds).toContain('day-020');
    expect(again.lastOpenedLessonId).toBe('day-011');
  });

  it('keeps users apart', async () => {
    const other = await upsertGoogleUser(connection.db, {
      sub: 'sub-other',
      email: 'o@example.com',
      name: null,
      picture: null,
    });
    expect((await getCourseProgress(connection.db, other.id, COURSE)).completedLessonIds).toEqual([]);
  });
});
