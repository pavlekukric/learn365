import 'server-only';

import type { NextRequest, NextResponse } from 'next/server';

import { getDb, type Db } from '../db/client';
import type { UserRow } from '../db/schema';
import { getAuthConfig, type AuthConfig } from '../env';
import { apiForbidden, apiNotFound, apiUnauthorized, jsonNoStore } from '../http';

import { isSameOriginRequest } from './csrf';
import { getSessionFromToken } from './currentUser';
import { SESSION_COOKIE } from './session';

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

  const session = await getSessionFromToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (session === null) return apiUnauthorized();

  try {
    const db = await getDb();
    return { auth, user: session.user, db };
  } catch (error) {
    console.error('[api] database unavailable', error);
    return jsonNoStore({ error: 'unavailable' }, 503);
  }
}
