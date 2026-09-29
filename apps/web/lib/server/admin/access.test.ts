import { describe, expect, it } from 'vitest';

import { resolveOverviewAccess } from './access';

describe('resolveOverviewAccess', () => {
  it('does not exist while accounts are off, whoever asks', () => {
    expect(resolveOverviewAccess({ authEnabled: false, user: null })).toBe('not-found');
    expect(resolveOverviewAccess({ authEnabled: false, user: { isAdmin: true } })).toBe(
      'not-found',
    );
  });

  it('sends a signed-out visitor to sign in', () => {
    expect(resolveOverviewAccess({ authEnabled: true, user: null })).toBe('sign-in');
  });

  it('does not exist for a signed-in account without the flag', () => {
    expect(resolveOverviewAccess({ authEnabled: true, user: { isAdmin: false } })).toBe(
      'not-found',
    );
  });

  it('opens for an account with the flag', () => {
    expect(resolveOverviewAccess({ authEnabled: true, user: { isAdmin: true } })).toBe('allow');
  });
});
