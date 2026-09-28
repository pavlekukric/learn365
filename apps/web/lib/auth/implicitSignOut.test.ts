import { describe, expect, it } from 'vitest';

import { isImplicitSignOut } from './implicitSignOut';

describe('isImplicitSignOut', () => {
  it('is true only when accounts are on, nobody is signed in and a marker exists', () => {
    expect(isImplicitSignOut({ enabled: true, user: null }, true)).toBe(true);
  });

  it('is false for an anonymous reader who never merged into an account', () => {
    expect(isImplicitSignOut({ enabled: true, user: null }, false)).toBe(false);
  });

  it('is false while someone is signed in', () => {
    expect(isImplicitSignOut({ enabled: true, user: { id: 'u1' } }, true)).toBe(false);
  });

  it('is false when accounts are off or the database is unreachable', () => {
    expect(isImplicitSignOut({ enabled: false, user: null }, true)).toBe(false);
  });
});
