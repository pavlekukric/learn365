/**
 * Validates a static course-content directory against every invariant the
 * app assumes about its lesson data. Runs via:
 *
 *   pnpm --filter @learn365/content validate-files <courseDir>
 *
 * Default `courseDir` is `<repo>/content/courses/istorija-srbije-365` —
 * the production drop-in path defined in `CONTENT_CONTRACT.md`.
 *
 * Collects every problem before exiting so the author sees the full report.
 * Exits 0 on success, 1 on any validation problem, 2 on loader errors
 * (malformed JSON / missing files / wrong field types).
 */

import { fileURLToPath } from 'node:url';
import { dirname, isAbsolute, resolve } from 'node:path';

import { ContentLoadError, loadCourseFromFiles } from './loadCourseFromFiles.js';

const MIN_READING_MINUTES = 4;
const MAX_READING_MINUTES = 15;
const MAX_TITLE_LENGTH = 70;
const MAX_SUBTITLE_LENGTH = 120;
const PLACEHOLDER_BODY = 'Lekcija se uskoro objavljuje.';

interface ValidationReport {
  readonly problems: readonly string[];
  readonly stats: {
    readonly totalLessons: number;
    readonly placeholderLessons: number;
    readonly authoredLessons: number;
    readonly sections: number;
    readonly eras: number;
    /** Derived reading minutes across authored lessons (Phase 11); median = course.estimatedMinutesPerLesson. */
    readonly readingTime: { readonly min: number; readonly max: number; readonly median: number };
  };
}

