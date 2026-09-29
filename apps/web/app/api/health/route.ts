import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDb } from '@/lib/server/db/client';
import { getMigrationState, type MigrationState } from '@/lib/server/db/migrate';
import { getServerEnv, isAuthEnabled } from '@/lib/server/env';

export const dynamic = 'force-dynamic';

type DbStatus = 'ok' | 'off' | 'error';

interface HealthBody {
  readonly ok: boolean;
  readonly auth: boolean;
  readonly db: DbStatus;
  /** Review 2026-09-30 item 10 — `deploy.sh` waits until this is no longer `pending`. */
  readonly migrations: MigrationState;
}

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

/**
 * Operator-facing health: is the database reachable, are its migrations
 * applied, and are accounts on. `ok` (and 200) means everything configured
 * works: no database at all, or a reachable one with its migrations applied.
 * The Docker image's own healthcheck stays `GET /` on purpose — reading must
 * keep working when the database is down, so a database outage must not
 * restart the web container.
 */
export async function GET(): Promise<NextResponse<HealthBody>> {
  const env = getServerEnv();
  const auth = isAuthEnabled(env);
  if (env.databaseUrl === null) {
    return NextResponse.json(
      { ok: true, auth, db: 'off', migrations: 'off' },
      { headers: NO_STORE },
    );
  }
  let db: DbStatus;
  try {
    await (await getDb()).execute(sql`select 1`);
    db = 'ok';
  } catch (error) {
    console.error('[health] database check failed', error);
    db = 'error';
  }
  const migrations = getMigrationState();
  const ok = db === 'ok' && migrations === 'ok';
  return NextResponse.json(
    { ok, auth, db, migrations },
    { status: ok ? 200 : 503, headers: NO_STORE },
  );
}
