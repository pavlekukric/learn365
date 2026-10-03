import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fileURLToPath } from 'node:url';

import { SYNC_USER_HEADER } from '@/lib/sync/wire';

import {
  AUTH_ON_PGLITE,
  AUTH_ON_UNREACHABLE,
  resetDbConnection,
  stubServerEnv,
} from '../../../test/serverEnv';
import { getDb } from '../db/client';
import { migrateDatabase } from '../db/migrate';

import { guardApi } from './guard';
import { createSession } from './session';
import { upsertGoogleUser } from './users';

const MIGRATIONS_DIR = fileURLToPath(new URL('../db/migrations', import.meta.url));

function request(cookie?: string): NextRequest {
  return new NextRequest('https://istorija365.test/api/me/progress', {
    headers: cookie === undefined ? {} : { cookie },
  });
}

async function statusOf(result: Awaited<ReturnType<typeof guardApi>>): Promise<{
  status: number;
  body: unknown;
}> {
  if ('user' in result) throw new Error('expected a response, got an API context');
  return { status: result.status, body: await result.json() };
}

describe('guardApi', () => {
  let restoreEnv: () => void = () => undefined;

  beforeEach(async () => {
    await resetDbConnection();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(async () => {
    await resetDbConnection();
    restoreEnv();
    vi.restoreAllMocks();
  });

  it('answers 404 with accounts off', async () => {
    restoreEnv = stubServerEnv({ ...AUTH_ON_UNREACHABLE, GOOGLE_CLIENT_SECRET: undefined });
    const { status } = await statusOf(
      await guardApi(request('__Host-l365_session=x'), { mutating: false }),
    );
    expect(status).toBe(404);
  });

  it('answers 401 without a cookie, before touching the database', async () => {
    restoreEnv = stubServerEnv(AUTH_ON_UNREACHABLE);
    const { status } = await statusOf(await guardApi(request(), { mutating: false }));
    expect(status).toBe(401);
  });

  it('answers 503, not 401, when the database is unreachable (Phase 12)', async () => {
    restoreEnv = stubServerEnv(AUTH_ON_UNREACHABLE);
    const { status, body } = await statusOf(
      await guardApi(request('__Host-l365_session=some-token'), { mutating: false }),
    );
    expect(status).toBe(503);
    expect(body).toEqual({ error: 'unavailable' });
  });

  it('answers 409 when the request names another user than the session (review 2026-10-03 P1 item 2)', async () => {
    restoreEnv = stubServerEnv({ ...AUTH_ON_PGLITE, MIGRATIONS_DIR });
    await migrateDatabase();
    const db = await getDb();
    const user = await upsertGoogleUser(db, {
      sub: 'sub-guard',
      email: 'g@example.com',
      name: null,
      picture: null,
    });
    const { token } = await createSession(db, user.id);
    const withUser = (claimed?: string) =>
      new NextRequest('https://istorija365.test/api/me/progress', {
        headers: {
          cookie: `__Host-l365_session=${token}`,
          ...(claimed === undefined ? {} : { [SYNC_USER_HEADER]: claimed }),
        },
      });

    const { status, body } = await statusOf(
      await guardApi(withUser('someone-else'), { mutating: false }),
    );
    expect(status).toBe(409);
    expect(body).toEqual({ error: 'account_changed' });

    const matching = await guardApi(withUser(user.id), { mutating: false });
    expect('user' in matching && matching.user.id).toBe(user.id);
    // Without the header (any non-sync caller) the cookie alone decides.
    const unnamed = await guardApi(withUser(), { mutating: false });
    expect('user' in unnamed && unnamed.user.id).toBe(user.id);
  });
});
