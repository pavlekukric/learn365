import { fileURLToPath } from 'node:url';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetDbConnection, stubServerEnv } from '../../../test/serverEnv';

import { isConnectivityError } from './client';
import {
  getMigrationState,
  migrateAtStartup,
  resetMigrationState,
  retryDelayMs,
  retryMigrations,
} from './migrate';

const MIGRATIONS_DIR = fileURLToPath(new URL('./migrations', import.meta.url));
const UNREACHABLE = 'postgres://learn365:x@127.0.0.1:1/learn365';

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

  it('defers when the database cannot be reached, so the server still starts', async () => {
    restoreEnv = stubServerEnv({ DATABASE_URL: UNREACHABLE });
    await expect(migrateAtStartup({ retries: 0, delayMs: 1 })).resolves.toBe('deferred');
    expect(getMigrationState()).toBe('pending');
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('database unreachable at start-up'),
      expect.anything(),
    );
  });

  it('still throws when a migration cannot be applied', async () => {
    restoreEnv = stubServerEnv({ DATABASE_URL: 'pglite://', MIGRATIONS_DIR: '/definitely/not/a/folder' });
    await expect(migrateAtStartup({ retries: 0, delayMs: 1 })).rejects.toThrow();
    expect(getMigrationState()).toBe('failed');
  });

  it('applies on a reachable database', async () => {
    restoreEnv = stubServerEnv({ DATABASE_URL: 'pglite://', MIGRATIONS_DIR });
    await expect(migrateAtStartup({ retries: 0, delayMs: 1 })).resolves.toBe('applied');
    expect(getMigrationState()).toBe('ok');
  });

  it('reports off without a database, pending before anything ran', () => {
    restoreEnv = stubServerEnv({ DATABASE_URL: undefined });
    expect(getMigrationState()).toBe('off');
    restoreEnv();
    restoreEnv = stubServerEnv({ DATABASE_URL: 'pglite://', MIGRATIONS_DIR });
    expect(getMigrationState()).toBe('pending');
  });
});

describe('retryDelayMs', () => {
  it('doubles from the first delay and stops at the ceiling', () => {
    const options = { retries: Number.POSITIVE_INFINITY, delayMs: 15_000, maxDelayMs: 60_000 };
    expect([1, 2, 3, 4, 5, 500].map((attempt) => retryDelayMs(options, attempt))).toEqual([
      15_000, 30_000, 60_000, 60_000, 60_000, 60_000,
    ]);
  });

  it('keeps a flat delay without a ceiling', () => {
    expect(retryDelayMs({ retries: 3, delayMs: 5 }, 3)).toBe(5);
  });
});

describe('retryMigrations', () => {
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

  it('keeps trying while the database is away and applies once it answers', async () => {
    restoreEnv = stubServerEnv({ DATABASE_URL: UNREACHABLE, MIGRATIONS_DIR });
    await expect(migrateAtStartup({ retries: 0, delayMs: 1 })).resolves.toBe('deferred');
    const waits: number[] = [];
    const result = await retryMigrations({
      retries: 10,
      delayMs: 1,
      maxDelayMs: 4,
      sleep: async (ms) => {
        waits.push(ms);
        // The database "comes back" before the fourth retry.
        if (waits.length === 4) {
          await resetDbConnection();
          restoreEnv();
          restoreEnv = stubServerEnv({ DATABASE_URL: 'pglite://', MIGRATIONS_DIR });
        }
      },
    });
    expect(result).toBe('ok');
    expect(waits).toEqual([1, 2, 4, 4]);
    expect(getMigrationState()).toBe('ok');
  });

  it('stays pending (not failed) when a finite budget runs out on an unreachable database', async () => {
    restoreEnv = stubServerEnv({ DATABASE_URL: UNREACHABLE, MIGRATIONS_DIR });
    const result = await retryMigrations({ retries: 3, delayMs: 1, sleep: () => Promise.resolve() });
    expect(result).toBe('pending');
    expect(getMigrationState()).toBe('pending');
  });

  it('stops and reports failed when a migration throws on a retry', async () => {
    restoreEnv = stubServerEnv({ DATABASE_URL: UNREACHABLE, MIGRATIONS_DIR });
    let calls = 0;
    const result = await retryMigrations({
      retries: 10,
      delayMs: 1,
      sleep: async () => {
        calls += 1;
        if (calls === 2) {
          await resetDbConnection();
          restoreEnv();
          restoreEnv = stubServerEnv({
            DATABASE_URL: 'pglite://',
            MIGRATIONS_DIR: '/definitely/not/a/folder',
          });
        }
      },
    });
    expect(result).toBe('failed');
    expect(calls).toBe(2);
    expect(getMigrationState()).toBe('failed');
  });
});
