import { describe, expect, it } from 'vitest';

import { articles } from './courses/istorija-srbije-365/articles.js';
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
import { getLessonArticle } from './server.js';
import { LESSON_ARTICLE_KEYS } from './types.js';

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

  it('exposes 365 lessons', () => {
    expect(getLessons(COURSE)).toHaveLength(365);
  });

  it('every section sits inside an era', () => {
    const sections = getSections(COURSE);
    expect(sections.length).toBeGreaterThan(0);
    const eraIds = new Set(getEras(COURSE).map((e) => e.id));
    for (const s of sections) expect(eraIds.has(s.eraId)).toBe(true);
  });
});

describe('registry: lookups', () => {
  it('finds the day-001 lesson by id', () => {
    const lesson = getLessonById(COURSE, 'day-001');
    expect(lesson).not.toBeNull();
    expect(lesson?.dayNumber).toBe(1);
  });

  it('returns null for an unknown lesson id', () => {
    expect(getLessonById(COURSE, 'ne-postoji')).toBeNull();
  });

  it('section → lessons covers the section day range exactly', () => {
    const section = getSections(COURSE)[0];
    if (!section) throw new Error('expected at least one section');
    const lessons = getLessonsBySection(COURSE, section.id);
    const expectedCount = section.endDay - section.startDay + 1;
    expect(lessons).toHaveLength(expectedCount);
    expect(lessons[0]?.dayNumber).toBe(section.startDay);
    expect(lessons.at(-1)?.dayNumber).toBe(section.endDay);
  });

  it('era → lessons sums to its section ranges', () => {
    // nemanjici is era II; its lesson count equals the sum of its
    // sections' day spans, whatever the editorial structure looks like.
    const sections = getSectionsByEra(COURSE, 'nemanjici');
    expect(sections.length).toBeGreaterThan(0);
    const expected = sections.reduce((n, s) => n + (s.endDay - s.startDay + 1), 0);
    expect(getLessonsByEra(COURSE, 'nemanjici')).toHaveLength(expected);
  });

  it('lesson → era resolves', () => {
    const lesson = getLessonById(COURSE, 'day-046');
    expect(lesson).not.toBeNull();
    expect(getEraForLesson(COURSE, 'day-046')?.id).toBe(lesson?.eraId);
  });

  it('lesson → section resolves', () => {
    const lesson = getLessonById(COURSE, 'day-046');
    expect(lesson).not.toBeNull();
    expect(getSectionForLesson(COURSE, 'day-046')?.id).toBe(lesson?.sectionId);
  });

  it('section → era resolves', () => {
    const section = getSections(COURSE).find((s) => s.eraId === 'nemanjici');
    expect(section).toBeDefined();
    if (!section) return;
    expect(getEraForSection(COURSE, section.id)?.id).toBe('nemanjici');
  });
});

describe('registry: authored seeds', () => {
  // Source of truth: every JSON lesson file under
  // `content/courses/istorija-srbije-365/lessons/` whose `isPlaceholder`
  // is not `true`. Keep this list in sync when seed lessons are added.
  const SEED_IDS = ['day-001', 'day-002', 'day-007', 'day-031', 'day-365'];

  it.each(SEED_IDS)('%s is authored (not a stub)', (id) => {
    const lesson = getLessonById(COURSE, id);
    const article = getLessonArticle(COURSE, id);
    expect(lesson).not.toBeNull();
    expect(article).not.toBeNull();
    expect(lesson?.isPlaceholder).not.toBe(true);
    expect(article?.content.length).toBeGreaterThan(1);
    const firstBlock = article?.content[0];
    expect(firstBlock?.type).toBe('paragraph');
    if (firstBlock?.type === 'paragraph') {
      expect(firstBlock.dropcap).toBe(true);
      expect(firstBlock.text).not.toContain('Lekcija se uskoro objavljuje');
    }
  });
});

describe('registry: summary / article split', () => {
  it('every summary has an article and every article a summary', () => {
    const lessons = getLessons(COURSE);
    expect(Object.keys(articles)).toHaveLength(lessons.length);
    for (const lesson of lessons) {
      expect(getLessonArticle(COURSE, lesson.id)).not.toBeNull();
    }
  });

  it('no article key leaks into the client-safe summary', () => {
    // Guards the codegen: the navigation index must stay small, and the
    // lesson bodies must never be reachable from the main entry.
    for (const lesson of getLessons(COURSE)) {
      for (const key of LESSON_ARTICLE_KEYS) {
        expect(lesson).not.toHaveProperty(key);
      }
    }
  });

  it('the article carries the editorial fields', () => {
    const article = getLessonArticle(COURSE, 'day-001');
    expect(article?.subtitle).toBeTypeOf('string');
    expect(article?.summary).toBeTypeOf('string');
    expect(article?.dateLabel).toBeTypeOf('string');
    expect(article?.sources?.length).toBeGreaterThan(0);
  });

  it('returns null for an unknown lesson or course', () => {
    expect(getLessonArticle(COURSE, 'ne-postoji')).toBeNull();
    expect(getLessonArticle('nepostojeci-kurs', 'day-001')).toBeNull();
  });
});

describe('registry: navigation', () => {
  it('prev of day 1 is null', () => {
    expect(getPrevLesson(COURSE, 'day-001')).toBeNull();
  });

  it('next of day 1 is day 2', () => {
    expect(getNextLesson(COURSE, 'day-001')?.dayNumber).toBe(2);
  });

  it('next of the final lesson is null', () => {
    const last = getLessons(COURSE).at(-1);
    expect(last?.dayNumber).toBe(365);
    if (!last) return;
    expect(getNextLesson(COURSE, last.id)).toBeNull();
  });

  it('prev/next form a consistent chain across every era boundary', () => {
    const lessons = getLessons(COURSE);
    for (let i = 1; i < lessons.length; i += 1) {
      const prev = lessons[i - 1];
      const cur = lessons[i];
      if (!prev || !cur) continue;
      if (prev.eraId === cur.eraId) continue;
      // At an era boundary, next/prev must still link the two lessons.
      expect(getNextLesson(COURSE, prev.id)?.id).toBe(cur.id);
      expect(getPrevLesson(COURSE, cur.id)?.id).toBe(prev.id);
    }
  });
});
