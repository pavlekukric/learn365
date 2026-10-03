import type { MetadataRoute } from 'next';

import { getAllCourseIds, getLessons } from '@learn365/content';
import { getLessonModifiedAt } from '@learn365/content/server';

import { courseHref, lessonHref } from '@/lib/routes';
import { SITE_URL } from '@/lib/seo/metadata';

/**
 * `/sitemap.xml` — every public page. Account pages and the API are left out
 * (they are `noindex` / disallowed in robots). A lesson's `lastmod` is the
 * day its JSON last changed, as `pnpm gen-content` recorded it in
 * `lesson-dates.json` (review 2026-10-03 P2 9).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/o-aplikaciji`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/privatnost`, changeFrequency: 'yearly', priority: 0.2 },
  ];
  for (const courseId of getAllCourseIds()) {
    entries.push({
      url: `${SITE_URL}${courseHref(courseId)}`,
      changeFrequency: 'weekly',
      priority: 0.9,
    });
    for (const lesson of getLessons(courseId)) {
      const entry: MetadataRoute.Sitemap[number] = {
        url: `${SITE_URL}${lessonHref(courseId, lesson.id)}`,
        changeFrequency: 'monthly',
        priority: 0.7,
      };
      const modifiedAt = getLessonModifiedAt(courseId, lesson.id);
      if (modifiedAt !== null) entry.lastModified = modifiedAt;
      entries.push(entry);
    }
  }
  return entries;
}
