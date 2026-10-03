import 'server-only';

import { getServerEnv } from '../env';

import { getConnection, isConnectivityError } from './client';

/**
 * Where the start-up migration stands, for `/api/health` and `deploy.sh`
 * (review 2026-09-30 item 10):
 *
 *   off      no `DATABASE_URL` — nothing to migrate
 *   pending  not applied yet: the server has just started, or the database
 *            is unreachable and the background retry is still waiting on it
 *   ok       applied (or nothing was pending) in this process
 *   failed   a migration threw — accounts stay off until the next deploy
 *
 * Parked on `globalThis`: `instrumentation.ts` and the route handlers are
 * separate bundles in the same process, so a module-level variable would
 * not be shared between them.
 */
export type MigrationState = 'off' | 'pending' | 'ok' | 'failed';

interface GlobalWithMigrations {
  __learn365Migrations?: Exclude<MigrationState, 'off'>;
}

function setMigrationState(state: Exclude<MigrationState, 'off'>): void {
  (globalThis as GlobalWithMigrations).__learn365Migrations = state;
}

export function getMigrationState(): MigrationState {
  if (getServerEnv().databaseUrl === null) return 'off';
  return (globalThis as GlobalWithMigrations).__learn365Migrations ?? 'pending';
}

/** Tests only: forget the recorded state. */
export function resetMigrationState(): void {
  delete (globalThis as GlobalWithMigrations).__learn365Migrations;
}

/**
 * Apply pending migrations from `MIGRATIONS_DIR` (defaults to
 * `lib/server/db/migrations` under the working directory; the Docker image
 * sets it explicitly). A no-op without `DATABASE_URL`.
 *
 * Single replica, additive migrations only: a failure here throws. At server
 * start `migrateAtStartup` decides what a throw means (an unreachable
 * database is tolerated, a failing migration is not).
 */
export async function migrateDatabase(): Promise<void> {
  const env = getServerEnv();
  if (env.databaseUrl === null) return;
  const connection = await getConnection();
  const started = Date.now();
  try {
    await connection.migrate(env.migrationsDir);
  } catch (error) {
    if (connection.driver === 'pglite' && String(error).includes('PGlite failed to initialize')) {
      throw new Error(
        `PGlite could not open ${env.databaseUrl}. After a hard stop (Ctrl+C, killed process) the ` +
          'folder can stay locked — it is throwaway dev data, so delete it and start again, or point ' +
          'DATABASE_URL at a folder outside OneDrive. See apps/web/.env.example.',
        { cause: error },
      );
    }
    throw error;
  }
  console.info(
    `[db] migrations applied (${connection.driver}) in ${String(Date.now() - started)} ms`,
  );
}

export interface StartupMigrationOptions {
  /** Background attempts after a connectivity failure (0 = none, `Infinity` = until it answers). */
  readonly retries: number;
  /** Wait before the first retry; doubles on every further miss… */
  readonly delayMs: number;
  /** …up to this ceiling. */
  readonly maxDelayMs?: number;
  /** Injected in tests; defaults to an unref'd timer. */
  readonly sleep?: (ms: number) => Promise<void>;
}

/** 15 s, 30 s, 60 s, 60 s, … for as long as the database stays away. */
const DEFAULT_STARTUP: StartupMigrationOptions = {
  retries: Number.POSITIVE_INFINITY,
  delayMs: 15_000,
  maxDelayMs: 60_000,
};

export type StartupMigrationResult = 'applied' | 'deferred';

/**
 * The start-up wrapper `instrumentation.ts` calls (Phase 12). Reading needs
 * no database, so a database that cannot be *reached* must not take the
 * server down: the error is logged, the server starts with accounts
 * effectively off (`/api/health` says `db: error`, `migrations: pending`),
 * and the migration is retried in the background — with a capped backoff,
 * for as long as it takes. Anything else — a migration that fails to apply —
 * still throws, the container never becomes healthy and `deploy.sh` rolls
 * back to the previous image.
 */
export async function migrateAtStartup(
  options: StartupMigrationOptions = DEFAULT_STARTUP,
): Promise<StartupMigrationResult> {
  setMigrationState('pending');
  try {
    await migrateDatabase();
    setMigrationState('ok');
    return 'applied';
  } catch (error) {
    if (!isConnectivityError(error)) {
      setMigrationState('failed');
      throw error;
    }
    console.error(
      '[db] database unreachable at start-up — reading continues, accounts are off until it answers; ' +
        `retrying migrations from ${String(options.delayMs)} ms, backing off to ` +
        `${String(options.maxDelayMs ?? options.delayMs)} ms`,
      error,
    );
    if (options.retries > 0) void retryMigrations(options);
    return 'deferred';
  }
}

/** The wait before retry `attempt` (1-based): `delayMs · 2^(attempt−1)`, capped at `maxDelayMs`. */
export function retryDelayMs(options: StartupMigrationOptions, attempt: number): number {
  const cap = options.maxDelayMs ?? options.delayMs;
  const grown = options.delayMs * 2 ** Math.min(attempt - 1, 20);
  return Math.min(grown, Math.max(cap, options.delayMs));
}

/** Log a miss on attempts 1, 2, 4, 8, … and then once an hour at the ceiling — not every minute. */
function shouldLogMiss(attempt: number): boolean {
  return (attempt & (attempt - 1)) === 0 || attempt % 60 === 0;
}

/**
 * The background loop behind a deferred start-up. Resolves with the final
 * state: `ok` once applied, `failed` when a migration throws, `pending` only
 * when a finite `retries` ran out (tests; production retries without end).
 */
export async function retryMigrations(
  options: StartupMigrationOptions,
): Promise<Exclude<MigrationState, 'off'>> {
  const sleep = options.sleep ?? defaultSleep;
  for (let attempt = 1; attempt <= options.retries; attempt += 1) {
    await sleep(retryDelayMs(options, attempt));
    try {
      await migrateDatabase();
      console.info(`[db] migrations applied on retry ${String(attempt)}`);
      setMigrationState('ok');
      return 'ok';
    } catch (error) {
      if (!isConnectivityError(error)) {
        console.error(
          '[db] migration failed on retry — accounts stay off until the next deploy',
          error,
        );
        setMigrationState('failed');
        return 'failed';
      }
      if (shouldLogMiss(attempt)) {
        console.error(`[db] still no database after ${String(attempt)} retries — trying again`);
      }
    }
  }
  return 'pending';
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    // Never keep the process alive just for this loop.
    setTimeout(resolve, ms).unref();
  });
}
