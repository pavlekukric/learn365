import { fileURLToPath } from 'node:url';

import { openConnection, type DbConnection } from '../lib/server/db/client';

const MIGRATIONS_DIR = fileURLToPath(new URL('../lib/server/db/migrations', import.meta.url));

/** A fresh in-memory PGlite database with the committed migrations applied. */
export async function openTestDb(): Promise<DbConnection> {
  const connection = await openConnection('pglite://');
  await connection.migrate(MIGRATIONS_DIR);
  return connection;
}
