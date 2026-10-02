import { describe, expect, it } from 'vitest';

import type { Lesson } from '@learn365/content/types';

import { findResumeLesson, findNextLesson, findPrevLesson } from './index.js';

function lesson(id: string, dayNumber: number): Lesson {
  return {
    id,
    courseId: 'istorija-srbije-365',
    sectionId: 'demo',
    eraId: 'demo',
    dayNumber,
    title: `Lesson ${id}`,
    readingTimeMinutes: 8,
    year: 2026,
    content: [{ type: 'paragraph', text: '…' }],
    order: dayNumber,
  };
}

const lessons: readonly Lesson[] = [lesson('a', 1), lesson('b', 2), lesson('c', 3)];

describe('findPrevLesson', () => {
  it('returns the prior lesson', () => {
    expect(findPrevLesson(lessons, 'b')?.id).toBe('a');
  });

  it('returns null for the first lesson', () => {
    expect(findPrevLesson(lessons, 'a')).toBeNull();
  });

  it('returns null when the lesson is unknown', () => {
    expect(findPrevLesson(lessons, 'zzz')).toBeNull();
  });
});

describe('findNextLesson', () => {
  it('returns the next lesson', () => {
    expect(findNextLesson(lessons, 'b')?.id).toBe('c');
  });

  it('returns null for the last lesson', () => {
    expect(findNextLesson(lessons, 'c')).toBeNull();
  });

  it('returns null when the lesson is unknown', () => {
    expect(findNextLesson(lessons, 'zzz')).toBeNull();
  });
});

describe('findResumeLesson', () => {
  const small: readonly Lesson[] = [lesson('a', 1), lesson('b', 2), lesson('c', 3), lesson('d', 4)];

  // A course-sized list (day-001 … day-365) for the owner's scenarios.
  const course: readonly Lesson[] = Array.from({ length: 365 }, (_, i) =>
    lesson(`day-${String(i + 1).padStart(3, '0')}`, i + 1),
  );
  const days = (...nums: number[]) =>
    new Set(nums.map((n) => `day-${String(n).padStart(3, '0')}`));
  const range = (from: number, to: number) =>
    Array.from({ length: to - from + 1 }, (_, i) => from + i);

  it('returns Day 1 when nothing is completed', () => {
    expect(findResumeLesson(small, null)?.id).toBe('a');
    expect(findResumeLesson(small, new Set())?.id).toBe('a');
  });

  it('moves on to the next unread day after the last completed one', () => {
    expect(findResumeLesson(small, new Set(['a']))?.id).toBe('b');
  });

  it('read Days 1–3 (Day 250 merely opened) → Day 4', () => {
    // Opening a lesson is not an input any more: only completions count.
    expect(findResumeLesson(course, days(1, 2, 3))?.id).toBe('day-004');
  });

  it('read Days 1–3 and Day 365 → Day 4 (nothing unread after 365, earliest gap)', () => {
    expect(findResumeLesson(course, days(1, 2, 3, 365))?.id).toBe('day-004');
  });

  it('read only Days 231–235 → Day 236 (the frontier, not Day 1)', () => {
    expect(findResumeLesson(course, days(...range(231, 235)))?.id).toBe('day-236');
  });

  it('out of order {a, c} → d, the first unread after the highest completed', () => {
    expect(findResumeLesson(small, new Set(['a', 'c']))?.id).toBe('d');
  });

  it('skips completed lessons past the frontier gap', () => {
    // Highest completed is c; d is unread → d, even though b is a gap.
    expect(findResumeLesson(small, new Set(['c']))?.id).toBe('d');
  });

  it('ignores ids that are not in the course', () => {
    expect(findResumeLesson(small, new Set(['a', 'zzz']))?.id).toBe('b');
  });

  it('returns null when everything is completed', () => {
    expect(findResumeLesson(small, new Set(['a', 'b', 'c', 'd']))).toBeNull();
  });
});
