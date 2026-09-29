import { describe, expect, it } from 'vitest';

import { formatAccountDate, formatLastActivity } from './accountDates';

describe('formatAccountDate', () => {
  it('spells the date in Serbian', () => {
    expect(formatAccountDate(new Date('2026-09-27T10:00:00.000Z'))).toBe('27. sep 2026.');
    expect(formatAccountDate(new Date('2026-05-03T10:00:00.000Z'))).toBe('3. maj 2026.');
    expect(formatAccountDate(new Date('2026-08-15T10:00:00.000Z'))).toBe('15. avg 2026.');
  });

  it('uses the Belgrade calendar day, not the UTC one', () => {
    // 22:30 UTC on the 27th is 00:30 on the 28th in Belgrade (UTC+2 in September).
    expect(formatAccountDate(new Date('2026-09-27T22:30:00.000Z'))).toBe('28. sep 2026.');
  });
});

describe('formatLastActivity', () => {
  const now = new Date('2026-09-29T12:00:00.000Z');

  it('names today and yesterday', () => {
    expect(formatLastActivity(new Date('2026-09-29T06:00:00.000Z'), now)).toBe('danas');
    expect(formatLastActivity(new Date('2026-09-28T20:00:00.000Z'), now)).toBe('juče');
  });

  it('counts calendar days within a week', () => {
    expect(formatLastActivity(new Date('2026-09-26T23:00:00.000Z'), now)).toBe('pre 2 dana');
    expect(formatLastActivity(new Date('2026-09-23T12:00:00.000Z'), now)).toBe('pre 6 dana');
  });

  it('falls back to the date after a week', () => {
    expect(formatLastActivity(new Date('2026-09-22T12:00:00.000Z'), now)).toBe('22. sep 2026.');
  });

  it('never reports the future', () => {
    expect(formatLastActivity(new Date('2026-09-30T12:00:00.000Z'), now)).toBe('danas');
  });
});
