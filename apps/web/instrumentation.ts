/**
 * Next.js instrumentation hook — runs once per server start, before the
 * first request is served. The only job here is to apply database
 * migrations when a database is configured. Everything is a dynamic import
 * inside the Node.js branch so the edge bundle never sees the driver code.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (!process.env.DATABASE_URL) return;
  const { migrateDatabase } = await import('./lib/server/db/migrate');
  await migrateDatabase();
}
