import 'server-only';

import type { NextRequest, NextResponse } from 'next/server';

import { getDb, type Db } from '../db/client';
import type { UserRow } from '../db/schema';
import { getAuthConfig, type AuthConfig } from '../env';
import { apiForbidden, apiNotFound, apiUnauthorized, apiUnavailable } from '../http';

import { isSameOriginRequest } from './csrf';
import { DbUnavailableError, getSessionFromToken } from './currentUser';
import { readSessionToken, type SessionValidation } from './session';

export interface ApiContext {
  readonly auth: AuthConfig;
  readonly user: UserRow;
  readonly db: Db;
}

/**
 * Everything a `/api/me/**` handler needs before touching data, or the
 * response that ends the request: 404 with accounts off, 403 on a
 * cross-origin mutation, 401 without a live session, 503 when the database
 * is unreachable. Narrow with `'user' in result`.
 */
export async function guardApi(
  request: NextRequest,
  options: { readonly mutating: boolean },
): Promise<ApiContext | NextResponse> {
  const auth = getAuthConfig();
  if (auth === null) return apiNotFound();
  if (options.mutating && !isSameOriginRequest(request, auth.appUrl)) return apiForbidden();

  let session: SessionValidation | null;
  try {
    session = await getSessionFromToken(
      readSessionToken(request.cookies, auth.secureCookies)?.token,
    );
  } catch (error) {
    // Phase 12: an outage is 503, never 401 — the client keeps its deltas and retries.
    if (error instanceof DbUnavailableError) return apiUnavailable();
    throw error;
  }
  if (session === null) return apiUnauthorized();

  try {
    const db = await getDb();
    return { auth, user: session.user, db };
  } catch (error) {
    console.error('[api] database unavailable', error);
    return apiUnavailable();
  }
}
