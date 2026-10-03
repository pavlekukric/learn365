import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { openTestDb } from '../../../test/db';
import type { DbConnection } from '../db/client';
import { sessions } from '../db/schema';

import {
  SESSION_RENEW_BELOW_MS,
  SESSION_TTL_MS,
  createSession,
  expiredSessionCookieAttributes,
  hashSessionToken,
  invalidateSession,
  invalidateUserSessions,
  purgeExpiredSessions,
  sessionCookieAttributes,
  validateSessionToken,
} from './session';
import { upsertGoogleUser } from './users';

const DAY_MS = 86_400_000;
const NOW = new Date('2026-09-27T10:00:00.000Z');

describe('sessions', () => {
  let connection: DbConnection;
  let userId: string;

  beforeAll(async () => {
    connection = await openTestDb();
    const user = await upsertGoogleUser(connection.db, {
      sub: 'sub-session',
      email: 'reader@example.com',
      name: 'Reader',
      picture: null,
    });
    userId = user.id;
  });

  afterAll(async () => {
    await connection.close();
  });

  it('stores only the hash and validates the raw token', async () => {
    const { token, expiresAt } = await createSession(connection.db, userId, NOW);
    expect(expiresAt.getTime()).toBe(NOW.getTime() + SESSION_TTL_MS);

    const rows = await connection.db.select().from(sessions);
    expect(rows.some((row) => row.id === token)).toBe(false);
    expect(rows.some((row) => row.id === hashSessionToken(token))).toBe(true);

    const validation = await validateSessionToken(connection.db, token, NOW);
    expect(validation?.user.id).toBe(userId);
    expect(validation?.renewed).toBe(false);
    expect(await validateSessionToken(connection.db, 'unknown-token', NOW)).toBeNull();
  });

  it('drops an expired session on contact', async () => {
    const { token } = await createSession(
      connection.db,
      userId,
      new Date(NOW.getTime() - 40 * DAY_MS),
    );
    expect(await validateSessionToken(connection.db, token, NOW)).toBeNull();
    const rows = await connection.db.select().from(sessions);
    expect(rows.some((row) => row.id === hashSessionToken(token))).toBe(false);
  });

  it('slides the expiry when fewer than 15 days remain', async () => {
    const created = new Date(NOW.getTime() - (SESSION_TTL_MS - SESSION_RENEW_BELOW_MS) - DAY_MS);
    const { token } = await createSession(connection.db, userId, created);
    const validation = await validateSessionToken(connection.db, token, NOW);
    expect(validation?.renewed).toBe(true);
    expect(validation?.session.expiresAt.getTime()).toBe(NOW.getTime() + SESSION_TTL_MS);
    // Persisted, not just returned.
    const again = await validateSessionToken(connection.db, token, NOW);
    expect(again?.renewed).toBe(false);
  });

  it('invalidates one session, all of a user, and purges expired rows', async () => {
    const a = await createSession(connection.db, userId, NOW);
    const b = await createSession(connection.db, userId, NOW);
    await invalidateSession(connection.db, hashSessionToken(a.token));
    expect(await validateSessionToken(connection.db, a.token, NOW)).toBeNull();
    expect(await validateSessionToken(connection.db, b.token, NOW)).not.toBeNull();

    await createSession(connection.db, userId, new Date(NOW.getTime() - 60 * DAY_MS));
    await purgeExpiredSessions(connection.db, NOW);
    const live = await connection.db.select().from(sessions);
    expect(live.every((row) => row.expiresAt.getTime() > NOW.getTime())).toBe(true);

    await invalidateUserSessions(connection.db, userId);
    expect(await connection.db.select().from(sessions)).toHaveLength(0);
  });

  it('builds cookie attributes that follow the origin scheme', () => {
    const live = sessionCookieAttributes(NOW, true);
    expect(live).toEqual({
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      expires: NOW,
    });
    const gone = expiredSessionCookieAttributes(false);
    expect(gone.maxAge).toBe(0);
    expect(gone.secure).toBe(false);
    expect(gone.expires.getTime()).toBe(0);
  });
});
