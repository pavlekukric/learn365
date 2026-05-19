import { describe, expect, it } from 'vitest';

import {
  bookmarkCount,
  bookmarkedLessonIds,
  isBookmarked,
} from './selectors.js';
import type { BookmarkState } from './types.js';

const COURSE = 'istorija-srbije-365';

function stateWith(ids: string[]): BookmarkState {
  return {
    byCourse: {
      [COURSE]: {
        lessonIds: new Set(ids),
        updatedAt: '2026-05-19T10:00:00.000Z',
      },
    },
  };
}

describe('isBookmarked', () => {
  it('returns true when the lesson id is in the set', () => {
    expect(isBookmarked(stateWith(['a']), COURSE, 'a')).toBe(true);
  });

  it('returns false when not present', () => {
    expect(isBookmarked(stateWith(['a']), COURSE, 'b')).toBe(false);
  });

  it('returns false when the course has no record', () => {
    expect(isBookmarked({ byCourse: {} }, COURSE, 'a')).toBe(false);
  });
});

describe('bookmarkCount', () => {
  it('counts the set size', () => {
    expect(bookmarkCount(stateWith(['a', 'b', 'c']), COURSE)).toBe(3);
  });

  it('returns 0 for an unknown course', () => {
    expect(bookmarkCount({ byCourse: {} }, COURSE)).toBe(0);
  });
});

describe('bookmarkedLessonIds', () => {
  it('returns ids in insertion order', () => {
    expect(bookmarkedLessonIds(stateWith(['c', 'a', 'b']), COURSE)).toEqual([
      'c',
      'a',
      'b',
    ]);
  });

  it('returns an empty array for an unknown course', () => {
    expect(bookmarkedLessonIds({ byCourse: {} }, COURSE)).toEqual([]);
  });

  it('returns a fresh array each call', () => {
    const state = stateWith(['a', 'b']);
    expect(bookmarkedLessonIds(state, COURSE)).not.toBe(
      bookmarkedLessonIds(state, COURSE),
    );
  });
});
