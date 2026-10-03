import { describe, expect, it } from 'vitest';

import { buildLessonTimelineScale, formatTickYear } from './lessonTimelineScale.js';

describe('buildLessonTimelineScale', () => {
  it('returns null for a non-finite year', () => {
    expect(buildLessonTimelineScale(Number.NaN)).toBeNull();
    expect(buildLessonTimelineScale(Number.POSITIVE_INFINITY)).toBeNull();
  });

  it('builds a century window for a medieval year, marker near centre', () => {
    const scale = buildLessonTimelineScale(1480);
    expect(scale).not.toBeNull();
    // Math.round(1480 / 100) === 15 -> start = 1500 - 200 = 1300.
    expect(scale?.ticks).toEqual([1300, 1400, 1500, 1600, 1700]);
    // (1480 - 1300) / 400 * 100 = 45.
    expect(scale?.markerPercent).toBeCloseTo(45);
  });

  it('uses a broad step for deep prehistory', () => {
    const scale = buildLessonTimelineScale(-9500);
    // magnitude >= 7000 -> step 2000; round(-9500/2000) = -5 -> start -14000.
    expect(scale?.ticks).toEqual([-14000, -12000, -10000, -8000, -6000]);
    expect(scale?.markerPercent).toBeCloseTo(56.25);
  });

  it('uses a 1000-year step for antiquity', () => {
    const scale = buildLessonTimelineScale(-5000);
    expect(scale?.ticks).toEqual([-7000, -6000, -5000, -4000, -3000]);
    expect(scale?.markerPercent).toBeCloseTo(50);
  });

  it('soft-caps the window so it never trails far past the present', () => {
    const scale = buildLessonTimelineScale(1989);
    // Centred start would be 1800; cap pulls the window back to end at 2100.
    expect(scale?.ticks).toEqual([1700, 1800, 1900, 2000, 2100]);
    expect(scale?.markerPercent).toBeGreaterThan(50);
    expect(scale?.markerPercent).toBeLessThanOrEqual(100);
  });

  it('keeps the marker percent within 0..100', () => {
    for (const year of [-9500, -300, 0, 1166, 1804, 1989, 2025]) {
      const pct = buildLessonTimelineScale(year)?.markerPercent ?? -1;
      expect(pct).toBeGreaterThanOrEqual(0);
      expect(pct).toBeLessThanOrEqual(100);
    }
  });
});

describe('formatTickYear', () => {
  it('renders CE years bare', () => {
    expect(formatTickYear(1400)).toBe('1400');
    expect(formatTickYear(0)).toBe('0');
  });

  it('renders BCE years with a Serbian suffix', () => {
    expect(formatTickYear(-6000)).toBe('6000 p. n. e.');
  });
});
