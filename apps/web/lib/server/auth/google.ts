import 'server-only';

import { createHash, randomBytes } from 'node:crypto';

/**
 * Google sign-in, authorization-code flow with PKCE, written against the
 * OAuth 2.0 / OpenID Connect endpoints directly — one provider, no client
 * library. The ID token is received straight from Google's token endpoint
 * over TLS, so its claims are checked (issuer, audience, expiry, verified
 * email) but its signature is not re-verified; that is the documented
 * shortcut for this flow. Nothing here stores or reuses Google tokens.
 */
export const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
export const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
export const GOOGLE_SCOPES = ['openid', 'email', 'profile'] as const;

const GOOGLE_ISSUERS: ReadonlySet<string> = new Set([
  'https://accounts.google.com',
  'accounts.google.com',
]);

/** 256-bit random value, base64url — used for `state` and the PKCE verifier. */
export function randomToken(): string {
  return randomBytes(32).toString('base64url');
}

/** RFC 7636 `S256` code challenge for a verifier. */
export function codeChallengeS256(codeVerifier: string): string {
  return createHash('sha256').update(codeVerifier).digest('base64url');
}

/** The redirect URI registered with Google, derived from the public origin. */
export function googleRedirectUri(appUrl: string): string {
  return `${appUrl}/api/auth/google/callback`;
}

export interface AuthorizationUrlInput {
  readonly clientId: string;
  readonly redirectUri: string;
  readonly state: string;
  readonly codeVerifier: string;
}

export function buildAuthorizationUrl(input: AuthorizationUrlInput): URL {
  const url = new URL(GOOGLE_AUTH_ENDPOINT);
  const params = url.searchParams;
  params.set('client_id', input.clientId);
  params.set('redirect_uri', input.redirectUri);
  params.set('response_type', 'code');
  params.set('scope', GOOGLE_SCOPES.join(' '));
  params.set('state', input.state);
  params.set('code_challenge', codeChallengeS256(input.codeVerifier));
  params.set('code_challenge_method', 'S256');
  return url;
}

export class GoogleTokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GoogleTokenError';
  }
}

export interface TokenExchangeInput {
  readonly clientId: string;
  readonly clientSecret: string;
  readonly redirectUri: string;
  readonly code: string;
  readonly codeVerifier: string;
}

/** Swap the authorization code for tokens; only the ID token is used. */
export async function exchangeAuthorizationCode(
  input: TokenExchangeInput,
  fetchImpl: typeof fetch = fetch,
): Promise<{ idToken: string }> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: input.code,
    client_id: input.clientId,
    client_secret: input.clientSecret,
    redirect_uri: input.redirectUri,
    code_verifier: input.codeVerifier,
  });
  const response = await fetchImpl(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body,
  });
  if (!response.ok) {
    throw new GoogleTokenError(`token endpoint answered ${String(response.status)}`);
  }
  const json = (await response.json()) as { id_token?: unknown };
  if (typeof json.id_token !== 'string' || json.id_token.length === 0) {
    throw new GoogleTokenError('token response carries no id_token');
  }
  return { idToken: json.id_token };
}

export class IdTokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IdTokenError';
  }
}

/** Decode a JWT payload without verifying its signature (see module note). */
export function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split('.');
  if (parts.length !== 3 || parts[1] === undefined || parts[1].length === 0) {
    throw new IdTokenError('malformed token');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch {
    throw new IdTokenError('payload is not JSON');
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new IdTokenError('payload is not an object');
  }
  return parsed as Record<string, unknown>;
}

export interface GoogleIdentity {
  readonly sub: string;
  readonly email: string;
  readonly name: string | null;
  readonly picture: string | null;
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/** Check the claims we rely on and reduce them to what the app keeps. */
export function verifyIdTokenClaims(
  claims: Record<string, unknown>,
  options: { readonly clientId: string; readonly now?: number },
): GoogleIdentity {
  const now = options.now ?? Date.now();
  const { iss, aud, exp, sub, email } = claims;
  if (typeof iss !== 'string' || !GOOGLE_ISSUERS.has(iss)) {
    throw new IdTokenError('unexpected issuer');
  }
  const audienceOk =
    typeof aud === 'string' ? aud === options.clientId : Array.isArray(aud) && aud.includes(options.clientId);
  if (!audienceOk) {
    throw new IdTokenError('unexpected audience');
  }
  if (typeof exp !== 'number' || !Number.isFinite(exp) || exp * 1000 <= now) {
    throw new IdTokenError('token expired');
  }
  if (typeof sub !== 'string' || sub.length === 0) {
    throw new IdTokenError('missing subject');
  }
  if (typeof email !== 'string' || email.length === 0) {
    throw new IdTokenError('missing email');
  }
  if (claims['email_verified'] !== true) {
    throw new IdTokenError('email not verified');
  }
  return { sub, email, name: optionalString(claims['name']), picture: optionalString(claims['picture']) };
}
