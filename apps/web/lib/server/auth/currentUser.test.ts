import { fileURLToPath } from 'node:url';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AUTH_ON_PGLITE,
  AUTH_ON_UNREACHABLE,
  resetDbConnection,
  stubServerEnv,
} from '../../../test/serverEnv';
import { migrateDatabase } from '../db/migrate';

import { DbUnavailableError, getSessionFromToken } from './currentUser';

const MIGRATIONS_DIR = fileURLToPath(new URL('../db/migrations', import.meta.url));

describe('getSessionFromToken', () => {
  let restoreEnv: () => void = () => undefined;

  beforeEach(async () => {
    await resetDbConnection();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
  });

  afterEach(async () => {
    await resetDbConnection();
    restoreEnv();
    vi.restoreAllMocks();
  });

  it('is null without a token or with accounts off — the database is never touched', async () => {
    restoreEnv = stubServerEnv({ ...AUTH_ON_UNREACHABLE, APP_URL: undefined });
    await expect(getSessionFromToken(undefined)).resolves.toBeNull();
    await expect(getSessionFromToken('')).resolves.toBeNull();
    await expect(getSessionFromToken('some-token')).resolves.toBeNull();
  });

  it('throws DbUnavailableError when the database cannot be reached (Phase 12)', async () => {
    restoreEnv = stubServerEnv(AUTH_ON_UNREACHABLE);
    await expect(getSessionFromToken('some-token')).rejects.toBeInstanceOf(DbUnavailableError);
  });

  it('is null for an unknown token on a reachable database', async () => {
    restoreEnv = stubServerEnv({ ...AUTH_ON_PGLITE, MIGRATIONS_DIR });
    await migrateDatabase();
    await expect(getSessionFromToken('unknown-token')).resolves.toBeNull();
  });
});
