import { fileURLToPath } from 'node:url';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetDbConnection, stubServerEnv } from '../../../test/serverEnv';

import { isConnectivityError } from './client';
import { migrateAtStartup } from './migrate';

const MIGRATIONS_DIR = fileURLToPath(new URL('./migrations', import.meta.url));

function withCode(code: string): Error {
  return Object.assign(new Error(code), { code });
}

describe('isConnectivityError', () => {
  it('recognises socket, DNS, postgres.js and PostgreSQL connection codes', () => {
    for (const code of [
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT',
      'CONNECT_TIMEOUT',
      'CONNECTION_CLOSED',
      '57P03',
      '08006',
    ]) {
      expect(isConnectivityError(withCode(code)), code).toBe(true);
    }
  });

  it('follows cause chains and AggregateError-style error lists', () => {
    expect(isConnectivityError(new Error('wrapped', { cause: withCode('ECONNREFUSED') }))).toBe(true);
    expect(isConnectivityError({ errors: [new Error('other'), withCode('EHOSTUNREACH')] })).toBe(true);
  });

  it('does not mistake a failing query, a missing file or nothing at all for an outage', () => {
    expect(isConnectivityError(new Error('syntax error at or near'))).toBe(false);
    expect(isConnectivityError(withCode('42P01'))).toBe(false);
    expect(isConnectivityError(withCode('ENOENT'))).toBe(false);
    expect(isConnectivityError(null)).toBe(false);
    expect(isConnectivityError('ECONNREFUSED')).toBe(false);
  });
});

describe('migrateAtStartup', () => {
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

  it('defers when the database cannot be reached, so the server still starts', async () => {
    restoreEnv = stubServerEnv({ DATABASE_URL: 'postgres://learn365:x@127.0.0.1:1/learn365' });
    await expect(migrateAtStartup({ retries: 0, delayMs: 1 })).resolves.toBe('deferred');
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('database unreachable at start-up'),
      expect.anything(),
    );
  });

  it('still throws when a migration cannot be applied', async () => {
    restoreEnv = stubServerEnv({ DATABASE_URL: 'pglite://', MIGRATIONS_DIR: '/definitely/not/a/folder' });
    await expect(migrateAtStartup({ retries: 0, delayMs: 1 })).rejects.toThrow();
  });

  it('applies on a reachable database', async () => {
    restoreEnv = stubServerEnv({ DATABASE_URL: 'pglite://', MIGRATIONS_DIR });
    await expect(migrateAtStartup({ retries: 0, delayMs: 1 })).resolves.toBe('applied');
  });
});
