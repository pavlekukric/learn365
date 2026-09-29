import 'server-only';

import { getCourse, getLessonById } from '@learn365/content';

/**
 * Request validation for the progress / bookmark routes. The content
 * package is on the server, so ids are checked against it: unknown lesson
 * ids are *dropped and counted*, never a reason to fail a request — a stale
 * local cache must not be able to lock a reader out of sync.
 */
export const MAX_IDS = 400;

export function parseCourseId(value: unknown): string | null {
  return typeof value === 'string' && getCourse(value) !== null ? value : null;
}

export interface ParsedIds {
  readonly ids: readonly string[];
  readonly dropped: number;
}

/**
 * Absent → empty. Anything but an array of at most `MAX_IDS` entries → `null`
 * (bad request). Non-strings and ids unknown to the course are dropped;
 * duplicates collapse.
 */
export function parseLessonIds(courseId: string, value: unknown): ParsedIds | null {
  if (value === undefined) return { ids: [], dropped: 0 };
  if (!Array.isArray(value) || value.length > MAX_IDS) return null;
  const ids = new Set<string>();
  let dropped = 0;
  for (const item of value) {
    if (typeof item === 'string' && getLessonById(courseId, item) !== null) {
      ids.add(item);
    } else {
      dropped += 1;
    }
  }
  return { ids: [...ids], dropped };
}

/** `undefined` = not provided; `null` = clear; a known id = set; an unknown id = ignored. */
export function parseLastOpened(courseId: string, value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return typeof value === 'string' && getLessonById(courseId, value) !== null ? value : undefined;
}

/** Normalised ISO string, or `null` when missing / unparseable. */
export function parseIsoTimestamp(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const millis = Date.parse(value);
  return Number.isNaN(millis) ? null : new Date(millis).toISOString();
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
