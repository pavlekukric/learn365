import { describe, expect, it } from 'vitest';

import { getCourse } from '@learn365/content';

import { ORGANIZATION_NAME, courseJsonLd, lessonJsonLd, serializeJsonLd } from './jsonLd';
import { SITE_URL } from './metadata';

describe('structured data', () => {
  it('describes the course with its provider', () => {
    const course = getCourse('istorija-srbije-365');
    expect(course).not.toBeNull();
    if (!course) return;
    const data = courseJsonLd(course, `/course/${course.id}`);
    expect(data).toMatchObject({
      '@type': 'Course',
      name: course.title,
      url: `${SITE_URL}/course/${course.id}`,
      provider: { '@type': 'Organization', name: ORGANIZATION_NAME },
    });
  });

  it('describes a lesson and appends it to the breadcrumb trail', () => {
    const [article, trail] = lessonJsonLd({
      title: 'Lekcija',
      description: 'Opis.',
      path: '/course/c/lesson/day-002',
      dayNumber: 2,
      readingTimeMinutes: 6,
      course: { title: 'Kurs', path: '/course/c' },
      section: 'Era I',
      author: 'Autor',
      breadcrumbs: [
        { label: 'Početna', href: '/' },
        { label: 'Kurs', href: '/course/c' },
      ],
    });
    expect(article).toMatchObject({
      '@type': ['Article', 'LearningResource'],
      headline: 'Lekcija',
      articleSection: 'Era I',
      timeRequired: 'PT6M',
      author: { '@type': 'Person', name: 'Autor' },
    });
    expect(article).not.toHaveProperty('dateModified');
    expect(trail).toMatchObject({ '@type': 'BreadcrumbList' });
    const items = (trail as { itemListElement: { position: number; name: string; item: string }[] })
      .itemListElement;
    expect(items.map((i) => i.position)).toEqual([1, 2, 3]);
    expect(items[2]).toMatchObject({
      name: 'Lekcija',
      item: `${SITE_URL}/course/c/lesson/day-002`,
    });
  });

  it('carries the date the lesson last changed, and anchors era and section on the overview', () => {
    const [article, trail] = lessonJsonLd({
      title: 'Lekcija',
      description: 'Opis.',
      path: '/course/c/lesson/day-001',
      dayNumber: 1,
      readingTimeMinutes: 6,
      course: { title: 'Kurs', path: '/course/c' },
      section: 'Era I',
      dateModified: '2026-09-30',
      breadcrumbs: [
        { label: 'Početna', href: '/' },
        { label: 'Kurs', href: '/course/c' },
        { label: 'Era I', href: '/course/c#era-e1' },
        { label: 'Odeljak', href: '/course/c#section-s1' },
      ],
    });
    expect(article).toMatchObject({ dateModified: '2026-09-30' });
    const items = (trail as { itemListElement: { item: string }[] }).itemListElement.map(
      (i) => i.item,
    );
    expect(items).toEqual([
      `${SITE_URL}/`,
      `${SITE_URL}/course/c`,
      `${SITE_URL}/course/c#era-e1`,
      `${SITE_URL}/course/c#section-s1`,
      `${SITE_URL}/course/c/lesson/day-001`,
    ]);
    expect(new Set(items).size).toBe(items.length);
  });

  it('serializes without a raw "<" so the script element cannot be closed early', () => {
    const json = serializeJsonLd({ name: '</script><script>alert(1)</script>' });
    expect(json).not.toContain('<');
    expect(JSON.parse(json)).toEqual({ name: '</script><script>alert(1)</script>' });
  });
});
