import { describe, expect, it } from 'vitest';

import type { ProgressState } from './types.js';
import {
  completedCount,
  courseProgress,
  isCompleted,
  lastOpenedLessonId,
  progressForLessons,
} from './selectors.js';

const COURSE = 'istorija-srbije-365';

function stateWith(completed: string[], lastOpened: string | null = null): ProgressState {
  return {
    byCourse: {
      [COURSE]: {
        completedLessonIds: new Set(completed),
        lastOpenedLessonId: lastOpened,
        updatedAt: '2026-05-13T10:00:00.000Z',
      },
    },
  };
}

describe('isCompleted', () => {
  it('returns true when the lesson id is in the set', () => {
    expect(isCompleted(stateWith(['a']), COURSE, 'a')).toBe(true);
  });

  it('returns false when not present', () => {
    expect(isCompleted(stateWith(['a']), COURSE, 'b')).toBe(false);
  });

  it('returns false when the course has no record', () => {
    expect(isCompleted({ byCourse: {} }, COURSE, 'a')).toBe(false);
  });
});

describe('completedCount', () => {
  it('counts the set size', () => {
    expect(completedCount(stateWith(['a', 'b', 'c']), COURSE)).toBe(3);
  });

  it('returns 0 for an unknown course', () => {
    expect(completedCount({ byCourse: {} }, COURSE)).toBe(0);
  });
});

describe('lastOpenedLessonId', () => {
  it('returns the stored id', () => {
    expect(lastOpenedLessonId(stateWith([], 'nemanjici-rani-001'), COURSE)).toBe(
      'nemanjici-rani-001',
    );
  });

  it('returns null when not set', () => {
    expect(lastOpenedLessonId({ byCourse: {} }, COURSE)).toBeNull();
  });
});

describe('progressForLessons', () => {
  it('counts only the intersection with the supplied lesson ids', () => {
    const result = progressForLessons(stateWith(['a', 'b', 'x']), COURSE, ['a', 'b', 'c']);
    expect(result).toEqual({ done: 2, total: 3, pct: (2 / 3) * 100 });
  });

  it('handles an empty section without dividing by zero', () => {
    expect(progressForLessons(stateWith(['a']), COURSE, [])).toEqual({
      done: 0,
      total: 0,
      pct: 0,
    });
  });

  it('returns 0/n for an unknown course', () => {
    expect(progressForLessons({ byCourse: {} }, COURSE, ['a', 'b'])).toEqual({
      done: 0,
      total: 2,
      pct: 0,
    });
  });
});

describe('courseProgress', () => {
  it('uses the course-supplied total, not the set size', () => {
    expect(courseProgress(stateWith(['a', 'b']), COURSE, 365)).toEqual({
      done: 2,
      total: 365,
      pct: (2 / 365) * 100,
      remaining: 363,
    });
  });

  it('clamps remaining at zero when the user is somehow over-counted', () => {
    expect(
      courseProgress(stateWith(['a', 'b', 'c']), COURSE, 2).remaining,
    ).toBe(0);
  });
});
