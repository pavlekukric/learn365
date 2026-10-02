import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { inUnicodeRange, SERBIAN_LATIN_RANGE } from './serbianLatin';

const here = (relative: string) => fileURLToPath(new URL(relative, import.meta.url));

function jsonFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return jsonFiles(path);
    return name.endsWith('.json') ? [path] : [];
  });
}

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value !== null && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('self-hosted font subset', () => {
  it('every localFont call declares SERBIAN_LATIN_RANGE', () => {
    const source = readFileSync(here('./fonts.ts'), 'utf8');
    const calls = source.match(/localFont\(/g) ?? [];
    const ranges = source.split(SERBIAN_LATIN_RANGE).length - 1;
    expect(calls.length).toBeGreaterThan(0);
    expect(ranges).toBe(calls.length);
  });

  it('covers every character the course content uses', () => {
    const outside = new Map<string, string>();
    for (const file of jsonFiles(here('../../../../content/courses'))) {
      const text = strings(JSON.parse(readFileSync(file, 'utf8')) as unknown).join('\n');
      for (const char of text) {
        const codePoint = char.codePointAt(0) ?? 0;
        if (codePoint < 0x20) continue; // newlines, tabs
        if (!inUnicodeRange(SERBIAN_LATIN_RANGE, codePoint) && !outside.has(char)) {
          outside.set(char, file);
        }
      }
    }
    // A new character here renders in the fallback face: add it to the range
    // in serbianLatin.ts, fonts.ts and subset-fonts.sh, then re-run the script.
    expect(Object.fromEntries(outside)).toEqual({});
  });
});
