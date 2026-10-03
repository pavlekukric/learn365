import { describe, expect, it } from 'vitest';

import { bandWeightPercents, markerPositionPercent, timelineFillPercent } from './timelineMath.js';

const eras = [
  { id: 'a', yearStart: 0, yearEnd: 100 },
  { id: 'b', yearStart: 100, yearEnd: 200 },
  { id: 'c', yearStart: 200, yearEnd: 300 },
  { id: 'd', yearStart: 300, yearEnd: 400 },
];

describe('markerPositionPercent', () => {
  it('returns 0 when the eras list is empty', () => {
    expect(markerPositionPercent([], 'a', 50)).toBe(0);
  });

  it('returns 0 when the era is unknown', () => {
    expect(markerPositionPercent(eras, 'missing', 50)).toBe(0);
  });

  it('positions the marker at the start of an era when year === yearStart', () => {
    expect(markerPositionPercent(eras, 'a', 0)).toBeCloseTo(0);
    expect(markerPositionPercent(eras, 'b', 100)).toBeCloseTo(25);
    expect(markerPositionPercent(eras, 'd', 300)).toBeCloseTo(75);
  });

  it('positions the marker mid-era when year is half-way', () => {
    expect(markerPositionPercent(eras, 'a', 50)).toBeCloseTo(12.5);
    expect(markerPositionPercent(eras, 'c', 250)).toBeCloseTo(62.5);
  });

  it('clamps to the start when year < yearStart', () => {
    expect(markerPositionPercent(eras, 'b', 50)).toBeCloseTo(25);
  });

  it('clamps to the end when year > yearEnd', () => {
    expect(markerPositionPercent(eras, 'b', 999)).toBeCloseTo(50);
  });

  it('handles a zero-width era without dividing by zero', () => {
    const degenerate = [{ id: 'x', yearStart: 100, yearEnd: 100 }];
    expect(markerPositionPercent(degenerate, 'x', 100)).toBeCloseTo(0);
  });

  it('uses weights to make bands proportional when supplied', () => {
    // Weights 1/1/1/1 collapse to the equal-width result.
    expect(markerPositionPercent(eras, 'c', 200, [1, 1, 1, 1])).toBeCloseTo(50);
    // Weights 10/30/10/50 → band c starts after 10+30 = 40% of 100 weight.
    expect(markerPositionPercent(eras, 'c', 200, [10, 30, 10, 50])).toBeCloseTo(40);
    // Mid-era c (year 250) adds half of c's 10% band.
    expect(markerPositionPercent(eras, 'c', 250, [10, 30, 10, 50])).toBeCloseTo(45);
  });

  it('ignores a weights array whose length does not match the eras', () => {
    expect(markerPositionPercent(eras, 'b', 100, [1, 2])).toBeCloseTo(25);
  });
});

describe('bandWeightPercents', () => {
  it('returns an empty array for empty input', () => {
    expect(bandWeightPercents([])).toEqual([]);
  });

  it('normalizes weights to percentages that sum to 100', () => {
    const result = bandWeightPercents([10, 30, 10]);
    expect(result).toEqual([20, 60, 20]);
    expect(result.reduce((a, b) => a + b, 0)).toBeCloseTo(100);
  });

  it('falls back to equal shares when every weight is zero or invalid', () => {
    expect(bandWeightPercents([0, 0])).toEqual([50, 50]);
    expect(bandWeightPercents([Number.NaN, -1])).toEqual([50, 50]);
  });
});

describe('timelineFillPercent', () => {
  it('returns 0 when there are no lessons', () => {
    expect(timelineFillPercent([])).toBe(0);
    expect(timelineFillPercent([{ lessonCount: 0, completedCount: 0 }])).toBe(0);
  });

  it('is the completed fraction of all lessons', () => {
    expect(
      timelineFillPercent([
        { lessonCount: 30, completedCount: 30 },
        { lessonCount: 70, completedCount: 0 },
      ]),
    ).toBeCloseTo(30);
  });

  it('clamps per-era completed counts to the lesson count', () => {
    expect(timelineFillPercent([{ lessonCount: 10, completedCount: 999 }])).toBeCloseTo(100);
  });
});
