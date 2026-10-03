import { describe, expect, it } from 'vitest';

import {
  courseHref,
  eraAnchorId,
  isCoursePath,
  isLessonPath,
  lessonHref,
  readingListHref,
  sectionAnchorId,
} from './routes';

describe('routes', () => {
  it('builds the course and lesson URLs', () => {
    expect(courseHref('istorija-srbije-365')).toBe('/course/istorija-srbije-365');
    expect(lessonHref('istorija-srbije-365', 'day-001')).toBe(
      '/course/istorija-srbije-365/lesson/day-001',
    );
  });

  it('builds the reading-list URL, with an era anchor when asked', () => {
    expect(readingListHref('c')).toBe('/course/c/literatura');
    expect(readingListHref('c', 'nemanjici')).toBe('/course/c/literatura#era-nemanjici');
  });

  it('tells a lesson page from the course overview', () => {
    expect(isLessonPath(lessonHref('c', 'day-002'))).toBe(true);
    expect(isLessonPath(courseHref('c'))).toBe(false);
    expect(isLessonPath('/o-aplikaciji')).toBe(false);
    expect(isCoursePath(courseHref('c'))).toBe(true);
    expect(isCoursePath(lessonHref('c', 'day-002'))).toBe(true);
    expect(isCoursePath('/')).toBe(false);
    expect(isCoursePath('/course/')).toBe(false);
  });

  it('names distinct anchors for an era and a section', () => {
    expect(eraAnchorId('nemanjici')).toBe('era-nemanjici');
    expect(sectionAnchorId('nemanjici')).toBe('section-nemanjici');
  });
});
