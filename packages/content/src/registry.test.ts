import { describe, expect, it } from 'vitest';

import {
  getAllCourseIds,
  getCourse,
  getEraForLesson,
  getEraForSection,
  getEras,
  getLessonById,
  getLessons,
  getLessonsByEra,
  getLessonsBySection,
  getNextLesson,
  getPrevLesson,
  getSectionForLesson,
  getSections,
  getSectionsByEra,
} from './registry.js';

const COURSE = 'istorija-srbije-365';

describe('registry: course shape', () => {
  it('lists the v1 course', () => {
    expect(getAllCourseIds()).toEqual([COURSE]);
  });

  it('returns the course record', () => {
    const c = getCourse(COURSE);
    expect(c?.id).toBe(COURSE);
    expect(c?.totalLessons).toBe(365);
    expect(c?.language).toBe('sr');
  });

  it('returns null for an unknown course', () => {
    expect(getCourse('nepostojeci-kurs')).toBeNull();
  });

  it('exposes 8 eras', () => {
    expect(getEras(COURSE)).toHaveLength(8);
  });

  it('exposes 28 sections', () => {
    expect(getSections(COURSE)).toHaveLength(28);
  });

  it('exposes 365 lessons', () => {
    expect(getLessons(COURSE)).toHaveLength(365);
  });
});

describe('registry: lookups', () => {
  it('finds a lesson by id', () => {
    const lesson = getLessonById(COURSE, 'praistorija-i-antika-001');
    expect(lesson?.title).toBe('Lepenski Vir');
    expect(lesson?.dayNumber).toBe(1);
  });

  it('returns null for an unknown lesson id', () => {
    expect(getLessonById(COURSE, 'ne-postoji')).toBeNull();
  });

  it('section → lessons (15 for `rani-nemanjici`)', () => {
    const lessons = getLessonsBySection(COURSE, 'rani-nemanjici');
    expect(lessons).toHaveLength(15);
    expect(lessons[0]?.dayNumber).toBe(31);
    expect(lessons.at(-1)?.dayNumber).toBe(45);
  });

  it('era → lessons (75 for `nemanjici`)', () => {
    expect(getLessonsByEra(COURSE, 'nemanjici')).toHaveLength(75);
  });

  it('era → sections (5 for `nemanjici`)', () => {
    expect(getSectionsByEra(COURSE, 'nemanjici')).toHaveLength(5);
  });

  it('lesson → era', () => {
    expect(getEraForLesson(COURSE, 'rani-nemanjici-001')?.id).toBe('nemanjici');
  });

  it('lesson → section', () => {
    expect(getSectionForLesson(COURSE, 'rani-nemanjici-001')?.id).toBe(
      'rani-nemanjici',
    );
  });

  it('section → era', () => {
    expect(getEraForSection(COURSE, 'dusanovo-carstvo')?.id).toBe('nemanjici');
  });
});

describe('registry: navigation', () => {
  it('prev of day 1 is null', () => {
    expect(getPrevLesson(COURSE, 'praistorija-i-antika-001')).toBeNull();
  });

  it('next of day 1 is day 2', () => {
    const next = getNextLesson(COURSE, 'praistorija-i-antika-001');
    expect(next?.dayNumber).toBe(2);
  });

  it('next of day 365 is null', () => {
    const last = getLessons(COURSE).at(-1);
    expect(last?.dayNumber).toBe(365);
    if (!last) return;
    expect(getNextLesson(COURSE, last.id)).toBeNull();
  });

  it('prev/next form a consistent chain across era boundaries', () => {
    // last lesson of era II (day 105) → first lesson of era III (day 106)
    const last = getLessons(COURSE).find((l) => l.dayNumber === 105);
    const first = getLessons(COURSE).find((l) => l.dayNumber === 106);
    expect(last).toBeDefined();
    expect(first).toBeDefined();
    if (!last || !first) return;
    expect(getNextLesson(COURSE, last.id)?.id).toBe(first.id);
    expect(getPrevLesson(COURSE, first.id)?.id).toBe(last.id);
  });
});
