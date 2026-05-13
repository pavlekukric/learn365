import { describe, expect, it } from 'vitest';

import { clamp01, toPercentInt } from './progressMath.js';

describe('clamp01', () => {
  it('passes values in [0, 1] through unchanged', () => {
    expect(clamp01(0)).toBe(0);
    expect(clamp01(0.42)).toBe(0.42);
    expect(clamp01(1)).toBe(1);
  });

  it('clamps values below 0 to 0', () => {
    expect(clamp01(-0.5)).toBe(0);
    expect(clamp01(Number.NEGATIVE_INFINITY)).toBe(0);
  });

  it('clamps values above 1 to 1', () => {
    expect(clamp01(1.5)).toBe(1);
    expect(clamp01(Number.POSITIVE_INFINITY)).toBe(1);
  });

  it('treats NaN as 0', () => {
    expect(clamp01(Number.NaN)).toBe(0);
  });
});

describe('toPercentInt', () => {
  it('rounds to the nearest integer percent', () => {
    expect(toPercentInt(0)).toBe(0);
    expect(toPercentInt(0.005)).toBe(1);
    expect(toPercentInt(0.5)).toBe(50);
    expect(toPercentInt(0.999)).toBe(100);
    expect(toPercentInt(1)).toBe(100);
  });

  it('clamps out-of-range inputs', () => {
    expect(toPercentInt(-1)).toBe(0);
    expect(toPercentInt(2)).toBe(100);
    expect(toPercentInt(Number.NaN)).toBe(0);
  });
});
