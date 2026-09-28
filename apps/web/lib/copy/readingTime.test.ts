import { getLessons } from '@learn365/content';
import { describe, expect, it } from 'vitest';

import { READING_TIME_LABEL, formatReadingTimeRange, readingTimeLabel } from './readingTime';

describe('formatReadingTimeRange', () => {
  it('formats a range with an en dash and the plural', () => {
    expect(formatReadingTimeRange({ min: 5, max: 7 })).toBe('5–7 minuta');
  });

  it('collapses an equal range to one number with the right count word', () => {
    expect(formatReadingTimeRange({ min: 6, max: 6 })).toBe('6 minuta');
    expect(formatReadingTimeRange({ min: 1, max: 1 })).toBe('1 minut');
    expect(formatReadingTimeRange({ min: 21, max: 21 })).toBe('21 minut');
    expect(formatReadingTimeRange({ min: 11, max: 11 })).toBe('11 minuta');
  });
});

describe('READING_TIME_LABEL', () => {
  it('is the min–max of the derived lesson minutes of the default course', () => {
    const minutes = getLessons('istorija-srbije-365').map((l) => l.readingTimeMinutes);
    const min = Math.min(...minutes);
    const max = Math.max(...minutes);
    expect(READING_TIME_LABEL).toBe(`${String(min)}–${String(max)} minuta`);
    expect(readingTimeLabel()).toBe(READING_TIME_LABEL);
  });

  it('throws for a course without lessons', () => {
    expect(() => readingTimeLabel('nepostojeci-kurs')).toThrow(/no authored lesson/);
  });
});
