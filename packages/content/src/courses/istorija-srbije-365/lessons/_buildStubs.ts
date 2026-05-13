import type { Era, Lesson, LessonId, Section } from '../../../types.js';

import { lessonTitles } from './titles.js';

/**
 * Builds the full 365-lesson list for `istorija-srbije-365` by walking
 * the section list, looking up curated titles, and inserting a single
 * placeholder content block for any lesson not in the authored overlay.
 *
 * This is the function that the lessons barrel calls at module load
 * time — no codegen step, no generated files committed to git.
 *
 * Each lesson's `year` is linearly interpolated across its Era's year
 * range; `readingTimeMinutes` varies deterministically from 6 to 10.
 * Both can be overridden by the authored lesson if present.
 */

const COURSE_ID = 'istorija-srbije-365';
const STUB_PARAGRAPH = 'Lekcija se uskoro objavljuje.';
const FALLBACK_READING_MIN = 6;
const FALLBACK_READING_SPAN = 5;

function interpolateYear(era: Era, day: number, eraStartDay: number, eraEndDay: number): number {
  const span = eraEndDay - eraStartDay;
  if (span <= 0) return era.yearStart;
  const t = (day - eraStartDay) / span;
  return Math.round(era.yearStart + t * (era.yearEnd - era.yearStart));
}

function stubReadingTime(day: number): number {
  return FALLBACK_READING_MIN + ((day * 7) % FALLBACK_READING_SPAN);
}

function eraDayRange(sections: readonly Section[], eraId: string): {
  startDay: number;
  endDay: number;
} {
  let startDay = Number.POSITIVE_INFINITY;
  let endDay = Number.NEGATIVE_INFINITY;
  for (const s of sections) {
    if (s.eraId !== eraId) continue;
    if (s.startDay < startDay) startDay = s.startDay;
    if (s.endDay > endDay) endDay = s.endDay;
  }
  return { startDay, endDay };
}

function stubTitleFor(section: Section, positionInSection: number): string {
  const list = lessonTitles[section.id];
  const fromList = list?.[positionInSection - 1];
  if (fromList) return fromList;
  return `${section.title} — lekcija ${String(positionInSection)}`;
}

function pad3(n: number): string {
  return String(n).padStart(3, '0');
}

export function lessonIdFor(section: Section, positionInSection: number): LessonId {
  return `${section.id}-${pad3(positionInSection)}`;
}

/**
 * Build all 365 lessons. Authored lessons (provided as a map keyed by
 * lesson id) replace their stub counterparts; the validator enforces
 * that every authored lesson matches its position metadata.
 */
export function buildAllLessons(args: {
  readonly eras: readonly Era[];
  readonly sections: readonly Section[];
  readonly authored?: Readonly<Record<LessonId, Lesson>>;
}): readonly Lesson[] {
  const { eras, sections, authored = {} } = args;

  // Pre-compute the day range for each era so we don't rescan per-lesson.
  const eraRangeById = new Map<string, { startDay: number; endDay: number }>();
  for (const era of eras) {
    eraRangeById.set(era.id, eraDayRange(sections, era.id));
  }

  const out: Lesson[] = [];
  const sorted = [...sections].sort((a, b) => a.order - b.order);

  for (const section of sorted) {
    const era = eras.find((e) => e.id === section.eraId);
    if (!era) {
      throw new Error(
        `Section ${section.id} references unknown era ${section.eraId}`,
      );
    }
    const eraRange = eraRangeById.get(era.id);
    if (!eraRange) {
      throw new Error(`No day range computed for era ${era.id}`);
    }

    const sectionLessonCount = section.endDay - section.startDay + 1;
    for (let i = 0; i < sectionLessonCount; i += 1) {
      const positionInSection = i + 1;
      const dayNumber = section.startDay + i;
      const id = lessonIdFor(section, positionInSection);
      const authoredLesson = authored[id];
      if (authoredLesson) {
        out.push(authoredLesson);
        continue;
      }
      out.push({
        id,
        courseId: COURSE_ID,
        sectionId: section.id,
        eraId: section.eraId,
        dayNumber,
        order: positionInSection,
        title: stubTitleFor(section, positionInSection),
        readingTimeMinutes: stubReadingTime(dayNumber),
        year: interpolateYear(era, dayNumber, eraRange.startDay, eraRange.endDay),
        content: [{ type: 'paragraph', text: STUB_PARAGRAPH }],
      });
    }
  }

  return out;
}
