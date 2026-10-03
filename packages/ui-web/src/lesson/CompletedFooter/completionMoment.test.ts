import { describe, expect, it } from 'vitest';

import { completionAnnouncement, completionMoment, formatLessonCount } from './completionMoment.js';

const TOTAL = 365;

describe('completionMoment', () => {
  it('says "Prvi dan" only for Day 1', () => {
    expect(
      completionMoment({
        dayNumber: 1,
        isLastLesson: false,
        completedCount: 1,
        totalLessons: TOTAL,
      }),
    ).toEqual({ kind: 'day', line: 'Prvi dan je iza tebe.' });
  });

  it('a first completion on another day names that day, not "Prvi dan"', () => {
    expect(
      completionMoment({
        dayNumber: 200,
        isLastLesson: false,
        completedCount: 1,
        totalLessons: TOTAL,
      }),
    ).toEqual({ kind: 'day', line: 'Dan 200 je iza tebe.' });
  });

  it('Day 1 read again later in the course still says "Prvi dan"', () => {
    expect(
      completionMoment({
        dayNumber: 1,
        isLastLesson: false,
        completedCount: 40,
        totalLessons: TOTAL,
      }),
    ).toEqual({ kind: 'day', line: 'Prvi dan je iza tebe.' });
  });

  it('the last lesson read with the course unfinished says how many remain', () => {
    expect(
      completionMoment({
        dayNumber: 365,
        isLastLesson: true,
        completedCount: 1,
        totalLessons: TOTAL,
      }),
    ).toEqual({
      kind: 'lastDay',
      line: 'Poslednja lekcija kursa je iza tebe.',
      remaining: 'Do kraja kursa: još 364 lekcije',
    });
  });

  it('365 / 365 on the last day is the finish moment', () => {
    expect(
      completionMoment({
        dayNumber: 365,
        isLastLesson: true,
        completedCount: 365,
        totalLessons: TOTAL,
      }),
    ).toEqual({
      kind: 'finished',
      heading: 'Kurs je završen.',
      line: 'Svih 365 dana je iza tebe.',
    });
  });

  it('365 / 365 on any other day keeps the day copy (and so the next card), with a quiet note', () => {
    expect(
      completionMoment({
        dayNumber: 120,
        isLastLesson: false,
        completedCount: 365,
        totalLessons: TOTAL,
      }),
    ).toEqual({ kind: 'day', line: 'Dan 120 je iza tebe.', note: 'Kurs je završen' });
    expect(
      completionMoment({
        dayNumber: 1,
        isLastLesson: false,
        completedCount: 365,
        totalLessons: TOTAL,
      }),
    ).toEqual({ kind: 'day', line: 'Prvi dan je iza tebe.', note: 'Kurs je završen' });
  });
});

describe('completionAnnouncement', () => {
  const say = (dayNumber: number, isLastLesson: boolean, completedCount: number) =>
    completionAnnouncement(
      completionMoment({ dayNumber, isLastLesson, completedCount, totalLessons: TOTAL }),
      completedCount,
      TOTAL,
    );

  it('speaks the moment line and the count', () => {
    expect(say(4, false, 4)).toBe('Dan 4 je iza tebe. Pročitano 4 od 365.');
  });

  it('adds the remaining count on the last day and the finish when done', () => {
    expect(say(365, true, 1)).toBe(
      'Poslednja lekcija kursa je iza tebe. Do kraja kursa: još 364 lekcije. Pročitano 1 od 365.',
    );
    expect(say(365, true, 365)).toBe(
      'Kurs je završen. Svih 365 dana je iza tebe. Pročitano 365 od 365.',
    );
    expect(say(200, false, 365)).toBe(
      'Dan 200 je iza tebe. Pročitano 365 od 365. Kurs je završen.',
    );
  });
});

describe('formatLessonCount', () => {
  it('follows the Serbian count forms', () => {
    expect(formatLessonCount(1)).toBe('1 lekcija');
    expect(formatLessonCount(2)).toBe('2 lekcije');
    expect(formatLessonCount(4)).toBe('4 lekcije');
    expect(formatLessonCount(5)).toBe('5 lekcija');
    expect(formatLessonCount(12)).toBe('12 lekcija');
    expect(formatLessonCount(21)).toBe('21 lekcija');
    expect(formatLessonCount(364)).toBe('364 lekcije');
  });
});
