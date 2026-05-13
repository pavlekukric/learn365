import { describe, expect, it } from 'vitest';

import type { Lesson } from '@learn365/content/types';

import { findNextLesson, findPrevLesson, lessonViewState } from './index.js';

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

const lessons: readonly Lesson[] = [
  lesson('a', 1),
  lesson('b', 2),
  lesson('c', 3),
];

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

describe('lessonViewState', () => {
  it('completed beats active', () => {
    expect(lessonViewState({ isCompleted: true, isActive: true })).toBe('completed');
  });

  it('active when not completed', () => {
    expect(lessonViewState({ isCompleted: false, isActive: true })).toBe('active');
  });

  it('not_started by default', () => {
    expect(lessonViewState({ isCompleted: false, isActive: false })).toBe(
      'not_started',
    );
  });
});
