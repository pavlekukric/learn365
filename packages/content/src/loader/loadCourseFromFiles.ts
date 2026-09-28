/**
 * File-based loader for static course content.
 *
 * Reads a fully-populated course directory laid out per CONTENT_CONTRACT.md
 * and returns the same `Course / Era / Section / Lesson` shapes that the rest
 * of `@learn365/content` already exposes. The loader is intentionally
 * synchronous so it can run at module-load time inside server-rendered Next
 * routes and inside the content-validation script — there is no async path
 * through the UI to deal with.
 *
 * Layout expected at `<courseDir>`:
 *
 *   course.json
 *   eras.json
 *   sections.json
 *   lessons/
 *     day-001.json
 *     day-002.json
 *     …
 *     day-365.json
 *
 * The loader performs structural validation only (shape, required fields,
 * enum values). Cross-file invariants (day numbers cover 1..N, section ranges
 * are contiguous, etc.) are enforced by `validateContentFiles.ts`, which
 * builds on top of this loader.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type {
  Course,
  Era,
  Lesson,
  LessonBlock,
  LessonByline,
  Script,
  Section,
  Source,
  SourceKind,
} from '../types.js';

import { estimateReadingMinutes, medianReadingMinutes } from './readingTime.js';

export interface LoadedCourse {
  readonly course: Course;
  readonly eras: readonly Era[];
  readonly sections: readonly Section[];
  readonly lessons: readonly Lesson[];
}

export class ContentLoadError extends Error {
  readonly file: string;
  constructor(file: string, message: string) {
    super(`${file}: ${message}`);
    this.name = 'ContentLoadError';
    this.file = file;
  }
}

function readJson(file: string): unknown {
  let raw: string;
  try {
    raw = readFileSync(file, 'utf8');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new ContentLoadError(file, `cannot read file (${msg})`);
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new ContentLoadError(file, `invalid JSON (${msg})`);
  }
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function requireString(file: string, obj: Record<string, unknown>, key: string): string {
  const v = obj[key];
  if (typeof v !== 'string' || v.length === 0) {
    throw new ContentLoadError(file, `field "${key}" must be a non-empty string`);
  }
  return v;
}

function optionalString(
  file: string,
  obj: Record<string, unknown>,
  key: string,
): string | undefined {
  const v = obj[key];
  if (v === undefined) return undefined;
  if (typeof v !== 'string') {
    throw new ContentLoadError(file, `field "${key}" must be a string when present`);
  }
  return v;
}

function requireNumber(file: string, obj: Record<string, unknown>, key: string): number {
  const v = obj[key];
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    throw new ContentLoadError(file, `field "${key}" must be a finite number`);
  }
  return v;
}

function requireInt(file: string, obj: Record<string, unknown>, key: string): number {
  const v = requireNumber(file, obj, key);
  if (!Number.isInteger(v)) {
    throw new ContentLoadError(file, `field "${key}" must be an integer`);
  }
  return v;
}

function optionalBoolean(
  file: string,
  obj: Record<string, unknown>,
  key: string,
): boolean | undefined {
  const v = obj[key];
  if (v === undefined) return undefined;
  if (typeof v !== 'boolean') {
    throw new ContentLoadError(file, `field "${key}" must be a boolean when present`);
  }
  return v;
}

function optionalStringArray(
  file: string,
  obj: Record<string, unknown>,
  key: string,
): readonly string[] | undefined {
  const v = obj[key];
  if (v === undefined) return undefined;
  if (!Array.isArray(v) || !v.every((x) => typeof x === 'string')) {
    throw new ContentLoadError(file, `field "${key}" must be an array of strings when present`);
  }
  return v;
}

const SOURCE_KINDS: readonly SourceKind[] = [
  'book',
  'article',
  'museum',
  'archive',
  'web',
];

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseByline(file: string, raw: unknown): LessonByline {
  if (!isObject(raw)) {
    throw new ContentLoadError(file, 'field "byline" must be an object when present');
  }
  const author = optionalString(file, raw, 'author');
  const reviewer = optionalString(file, raw, 'reviewer');
  if (author === undefined && reviewer === undefined) {
    throw new ContentLoadError(
      file,
      'field "byline" must define at least one of "author" / "reviewer"',
    );
  }
  return {
    ...(author !== undefined ? { author } : {}),
    ...(reviewer !== undefined ? { reviewer } : {}),
  };
}

function parseLastReviewedAt(file: string, raw: unknown): string {
  if (typeof raw !== 'string' || !ISO_DATE_RE.test(raw)) {
    throw new ContentLoadError(
      file,
      'field "lastReviewedAt" must be an ISO date string (YYYY-MM-DD)',
    );
  }
  const parsed = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new ContentLoadError(file, `field "lastReviewedAt" "${raw}" is not a valid date`);
  }
  return raw;
}

function parseSource(file: string, raw: unknown, index: number): Source {
  if (!isObject(raw)) {
    throw new ContentLoadError(file, `sources[${String(index)}] must be an object`);
  }
  const kind = raw['kind'];
  if (typeof kind !== 'string' || !(SOURCE_KINDS as readonly string[]).includes(kind)) {
    throw new ContentLoadError(
      file,
      `sources[${String(index)}].kind must be one of ${SOURCE_KINDS.join('|')} (got "${String(kind)}")`,
    );
  }
  const title = requireString(file, raw, 'title');
  const author = optionalString(file, raw, 'author');
  const url = optionalString(file, raw, 'url');
  if (url !== undefined) {
    try {
      // Validate URL shape only; the parsed object is intentionally discarded.
      void new URL(url);
    } catch {
      throw new ContentLoadError(
        file,
        `sources[${String(index)}].url "${url}" is not a valid URL`,
      );
    }
  }
  const yearRaw = raw['year'];
  let year: number | undefined;
  if (yearRaw !== undefined) {
    if (typeof yearRaw !== 'number' || !Number.isFinite(yearRaw) || !Number.isInteger(yearRaw)) {
      throw new ContentLoadError(
        file,
        `sources[${String(index)}].year must be an integer when present`,
      );
    }
    year = yearRaw;
  }
  return {
    kind: kind as SourceKind,
    title,
    ...(author !== undefined ? { author } : {}),
    ...(year !== undefined ? { year } : {}),
    ...(url !== undefined ? { url } : {}),
  };
}

function optionalSources(
  file: string,
  obj: Record<string, unknown>,
): readonly Source[] | undefined {
  const v = obj['sources'];
  if (v === undefined) return undefined;
  if (!Array.isArray(v)) {
    throw new ContentLoadError(file, 'field "sources" must be an array when present');
  }
  if (v.length === 0) {
    throw new ContentLoadError(
      file,
      'field "sources" must be a non-empty array when present (omit the field instead)',
    );
  }
  return v.map((s, i) => parseSource(file, s, i));
}

function parseCourse(
  file: string,
  raw: unknown,
): Omit<Course, 'estimatedMinutesPerLesson'> {
  if (!isObject(raw)) {
    throw new ContentLoadError(file, 'top-level value must be an object');
  }
  const language = requireString(file, raw, 'language');
  if (language !== 'sr') {
    throw new ContentLoadError(file, `language must be "sr" (got "${language}")`);
  }
  const defaultScript = requireString(file, raw, 'defaultScript');
  if (defaultScript !== 'latin' && defaultScript !== 'cyrillic') {
    throw new ContentLoadError(
      file,
      `defaultScript must be "latin" or "cyrillic" (got "${defaultScript}")`,
    );
  }
  if (raw['estimatedMinutesPerLesson'] !== undefined) {
    throw new ContentLoadError(
      file,
      'field "estimatedMinutesPerLesson" is derived (median of the lesson reading times) — remove it',
    );
  }
  const course: Omit<Course, 'estimatedMinutesPerLesson'> = {
    id: requireString(file, raw, 'id'),
    title: requireString(file, raw, 'title'),
    subtitle: requireString(file, raw, 'subtitle'),
    description: requireString(file, raw, 'description'),
    totalLessons: requireInt(file, raw, 'totalLessons'),
    language,
    defaultScript: defaultScript as Script,
  };
  const cover = optionalString(file, raw, 'coverImage');
  return cover === undefined ? course : { ...course, coverImage: cover };
}

function parseEra(file: string, raw: unknown, index: number): Era {
  if (!isObject(raw)) {
    throw new ContentLoadError(file, `entry [${String(index)}] must be an object`);
  }
  return {
    id: requireString(file, raw, 'id'),
    courseId: requireString(file, raw, 'courseId'),
    num: requireString(file, raw, 'num'),
    title: requireString(file, raw, 'title'),
    description: requireString(file, raw, 'description'),
    yearStart: requireInt(file, raw, 'yearStart'),
    yearEnd: requireInt(file, raw, 'yearEnd'),
    yearsLabel: requireString(file, raw, 'yearsLabel'),
    eraShort: requireString(file, raw, 'eraShort'),
    order: requireInt(file, raw, 'order'),
  };
}

function parseSection(file: string, raw: unknown, index: number): Section {
  if (!isObject(raw)) {
    throw new ContentLoadError(file, `entry [${String(index)}] must be an object`);
  }
  const subtitle = optionalString(file, raw, 'subtitle');
  const base = {
    id: requireString(file, raw, 'id'),
    courseId: requireString(file, raw, 'courseId'),
    eraId: requireString(file, raw, 'eraId'),
    title: requireString(file, raw, 'title'),
    order: requireInt(file, raw, 'order'),
    startDay: requireInt(file, raw, 'startDay'),
    endDay: requireInt(file, raw, 'endDay'),
  };
  return subtitle === undefined ? base : { ...base, subtitle };
}

function parseBlock(file: string, raw: unknown, index: number): LessonBlock {
  if (!isObject(raw)) {
    throw new ContentLoadError(file, `content[${String(index)}] must be an object`);
  }
  const type = raw['type'];
  switch (type) {
    case 'paragraph': {
      const dropcap = optionalBoolean(file, raw, 'dropcap');
      const block: LessonBlock = { type: 'paragraph', text: requireString(file, raw, 'text') };
      return dropcap === undefined ? block : { ...block, dropcap };
    }
    case 'heading': {
      const level = requireInt(file, raw, 'level');
      if (level !== 2 && level !== 3) {
        throw new ContentLoadError(
          file,
          `content[${String(index)}].level must be 2 or 3 (got ${String(level)})`,
        );
      }
      return { type: 'heading', level, text: requireString(file, raw, 'text') };
    }
    case 'quote': {
      const attribution = optionalString(file, raw, 'attribution');
      const block: LessonBlock = { type: 'quote', text: requireString(file, raw, 'text') };
      return attribution === undefined ? block : { ...block, attribution };
    }
    case 'image': {
      const caption = optionalString(file, raw, 'caption');
      const width = requireInt(file, raw, 'width');
      const height = requireInt(file, raw, 'height');
      if (width <= 0 || height <= 0) {
        throw new ContentLoadError(
          file,
          `content[${String(index)}] image width/height must be positive integers`,
        );
      }
      const block: LessonBlock = {
        type: 'image',
        src: requireString(file, raw, 'src'),
        alt: requireString(file, raw, 'alt'),
        width,
        height,
      };
      return caption === undefined ? block : { ...block, caption };
    }
    default:
      throw new ContentLoadError(
        file,
        `content[${String(index)}].type must be paragraph|heading|quote|image (got "${String(type)}")`,
      );
  }
}

function parseLesson(file: string, raw: unknown): Lesson {
  if (!isObject(raw)) {
    throw new ContentLoadError(file, 'top-level value must be an object');
  }
  const contentRaw = raw['content'];
  if (!Array.isArray(contentRaw) || contentRaw.length === 0) {
    throw new ContentLoadError(file, 'content must be a non-empty array of blocks');
  }
  const content = contentRaw.map((b, i) => parseBlock(file, b, i));
  if (raw['readingTimeMinutes'] !== undefined) {
    throw new ContentLoadError(
      file,
      'field "readingTimeMinutes" is derived from the text (ceil(words / 150)) — remove it from the file',
    );
  }

  const lesson: Lesson = {
    id: requireString(file, raw, 'id'),
    courseId: requireString(file, raw, 'courseId'),
    sectionId: requireString(file, raw, 'sectionId'),
    eraId: requireString(file, raw, 'eraId'),
    dayNumber: requireInt(file, raw, 'dayNumber'),
    order: requireInt(file, raw, 'order'),
    title: requireString(file, raw, 'title'),
    // Derived from the text (Phase 11) — see readingTime.ts.
    readingTimeMinutes: estimateReadingMinutes(content),
    year: requireInt(file, raw, 'year'),
    content,
  };

  // Optional fields — only assign when present to keep
  // exactOptionalPropertyTypes happy.
  const subtitle = optionalString(file, raw, 'subtitle');
  const dateLabel = optionalString(file, raw, 'dateLabel');
  const timelinePosition = optionalString(file, raw, 'timelinePosition');
  const isPlaceholder = optionalBoolean(file, raw, 'isPlaceholder');
  const summary = optionalString(file, raw, 'summary');
  const keyPeople = optionalStringArray(file, raw, 'keyPeople');
  const keyPlaces = optionalStringArray(file, raw, 'keyPlaces');
  const byline = raw['byline'] !== undefined ? parseByline(file, raw['byline']) : undefined;
  const lastReviewedAt =
    raw['lastReviewedAt'] !== undefined
      ? parseLastReviewedAt(file, raw['lastReviewedAt'])
      : undefined;
  const sources = optionalSources(file, raw);

  return {
    ...lesson,
    ...(subtitle !== undefined ? { subtitle } : {}),
    ...(dateLabel !== undefined ? { dateLabel } : {}),
    ...(timelinePosition !== undefined ? { timelinePosition } : {}),
    ...(isPlaceholder !== undefined ? { isPlaceholder } : {}),
    ...(summary !== undefined ? { summary } : {}),
    ...(keyPeople !== undefined ? { keyPeople } : {}),
    ...(keyPlaces !== undefined ? { keyPlaces } : {}),
    ...(byline !== undefined ? { byline } : {}),
    ...(lastReviewedAt !== undefined ? { lastReviewedAt } : {}),
    ...(sources !== undefined ? { sources } : {}),
  };
}

/**
 * Load a course from its static content directory. The directory must
 * contain `course.json`, `eras.json`, `sections.json`, and a `lessons/`
 * sub-directory with one `*.json` file per lesson.
 *
 * Returns parsed records sorted into stable order:
 *   - eras by `order`
 *   - sections by `order`
 *   - lessons by `dayNumber`
 *
 * Structural problems throw `ContentLoadError` with the offending file
 * and a human-readable message.
 */
