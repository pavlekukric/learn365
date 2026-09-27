import 'server-only';

import { getServerEnv } from '../env';

import { getConnection } from './client';

/**
 * Apply pending migrations from `MIGRATIONS_DIR` (defaults to
 * `lib/server/db/migrations` under the working directory; the Docker image
 * sets it explicitly). Called once from `instrumentation.ts` before the
 * server accepts requests, and a no-op without `DATABASE_URL`.
 *
 * Single replica, additive migrations only: a failure here throws, the
 * container never becomes healthy, and `deploy.sh` reports it while the
 * previous image tag still runs against the same schema.
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
