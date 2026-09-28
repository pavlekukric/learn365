import type { NextRequest, NextResponse } from 'next/server';

import { isSameOriginRequest } from '@/lib/server/auth/csrf';
import { DbUnavailableError, getSessionFromToken } from '@/lib/server/auth/currentUser';
import {
  SESSION_COOKIE,
  expiredSessionCookieAttributes,
  sessionCookieAttributes,
  validateSessionToken,
  type SessionValidation,
} from '@/lib/server/auth/session';
import { deleteUser, toPublicUser, type PublicUser } from '@/lib/server/auth/users';
import { getDb } from '@/lib/server/db/client';
import { getAuthConfig } from '@/lib/server/env';
import {
  apiForbidden,
  apiNotFound,
  apiUnauthorized,
  apiUnavailable,
  jsonNoStore,
  noContent,
} from '@/lib/server/http';

export const dynamic = 'force-dynamic';

export interface MeResponse {
  /** `false` when accounts are not configured (or the database is unreachable). */
  readonly enabled: boolean;
  readonly user: PublicUser | null;
}

/**
 * Who am I. The client calls this once per full page load. A database
 * outage answers 503 with `enabled: false` so the client renders no
 * sign-in surface for that load and touches nothing stored locally.
 */
export async function GET(request: NextRequest): Promise<NextResponse<MeResponse>> {
  const auth = getAuthConfig();
  if (auth === null) return jsonNoStore<MeResponse>({ enabled: false, user: null });

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token === undefined || token.length === 0) {
    return jsonNoStore<MeResponse>({ enabled: true, user: null });
  }

  try {
    const db = await getDb();
    const validation = await validateSessionToken(db, token);
    if (validation === null) {
      const response = jsonNoStore<MeResponse>({ enabled: true, user: null });
      response.cookies.set(SESSION_COOKIE, '', expiredSessionCookieAttributes(auth.secureCookies));
      return response;
    }
    const response = jsonNoStore<MeResponse>({ enabled: true, user: toPublicUser(validation.user) });
    // Always re-set the cookie (Phase 12): any `/api/me/**` route may have
    // extended the row, and this is the only route that writes cookies — the
    // browser's expiry must follow the row's, not the value it was given once.
    response.cookies.set(
      SESSION_COOKIE,
      token,
      sessionCookieAttributes(validation.session.expiresAt, auth.secureCookies),
    );
    return response;
  } catch (error) {
    console.error('[auth] /api/me failed', error);
    return jsonNoStore<MeResponse>({ enabled: false, user: null }, 503);
  }
}

/** Delete the account. Everything the reader owns cascades in the schema. */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const auth = getAuthConfig();
  if (auth === null) return apiNotFound();
  if (!isSameOriginRequest(request, auth.appUrl)) return apiForbidden();

  let session: SessionValidation | null;
  try {
    session = await getSessionFromToken(request.cookies.get(SESSION_COOKIE)?.value);
  } catch (error) {
    if (error instanceof DbUnavailableError) return apiUnavailable();
    throw error;
  }
  if (session === null) return apiUnauthorized();

  try {
    const db = await getDb();
    await deleteUser(db, session.user.id);
  } catch (error) {
    console.error('[auth] account deletion failed', error);
    return apiUnavailable();
  }

  const response = noContent();
  response.cookies.set(SESSION_COOKIE, '', expiredSessionCookieAttributes(auth.secureCookies));
  return response;
}
