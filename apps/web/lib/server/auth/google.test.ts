import { describe, expect, it } from 'vitest';

import {
  GOOGLE_TOKEN_ENDPOINT,
  GoogleTokenError,
  IdTokenError,
  buildAuthorizationUrl,
  codeChallengeS256,
  decodeJwtPayload,
  exchangeAuthorizationCode,
  googleRedirectUri,
  randomToken,
  verifyIdTokenClaims,
} from './google';

const CLIENT_ID = 'client-123.apps.googleusercontent.com';
const NOW = Date.parse('2026-09-27T10:00:00.000Z');

function b64url(value: object): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

function jwt(payload: object): string {
  return `${b64url({ alg: 'RS256', typ: 'JWT' })}.${b64url(payload)}.signature`;
}

const validClaims = {
  iss: 'https://accounts.google.com',
  aud: CLIENT_ID,
  exp: Math.floor(NOW / 1000) + 3600,
  sub: '1234567890',
  email: 'reader@example.com',
  email_verified: true,
  name: 'Reader One',
  picture: 'https://lh3.googleusercontent.com/a/photo',
};

describe('PKCE', () => {
  it('matches the RFC 7636 S256 test vector', () => {
    expect(codeChallengeS256('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')).toBe(
      'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
    );
  });

  it('mints 43-character base64url tokens that differ every time', () => {
    const a = randomToken();
    const b = randomToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(a).not.toBe(b);
  });
});

describe('authorization URL', () => {
  it('carries the client, redirect, scopes, state and S256 challenge', () => {
    const url = buildAuthorizationUrl({
      clientId: CLIENT_ID,
      redirectUri: googleRedirectUri('https://istorija365.com'),
      state: 'state-1',
      codeVerifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
    });
    expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
    const p = url.searchParams;
    expect(p.get('client_id')).toBe(CLIENT_ID);
    expect(p.get('redirect_uri')).toBe('https://istorija365.com/api/auth/google/callback');
    expect(p.get('response_type')).toBe('code');
    expect(p.get('scope')).toBe('openid email profile');
    expect(p.get('state')).toBe('state-1');
    expect(p.get('code_challenge')).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
    expect(p.get('code_challenge_method')).toBe('S256');
    expect(p.has('access_type')).toBe(false);
  });
});

describe('ID token claims', () => {
  it('decodes the payload and accepts a valid Google token', () => {
    const identity = verifyIdTokenClaims(decodeJwtPayload(jwt(validClaims)), {
      clientId: CLIENT_ID,
      now: NOW,
    });
    expect(identity).toEqual({
      sub: '1234567890',
      email: 'reader@example.com',
      name: 'Reader One',
      picture: 'https://lh3.googleusercontent.com/a/photo',
    });
  });

  it('accepts the bare issuer and an audience array; missing name/picture become null', () => {
    const identity = verifyIdTokenClaims(
      {
        ...validClaims,
        iss: 'accounts.google.com',
        aud: ['other', CLIENT_ID],
        name: undefined,
        picture: '',
      },
      { clientId: CLIENT_ID, now: NOW },
    );
    expect(identity.name).toBeNull();
    expect(identity.picture).toBeNull();
  });

  it.each([
    ['issuer', { iss: 'https://evil.example' }],
    ['audience', { aud: 'someone-else' }],
    ['expiry', { exp: Math.floor(NOW / 1000) - 1 }],
    ['subject', { sub: '' }],
    ['email', { email: undefined }],
    ['unverified email', { email_verified: false }],
  ])('rejects a token with a bad %s', (_label, override) => {
    expect(() =>
      verifyIdTokenClaims({ ...validClaims, ...override }, { clientId: CLIENT_ID, now: NOW }),
    ).toThrow(IdTokenError);
  });

  it('rejects malformed tokens', () => {
    expect(() => decodeJwtPayload('not-a-jwt')).toThrow(IdTokenError);
    expect(() => decodeJwtPayload('a..c')).toThrow(IdTokenError);
    expect(() => decodeJwtPayload(`a.${Buffer.from('[]').toString('base64url')}.c`)).toThrow(
      IdTokenError,
    );
  });
});

describe('code exchange', () => {
  const input = {
    clientId: CLIENT_ID,
    clientSecret: 'secret',
    redirectUri: 'https://istorija365.com/api/auth/google/callback',
    code: 'code-1',
    codeVerifier: 'verifier-1',
  };

  it('posts the form to the token endpoint and returns the id_token', async () => {
    let seen: { url: string; body: string; method: string | undefined } | null = null;
    const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
      seen = { url: String(url), body: String(init?.body), method: init?.method };
      return new Response(JSON.stringify({ id_token: 'id.token.here', access_token: 'x' }), {
        status: 200,
      });
    }) as unknown as typeof fetch;

    await expect(exchangeAuthorizationCode(input, fetchImpl)).resolves.toEqual({
      idToken: 'id.token.here',
    });
    expect(seen).not.toBeNull();
    const request = seen as unknown as { url: string; body: string; method: string | undefined };
    expect(request.url).toBe(GOOGLE_TOKEN_ENDPOINT);
    expect(request.method).toBe('POST');
    const form = new URLSearchParams(request.body);
    expect(form.get('grant_type')).toBe('authorization_code');
    expect(form.get('code')).toBe('code-1');
    expect(form.get('code_verifier')).toBe('verifier-1');
    expect(form.get('client_secret')).toBe('secret');
  });

  it('fails on a non-2xx answer or a response without id_token', async () => {
    const bad = (async () => new Response('nope', { status: 400 })) as unknown as typeof fetch;
    await expect(exchangeAuthorizationCode(input, bad)).rejects.toThrow(GoogleTokenError);
    const empty = (async () =>
      new Response(JSON.stringify({}), { status: 200 })) as unknown as typeof fetch;
    await expect(exchangeAuthorizationCode(input, empty)).rejects.toThrow(GoogleTokenError);
  });
});
