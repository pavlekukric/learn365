/**
 * Next.js instrumentation hook — runs once per server start, before the
 * first request is served. The only job here is to apply database
 * migrations when a database is configured. Everything is a dynamic import
 * inside the Node.js branch so the edge bundle never sees the driver code.
 *
 * Phase 12: an unreachable database does not stop the server — reading
 * needs none — the migration is retried in the background; a migration that
 * fails to apply still throws (see lib/server/db/migrate.ts).
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (!process.env.DATABASE_URL) return;
  const { migrateAtStartup } = await import('./lib/server/db/migrate');
  await migrateAtStartup();
}
