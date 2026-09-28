/**
 * Test helpers for server code that reads `process.env` per call and parks
 * its database connection on `globalThis` (`lib/server/db/client.ts`).
 */

const ENV_KEYS = [
  'DATABASE_URL',
  'APP_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'MIGRATIONS_DIR',
] as const;

type EnvKey = (typeof ENV_KEYS)[number];

/** `process.env` turns an assigned `undefined` into the string "undefined", so unsetting must delete. */
function setEnv(key: EnvKey, value: string | undefined): void {
  if (value === undefined) Reflect.deleteProperty(process.env, key);
  else process.env[key] = value;
}

/** Set the five server variables for one test (`undefined` unsets); the returned function restores them. */
export function stubServerEnv(values: Partial<Record<EnvKey, string | undefined>>): () => void {
  const saved = new Map<EnvKey, string | undefined>();
  for (const key of ENV_KEYS) {
    saved.set(key, process.env[key]);
    setEnv(key, values[key]);
  }
  return () => {
    for (const [key, value] of saved) setEnv(key, value);
  };
}

/** Everything accounts need, pointing at an in-memory PGlite database. */
export const AUTH_ON_PGLITE = {
  DATABASE_URL: 'pglite://',
  APP_URL: 'https://istorija365.test',
  GOOGLE_CLIENT_ID: 'client-id',
  GOOGLE_CLIENT_SECRET: 'client-secret',
} as const;

/** Everything accounts need, pointing at a port nothing listens on. */
export const AUTH_ON_UNREACHABLE = {
  ...AUTH_ON_PGLITE,
  DATABASE_URL: 'postgres://learn365:x@127.0.0.1:1/learn365',
} as const;

interface GlobalWithDb {
  __learn365Db?: Promise<{ readonly close: () => Promise<void> }>;
}

/** Drop (and close) the process-wide connection so the next call opens a fresh one. */
export async function resetDbConnection(): Promise<void> {
  const g = globalThis as GlobalWithDb;
  const pending = g.__learn365Db;
  delete g.__learn365Db;
  if (pending === undefined) return;
  try {
    await (await pending).close();
  } catch {
    // never opened, or already closed
  }
}
