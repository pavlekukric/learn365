import 'server-only';

import { cookies } from 'next/headers';
import { cache } from 'react';

import { getDb } from '../db/client';
import { getServerEnv, isAuthEnabled } from '../env';

import { SESSION_COOKIE, validateSessionToken, type SessionValidation } from './session';

/**
 * Resolve the session behind a cookie token. `null` for no cookie, an
 * unknown or expired session, accounts off, or a database error (logged) —
 * a database outage must read as "signed out", never as a crash of the page
 * or route that asked.
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
    return null;
  }
}

/** Current session for server components / pages (reads the request cookies). */
export const getCurrentSession = cache(async (): Promise<SessionValidation | null> => {
  const store = await cookies();
  return getSessionFromToken(store.get(SESSION_COOKIE)?.value);
});
