import { describe, expect, it } from 'vitest';

import { initialsFor } from './AccountMark.js';

describe('initialsFor', () => {
  it('takes the first letter of the first and last word', () => {
    expect(initialsFor('Pavle Kukrić')).toBe('PK');
    expect(initialsFor('Ana Marija Petrović')).toBe('AP');
  });

  it('handles single names, stray whitespace and empty input', () => {
    expect(initialsFor('Ana')).toBe('A');
    expect(initialsFor('  Đorđe   Balašević ')).toBe('ĐB');
    expect(initialsFor('')).toBe('');
    expect(initialsFor('   ')).toBe('');
    expect(initialsFor(null)).toBe('');
  });
});
