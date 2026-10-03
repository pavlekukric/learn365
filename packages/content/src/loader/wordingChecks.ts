/**
 * House-style wording checks for a lesson's reader-visible strings
 * (review 2026-10-03 P1 item 3). Pure: `validateContentFiles` turns every
 * returned message into a validation error, so a slip fixed once in the
 * corpus cannot come back unnoticed.
 *
 * Sources (titles, authors, URLs) are not checked: they quote external
 * works in their own spelling.
 */

import type { Lesson } from '../types.js';

/** Share previews cut the description around here (CONTENT_MODEL `summary`). */
export const MAX_SUMMARY_LENGTH = 160;

interface WordingRule {
  readonly pattern: RegExp;
  readonly message: string;
}

const WORDING_RULES: readonly WordingRule[] = [
  // Serbian quotes open with „ and close with ” (U+201D); “ (U+201C) is the English opener.
  { pattern: /“/, message: 'uses “ (U+201C); close „…” with ” (U+201D)' },
  { pattern: /"/, message: 'uses an ASCII " quote; use „…”' },
  // „1878.Pravac” — an ordinal number's period must be followed by a space.
  { pattern: /\d\.\p{L}/u, message: 'has a number-period-letter run with no space' },
  // Turkish letters: write the Serbian Latin transliteration (Pazvan-Oglu, Nizam-i).
  { pattern: /[ğıİş]/, message: 'uses a Turkish letter (ğ / ı / İ / ş); transliterate' },
];

function displayStrings(lesson: Lesson): readonly [field: string, text: string][] {
  const out: [string, string][] = [['title', lesson.title]];
  if (lesson.subtitle !== undefined) out.push(['subtitle', lesson.subtitle]);
  if (lesson.summary !== undefined) out.push(['summary', lesson.summary]);
  if (lesson.dateLabel !== undefined) out.push(['dateLabel', lesson.dateLabel]);
  if (lesson.timelinePosition !== undefined) {
    out.push(['timelinePosition', lesson.timelinePosition]);
  }
  lesson.keyPeople?.forEach((p, i) => out.push([`keyPeople[${String(i)}]`, p]));
  lesson.keyPlaces?.forEach((p, i) => out.push([`keyPlaces[${String(i)}]`, p]));
  lesson.content.forEach((block, i) => {
    const at = `content[${String(i)}]`;
    if (block.type === 'image') {
      out.push([`${at}.alt`, block.alt]);
      if (block.caption !== undefined) out.push([`${at}.caption`, block.caption]);
    } else {
      out.push([`${at}.text`, block.text]);
      if (block.type === 'quote' && block.attribution !== undefined) {
        out.push([`${at}.attribution`, block.attribution]);
      }
    }
  });
  return out;
}

/** Every house-style slip in one lesson, as `"<lesson id> <field> <problem>"` messages. */
export function lessonWordingProblems(lesson: Lesson): string[] {
  const problems: string[] = [];
  for (const [field, text] of displayStrings(lesson)) {
    for (const rule of WORDING_RULES) {
      if (rule.pattern.test(text)) problems.push(`lesson ${lesson.id} ${field} ${rule.message}`);
    }
  }
  if (lesson.summary !== undefined && lesson.summary.length > MAX_SUMMARY_LENGTH) {
    problems.push(
      `lesson ${lesson.id} summary length ${String(lesson.summary.length)} exceeds max ${String(MAX_SUMMARY_LENGTH)}`,
    );
  }
  if (lesson.dateLabel !== undefined && !/\d/.test(lesson.dateLabel)) {
    problems.push(
      `lesson ${lesson.id} dateLabel "${lesson.dateLabel}" contains no date (no digit)`,
    );
  }
  return problems;
}