export function loadCourseFromFiles(courseDir: string): LoadedCourse {
  const courseFile = join(courseDir, 'course.json');
  const erasFile = join(courseDir, 'eras.json');
  const sectionsFile = join(courseDir, 'sections.json');
  const lessonsDir = join(courseDir, 'lessons');

  const courseBase = parseCourse(courseFile, readJson(courseFile));

  const erasRaw = readJson(erasFile);
  if (!Array.isArray(erasRaw)) {
    throw new ContentLoadError(erasFile, 'top-level value must be an array of Era objects');
  }
  const eras = erasRaw
    .map((e, i) => parseEra(erasFile, e, i))
    .sort((a, b) => a.order - b.order);

  const sectionsRaw = readJson(sectionsFile);
  if (!Array.isArray(sectionsRaw)) {
    throw new ContentLoadError(
      sectionsFile,
      'top-level value must be an array of Section objects',
    );
  }
  const sections = sectionsRaw
    .map((s, i) => parseSection(sectionsFile, s, i))
    .sort((a, b) => a.order - b.order);

  let lessonFiles: string[];
  try {
    lessonFiles = readdirSync(lessonsDir).filter((f) => f.endsWith('.json'));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new ContentLoadError(lessonsDir, `cannot read lessons directory (${msg})`);
  }
  const lessons = lessonFiles
    .map((name) => {
      const file = join(lessonsDir, name);
      return parseLesson(file, readJson(file));
    })
    .sort((a, b) => a.dayNumber - b.dayNumber);

  // The course-level estimate is the median of the derived lesson minutes (Phase 11).
  const course: Course = {
    ...courseBase,
    estimatedMinutesPerLesson: medianReadingMinutes(lessons),
  };

  return { course, eras, sections, lessons };
}
