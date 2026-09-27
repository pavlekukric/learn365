import { describe, expect, it } from 'vitest';

import { sanitizeReturnTo } from './returnTo';

describe('sanitizeReturnTo', () => {
  it('keeps same-origin paths', () => {
    expect(sanitizeReturnTo('/')).toBe('/');
    expect(sanitizeReturnTo('/course/istorija-srbije-365/lesson/day-002')).toBe(
      '/course/istorija-srbije-365/lesson/day-002',
    );
    expect(sanitizeReturnTo('/nalog?x=1#top')).toBe('/nalog?x=1#top');
  });

  it.each([
    ['absolute URL', 'https://evil.example/'],
    ['protocol-relative', '//evil.example/'],
    ['backslash protocol-relative', '/\\evil.example'],
    ['no leading slash', 'course/x'],
    ['empty', ''],
    ['whitespace', '/a b'],
    ['control character', '/a\nb'],
    ['too long', '/' + 'a'.repeat(600)],
    ['null', null],
    ['undefined', undefined],
  ])('falls back to home for %s', (_label, raw) => {
    expect(sanitizeReturnTo(raw)).toBe('/');
  });

  it('honours a custom fallback', () => {
    expect(sanitizeReturnTo('https://x', '/course')).toBe('/course');
  });
});
