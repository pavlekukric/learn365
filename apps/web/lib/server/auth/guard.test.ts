import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AUTH_ON_UNREACHABLE, resetDbConnection, stubServerEnv } from '../../../test/serverEnv';

import { guardApi } from './guard';

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
    const { status } = await statusOf(await guardApi(request('__Host-l365_session=x'), { mutating: false }));
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
});
