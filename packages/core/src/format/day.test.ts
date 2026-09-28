import { describe, expect, it } from 'vitest';

import {
  formatDayEyebrow,
  formatDayProse,
  formatDayRange,
  formatJourneyDay,
  padDay,
} from './day.js';

describe('day formatters', () => {
  it('pads the numeral to three digits', () => {
    expect(padDay(1)).toBe('001');
    expect(padDay(46)).toBe('046');
    expect(padDay(365)).toBe('365');
  });

  it('eyebrow register is "DAN nnn"', () => {
    expect(formatDayEyebrow(2)).toBe('DAN 002');
    expect(formatDayEyebrow(365)).toBe('DAN 365');
  });

  it('range register shares the eyebrow prefix once', () => {
    expect(formatDayRange(1, 5)).toBe('DAN 001–005');
    expect(formatDayRange(341, 365)).toBe('DAN 341–365');
  });

  it('prose register is unpadded', () => {
    expect(formatDayProse(1)).toBe('Dan 1');
    expect(formatDayProse(200)).toBe('Dan 200');
  });

  it('journey day is an ordinal sentence fragment', () => {
    expect(formatJourneyDay(2)).toBe('Tvoj 2. dan');
    expect(formatJourneyDay(365)).toBe('Tvoj 365. dan');
  });
});
