import { describe, expect, it } from 'vitest';

import { META_DESCRIPTION_MAX, truncateDescription } from './description';

describe('truncateDescription', () => {
  it('keeps a short text as-is (whitespace collapsed)', () => {
    expect(truncateDescription('  Kratak   opis lekcije. ')).toBe('Kratak opis lekcije.');
  });

  it('keeps a text of exactly the limit', () => {
    const text = 'a'.repeat(META_DESCRIPTION_MAX);
    expect(truncateDescription(text)).toBe(text);
  });

  it('cuts a long text at a word boundary and ends with an ellipsis', () => {
    const text =
      'Stefan Nemanja ujedinjuje srpske zemlje, a njegov sin Sava osniva samostalnu crkvu; ' +
      'dinastija Nemanjića vlada Srbijom gotovo dva veka i ostavlja zadužbine koje i danas stoje.';
    const out = truncateDescription(text);
    expect(out.length).toBeLessThanOrEqual(META_DESCRIPTION_MAX);
    expect(out.endsWith('…')).toBe(true);
    const body = out.slice(0, -1);
    // The cut lands on a whole word of the original.
    expect(text.startsWith(body)).toBe(true);
    expect(text.charAt(body.length)).toMatch(/[\s,;:.]/);
  });

  it('drops dangling punctuation before the ellipsis', () => {
    expect(truncateDescription('jedan dva, tri četiri', 12)).toBe('jedan dva…');
    expect(truncateDescription('jedan — dva tri', 10)).toBe('jedan…');
  });

  it('hard-cuts a single word longer than the limit', () => {
    const out = truncateDescription('x'.repeat(200), 20);
    expect(out).toBe(`${'x'.repeat(19)}…`);
  });

  it('respects the limit for every length around it', () => {
    const words = 'reč '.repeat(60);
    for (let max = 20; max <= 160; max += 1) {
      expect(truncateDescription(words, max).length).toBeLessThanOrEqual(max);
    }
  });
});
