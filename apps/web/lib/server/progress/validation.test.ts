import { describe, expect, it } from 'vitest';

import {
  MAX_IDS,
  asRecord,
  parseCourseId,
  parseIsoTimestamp,
  parseLastOpened,
  parseLessonIds,
} from './validation';

const COURSE = 'istorija-srbije-365';

describe('progress validation', () => {
  it('accepts only known course ids', () => {
    expect(parseCourseId(COURSE)).toBe(COURSE);
    expect(parseCourseId('nope')).toBeNull();
    expect(parseCourseId(42)).toBeNull();
  });

  it('drops unknown lesson ids, collapses duplicates, rejects non-arrays and oversize lists', () => {
    expect(parseLessonIds(COURSE, undefined)).toEqual({ ids: [], dropped: 0 });
    expect(parseLessonIds(COURSE, ['day-001', 'day-001', 'day-999', 7])).toEqual({
      ids: ['day-001'],
      dropped: 2,
    });
    expect(parseLessonIds(COURSE, 'day-001')).toBeNull();
    expect(parseLessonIds(COURSE, new Array<string>(MAX_IDS + 1).fill('day-001'))).toBeNull();
  });

  it('distinguishes absent, cleared and set last-opened', () => {
    expect(parseLastOpened(COURSE, undefined)).toBeUndefined();
    expect(parseLastOpened(COURSE, null)).toBeNull();
    expect(parseLastOpened(COURSE, 'day-002')).toBe('day-002');
    expect(parseLastOpened(COURSE, 'day-999')).toBeUndefined();
  });

  it('normalises timestamps and guards records', () => {
    expect(parseIsoTimestamp('2026-09-27T10:00:00Z')).toBe('2026-09-27T10:00:00.000Z');
    expect(parseIsoTimestamp('yesterday')).toBeNull();
    expect(parseIsoTimestamp(1)).toBeNull();
    expect(asRecord({ a: 1 })).toEqual({ a: 1 });
    expect(asRecord([])).toBeNull();
    expect(asRecord(null)).toBeNull();
  });
});
