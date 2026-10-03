import { describe, expect, it } from 'vitest';

import { isImplicitSignOut, storageChangeNeedsRecheck } from './implicitSignOut';
import { BOOKMARKS_MARKER_KEY, PROGRESS_MARKER_KEY } from './localKeys';

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

describe('storageChangeNeedsRecheck', () => {
  const marker = (userId: string) =>
    JSON.stringify({ userId, syncedAt: '2026-10-03T08:00:00.000Z' });

  it('is true when another tab clears storage or removes a marker (a sign-out)', () => {
    expect(storageChangeNeedsRecheck(null, null, 'u1')).toBe(true);
    expect(storageChangeNeedsRecheck(PROGRESS_MARKER_KEY, null, 'u1')).toBe(true);
    expect(storageChangeNeedsRecheck(BOOKMARKS_MARKER_KEY, null, 'u1')).toBe(true);
  });

  it('is true when a marker now names another account (review 2026-10-03 P1 item 2)', () => {
    expect(storageChangeNeedsRecheck(PROGRESS_MARKER_KEY, marker('u2'), 'u1')).toBe(true);
    expect(storageChangeNeedsRecheck(BOOKMARKS_MARKER_KEY, marker('u2'), null)).toBe(true);
  });

  it("is false for a marker naming this tab's account and for unrelated keys", () => {
    expect(storageChangeNeedsRecheck(PROGRESS_MARKER_KEY, marker('u1'), 'u1')).toBe(false);
    expect(storageChangeNeedsRecheck('learn365:progress:v1', null, 'u1')).toBe(false);
  });
});