export function validateCourseDirectory(courseDir: string): ValidationReport {
  const { course, eras, sections, lessons } = loadCourseFromFiles(courseDir);

  const problems: string[] = [];
  const fail = (msg: string): void => {
    problems.push(msg);
  };

  // 1. Lesson count matches the course header.
  if (lessons.length !== course.totalLessons) {
    fail(
      `lesson count ${String(lessons.length)} != course.totalLessons ${String(course.totalLessons)}`,
    );
  }

  // 2. dayNumber values cover 1..totalLessons exactly with no duplicates.
  const seenDays = new Set<number>();
  for (const l of lessons) {
    if (seenDays.has(l.dayNumber)) {
      fail(`duplicate dayNumber ${String(l.dayNumber)} (lesson ${l.id})`);
    }
    seenDays.add(l.dayNumber);
    if (l.dayNumber < 1 || l.dayNumber > course.totalLessons) {
      fail(`lesson ${l.id} dayNumber ${String(l.dayNumber)} is outside [1..${String(course.totalLessons)}]`);
    }
  }
  for (let d = 1; d <= course.totalLessons; d += 1) {
    if (!seenDays.has(d)) fail(`missing dayNumber ${String(d)}`);
  }

  // 3. Lesson IDs are unique.
  const seenIds = new Set<string>();
  for (const l of lessons) {
    if (seenIds.has(l.id)) fail(`duplicate lesson id: ${l.id}`);
    seenIds.add(l.id);
  }

  // 4. courseId on every record matches the course.
  for (const e of eras) {
    if (e.courseId !== course.id) fail(`era ${e.id} courseId ${e.courseId} != ${course.id}`);
  }
  for (const s of sections) {
    if (s.courseId !== course.id) {
      fail(`section ${s.id} courseId ${s.courseId} != ${course.id}`);
    }
  }
  for (const l of lessons) {
    if (l.courseId !== course.id) {
      fail(`lesson ${l.id} courseId ${l.courseId} != ${course.id}`);
    }
  }

  // 5. Era / Section / Lesson references all resolve.
  const erasById = new Map(eras.map((e) => [e.id, e]));
  const sectionsById = new Map(sections.map((s) => [s.id, s]));
  for (const s of sections) {
    if (!erasById.has(s.eraId)) {
      fail(`section ${s.id} references unknown eraId ${s.eraId}`);
    }
  }
  for (const l of lessons) {
    const section = sectionsById.get(l.sectionId);
    if (!section) {
      fail(`lesson ${l.id} references unknown sectionId ${l.sectionId}`);
      continue;
    }
    const era = erasById.get(l.eraId);
    if (!era) {
      fail(`lesson ${l.id} references unknown eraId ${l.eraId}`);
      continue;
    }
    if (section.eraId !== l.eraId) {
      fail(
        `lesson ${l.id} eraId ${l.eraId} disagrees with section ${section.id} eraId ${section.eraId}`,
      );
    }
    if (l.dayNumber < section.startDay || l.dayNumber > section.endDay) {
      fail(
        `lesson ${l.id} dayNumber ${String(l.dayNumber)} is outside section range [${String(section.startDay)}..${String(section.endDay)}]`,
      );
    }
    if (l.year < era.yearStart || l.year > era.yearEnd) {
      fail(
        `lesson ${l.id} year ${String(l.year)} is outside era ${era.id} range [${String(era.yearStart)}..${String(era.yearEnd)}]`,
      );
    }
  }

  // 6. Section ranges are contiguous and cover 1..totalLessons.
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);
  let expectedStart = 1;
  for (const s of sortedSections) {
    if (s.startDay !== expectedStart) {
      fail(`section ${s.id} startDay ${String(s.startDay)} != expected ${String(expectedStart)}`);
    }
    if (s.endDay < s.startDay) {
      fail(`section ${s.id} endDay ${String(s.endDay)} < startDay ${String(s.startDay)}`);
    }
    expectedStart = s.endDay + 1;
  }
  if (expectedStart !== course.totalLessons + 1) {
    fail(
      `sections cover days 1..${String(expectedStart - 1)}, expected 1..${String(course.totalLessons)}`,
    );
  }

  // 7. Era order is sequential starting at 1 and year ranges are monotonic.
  const sortedEras = [...eras].sort((a, b) => a.order - b.order);
  for (let i = 0; i < sortedEras.length; i += 1) {
    const e = sortedEras[i];
    if (!e) continue;
    if (e.order !== i + 1) {
      fail(`era ${e.id} order ${String(e.order)} != expected ${String(i + 1)}`);
    }
    if (e.yearStart > e.yearEnd) {
      fail(`era ${e.id} yearStart ${String(e.yearStart)} > yearEnd ${String(e.yearEnd)}`);
    }
    if (i > 0) {
      const prev = sortedEras[i - 1];
      if (prev && prev.yearStart > e.yearStart) {
        fail(
          `era ${e.id} yearStart ${String(e.yearStart)} < previous era ${prev.id} yearStart ${String(prev.yearStart)}`,
        );
      }
    }
  }

  // 8. Section order is sequential starting at 1.
  for (let i = 0; i < sortedSections.length; i += 1) {
    const s = sortedSections[i];
    if (!s) continue;
    if (s.order !== i + 1) {
      fail(`section ${s.id} order ${String(s.order)} != expected ${String(i + 1)}`);
    }
  }

  // 9. Per-lesson field shape.
  let placeholderCount = 0;
  for (const l of lessons) {
    if (l.title.length === 0) fail(`lesson ${l.id} has empty title`);
    if (l.title.length > MAX_TITLE_LENGTH) {
      fail(
        `lesson ${l.id} title length ${String(l.title.length)} exceeds max ${String(MAX_TITLE_LENGTH)}`,
      );
    }
    if (l.subtitle !== undefined && l.subtitle.length > MAX_SUBTITLE_LENGTH) {
      fail(
        `lesson ${l.id} subtitle length ${String(l.subtitle.length)} exceeds max ${String(MAX_SUBTITLE_LENGTH)}`,
      );
    }
    // readingTimeMinutes is derived from the text (Phase 11); a placeholder's
    // stub body derives to 1, so the band applies to authored lessons only.
    if (
      l.isPlaceholder !== true &&
      (l.readingTimeMinutes < MIN_READING_MINUTES || l.readingTimeMinutes > MAX_READING_MINUTES)
    ) {
      fail(
        `lesson ${l.id} readingTimeMinutes ${String(l.readingTimeMinutes)} is outside [${String(MIN_READING_MINUTES)}..${String(MAX_READING_MINUTES)}]`,
      );
    }
    if (l.content.length === 0) {
      fail(`lesson ${l.id} has zero content blocks`);
    }

    // 10. Placeholder lessons are clearly marked: isPlaceholder === true AND
    // body is exactly one paragraph carrying the agreed sentinel sentence.
    const firstBlock = l.content[0];
    const isStubBody =
      l.content.length === 1 &&
      firstBlock?.type === 'paragraph' &&
      firstBlock.text === PLACEHOLDER_BODY;
    if (isStubBody && l.isPlaceholder !== true) {
      fail(`lesson ${l.id} has placeholder body but isPlaceholder is not true`);
    }
    if (l.isPlaceholder === true && !isStubBody) {
      fail(
        `lesson ${l.id} isPlaceholder=true but body is not exactly one paragraph saying "${PLACEHOLDER_BODY}"`,
      );
    }
    if (l.isPlaceholder === true) placeholderCount += 1;

    // 11. Authored lessons must start with a dropcap paragraph (matches
    // CONTENT_AUTHORING.md §2 and what the reader visually expects).
    if (l.isPlaceholder !== true) {
      if (!firstBlock || firstBlock.type !== 'paragraph') {
        fail(`authored lesson ${l.id} first block must be a paragraph`);
      } else if (firstBlock.dropcap !== true) {
        fail(`authored lesson ${l.id} first paragraph must set dropcap: true`);
      }
    }
  }

  const authoredMinutes = lessons
    .filter((l) => l.isPlaceholder !== true)
    .map((l) => l.readingTimeMinutes);
  const readingTime = {
    min: authoredMinutes.length > 0 ? Math.min(...authoredMinutes) : 0,
    max: authoredMinutes.length > 0 ? Math.max(...authoredMinutes) : 0,
    median: course.estimatedMinutesPerLesson,
  };

  return {
    problems,
    stats: {
      totalLessons: lessons.length,
      placeholderLessons: placeholderCount,
      authoredLessons: lessons.length - placeholderCount,
      sections: sections.length,
      eras: eras.length,
      readingTime,
    },
  };
}

