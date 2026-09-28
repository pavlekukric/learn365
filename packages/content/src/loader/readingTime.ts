/**
 * Reading time is derived from the lesson text, never authored (Phase 11).
 *
 * The loader assigns `Lesson.readingTimeMinutes` from `estimateReadingMinutes`
 * and `Course.estimatedMinutesPerLesson` from `medianReadingMinutes`, so the
 * numbers a reader sees cannot disagree with the words they are about to
 * read. The JSON files carry neither field (the loader rejects them).
 */

import type { Lesson, LessonBlock } from '../types.js';

/**
 * Attentive reading pace for Serbian prose, in words per minute. 200+ wpm is
 * skimming; the authoring guideline (700–1100 words per lesson) reads as
 * 5–8 minutes at this pace, and the 2026-09-28 corpus (622–1026 words) as
 * 5–7.
 */
export const WORDS_PER_MINUTE = 150;

const HAS_LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;

/**
 * Whitespace-separated tokens that carry at least one letter or digit — a
 * lone em dash or quotation mark is not a word. Counts `paragraph`,
 * `heading` and `quote` text; image `alt` / `caption` are a glance, not
 * reading, and are left out.
 */
export function countWords(blocks: readonly LessonBlock[]): number {
  let words = 0;
  for (const block of blocks) {
    if (block.type === 'image') continue;
    for (const token of block.text.split(/\s+/)) {
      if (HAS_LETTER_OR_DIGIT.test(token)) words += 1;
    }
  }
  return words;
}

/** `max(1, ceil(words / WORDS_PER_MINUTE))` — never 0, even for a stub body. */
export function estimateReadingMinutes(blocks: readonly LessonBlock[]): number {
  return Math.max(1, Math.ceil(countWords(blocks) / WORDS_PER_MINUTE));
}

/** Median of the lessons' reading minutes (upper median for an even count); 0 for no lessons. */
export function medianReadingMinutes(
  lessons: readonly Pick<Lesson, 'readingTimeMinutes'>[],
): number {
  if (lessons.length === 0) return 0;
  const sorted = lessons.map((l) => l.readingTimeMinutes).sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}
