import 'server-only';

import { getServerEnv } from '../env';

import { getConnection, isConnectivityError } from './client';

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
  /** Background attempts after a connectivity failure (0 = none). */
  readonly retries: number;
  readonly delayMs: number;
}

const DEFAULT_STARTUP: StartupMigrationOptions = { retries: 40, delayMs: 15_000 };

export type StartupMigrationResult = 'applied' | 'deferred';

/**
 * The start-up wrapper `instrumentation.ts` calls (Phase 12). Reading needs
 * no database, so a database that cannot be *reached* must not take the
 * server down: the error is logged, the server starts with accounts
 * effectively off (`/api/health` says `db: error`), and the migration is
 * retried in the background until the database answers. Anything else — a
 * migration that fails to apply — still throws, the container never becomes
 * healthy and `deploy.sh` rolls back to the previous image.
 */
export async function migrateAtStartup(
  options: StartupMigrationOptions = DEFAULT_STARTUP,
): Promise<StartupMigrationResult> {
  try {
    await migrateDatabase();
    return 'applied';
  } catch (error) {
    if (!isConnectivityError(error)) throw error;
    console.error(
      '[db] database unreachable at start-up — reading continues, accounts are off until it answers; ' +
        `retrying migrations every ${String(options.delayMs)} ms, ${String(options.retries)}×`,
      error,
    );
    if (options.retries > 0) void retryInBackground(options);
    return 'deferred';
  }
}

async function retryInBackground(options: StartupMigrationOptions): Promise<void> {
  for (let attempt = 1; attempt <= options.retries; attempt += 1) {
    await sleep(options.delayMs);
    try {
      await migrateDatabase();
      console.info(`[db] migrations applied on retry ${String(attempt)}`);
      return;
    } catch (error) {
      if (!isConnectivityError(error)) {
        console.error('[db] migration failed on retry — accounts stay off until the next deploy', error);
        return;
      }
    }
  }
  console.error(
    `[db] still no database after ${String(options.retries)} retries — giving up until the next restart`,
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    // Never keep the process alive just for this loop.
    setTimeout(resolve, ms).unref();
  });
}
