import 'server-only';

/**
 * The short-lived cookie that carries the OAuth `state`, the PKCE verifier
 * and the sanitised return path between the redirect to Google and the
 * callback. It is compared, not trusted: the callback only proceeds when the
 * `state` echoed by Google matches the one stored here.
 */
export const OAUTH_COOKIE = 'l365_oauth';
export const OAUTH_COOKIE_MAX_AGE_S = 600;

export interface OAuthState {
  readonly state: string;
  readonly codeVerifier: string;
  readonly returnTo: string;
}

export function encodeOAuthState(value: OAuthState): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

export function decodeOAuthState(raw: string | undefined): OAuthState | null {
  if (raw === undefined || raw.length === 0) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (parsed === null || typeof parsed !== 'object') return null;
  const { state, codeVerifier, returnTo } = parsed as Record<string, unknown>;
  if (typeof state !== 'string' || state.length === 0) return null;
  if (typeof codeVerifier !== 'string' || codeVerifier.length === 0) return null;
  if (typeof returnTo !== 'string') return null;
  return { state, codeVerifier, returnTo };
}

export interface OAuthCookieAttributes {
  readonly httpOnly: true;
  readonly sameSite: 'lax';
  readonly secure: boolean;
  readonly path: '/';
  readonly maxAge: number;
}

export function oauthCookieAttributes(secure: boolean, maxAge = OAUTH_COOKIE_MAX_AGE_S): OAuthCookieAttributes {
  return { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge };
}
