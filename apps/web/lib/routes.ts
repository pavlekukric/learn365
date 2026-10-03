/**
 * The app's public URLs, built in one place (review 2026-10-03 P2 13). Every
 * link to a course or a lesson goes through these helpers, so a route rename
 * (the planned Serbian paths) is one edit here plus redirects — not a hunt
 * through every component that once spelled the path out by hand.
 */

export type CourseHref = `/course/${string}`;
export type LessonHref = `/course/${string}/lesson/${string}`;

/** The course overview. */
export function courseHref(courseId: string): CourseHref {
  return `/course/${courseId}`;
}

/** One lesson of a course. */
export function lessonHref(courseId: string, lessonId: string): LessonHref {
  return `/course/${courseId}/lesson/${lessonId}`;
}

/**
 * The course's „Literatura i provera" page; with an era, that era's section
 * on it (review 2026-10-03 P1 4).
 */
export function readingListHref(courseId: string, eraId?: string): string {
  const path = `/course/${courseId}/literatura`;
  return eraId === undefined ? path : `${path}#${eraAnchorId(eraId)}`;
}

/** `true` for a lesson page (`/course/<id>/lesson/<id>`), whatever follows. */
export function isLessonPath(pathname: string): boolean {
  return /^\/course\/[^/]+\/lesson\/[^/]+/.test(pathname);
}

/** `true` for the course overview or anything under it. */
export function isCoursePath(pathname: string): boolean {
  return /^\/course\/[^/]+/.test(pathname);
}

/**
 * Element ids of an era card and a section row on the course overview, so a
 * fragment URL (`/course/<id>#era-<eraId>`) names a real place on that page.
 * The lesson pages' structured-data breadcrumbs point there (review
 * 2026-10-03 P2 9): an era is a part of the overview, not its first lesson.
 */
export function eraAnchorId(eraId: string): string {
  return `era-${eraId}`;
}

export function sectionAnchorId(sectionId: string): string {
  return `section-${sectionId}`;
}
