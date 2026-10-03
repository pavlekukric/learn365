import { describe, expect, it } from 'vitest';

import { EPOCH_ISO, compareTimestamps, diffSets, laterTimestamp, unionIds } from './index.js';

describe('compareTimestamps / laterTimestamp', () => {
  it('orders ISO timestamps and treats garbage as earliest', () => {
    expect(compareTimestamps('2026-01-01T00:00:00.000Z', '2026-01-02T00:00:00.000Z')).toBeLessThan(
      0,
    );
    expect(
      compareTimestamps('2026-01-02T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
    ).toBeGreaterThan(0);
    expect(compareTimestamps('2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')).toBe(0);
    expect(compareTimestamps('nope', EPOCH_ISO)).toBeLessThan(0);
    expect(compareTimestamps('nope', 'also nope')).toBe(0);
    expect(laterTimestamp('2026-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z')).toBe(
      '2026-01-01T00:00:00.000Z',
    );
    // Ties keep the first argument.
    expect(laterTimestamp('2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')).toBe(
      '2026-01-01T00:00:00.000Z',
    );
  });
});

describe('diffSets', () => {
  it('reports additions and removals, tolerating absent sides', () => {
    expect(diffSets(new Set(['a', 'b']), new Set(['b', 'c']))).toEqual({
      added: ['c'],
      removed: ['a'],
    });
    expect(diffSets(undefined, new Set(['x']))).toEqual({ added: ['x'], removed: [] });
    expect(diffSets(new Set(['x']), undefined)).toEqual({ added: [], removed: ['x'] });
    expect(diffSets(undefined, undefined)).toEqual({ added: [], removed: [] });
    expect(diffSets(new Set(['a']), new Set(['a']))).toEqual({ added: [], removed: [] });
  });
});

describe('unionIds', () => {
  it('keeps base order, appends new ids once', () => {
    expect(unionIds(['b', 'a'], ['a', 'c', 'c'])).toEqual(['b', 'a', 'c']);
    expect(unionIds([], [])).toEqual([]);
  });
});
