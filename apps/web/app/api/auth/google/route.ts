import { NextResponse, type NextRequest } from 'next/server';

import { buildAuthorizationUrl, googleRedirectUri, randomToken } from '@/lib/server/auth/google';
import {
  encodeOAuthState,
  oauthCookieAttributes,
  oauthCookieName,
} from '@/lib/server/auth/oauthState';
import { sanitizeReturnTo } from '@/lib/server/auth/returnTo';
import { getAuthConfig } from '@/lib/server/env';
import { NO_STORE_HEADERS, apiNotFound } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

/**
 * Step 1 of sign-in: mint `state` + PKCE verifier, park them (with the
 * sanitised return path) in a ten-minute cookie, and send the reader to
 * Google. A plain link can start this — `/api/auth/google?return_to=/…`.
 */
export function GET(request: NextRequest): NextResponse {
  const auth = getAuthConfig();
  if (auth === null) return apiNotFound();

  const state = randomToken();
  const codeVerifier = randomToken();
  const returnTo = sanitizeReturnTo(request.nextUrl.searchParams.get('return_to'));

  const url = buildAuthorizationUrl({
    clientId: auth.google.clientId,
    redirectUri: googleRedirectUri(auth.appUrl),
    state,
    codeVerifier,
  });

  const response = NextResponse.redirect(url, { status: 302, headers: NO_STORE_HEADERS });
  response.cookies.set(
    oauthCookieName(auth.secureCookies),
    encodeOAuthState({ state, codeVerifier, returnTo }),
    oauthCookieAttributes(auth.secureCookies),
  );
  return response;
}
