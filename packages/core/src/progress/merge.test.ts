import { describe, expect, it } from 'vitest';

import { EMPTY_PROGRESS_SNAPSHOT, mergeCourseProgress, toProgressSnapshot } from './merge.js';

const T1 = '2026-09-01T10:00:00.000Z';
const T2 = '2026-09-02T10:00:00.000Z';

describe('toProgressSnapshot', () => {
  it('flattens the Set and maps an absent record to the empty snapshot', () => {
    expect(
      toProgressSnapshot({
        completedLessonIds: new Set(['day-001', 'day-002']),
        lastOpenedLessonId: 'day-003',
        updatedAt: T1,
      }),
    ).toEqual({ completedLessonIds: ['day-001', 'day-002'], lastOpenedLessonId: 'day-003', updatedAt: T1 });
    expect(toProgressSnapshot(undefined)).toBe(EMPTY_PROGRESS_SNAPSHOT);
  });
});

describe('mergeCourseProgress', () => {
  it('unions completions, remote order first', () => {
    const merged = mergeCourseProgress(
      { completedLessonIds: ['day-003', 'day-001'], lastOpenedLessonId: null, updatedAt: T1 },
      { completedLessonIds: ['day-001', 'day-002'], lastOpenedLessonId: null, updatedAt: T1 },
    );
    expect(merged.completedLessonIds).toEqual(['day-001', 'day-002', 'day-003']);
  });

  it('takes lastOpened from the newer side, remote on ties', () => {
    const localNewer = mergeCourseProgress(
      { completedLessonIds: [], lastOpenedLessonId: 'day-009', updatedAt: T2 },
      { completedLessonIds: [], lastOpenedLessonId: 'day-004', updatedAt: T1 },
    );
    expect(localNewer.lastOpenedLessonId).toBe('day-009');
    expect(localNewer.updatedAt).toBe(T2);

    const remoteNewer = mergeCourseProgress(
      { completedLessonIds: [], lastOpenedLessonId: 'day-009', updatedAt: T1 },
      { completedLessonIds: [], lastOpenedLessonId: 'day-004', updatedAt: T2 },
    );
    expect(remoteNewer.lastOpenedLessonId).toBe('day-004');

    const tie = mergeCourseProgress(
      { completedLessonIds: [], lastOpenedLessonId: 'day-009', updatedAt: T1 },
      { completedLessonIds: [], lastOpenedLessonId: 'day-004', updatedAt: T1 },
    );
    expect(tie.lastOpenedLessonId).toBe('day-004');
  });

  it('falls back to the other side when the newer lastOpened is null', () => {
    const merged = mergeCourseProgress(
      { completedLessonIds: [], lastOpenedLessonId: null, updatedAt: T2 },
      { completedLessonIds: [], lastOpenedLessonId: 'day-004', updatedAt: T1 },
    );
    expect(merged.lastOpenedLessonId).toBe('day-004');
  });

  it('is a no-op against the empty snapshot', () => {
    const local = { completedLessonIds: ['day-001'], lastOpenedLessonId: 'day-002', updatedAt: T1 };
    expect(mergeCourseProgress(local, EMPTY_PROGRESS_SNAPSHOT)).toEqual(local);
    expect(mergeCourseProgress(EMPTY_PROGRESS_SNAPSHOT, local)).toEqual(local);
  });
});
