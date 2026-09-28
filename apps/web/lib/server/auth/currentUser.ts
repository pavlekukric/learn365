import 'server-only';

import { cookies } from 'next/headers';
import { cache } from 'react';

import { getDb } from '../db/client';
import { getServerEnv, isAuthEnabled } from '../env';

import { SESSION_COOKIE, validateSessionToken, type SessionValidation } from './session';

/** The session could not be checked because the database is unreachable (Phase 12). */
export class DbUnavailableError extends Error {
  constructor(cause: unknown) {
    super('the database is unreachable', { cause });
    this.name = 'DbUnavailableError';
  }
}

/**
 * Resolve the session behind a cookie token. `null` for no cookie, an
 * unknown or expired session, or accounts off. A database failure throws
 * `DbUnavailableError` (logged): an API route answers 503 with it, so an
 * outage never reads as "signed out" (Phase 12); pages map it to `null`.
 */
export async function getSessionFromToken(
  token: string | undefined,
): Promise<SessionValidation | null> {
  if (token === undefined || token.length === 0) return null;
  if (!isAuthEnabled(getServerEnv())) return null;
  try {
    const db = await getDb();
    return await validateSessionToken(db, token);
  } catch (error) {
    console.error('[auth] session lookup failed', error);
    throw new DbUnavailableError(error);
  }
}

/** Current session for server components / pages (reads the request cookies). */
export const getCurrentSession = cache(async (): Promise<SessionValidation | null> => {
  const store = await cookies();
  try {
    return await getSessionFromToken(store.get(SESSION_COOKIE)?.value);
  } catch (error) {
    // A page must render; without the database the reader is simply not signed in here.
    if (error instanceof DbUnavailableError) return null;
    throw error;
  }
});