function repoRoot(): string {
  // <repo>/packages/content/src/loader/validateContentFiles.ts → up 4 levels.
  const here = dirname(fileURLToPath(import.meta.url));
  return resolve(here, '..', '..', '..', '..');
}

function resolveCourseDir(arg: string | undefined): string {
  if (arg && arg.length > 0) {
    return isAbsolute(arg) ? arg : resolve(process.cwd(), arg);
  }
  return resolve(repoRoot(), 'content', 'courses', 'istorija-srbije-365');
}

function isMainModule(): boolean {
  if (typeof process === 'undefined' || !process.argv[1]) return false;
  const invoked = resolve(process.argv[1]);
  const here = resolve(fileURLToPath(import.meta.url));
  return invoked === here;
}

if (isMainModule()) {
  const courseDir = resolveCourseDir(process.argv[2]);
  try {
    const { problems, stats } = validateCourseDirectory(courseDir);
    if (problems.length === 0) {
      console.log(
        `@learn365/content: ${courseDir} ✓ ${String(stats.totalLessons)} lessons (${String(stats.authoredLessons)} authored, ${String(stats.placeholderLessons)} placeholder), ${String(stats.sections)} sections, ${String(stats.eras)} eras; reading time ${String(stats.readingTime.min)}–${String(stats.readingTime.max)} min (median ${String(stats.readingTime.median)}).`,
      );
      process.exit(0);
    }
    console.error(`@learn365/content: ${String(problems.length)} validation problem(s) in ${courseDir}:`);
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  } catch (err) {
    if (err instanceof ContentLoadError) {
      console.error(`@learn365/content: cannot load content from ${courseDir}`);
      console.error(`  - ${err.message}`);
      process.exit(2);
    }
    throw err;
  }
}
