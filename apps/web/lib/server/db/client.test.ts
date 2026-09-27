import { fileURLToPath } from 'node:url';

import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { openConnection, type DbConnection } from './client';
import { sessions, users } from './schema';

const MIGRATIONS_DIR = fileURLToPath(new URL('./migrations', import.meta.url));

describe('db client on PGlite', () => {
  let connection: DbConnection;

  beforeAll(async () => {
    connection = await openConnection('pglite://');
    await connection.migrate(MIGRATIONS_DIR);
  });

  afterAll(async () => {
    await connection.close();
  });

  it('applies the committed migrations and answers a trivial query', async () => {
    expect(connection.driver).toBe('pglite');
    // The shared `Db` type is driver-agnostic, so raw results are untyped;
    // PGlite answers `{ rows }`, which is all this smoke check needs.
    const result = (await connection.db.execute(sql`select 1 as one`)) as {
      rows: Record<string, unknown>[];
    };
    expect(result.rows[0]).toEqual({ one: 1 });
  });

  it('creates users with generated uuids and cascades sessions on delete', async () => {
    const [user] = await connection.db
      .insert(users)
      .values({ googleSub: 'sub-1', email: 'reader@example.com', name: 'Reader' })
      .returning();
    expect(user?.id).toMatch(/^[0-9a-f-]{36}$/);
    if (!user) throw new Error('insert returned no row');

    await connection.db.insert(sessions).values({
      id: 'hash-1',
      userId: user.id,
      expiresAt: new Date('2027-01-01T00:00:00.000Z'),
    });
    expect(await connection.db.select().from(sessions)).toHaveLength(1);

    await connection.db.delete(users);
    expect(await connection.db.select().from(sessions)).toHaveLength(0);
  });

  it('rejects a second user with the same google_sub', async () => {
    await connection.db.insert(users).values({ googleSub: 'sub-dup', email: 'a@example.com' });
    await expect(
      connection.db.insert(users).values({ googleSub: 'sub-dup', email: 'b@example.com' }),
    ).rejects.toThrow();
  });
});
