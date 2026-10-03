import { describe, expect, it } from 'vitest';

import {
  SESSION_COOKIE,
  SESSION_COOKIE_HOST,
  clearSessionCookies,
  readSessionToken,
  sessionCookieName,
} from './session';

function reader(jar: Record<string, string>) {
  return {
    get: (name: string) => (name in jar ? { value: jar[name] ?? '' } : undefined),
  };
}

function writer() {
  const calls: { name: string; value: string; maxAge: number | undefined }[] = [];
  return {
    calls,
    set: (name: string, value: string, attributes: { readonly maxAge?: number }) => {
      calls.push({ name, value, maxAge: attributes.maxAge });
    },
  };
}

describe('session cookie names (Phase 14)', () => {
  it('uses the __Host- prefix on https and the plain name on http', () => {
    expect(sessionCookieName(true)).toBe(SESSION_COOKIE_HOST);
    expect(sessionCookieName(false)).toBe(SESSION_COOKIE);
    expect(SESSION_COOKIE_HOST.startsWith('__Host-')).toBe(true);
  });

  it('reads the __Host- cookie first', () => {
    const read = readSessionToken(
      reader({ [SESSION_COOKIE_HOST]: 'new', [SESSION_COOKIE]: 'old' }),
      true,
    );
    expect(read).toEqual({ token: 'new' });
  });

  it('never reads the plain name on https — a subdomain could plant it', () => {
    expect(readSessionToken(reader({ [SESSION_COOKIE]: 'planted' }), true)).toBeNull();
  });

  it('ignores empty values and answers null when nothing is set', () => {
    expect(readSessionToken(reader({ [SESSION_COOKIE_HOST]: '' }), true)).toBeNull();
    expect(readSessionToken(reader({}), true)).toBeNull();
    expect(readSessionToken(reader({}), false)).toBeNull();
  });

  it('on http the plain name is the session cookie', () => {
    expect(readSessionToken(reader({ [SESSION_COOKIE]: 'x' }), false)).toEqual({ token: 'x' });
    // A __Host- cookie cannot exist on http; it is not consulted there.
    expect(readSessionToken(reader({ [SESSION_COOKIE_HOST]: 'y' }), false)).toBeNull();
  });

  it('clears both names on https and only the plain one on http', () => {
    const secure = writer();
    clearSessionCookies(secure, true);
    expect(secure.calls.map((c) => c.name).sort()).toEqual(
      [SESSION_COOKIE_HOST, SESSION_COOKIE].sort(),
    );
    expect(secure.calls.every((c) => c.value === '' && c.maxAge === 0)).toBe(true);

    const plain = writer();
    clearSessionCookies(plain, false);
    expect(plain.calls.map((c) => c.name)).toEqual([SESSION_COOKIE]);
  });
});
