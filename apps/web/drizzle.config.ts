import { defineConfig } from 'drizzle-kit';

/**
 * drizzle-kit reads the schema and writes SQL migrations; it never touches a
 * database here (no `dbCredentials`), so `pnpm db:generate` works on any
 * machine. The generated files under `lib/server/db/migrations` are committed
 * and applied at server start by `instrumentation.ts`.
 */
export default defineConfig({
  dialect: 'postgresql',
  schema: './lib/server/db/schema.ts',
  out: './lib/server/db/migrations',
  strict: true,
  verbose: true,
});
