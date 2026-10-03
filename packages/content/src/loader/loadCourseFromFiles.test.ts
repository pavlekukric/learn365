import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

import { ContentLoadError, loadCourseFromFiles } from './loadCourseFromFiles.js';

const COURSE_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../../content/courses/istorija-srbije-365',
);

/** A throwaway copy of the real course with Day 1's JSON patched. */
function courseWithDay1(patch: Record<string, unknown>): string {
  const dir = mkdtempSync(join(tmpdir(), 'learn365-loader-'));
  cpSync(COURSE_DIR, dir, { recursive: true });
  const file = join(dir, 'lessons', 'day-001.json');
  const lesson = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
  writeFileSync(file, JSON.stringify({ ...lesson, ...patch }));
  return dir;
}

describe('loadCourseFromFiles — lastReviewedAt (review 2026-10-03 P1 4)', () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  it('refuses a review date without a named reviewer', () => {
    const dir = courseWithDay1({ lastReviewedAt: '2026-10-01' });
    dirs.push(dir);
    expect(() => loadCourseFromFiles(dir)).toThrow(ContentLoadError);
    expect(() => loadCourseFromFiles(dir)).toThrow(/byline\.reviewer/);
  });

  it('accepts it next to byline.reviewer', () => {
    const dir = courseWithDay1({
      lastReviewedAt: '2026-10-01',
      byline: { reviewer: 'Ime Prezime' },
    });
    dirs.push(dir);
    const day1 = loadCourseFromFiles(dir).lessons[0];
    expect(day1?.lastReviewedAt).toBe('2026-10-01');
    expect(day1?.byline?.reviewer).toBe('Ime Prezime');
  });
});
