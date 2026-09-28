import { describe, expect, it } from 'vitest';

import {
  MIN_BAND_SHARE,
  bandWeightPercents,
  flooredWeights,
  markerPositionPercent,
  timelineFillPercent,
} from './timelineMath.js';

// Istorija Srbije 365: lessons per era, I → VIII.
const LESSONS = [45, 60, 45, 45, 35, 50, 60, 25];

describe('flooredWeights (Phase 13)', () => {
  it('raises only the eras below the minimum share', () => {
    const floored = flooredWeights(LESSONS);
    const floor = 365 * MIN_BAND_SHARE; // 32.85
    expect(floored.slice(0, 7)).toEqual(LESSONS.slice(0, 7));
    expect(floored[7]).toBeCloseTo(floor);
    expect(MIN_BAND_SHARE).toBe(0.09);
  });

  it('leaves a list alone when every share is above the floor', () => {
    expect(flooredWeights([10, 10, 10, 10])).toEqual([10, 10, 10, 10]);
  });

  it('treats bad weights as 0 and floors them like any other', () => {
    expect(flooredWeights([0, 100])).toEqual([9, 100]);
    expect(flooredWeights([Number.NaN, 100], 0.1)).toEqual([10, 100]);
    expect(flooredWeights([0, 0])).toEqual([0, 0]);
    expect(flooredWeights([])).toEqual([]);
  });

  it('keeps the bands, the marker and the fill on the same scale', () => {
    const eras = [
      { id: 'vii', yearStart: 1912, yearEnd: 1991 },
      { id: 'viii', yearStart: 1991, yearEnd: 2030 },
    ];
    // Floor = 85 × 0.085 = 7.2, so nothing is raised here; the point is that
    // whatever the weights are, all three consumers read the same scale.
    const weights = flooredWeights([60, 25]);
    const [pctVii] = bandWeightPercents(weights);
    // The marker at the very end of era VII sits exactly on the band boundary.
    expect(markerPositionPercent(eras, 'vii', 1991, weights)).toBeCloseTo(pctVii ?? 0);
    // Era VII fully read: the fill ends on the same boundary.
    expect(
      timelineFillPercent(
        [
          { lessonCount: 60, completedCount: 60 },
          { lessonCount: 25, completedCount: 0 },
        ],
        weights,
      ),
    ).toBeCloseTo(pctVii ?? 0);
  });
});

describe('timelineFillPercent with weights (Phase 13)', () => {
  it('equals the old total-over-total formula when the weights are the lesson counts', () => {
    const stats = [
      { lessonCount: 4, completedCount: 4 },
      { lessonCount: 6, completedCount: 0 },
    ];
    expect(timelineFillPercent(stats)).toBeCloseTo(40);
    expect(timelineFillPercent(stats, [4, 6])).toBeCloseTo(40);
  });

  it('weights each era by its band, not by its lesson count', () => {
    const stats = [
      { lessonCount: 10, completedCount: 10 },
      { lessonCount: 10, completedCount: 0 },
    ];
    expect(timelineFillPercent(stats, [10, 10])).toBeCloseTo(50);
    expect(timelineFillPercent(stats, [10, 30])).toBeCloseTo(25);
  });

  it('ignores a mismatched weights list and still clamps over-counts', () => {
    const stats = [
      { lessonCount: 10, completedCount: 12 },
      { lessonCount: 10, completedCount: 0 },
    ];
    expect(timelineFillPercent(stats, [1, 2, 3])).toBeCloseTo(50);
    expect(timelineFillPercent([], [])).toBe(0);
  });
});
