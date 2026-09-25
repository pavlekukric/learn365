import { describe, expect, it } from 'vitest';

import type { Lesson } from '@learn365/content/types';

import {
  findActiveLocation,
  findResumeLesson,
  findNextLesson,
  findPrevLesson,
  lessonViewState,
} from './index.js';

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

function l(id: string, dayNumber: number, sectionId: string, eraId: string): Lesson {
  return {
    id,
    courseId: 'istorija-srbije-365',
    sectionId,
    eraId,
    dayNumber,
    title: `Lesson ${id}`,
    readingTimeMinutes: 8,
    year: 2026,
    content: [{ type: 'paragraph', text: '…' }],
    order: dayNumber,
  };
}

describe('findActiveLocation', () => {
  const courseLessons: readonly Lesson[] = [
    l('a', 1, 's1', 'e1'),
    l('b', 2, 's1', 'e1'),
    l('c', 3, 's2', 'e1'),
    l('d', 4, 's3', 'e2'),
  ];

  it('returns null on an empty lesson list', () => {
    expect(findActiveLocation([], null, null)).toBeNull();
  });

  it('uses lastOpenedLessonId when it points to a real lesson', () => {
    expect(findActiveLocation(courseLessons, new Set(['a']), 'c')).toEqual({
      lessonId: 'c',
      sectionId: 's2',
      eraId: 'e1',
    });
  });

  it('falls back to first incomplete when lastOpened is stale', () => {
    expect(findActiveLocation(courseLessons, new Set(['a', 'b']), 'zzz')).toEqual({
      lessonId: 'c',
      sectionId: 's2',
      eraId: 'e1',
    });
  });

  it('falls back to first incomplete when there is no lastOpened', () => {
    expect(findActiveLocation(courseLessons, new Set(['a']), null)).toEqual({
      lessonId: 'b',
      sectionId: 's1',
      eraId: 'e1',
    });
  });

  it('falls back to the first lesson when nothing is completed and lastOpened is null', () => {
    expect(findActiveLocation(courseLessons, null, null)).toEqual({
      lessonId: 'a',
      sectionId: 's1',
      eraId: 'e1',
    });
  });

  it('falls back to the first lesson when everything is complete', () => {
    expect(findActiveLocation(courseLessons, new Set(['a', 'b', 'c', 'd']), null)).toEqual({
      lessonId: 'a',
      sectionId: 's1',
      eraId: 'e1',
    });
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
    expect(lessonViewState({ isCompleted: false, isActive: false })).toBe('not_started');
  });
});

describe('findResumeLesson', () => {
  const courseLessons: readonly Lesson[] = [
    l('a', 1, 's1', 'e1'),
    l('b', 2, 's1', 'e1'),
    l('c', 3, 's2', 'e1'),
    l('d', 4, 's3', 'e2'),
  ];

  it('returns the first lesson on a fresh state', () => {
    expect(findResumeLesson(courseLessons, null, null)?.id).toBe('a');
  });

  it('returns lastOpened when the reader left it unfinished', () => {
    expect(findResumeLesson(courseLessons, new Set(['a']), 'c')?.id).toBe('c');
  });

  it('never returns a completed lastOpened — moves on to the next unread day', () => {
    expect(findResumeLesson(courseLessons, new Set(['a']), 'a')?.id).toBe('b');
  });

  it('falls back to the first unread lesson when lastOpened is stale', () => {
    expect(findResumeLesson(courseLessons, new Set(['a', 'b']), 'zzz')?.id).toBe('c');
  });

  it('fills the earliest gap when lessons were completed out of order', () => {
    expect(findResumeLesson(courseLessons, new Set(['a', 'c']), 'c')?.id).toBe('b');
  });

  it('returns null when everything is completed', () => {
    expect(findResumeLesson(courseLessons, new Set(['a', 'b', 'c', 'd']), 'd')).toBeNull();
  });
});
