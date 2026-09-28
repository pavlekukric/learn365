import type {
  Course,
  CourseId,
  Era,
  EraId,
  LessonId,
  LessonSummary,
  Section,
  SectionId,
} from './types.js';

import {
  course as istorijaSrbijeCourse,
  eras as istorijaSrbijeEras,
  lessons as istorijaSrbijeLessons,
  sections as istorijaSrbijeSections,
} from './courses/istorija-srbije-365/index.js';

interface CourseData {
  readonly course: Course;
  readonly eras: readonly Era[];
  readonly sections: readonly Section[];
  readonly lessons: readonly LessonSummary[];
  readonly lessonById: ReadonlyMap<LessonId, LessonSummary>;
  readonly sectionById: ReadonlyMap<SectionId, Section>;
  readonly eraById: ReadonlyMap<EraId, Era>;
}

function buildCourseData(args: {
  course: Course;
  eras: readonly Era[];
  sections: readonly Section[];
  lessons: readonly LessonSummary[];
}): CourseData {
  return {
    course: args.course,
    eras: args.eras,
    sections: args.sections,
    lessons: args.lessons,
    lessonById: new Map(args.lessons.map((l) => [l.id, l])),
    sectionById: new Map(args.sections.map((s) => [s.id, s])),
    eraById: new Map(args.eras.map((e) => [e.id, e])),
  };
}

const registry: Readonly<Record<CourseId, CourseData>> = {
  'istorija-srbije-365': buildCourseData({
    course: istorijaSrbijeCourse,
    eras: istorijaSrbijeEras,
    sections: istorijaSrbijeSections,
    lessons: istorijaSrbijeLessons,
  }),
};

function dataFor(courseId: CourseId): CourseData | null {
  return registry[courseId] ?? null;
}

export function getAllCourseIds(): readonly CourseId[] {
  return Object.keys(registry);
}

export function getCourse(courseId: CourseId): Course | null {
  return dataFor(courseId)?.course ?? null;
}

export function getEras(courseId: CourseId): readonly Era[] {
  return dataFor(courseId)?.eras ?? [];
}

export function getSections(courseId: CourseId): readonly Section[] {
  return dataFor(courseId)?.sections ?? [];
}

export function getLessons(courseId: CourseId): readonly LessonSummary[] {
  return dataFor(courseId)?.lessons ?? [];
}

/**
 * Reading minutes across the authored (non-placeholder) lessons — the honest
 * range the product promises (Phase 11; the minutes themselves are derived
 * from the text by the loader). Null for an unknown course or one without an
 * authored lesson.
 */
export function getReadingTimeRange(
  courseId: CourseId,
): { readonly min: number; readonly max: number } | null {
  const lessons = dataFor(courseId)?.lessons.filter((l) => l.isPlaceholder !== true) ?? [];
  if (lessons.length === 0) return null;
  let min = Number.POSITIVE_INFINITY;
  let max = 0;
  for (const l of lessons) {
    if (l.readingTimeMinutes < min) min = l.readingTimeMinutes;
    if (l.readingTimeMinutes > max) max = l.readingTimeMinutes;
  }
  return { min, max };
}

export function getLessonById(courseId: CourseId, lessonId: LessonId): LessonSummary | null {
  return dataFor(courseId)?.lessonById.get(lessonId) ?? null;
}

export function getSectionById(courseId: CourseId, sectionId: SectionId): Section | null {
  return dataFor(courseId)?.sectionById.get(sectionId) ?? null;
}

export function getEraById(courseId: CourseId, eraId: EraId): Era | null {
  return dataFor(courseId)?.eraById.get(eraId) ?? null;
}

export function getLessonsBySection(
  courseId: CourseId,
  sectionId: SectionId,
): readonly LessonSummary[] {
  const lessons = dataFor(courseId)?.lessons;
  if (!lessons) return [];
  return lessons.filter((l) => l.sectionId === sectionId);
}

export function getLessonsByEra(courseId: CourseId, eraId: EraId): readonly LessonSummary[] {
  const lessons = dataFor(courseId)?.lessons;
  if (!lessons) return [];
  return lessons.filter((l) => l.eraId === eraId);
}

export function getSectionsByEra(
  courseId: CourseId,
  eraId: EraId,
): readonly Section[] {
  const sections = dataFor(courseId)?.sections;
  if (!sections) return [];
  return sections.filter((s) => s.eraId === eraId);
}

export function getEraForLesson(courseId: CourseId, lessonId: LessonId): Era | null {
  const lesson = getLessonById(courseId, lessonId);
  if (!lesson) return null;
  return getEraById(courseId, lesson.eraId);
}

export function getSectionForLesson(
  courseId: CourseId,
  lessonId: LessonId,
): Section | null {
  const lesson = getLessonById(courseId, lessonId);
  if (!lesson) return null;
  return getSectionById(courseId, lesson.sectionId);
}

export function getEraForSection(
  courseId: CourseId,
  sectionId: SectionId,
): Era | null {
  const section = getSectionById(courseId, sectionId);
  if (!section) return null;
  return getEraById(courseId, section.eraId);
}

export function getPrevLesson(courseId: CourseId, lessonId: LessonId): LessonSummary | null {
  const lessons = dataFor(courseId)?.lessons;
  if (!lessons) return null;
  const idx = lessons.findIndex((l) => l.id === lessonId);
  if (idx <= 0) return null;
  return lessons[idx - 1] ?? null;
}

export function getNextLesson(courseId: CourseId, lessonId: LessonId): LessonSummary | null {
  const lessons = dataFor(courseId)?.lessons;
  if (!lessons) return null;
  const idx = lessons.findIndex((l) => l.id === lessonId);
  if (idx < 0 || idx === lessons.length - 1) return null;
  return lessons[idx + 1] ?? null;
}
