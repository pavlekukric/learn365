import { NextResponse, type NextRequest } from 'next/server';

import {
  decodeJwtPayload,
  exchangeAuthorizationCode,
  googleRedirectUri,
  verifyIdTokenClaims,
} from '@/lib/server/auth/google';
import {
  decodeOAuthState,
  oauthCookieAttributes,
  oauthCookieName,
} from '@/lib/server/auth/oauthState';
import {
  createSession,
  purgeExpiredSessions,
  sessionCookieAttributes,
  sessionCookieName,
} from '@/lib/server/auth/session';
import { upsertGoogleUser } from '@/lib/server/auth/users';
import { getDb } from '@/lib/server/db/client';
import { getAuthConfig } from '@/lib/server/env';
import { NO_STORE_HEADERS, apiNotFound } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

type Failure = 'odbijeno' | 'neuspesno';

/**
 * Step 2 of sign-in. Google sends the reader back here with `code` + `state`.
 * The state must match the cookie, the code is exchanged (with the PKCE
 * verifier) for an ID token, the claims are checked, the user is upserted
 * by Google `sub`, a session is created and the reader lands on the path
 * they started from. Every failure is one calm redirect to `/prijava`.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = getAuthConfig();
  if (auth === null) return apiNotFound();

  const params = request.nextUrl.searchParams;
  const stored = decodeOAuthState(request.cookies.get(oauthCookieName(auth.secureCookies))?.value);

  const fail = (reason: Failure): NextResponse => {
    const response = NextResponse.redirect(new URL(`/prijava?greska=${reason}`, auth.appUrl), {
      status: 302,
      headers: NO_STORE_HEADERS,
    });
    response.cookies.set(
      oauthCookieName(auth.secureCookies),
      '',
      oauthCookieAttributes(auth.secureCookies, 0),
    );
    return response;
  };

  const providerError = params.get('error');
  if (providerError !== null) {
    return fail(providerError === 'access_denied' ? 'odbijeno' : 'neuspesno');
  }

  const code = params.get('code');
  const state = params.get('state');
  if (stored === null || code === null || state === null || state !== stored.state) {
    return fail('neuspesno');
  }

  try {
    const { idToken } = await exchangeAuthorizationCode({
      clientId: auth.google.clientId,
      clientSecret: auth.google.clientSecret,
      redirectUri: googleRedirectUri(auth.appUrl),
      code,
      codeVerifier: stored.codeVerifier,
    });
    const identity = verifyIdTokenClaims(decodeJwtPayload(idToken), {
      clientId: auth.google.clientId,
    });

    const db = await getDb();
    const user = await upsertGoogleUser(db, identity);
    await purgeExpiredSessions(db);
    const { token, expiresAt } = await createSession(db, user.id);

    const response = NextResponse.redirect(new URL(stored.returnTo, auth.appUrl), {
      status: 302,
      headers: NO_STORE_HEADERS,
    });
    response.cookies.set(
      sessionCookieName(auth.secureCookies),
      token,
      sessionCookieAttributes(expiresAt, auth.secureCookies),
    );
    response.cookies.set(
      oauthCookieName(auth.secureCookies),
      '',
      oauthCookieAttributes(auth.secureCookies, 0),
    );
    return response;
  } catch (error) {
    console.error('[auth] google callback failed:', error instanceof Error ? error.message : error);
    return fail('neuspesno');
  }
}
