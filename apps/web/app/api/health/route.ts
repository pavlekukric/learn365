import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDb } from '@/lib/server/db/client';
import { getServerEnv, isAuthEnabled } from '@/lib/server/env';

export const dynamic = 'force-dynamic';

type DbStatus = 'ok' | 'off' | 'error';

interface HealthBody {
  readonly ok: boolean;
  readonly auth: boolean;
  readonly db: DbStatus;
}

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

/**
 * Operator-facing health: is the database reachable and are accounts on.
 * The Docker image's own healthcheck stays `GET /` on purpose — reading must
 * keep working when the database is down, so a database outage must not
 * restart the web container.
 */
export async function GET(): Promise<NextResponse<HealthBody>> {
  const env = getServerEnv();
  const auth = isAuthEnabled(env);
  if (env.databaseUrl === null) {
    return NextResponse.json({ ok: true, auth, db: 'off' }, { headers: NO_STORE });
  }
  try {
    const db = await getDb();
    await db.execute(sql`select 1`);
    return NextResponse.json({ ok: true, auth, db: 'ok' }, { headers: NO_STORE });
  } catch (error) {
    console.error('[health] database check failed', error);
    return NextResponse.json({ ok: false, auth, db: 'error' }, { status: 503, headers: NO_STORE });
  }
}
