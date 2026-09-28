import type { MetadataRoute } from 'next';

import { getAllCourseIds, getLessons } from '@learn365/content';
import { getLessonArticle } from '@learn365/content/server';

import { SITE_URL } from '@/lib/seo/metadata';

/**
 * `/sitemap.xml` — every public page. Lesson links on the course page are
 * rendered client-side inside the era disclosures, so without this file a
 * crawler reaches deep lessons only through prev/next chains. Account pages
 * and the API are left out (they are `noindex` / disallowed in robots).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/o-aplikaciji`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/privatnost`, changeFrequency: 'yearly', priority: 0.2 },
  ];
  for (const courseId of getAllCourseIds()) {
    entries.push({
      url: `${SITE_URL}/course/${courseId}`,
      changeFrequency: 'weekly',
      priority: 0.9,
    });
    for (const lesson of getLessons(courseId)) {
      const entry: MetadataRoute.Sitemap[number] = {
        url: `${SITE_URL}/course/${courseId}/lesson/${lesson.id}`,
        changeFrequency: 'monthly',
        priority: 0.7,
      };
      const lastReviewedAt = getLessonArticle(courseId, lesson.id)?.lastReviewedAt;
      if (lastReviewedAt !== undefined) entry.lastModified = lastReviewedAt;
      entries.push(entry);
    }
  }
  return entries;
}
