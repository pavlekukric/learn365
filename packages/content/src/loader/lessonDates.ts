/**
 * When did each lesson's text last change? (review 2026-10-03 P2 9.)
 *
 * The sitemap `lastmod`, the lesson JSON-LD `dateModified` and
 * `article:modified_time` need a truthful per-lesson date. Git knows it, but
 * git is not there when it is needed: the Docker build has no `.git`, CI
 * checks out two commits, and a lesson edited in the working tree has no
 * commit yet. So the date is recorded next to the content instead:
 * `lesson-dates.json` maps every lesson id to a hash of its JSON and the day
 * that hash was first seen. `pnpm gen-content` rehashes every lesson and
 * moves a date only when the hash moved — re-running it on another day, or in
 * CI's drift check, changes nothing.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';

export const LESSON_DATES_FILE = 'lesson-dates.json';

export interface LessonDateEntry {
  /** First 16 hex digits of the SHA-256 of the lesson's JSON (whitespace-insensitive). */
  readonly hash: string;
  /** `YYYY-MM-DD`: the day this hash was first recorded. */
  readonly modifiedAt: string;
}

export type LessonDates = Readonly<Record<string, LessonDateEntry>>;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Hash of a parsed lesson file. Re-indenting the file does not change it; any edit to a value does. */
export function lessonContentHash(parsedJson: unknown): string {
  return createHash('sha256').update(JSON.stringify(parsedJson)).digest('hex').slice(0, 16);
}

/**
 * The next date map: an entry whose hash is unchanged keeps its date; a
 * changed or new lesson gets `firstSeen(id)` (gen-content: the file's last
 * commit date when git can vouch for it, else today); a removed lesson
 * drops out. Keys come out sorted, so the file diffs cleanly.
 */
export function updateLessonDates(
  previous: LessonDates,
  hashes: ReadonlyMap<string, string>,
  firstSeen: (lessonId: string) => string,
): LessonDates {
  const next: Record<string, LessonDateEntry> = {};
  for (const id of [...hashes.keys()].sort()) {
    const hash = hashes.get(id);
    if (hash === undefined) continue;
    const known = previous[id];
    next[id] = known?.hash === hash ? known : { hash, modifiedAt: firstSeen(id) };
  }
  return next;
}

function isEntry(value: unknown): value is LessonDateEntry {
  if (typeof value !== 'object' || value === null) return false;
  const { hash, modifiedAt } = value as Record<string, unknown>;
  return typeof hash === 'string' && typeof modifiedAt === 'string' && ISO_DATE.test(modifiedAt);
}

/** The recorded map, or an empty one when the file does not exist yet. */
export function readLessonDates(file: string): LessonDates {
  if (!existsSync(file)) return {};
  const raw: unknown = JSON.parse(readFileSync(file, 'utf8'));
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error(`${file}: top-level value must be an object`);
  }
  const out: Record<string, LessonDateEntry> = {};
  for (const [id, entry] of Object.entries(raw)) {
    if (!isEntry(entry))
      throw new Error(`${file}: entry "${id}" must be { hash, modifiedAt: YYYY-MM-DD }`);
    out[id] = { hash: entry.hash, modifiedAt: entry.modifiedAt };
  }
  return out;
}

export function serializeLessonDates(dates: LessonDates): string {
  return `${JSON.stringify(dates, null, 2)}\n`;
}
