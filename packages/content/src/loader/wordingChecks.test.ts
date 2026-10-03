import { describe, expect, it } from 'vitest';

import type { Lesson } from '../types.js';

import { MAX_SUMMARY_LENGTH, lessonWordingProblems } from './wordingChecks.js';

function lesson(overrides: Partial<Lesson> = {}): Lesson {
  return {
    id: 'day-248',
    courseId: 'istorija-srbije-365',
    sectionId: 'nezavisnost',
    eraId: 'knezevina-i-kraljevina',
    dayNumber: 248,
    order: 1,
    title: 'Rusko-turski rat i Srbija',
    readingTimeMinutes: 6,
    year: 1877,
    dateLabel: '1877–1878.',
    summary: 'Srbija ulazi u drugi rat i oslobađa Niš, Pirot i Vranje.',
    keyPeople: ['Kosta Protić'],
    keyPlaces: ['Niš'],
    content: [
      { type: 'paragraph', dropcap: true, text: 'Krajem januara 1878. Pravac je „jasan”.' },
    ],
    ...overrides,
  };
}

const paragraph = (text: string): Lesson['content'] => [{ type: 'paragraph', dropcap: true, text }];

describe('lessonWordingProblems', () => {
  it('passes a clean lesson', () => {
    expect(lessonWordingProblems(lesson())).toEqual([]);
  });

  it('flags the English opening quote used as a closer', () => {
    const problems = lessonWordingProblems(lesson({ content: paragraph('Ostao je „knez“.') }));
    expect(problems).toEqual([expect.stringContaining('content[0].text uses “')]);
  });

  it('flags ASCII double quotes, also in keyPlaces', () => {
    const problems = lessonWordingProblems(lesson({ keyPlaces: ['"Moskva"'] }));
    expect(problems).toEqual([expect.stringContaining('keyPlaces[0] uses an ASCII')]);
  });

  it('flags a missing space after a number’s period', () => {
    const problems = lessonWordingProblems(lesson({ content: paragraph('januara 1878.Pravac') }));
    expect(problems).toEqual([expect.stringContaining('number-period-letter')]);
  });

  it('flags Turkish letters anywhere in the display strings', () => {
    const problems = lessonWordingProblems(
      lesson({ keyPeople: ['Pazvantoğlu'], title: 'Nizam-ı Cedid' }),
    );
    expect(problems).toHaveLength(2);
  });

  it('caps the summary at the share-preview length', () => {
    expect(lessonWordingProblems(lesson({ summary: 'a'.repeat(MAX_SUMMARY_LENGTH) }))).toEqual([]);
    expect(lessonWordingProblems(lesson({ summary: 'a'.repeat(MAX_SUMMARY_LENGTH + 1) }))).toEqual([
      expect.stringContaining('summary length 161'),
    ]);
  });

  it('requires a dateLabel to carry a date', () => {
    expect(lessonWordingProblems(lesson({ dateLabel: 'pregled' }))).toEqual([
      expect.stringContaining('dateLabel "pregled"'),
    ]);
    expect(lessonWordingProblems(lesson({ dateLabel: '18. vek' }))).toEqual([]);
  });

  it('checks image alt and caption, not only text blocks', () => {
    const content: Lesson['content'] = [
      { type: 'paragraph', dropcap: true, text: 'Uvod.' },
      { type: 'image', src: '/x.webp', alt: 'Vir', width: 10, height: 10, caption: '„Vir“' },
    ];
    expect(lessonWordingProblems(lesson({ content }))).toEqual([
      expect.stringContaining('content[1].caption'),
    ]);
  });
});
