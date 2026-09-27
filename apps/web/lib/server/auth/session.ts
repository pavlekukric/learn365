import 'server-only';

import { createHash, randomBytes } from 'node:crypto';

import { eq, lt } from 'drizzle-orm';

import type { Db } from '../db/client';
import { sessions, users, type SessionRow, type UserRow } from '../db/schema';

/**
 * Sessions: a 256-bit random token lives only in the cookie; the database
 * keeps its SHA-256. Thirty days, sliding — validation extends a session
 * that has less than fifteen days left. Expired rows are removed when met
 * and purged in bulk on every sign-in.
 */
export const SESSION_COOKIE = 'l365_session';

const DAY_MS = 86_400_000;
export const SESSION_TTL_MS = 30 * DAY_MS;
export const SESSION_RENEW_BELOW_MS = 15 * DAY_MS;

export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export interface CreatedSession {
  readonly token: string;
  readonly expiresAt: Date;
}

export async function createSession(
  db: Db,
  userId: string,
  now: Date = new Date(),
): Promise<CreatedSession> {
  const token = generateSessionToken();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
  await db.insert(sessions).values({ id: hashSessionToken(token), userId, expiresAt });
  return { token, expiresAt };
}

export interface SessionValidation {
  readonly user: UserRow;
  readonly session: SessionRow;
  /** `true` when the expiry was just extended — the caller re-sets the cookie. */
  readonly renewed: boolean;
}

export async function validateSessionToken(
  db: Db,
  token: string,
  now: Date = new Date(),
): Promise<SessionValidation | null> {
  const id = hashSessionToken(token);
  const rows = await db
    .select({ session: sessions, user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, id))
    .limit(1);
  const row = rows[0];
  if (row === undefined) return null;

  if (row.session.expiresAt.getTime() <= now.getTime()) {
    await db.delete(sessions).where(eq(sessions.id, id));
    return null;
  }

  if (row.session.expiresAt.getTime() - now.getTime() < SESSION_RENEW_BELOW_MS) {
    const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
    await db.update(sessions).set({ expiresAt }).where(eq(sessions.id, id));
    return { user: row.user, session: { ...row.session, expiresAt }, renewed: true };
  }

  return { user: row.user, session: row.session, renewed: false };
}

export async function invalidateSession(db: Db, sessionId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export async function invalidateUserSessions(db: Db, userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

export async function purgeExpiredSessions(db: Db, now: Date = new Date()): Promise<void> {
  await db.delete(sessions).where(lt(sessions.expiresAt, now));
}

export interface SessionCookieAttributes {
  readonly httpOnly: true;
  readonly sameSite: 'lax';
  readonly secure: boolean;
  readonly path: '/';
  readonly expires: Date;
}

/** Cookie attributes for a live session. `secure` follows the public origin's scheme. */
export function sessionCookieAttributes(expiresAt: Date, secure: boolean): SessionCookieAttributes {
  return { httpOnly: true, sameSite: 'lax', secure, path: '/', expires: expiresAt };
}

/** Attributes that make the browser drop the session cookie at once. */
export function expiredSessionCookieAttributes(
  secure: boolean,
): SessionCookieAttributes & { readonly maxAge: 0 } {
  return { ...sessionCookieAttributes(new Date(0), secure), maxAge: 0 };
}
