import { fileURLToPath } from 'node:url';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { migrateAtStartup, resetMigrationState } from '@/lib/server/db/migrate';
import { AUTH_ON_PGLITE, AUTH_ON_UNREACHABLE, resetDbConnection, stubServerEnv } from '@/test/serverEnv';

import { GET } from './route';

const MIGRATIONS_DIR = fileURLToPath(new URL('../../../lib/server/db/migrations', import.meta.url));

async function health(): Promise<{ status: number; body: unknown }> {
  const response = await GET();
  return { status: response.status, body: await response.json() };
}

describe('GET /api/health', () => {
  let restoreEnv: () => void = () => undefined;

  beforeEach(async () => {
    await resetDbConnection();
    resetMigrationState();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
  });

  afterEach(async () => {
    await resetDbConnection();
    resetMigrationState();
    restoreEnv();
    vi.restoreAllMocks();
  });

  it('without a database: ok, nothing to migrate', async () => {
    restoreEnv = stubServerEnv({});
    expect(await health()).toEqual({
      status: 200,
      body: { ok: true, auth: false, db: 'off', migrations: 'off' },
    });
  });

  it('reachable database, migrations applied: ok', async () => {
    restoreEnv = stubServerEnv({ ...AUTH_ON_PGLITE, MIGRATIONS_DIR });
    await migrateAtStartup({ retries: 0, delayMs: 1 });
    expect(await health()).toEqual({
      status: 200,
      body: { ok: true, auth: true, db: 'ok', migrations: 'ok' },
    });
  });

  it('reachable database, migrations not yet run: 503 pending', async () => {
    restoreEnv = stubServerEnv({ ...AUTH_ON_PGLITE, MIGRATIONS_DIR });
    expect(await health()).toEqual({
      status: 503,
      body: { ok: false, auth: true, db: 'ok', migrations: 'pending' },
    });
  });

  it('a migration that failed: 503 failed', async () => {
    restoreEnv = stubServerEnv({ ...AUTH_ON_PGLITE, MIGRATIONS_DIR: '/definitely/not/a/folder' });
    await expect(migrateAtStartup({ retries: 0, delayMs: 1 })).rejects.toThrow();
    expect(await health()).toEqual({
      status: 503,
      body: { ok: false, auth: true, db: 'ok', migrations: 'failed' },
    });
  });

  it('unreachable database at start-up: 503 error, still pending', async () => {
    restoreEnv = stubServerEnv({ ...AUTH_ON_UNREACHABLE, MIGRATIONS_DIR });
    await expect(migrateAtStartup({ retries: 0, delayMs: 1 })).resolves.toBe('deferred');
    expect(await health()).toEqual({
      status: 503,
      body: { ok: false, auth: true, db: 'error', migrations: 'pending' },
    });
  });
});
