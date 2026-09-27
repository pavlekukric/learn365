import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { openTestDb } from '../../../test/db';
import type { DbConnection } from '../db/client';
import { sessions, users } from '../db/schema';

import { createSession } from './session';
import { deleteUser, toPublicUser, upsertGoogleUser } from './users';

describe('users', () => {
  let connection: DbConnection;

  beforeAll(async () => {
    connection = await openTestDb();
  });

  afterAll(async () => {
    await connection.close();
  });

  it('upserts by google sub: same account keeps its id, profile fields refresh', async () => {
    const first = await upsertGoogleUser(connection.db, {
      sub: 'sub-a',
      email: 'a@example.com',
      name: 'Ana',
      picture: null,
    });
    const second = await upsertGoogleUser(connection.db, {
      sub: 'sub-a',
      email: 'ana@example.com',
      name: 'Ana Petrović',
      picture: 'https://lh3.googleusercontent.com/a/ana',
    });
    expect(second.id).toBe(first.id);
    expect(second.email).toBe('ana@example.com');
    expect(second.name).toBe('Ana Petrović');
    expect(second.pictureUrl).toBe('https://lh3.googleusercontent.com/a/ana');
    expect(second.lastSeenAt).not.toBeNull();

    const other = await upsertGoogleUser(connection.db, {
      sub: 'sub-b',
      email: 'b@example.com',
      name: null,
      picture: null,
    });
    expect(other.id).not.toBe(first.id);
    expect(await connection.db.select().from(users)).toHaveLength(2);
  });

  it('exposes only the public shape to the browser', async () => {
    const [row] = await connection.db.select().from(users).limit(1);
    if (!row) throw new Error('no user');
    const pub = toPublicUser(row);
    expect(Object.keys(pub).sort()).toEqual(['email', 'id', 'name', 'picture']);
    expect(pub).not.toHaveProperty('googleSub');
  });

  it('deletes a user together with their sessions', async () => {
    const user = await upsertGoogleUser(connection.db, {
      sub: 'sub-delete',
      email: 'd@example.com',
      name: null,
      picture: null,
    });
    await createSession(connection.db, user.id);
    await deleteUser(connection.db, user.id);
    const remaining = await connection.db.select().from(sessions);
    expect(remaining.some((row) => row.userId === user.id)).toBe(false);
    const rows = await connection.db.select().from(users);
    expect(rows.some((row) => row.id === user.id)).toBe(false);
  });
});
