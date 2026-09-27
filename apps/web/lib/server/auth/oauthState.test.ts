import { describe, expect, it } from 'vitest';

import { decodeOAuthState, encodeOAuthState, oauthCookieAttributes } from './oauthState';

describe('oauth state cookie', () => {
  it('round-trips state, verifier and return path', () => {
    const value = { state: 's', codeVerifier: 'v', returnTo: '/course' };
    expect(decodeOAuthState(encodeOAuthState(value))).toEqual(value);
  });

  it('returns null for missing, garbled or incomplete values', () => {
    expect(decodeOAuthState(undefined)).toBeNull();
    expect(decodeOAuthState('')).toBeNull();
    expect(decodeOAuthState('!!!')).toBeNull();
    expect(decodeOAuthState(Buffer.from('"str"').toString('base64url'))).toBeNull();
    expect(
      decodeOAuthState(Buffer.from(JSON.stringify({ state: 's' })).toString('base64url')),
    ).toBeNull();
  });

  it('is short-lived, http-only and lax', () => {
    expect(oauthCookieAttributes(true)).toEqual({
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: 600,
    });
    expect(oauthCookieAttributes(false, 0).maxAge).toBe(0);
  });
});
