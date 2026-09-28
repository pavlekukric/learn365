import { describe, expect, it } from 'vitest';

import type { LessonBlock } from '../types.js';

import {
  WORDS_PER_MINUTE,
  countWords,
  estimateReadingMinutes,
  medianReadingMinutes,
} from './readingTime.js';

function paragraphOf(words: number): LessonBlock {
  return { type: 'paragraph', text: Array.from({ length: words }, (_, i) => `reč${String(i)}`).join(' ') };
}

describe('countWords', () => {
  it('counts tokens across paragraph, heading and quote blocks', () => {
    const blocks: readonly LessonBlock[] = [
      { type: 'paragraph', dropcap: true, text: 'U Đerdapskoj klisuri, tamo gde Dunav protiče.' },
      { type: 'heading', level: 2, text: 'Kuće koje su menjale sliku' },
      { type: 'quote', text: 'Zakonom valja vladati', attribution: 'pripisano sv. Savi' },
    ];
    expect(countWords(blocks)).toBe(7 + 5 + 3);
  });

  it('ignores tokens without a letter or digit and any whitespace run', () => {
    expect(countWords([{ type: 'paragraph', text: 'reka — „vir” —  ime,\n\t1389.' }])).toBe(4);
  });

  it('does not count image alt or caption', () => {
    const blocks: readonly LessonBlock[] = [
      { type: 'image', src: '/x.webp', alt: 'jedna dva tri', width: 10, height: 10, caption: 'četiri pet' },
      { type: 'paragraph', text: 'šest' },
    ];
    expect(countWords(blocks)).toBe(1);
  });
});

describe('estimateReadingMinutes', () => {
  it('rounds up and never returns 0', () => {
    expect(WORDS_PER_MINUTE).toBe(150);
    expect(estimateReadingMinutes([{ type: 'paragraph', text: 'Lekcija se uskoro objavljuje.' }])).toBe(1);
    expect(estimateReadingMinutes([paragraphOf(150)])).toBe(1);
    expect(estimateReadingMinutes([paragraphOf(151)])).toBe(2);
  });

  it('maps the corpus extremes to the promised range', () => {
    expect(estimateReadingMinutes([paragraphOf(622)])).toBe(5); // Day 7, the shortest lesson
    expect(estimateReadingMinutes([paragraphOf(832)])).toBe(6); // the median lesson
    expect(estimateReadingMinutes([paragraphOf(1026)])).toBe(7); // Day 247, the longest lesson
  });
});

describe('medianReadingMinutes', () => {
  const of = (...minutes: number[]) => minutes.map((readingTimeMinutes) => ({ readingTimeMinutes }));

  it('returns the middle value for an odd count', () => {
    expect(medianReadingMinutes(of(7, 5, 6))).toBe(6);
  });

  it('returns the upper median for an even count', () => {
    expect(medianReadingMinutes(of(5, 6, 6, 7))).toBe(6);
    expect(medianReadingMinutes(of(5, 7))).toBe(7);
  });

  it('returns 0 for no lessons', () => {
    expect(medianReadingMinutes([])).toBe(0);
  });
});
