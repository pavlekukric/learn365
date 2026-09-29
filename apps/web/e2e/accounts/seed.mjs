/**
 * Seeds the throwaway database of the accounts-on Playwright project
 * (review 2026-09-30 item 19), then exits; `playwright.config.ts` runs
 * `node e2e/accounts/seed.mjs && next start …` as that project's web server.
 *
 * No Google in the loop: instead of a stubbed OAuth provider (which would
 * need a switchable token endpoint in production code), every test account
 * gets a session row whose token the spec puts into the `l365_session`
 * cookie — exactly what `/api/auth/google/callback` would have left behind.
 * The OAuth exchange itself stays covered by the unit tests
 * (`lib/server/auth/google.test.ts`).
 *
 * Refuses to touch anything but a `pglite://<folder>` database, and only
 * with `LEARN365_E2E_SEED=1` — it deletes that folder first.
 */
import { createHash } from 'node:crypto';
import { readFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';

const COURSE_ID = 'istorija-srbije-365';
const DAY_MS = 86_400_000;

const url = process.env.DATABASE_URL ?? '';
const dataDir = url.startsWith('pglite://') ? url.slice('pglite://'.length) : '';
if (process.env.LEARN365_E2E_SEED !== '1' || dataDir === '') {
  console.error('seed: needs LEARN365_E2E_SEED=1 and DATABASE_URL=pglite://<folder> — refusing.');
  process.exit(2);
}

/** @type {{ accounts: { key: string, name: string, completed: string[], isAdmin?: boolean }[] }} */
const { accounts } = JSON.parse(
  readFileSync(fileURLToPath(new URL('./accounts.json', import.meta.url)), 'utf8'),
);
const migrationsFolder = fileURLToPath(new URL('../../lib/server/db/migrations', import.meta.url));

rmSync(dataDir, { recursive: true, force: true });
const client = new PGlite(dataDir);
try {
  await migrate(drizzle({ client }), { migrationsFolder });
  const expiresAt = new Date(Date.now() + 20 * DAY_MS).toISOString();
  for (const account of accounts) {
    const { rows } = await client.query(
      `insert into users (google_sub, email, name, is_admin, last_seen_at)
       values ($1, $2, $3, $4, now()) returning id`,
      [`e2e-${account.key}`, `${account.key}@e2e.test`, account.name, account.isAdmin === true],
    );
    const userId = /** @type {{ id: string }} */ (rows[0]).id;
    const token = `e2e-session-${account.key}`;
    await client.query('insert into sessions (id, user_id, expires_at) values ($1, $2, $3)', [
      createHash('sha256').update(token).digest('hex'),
      userId,
      expiresAt,
    ]);
    if (account.completed.length > 0) {
      await client.query(
        `insert into course_progress (user_id, course_id, last_opened_lesson_id, updated_at)
         values ($1, $2, $3, now())`,
        [userId, COURSE_ID, account.completed.at(-1)],
      );
      for (const lessonId of account.completed) {
        await client.query(
          'insert into lesson_completions (user_id, course_id, lesson_id) values ($1, $2, $3)',
          [userId, COURSE_ID, lessonId],
        );
      }
    }
  }
  console.log(`seed: ${String(accounts.length)} accounts in ${dataDir}`);
} finally {
  await client.close();
}
