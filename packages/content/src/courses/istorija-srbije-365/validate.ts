/**
 * Validates `istorija-srbije-365` against the invariants described in
 * docs/CONTENT_AUTHORING.md §4. Runs via
 * `pnpm --filter @learn365/content validate-content` and in CI.
 *
 * Collects every problem before exiting so the author sees the full
 * report instead of fixing one at a time.
 */

import { course } from './course.js';
import { eras } from './eras.js';
import { sections } from './sections.js';
import { lessons } from './lessons/index.js';
import { lessonTitles } from './lessons/titles.js';

const MIN_READING_MINUTES = 4;
const MAX_READING_MINUTES = 15;
const TOTAL_LESSONS = 365;

const problems: string[] = [];

function fail(msg: string): void {
  problems.push(msg);
}

// 1. Lesson count matches the course header.
if (lessons.length !== course.totalLessons) {
  fail(
    `expected ${String(course.totalLessons)} lessons, got ${String(lessons.length)}`,
  );
}
if (lessons.length !== TOTAL_LESSONS) {
  fail(`expected total ${String(TOTAL_LESSONS)} lessons, got ${String(lessons.length)}`);
}

// 2. dayNumber values cover 1..365 exactly with no duplicates.
const seenDays = new Set<number>();
for (const lesson of lessons) {
  if (seenDays.has(lesson.dayNumber)) {
    fail(`duplicate dayNumber ${String(lesson.dayNumber)} (lesson ${lesson.id})`);
  }
  seenDays.add(lesson.dayNumber);
  if (lesson.dayNumber < 1 || lesson.dayNumber > TOTAL_LESSONS) {
    fail(`dayNumber out of range on ${lesson.id}: ${String(lesson.dayNumber)}`);
  }
}
for (let d = 1; d <= TOTAL_LESSONS; d += 1) {
  if (!seenDays.has(d)) fail(`missing dayNumber ${String(d)}`);
}

// 3. Lesson IDs are unique.
const seenIds = new Set<string>();
for (const lesson of lessons) {
  if (seenIds.has(lesson.id)) fail(`duplicate lesson id: ${lesson.id}`);
  seenIds.add(lesson.id);
}

// 4. Lesson references resolve.
const sectionsById = new Map(sections.map((s) => [s.id, s]));
const erasById = new Map(eras.map((e) => [e.id, e]));
for (const lesson of lessons) {
  const section = sectionsById.get(lesson.sectionId);
  if (!section) {
    fail(`lesson ${lesson.id} references unknown sectionId ${lesson.sectionId}`);
    continue;
  }
  const era = erasById.get(lesson.eraId);
  if (!era) {
    fail(`lesson ${lesson.id} references unknown eraId ${lesson.eraId}`);
    continue;
  }
  if (section.eraId !== lesson.eraId) {
    fail(
      `lesson ${lesson.id} eraId ${lesson.eraId} disagrees with section ${section.id} eraId ${section.eraId}`,
    );
  }
  if (lesson.dayNumber < section.startDay || lesson.dayNumber > section.endDay) {
    fail(
      `lesson ${lesson.id} dayNumber ${String(lesson.dayNumber)} is outside section range [${String(section.startDay)}..${String(section.endDay)}]`,
    );
  }
}

// 5. Section ranges are contiguous and cover 1..365.
const sortedSections = [...sections].sort((a, b) => a.order - b.order);
let expectedStart = 1;
for (const s of sortedSections) {
  if (s.startDay !== expectedStart) {
    fail(
      `section ${s.id} startDay ${String(s.startDay)} != expected ${String(expectedStart)}`,
    );
  }
  if (s.endDay < s.startDay) {
    fail(
      `section ${s.id} has endDay ${String(s.endDay)} < startDay ${String(s.startDay)}`,
    );
  }
  expectedStart = s.endDay + 1;
}
if (expectedStart !== TOTAL_LESSONS + 1) {
  fail(
    `sections only cover days 1..${String(expectedStart - 1)}, expected 1..${String(TOTAL_LESSONS)}`,
  );
}

// 6. Era year ranges are monotonic (yearStart < yearEnd, era N's yearEnd ≤ era N+1's yearStart-isn't strict; we just check ordering by `order`).
const sortedEras = [...eras].sort((a, b) => a.order - b.order);
for (let i = 0; i < sortedEras.length; i += 1) {
  const e = sortedEras[i];
  if (!e) continue;
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

// 7. Each lesson has at least one content block.
for (const lesson of lessons) {
  if (lesson.content.length === 0) {
    fail(`lesson ${lesson.id} has zero content blocks`);
  }
}

// 8. Reading times are in range.
for (const lesson of lessons) {
  if (
    lesson.readingTimeMinutes < MIN_READING_MINUTES ||
    lesson.readingTimeMinutes > MAX_READING_MINUTES
  ) {
    fail(
      `lesson ${lesson.id} readingTimeMinutes ${String(lesson.readingTimeMinutes)} is outside [${String(MIN_READING_MINUTES)}..${String(MAX_READING_MINUTES)}]`,
    );
  }
}

// 9. Each section has a title array of the right length.
for (const s of sections) {
  const list = lessonTitles[s.id];
  if (!list) {
    fail(`section ${s.id} has no entry in lessonTitles`);
    continue;
  }
  const expected = s.endDay - s.startDay + 1;
  if (list.length !== expected) {
    fail(
      `section ${s.id} titles length ${String(list.length)} != section lesson count ${String(expected)}`,
    );
  }
}

// 10. Sections all share their eraId with their referenced era (eraId resolves).
for (const s of sections) {
  if (!erasById.has(s.eraId)) {
    fail(`section ${s.id} references unknown eraId ${s.eraId}`);
  }
}

// 11. Authored lessons (if any) must include a first paragraph dropcap (matches docs §2).
for (const lesson of lessons) {
  // skip pure stubs (single paragraph, fixed placeholder)
  if (lesson.content.length === 1 && lesson.content[0]?.type === 'paragraph') {
    const onlyBlock = lesson.content[0];
    if (onlyBlock.text === 'Lekcija se uskoro objavljuje.') continue;
  }
  const firstBlock = lesson.content[0];
  if (!firstBlock) continue;
  if (firstBlock.type !== 'paragraph') {
    fail(`authored lesson ${lesson.id} first block is not a paragraph`);
    continue;
  }
  if (!firstBlock.dropcap) {
    fail(`authored lesson ${lesson.id} first paragraph is missing dropcap: true`);
  }
}

if (problems.length === 0) {
  console.log(
    `@learn365/content: istorija-srbije-365 ✓ ${String(lessons.length)} lessons, ${String(sections.length)} sections, ${String(eras.length)} eras.`,
  );
  process.exit(0);
}

console.error(`@learn365/content: ${String(problems.length)} validation problem(s):`);
for (const p of problems) console.error(`  - ${p}`);
process.exit(1);
