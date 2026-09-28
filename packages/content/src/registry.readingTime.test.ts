import { describe, expect, it } from 'vitest';

import { getCourse, getLessons, getReadingTimeRange } from './registry.js';

const COURSE = 'istorija-srbije-365';

describe('registry: reading time (derived, Phase 11)', () => {
  it('the range is the min–max of the authored lessons and sits inside the validator band', () => {
    const range = getReadingTimeRange(COURSE);
    expect(range).not.toBeNull();
    const minutes = getLessons(COURSE)
      .filter((l) => l.isPlaceholder !== true)
      .map((l) => l.readingTimeMinutes);
    expect(range?.min).toBe(Math.min(...minutes));
    expect(range?.max).toBe(Math.max(...minutes));
    expect(range?.min).toBeGreaterThanOrEqual(4);
    expect(range?.max).toBeLessThanOrEqual(15);
    expect(range?.max).toBeGreaterThanOrEqual(range?.min ?? 0);
  });

  it('the course-level estimate is the median of the lesson minutes', () => {
    const sorted = getLessons(COURSE)
      .map((l) => l.readingTimeMinutes)
      .sort((a, b) => a - b);
    expect(getCourse(COURSE)?.estimatedMinutesPerLesson).toBe(sorted[Math.floor(sorted.length / 2)]);
  });

  it('returns null for an unknown course', () => {
    expect(getReadingTimeRange('nepostojeci-kurs')).toBeNull();
  });
});
