import type { NextRequest, NextResponse } from 'next/server';

import { isSameOriginRequest } from '@/lib/server/auth/csrf';
import {
  clearSessionCookies,
  hashSessionToken,
  invalidateSession,
  readSessionToken,
} from '@/lib/server/auth/session';
import { getDb } from '@/lib/server/db/client';
import { getAuthConfig } from '@/lib/server/env';
import { apiForbidden, apiNotFound, noContent } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

/**
 * Sign out: drop the session row and the cookie (under every name this app
 * has used). The cookie is cleared even if the database cannot be reached —
 * the row then simply expires on its own.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = getAuthConfig();
  if (auth === null) return apiNotFound();
  if (!isSameOriginRequest(request, auth.appUrl)) return apiForbidden();

  const read = readSessionToken(request.cookies, auth.secureCookies);
  if (read !== null) {
    try {
      const db = await getDb();
      await invalidateSession(db, hashSessionToken(read.token));
    } catch (error) {
      console.error('[auth] sign-out could not reach the database', error);
    }
  }

  const response = noContent();
  clearSessionCookies(response.cookies, auth.secureCookies);
  return response;
}
