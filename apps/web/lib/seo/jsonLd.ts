import type { Course } from '@learn365/content';

import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from './metadata';

/**
 * schema.org structured data for the course overview and the lesson pages
 * (review 2026-09-30, item 12). Built only from data the page already has.
 */

/** The publisher's public name — the site name. */
export const ORGANIZATION_NAME = SITE_NAME;

type JsonLd = Record<string, unknown>;

function absolute(path: string): string {
  return `${SITE_URL}${path}`;
}

const organization: JsonLd = {
  '@type': 'Organization',
  name: ORGANIZATION_NAME,
  url: absolute('/'),
};

/** `Course` + its provider, for `/course/[courseId]`. */
export function courseJsonLd(course: Course, path: string): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description,
    url: absolute(path),
    inLanguage: 'sr-Latn',
    isAccessibleForFree: true,
    provider: organization,
  };
}

export interface LessonJsonLdInput {
  title: string;
  description: string;
  path: string;
  dayNumber: number;
  readingTimeMinutes: number;
  course: { title: string; path: string };
  /** The era, as `articleSection`. */
  section: string;
  author?: string;
  /** `YYYY-MM-DD` on which the lesson's text last changed (`lesson-dates.json`). */
  dateModified?: string;
  /**
   * Location trail, Home first; the lesson itself is appended as the last
   * item. Every `href` must name its own page or anchor — never the lesson's
   * URL (an era is `/course/<id>#era-<eraId>`, not its first lesson).
   */
  breadcrumbs: readonly { label: string; href: string }[];
}

/** `Article` + `LearningResource` and its `BreadcrumbList`, for a lesson page. */
export function lessonJsonLd(input: LessonJsonLdInput): JsonLd[] {
  const url = absolute(input.path);
  const article: JsonLd = {
    '@context': 'https://schema.org',
    '@type': ['Article', 'LearningResource'],
    headline: input.title,
    description: input.description,
    url,
    mainEntityOfPage: url,
    inLanguage: 'sr-Latn',
    isAccessibleForFree: true,
    learningResourceType: 'lesson',
    articleSection: input.section,
    position: input.dayNumber,
    timeRequired: `PT${String(input.readingTimeMinutes)}M`,
    image: absolute(DEFAULT_OG_IMAGE.url),
    author: input.author !== undefined ? { '@type': 'Person', name: input.author } : organization,
    publisher: organization,
    ...(input.dateModified !== undefined ? { dateModified: input.dateModified } : {}),
    isPartOf: { '@type': 'Course', name: input.course.title, url: absolute(input.course.path) },
  };
  const trail = [...input.breadcrumbs, { label: input.title, href: input.path }];
  const breadcrumbList: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.label,
      item: absolute(crumb.href),
    })),
  };
  return [article, breadcrumbList];
}

/**
 * The JSON for an inline `<script type="application/ld+json">`. `<` is
 * escaped so no string in the data can close the script element early.
 */
export function serializeJsonLd(data: JsonLd | JsonLd[]): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
