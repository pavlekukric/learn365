import { describe, expect, it } from 'vitest';

import { noindexMetadata, shareMetadata } from './metadata';

describe('share metadata', () => {
  it('is a website with its own URL by default', () => {
    const meta = shareMetadata({ title: 'T', description: 'D', path: '/o-aplikaciji' });
    expect(meta.alternates).toEqual({ canonical: '/o-aplikaciji' });
    expect(meta.openGraph).toMatchObject({ type: 'website', url: '/o-aplikaciji' });
  });

  it('is an article with its era and modified time for a lesson', () => {
    const meta = shareMetadata({
      title: 'T',
      description: 'D',
      path: '/course/c/lesson/day-001',
      article: { section: 'Era I', modifiedTime: '2026-09-30' },
    });
    expect(meta.openGraph).toMatchObject({
      type: 'article',
      section: 'Era I',
      modifiedTime: '2026-09-30',
      url: '/course/c/lesson/day-001',
    });
  });

  it('has no canonical and no og:url on a noindex page', () => {
    const meta = noindexMetadata('Prijava');
    expect(meta.title).toBe('Prijava');
    expect(meta.robots).toEqual({ index: false, follow: false });
    expect(meta.alternates).toEqual({ canonical: null });
    expect(meta.openGraph).not.toHaveProperty('url');
    expect(meta.openGraph).toMatchObject({ title: 'Prijava · Istorija 365' });
  });
});
