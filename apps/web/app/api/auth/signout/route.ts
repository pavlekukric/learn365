import type { NextRequest, NextResponse } from 'next/server';

import { isSameOriginRequest } from '@/lib/server/auth/csrf';
import {
  SESSION_COOKIE,
  expiredSessionCookieAttributes,
  hashSessionToken,
  invalidateSession,
} from '@/lib/server/auth/session';
import { getDb } from '@/lib/server/db/client';
import { getAuthConfig } from '@/lib/server/env';
import { apiForbidden, apiNotFound, noContent } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

/**
 * Sign out: drop the session row and the cookie. The cookie is cleared even
 * if the database cannot be reached — the row then simply expires on its own.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = getAuthConfig();
  if (auth === null) return apiNotFound();
  if (!isSameOriginRequest(request, auth.appUrl)) return apiForbidden();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token !== undefined && token.length > 0) {
    try {
      const db = await getDb();
      await invalidateSession(db, hashSessionToken(token));
    } catch (error) {
      console.error('[auth] sign-out could not reach the database', error);
    }
  }

  const response = noContent();
  response.cookies.set(SESSION_COOKIE, '', expiredSessionCookieAttributes(auth.secureCookies));
  return response;
}
