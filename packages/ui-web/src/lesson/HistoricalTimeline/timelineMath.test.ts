import { describe, expect, it } from 'vitest';

import { markerPositionPercent } from './timelineMath.js';

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
});
