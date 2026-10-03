import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { lessonModifiedAt } from '../courses/istorija-srbije-365/_generated.articles.js';

import {
  LESSON_DATES_FILE,
  lessonContentHash,
  readLessonDates,
  serializeLessonDates,
  updateLessonDates,
} from './lessonDates.js';

describe('lesson dates', () => {
  it('hashes values, not formatting', () => {
    const a = JSON.parse('{"id":"day-001","title":"A"}') as unknown;
    const b = JSON.parse('{\n  "id": "day-001",\n  "title": "A"\n}\n') as unknown;
    expect(lessonContentHash(a)).toBe(lessonContentHash(b));
    expect(lessonContentHash(a)).not.toBe(lessonContentHash({ id: 'day-001', title: 'B' }));
    expect(lessonContentHash(a)).toMatch(/^[0-9a-f]{16}$/);
  });

  it('moves a date only when that lesson changed, and drops removed lessons', () => {
    const previous = {
      'day-001': { hash: 'aaaa', modifiedAt: '2026-09-28' },
      'day-002': { hash: 'bbbb', modifiedAt: '2026-09-30' },
      'day-009': { hash: 'zzzz', modifiedAt: '2026-09-01' },
    };
    const hashes = new Map([
      ['day-002', 'cccc'],
      ['day-001', 'aaaa'],
      ['day-003', 'dddd'],
    ]);
    const seen: string[] = [];
    const next = updateLessonDates(previous, hashes, (id) => {
      seen.push(id);
      return '2026-10-03';
    });
    expect(next).toEqual({
      'day-001': { hash: 'aaaa', modifiedAt: '2026-09-28' },
      'day-002': { hash: 'cccc', modifiedAt: '2026-10-03' },
      'day-003': { hash: 'dddd', modifiedAt: '2026-10-03' },
    });
    expect(Object.keys(next)).toEqual(['day-001', 'day-002', 'day-003']);
    expect(seen).toEqual(['day-002', 'day-003']);
  });

  it('is a no-op on a second run (the CI drift check)', () => {
    const hashes = new Map([['day-001', 'aaaa']]);
    const first = updateLessonDates({}, hashes, () => '2026-10-03');
    const second = updateLessonDates(first, hashes, () => '2027-01-01');
    expect(serializeLessonDates(second)).toBe(serializeLessonDates(first));
  });

  it('reads a missing file as empty and rejects a malformed entry', () => {
    const dir = mkdtempSync(join(tmpdir(), 'lesson-dates-'));
    expect(readLessonDates(join(dir, 'missing.json'))).toEqual({});
    const good = join(dir, 'good.json');
    writeFileSync(
      good,
      serializeLessonDates({ 'day-001': { hash: 'aaaa', modifiedAt: '2026-09-28' } }),
    );
    expect(readLessonDates(good)).toEqual({
      'day-001': { hash: 'aaaa', modifiedAt: '2026-09-28' },
    });
    const bad = join(dir, 'bad.json');
    writeFileSync(bad, JSON.stringify({ 'day-001': { hash: 'aaaa', modifiedAt: '28.9.2026.' } }));
    expect(() => readLessonDates(bad)).toThrow(/day-001/);
  });
});

describe('the committed lesson-dates.json', () => {
  const courseDir = resolve(
    dirname(fileURLToPath(import.meta.url)),
    '../../../../content/courses/istorija-srbije-365',
  );
  const dates = readLessonDates(join(courseDir, LESSON_DATES_FILE));

  it('matches every lesson file (else run `pnpm gen-content`)', () => {
    const lessonsDir = join(courseDir, 'lessons');
    const files = readdirSync(lessonsDir).filter((f) => f.endsWith('.json'));
    expect(Object.keys(dates)).toHaveLength(files.length);
    for (const name of files) {
      const parsed = JSON.parse(readFileSync(join(lessonsDir, name), 'utf8')) as { id: string };
      expect(dates[parsed.id]?.hash, parsed.id).toBe(lessonContentHash(parsed));
    }
  });

  it('is what the generated articles module carries', () => {
    const fromFile = Object.fromEntries(
      Object.entries(dates).map(([id, entry]) => [id, entry.modifiedAt]),
    );
    expect({ ...lessonModifiedAt }).toEqual(fromFile);
  });
});
