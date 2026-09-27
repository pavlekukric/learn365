import 'server-only';

import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';

import { getServerEnv } from '../env';

import * as schema from './schema';

/**
 * One database handle for the whole server. The driver is picked from the
 * `DATABASE_URL` scheme:
 *
 *   postgres://user:pw@db:5432/learn365   → postgres.js (production, VPS compose)
 *   pglite://.data/dev                    → PGlite, Postgres in WASM, file-backed
 *   pglite://                             → PGlite in memory (tests)
 *
 * PGlite exists because the dev machine has neither Docker nor a local
 * Postgres; it is a dev dependency and is excluded from the production image
 * (next.config.mjs). Both drivers go through the same Drizzle query API, so
 * the repository layer never knows which one it is on.
 */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

export type DbDriver = 'postgres' | 'pglite';

export interface DbConnection {
  readonly db: Db;
  readonly driver: DbDriver;
  /** Apply the drizzle-kit SQL migrations from `migrationsFolder` (idempotent). */
  readonly migrate: (migrationsFolder: string) => Promise<void>;
  readonly close: () => Promise<void>;
}

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super('DATABASE_URL is not set — the database is not configured.');
    this.name = 'DatabaseNotConfiguredError';
  }
}

const PGLITE_SCHEME = 'pglite://';

/** Open a fresh connection for the given URL. Prefer `getConnection()` in app code. */
export async function openConnection(url: string): Promise<DbConnection> {
  if (url.startsWith(PGLITE_SCHEME)) {
    const [{ PGlite }, { drizzle }, { migrate }] = await Promise.all([
      import('@electric-sql/pglite'),
      import('drizzle-orm/pglite'),
      import('drizzle-orm/pglite/migrator'),
    ]);
    const dataDir = url.slice(PGLITE_SCHEME.length);
    const client = dataDir === '' ? new PGlite() : new PGlite(dataDir);
    const db = drizzle({ client, schema });
    return {
      db,
      driver: 'pglite',
      migrate: (migrationsFolder) => migrate(db, { migrationsFolder }),
      close: () => client.close(),
    };
  }

  const [{ default: postgres }, { drizzle }, { migrate }] = await Promise.all([
    import('postgres'),
    import('drizzle-orm/postgres-js'),
    import('drizzle-orm/postgres-js/migrator'),
  ]);
  const client = postgres(url, { max: 5 });
  const db = drizzle({ client, schema });
  return {
    db,
    driver: 'postgres',
    migrate: (migrationsFolder) => migrate(db, { migrationsFolder }),
    close: () => client.end(),
  };
}

interface GlobalWithDb {
  __learn365Db?: Promise<DbConnection>;
}

/**
 * Process-wide singleton, parked on `globalThis` so Next's dev-mode module
 * reloads do not open a new pool (or a second PGlite handle on the same
 * folder) on every edit. A failed open is not cached.
 */
export function getConnection(): Promise<DbConnection> {
  const env = getServerEnv();
  if (env.databaseUrl === null) {
    return Promise.reject(new DatabaseNotConfiguredError());
  }
  const g = globalThis as GlobalWithDb;
  if (g.__learn365Db === undefined) {
    const url = env.databaseUrl;
    g.__learn365Db = openConnection(url).catch((error: unknown) => {
      delete g.__learn365Db;
      throw error;
    });
  }
  return g.__learn365Db;
}

export async function getDb(): Promise<Db> {
  return (await getConnection()).db;
}
