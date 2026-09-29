import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { openTestDb } from '../../../test/db';
import { upsertGoogleUser } from '../auth/users';
import { applyBookmarksDelta } from '../bookmarks/repository';
import type { DbConnection } from '../db/client';
import { users } from '../db/schema';
import { applyProgressDelta } from '../progress/repository';

import { getAccountsOverview } from './overview';

const COURSE = 'istorija-srbije-365';
const NOW = new Date('2026-09-29T12:00:00.000Z');
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 86_400_000);

describe('accounts overview', () => {
  let connection: DbConnection;

  beforeAll(async () => {
    connection = await openTestDb();
  });

  afterAll(async () => {
    await connection.close();
  });

  it('is empty for an empty database', async () => {
    expect(await getAccountsOverview(connection.db, NOW)).toEqual({
      total: 0,
      newInWindow: 0,
      activeInWindow: 0,
      accounts: [],
    });
  });

  it('lists accounts newest first with their counts and last activity', async () => {
    const db = connection.db;

    // Registered 30 days ago, signed in 20 days ago, read a lesson yesterday.
    const ana = await upsertGoogleUser(
      db,
      { sub: 's-ana', email: 'ana@example.com', name: 'Ana', picture: null },
      daysAgo(20),
    );
    await db
      .update(users)
      .set({ createdAt: daysAgo(30) })
      .where(eq(users.id, ana.id));
    await applyProgressDelta(
      db,
      ana.id,
      COURSE,
      { complete: ['day-001', 'day-002', 'day-003'], uncomplete: [] },
      daysAgo(1),
    );
    await applyBookmarksDelta(db, ana.id, COURSE, { add: ['day-002'], remove: [] }, daysAgo(1));

    // Registered and last seen 10 days ago, nothing since.
    const bora = await upsertGoogleUser(
      db,
      { sub: 's-bora', email: 'bora@example.com', name: null, picture: null },
      daysAgo(10),
    );
    await db
      .update(users)
      .set({ createdAt: daysAgo(10) })
      .where(eq(users.id, bora.id));

    // Registered two days ago.
    const ceca = await upsertGoogleUser(
      db,
      { sub: 's-ceca', email: 'ceca@example.com', name: 'Ceca', picture: null },
      daysAgo(2),
    );
    await db
      .update(users)
      .set({ createdAt: daysAgo(2) })
      .where(eq(users.id, ceca.id));

    const overview = await getAccountsOverview(db, NOW);

    expect(overview.total).toBe(3);
    expect(overview.newInWindow).toBe(1); // Ceca
    expect(overview.activeInWindow).toBe(2); // Ceca (new) and Ana (progress yesterday)
    expect(overview.accounts.map((a) => a.email)).toEqual([
      'ceca@example.com',
      'bora@example.com',
      'ana@example.com',
    ]);

    const [cecaRow, boraRow, anaRow] = overview.accounts;
    expect(anaRow).toMatchObject({ name: 'Ana', lessonsRead: 3, lessonsSaved: 1 });
    expect(anaRow?.registeredAt.toISOString()).toBe(daysAgo(30).toISOString());
    // Progress (yesterday) is later than the last sign-in (20 days ago).
    expect(anaRow?.lastActiveAt.toISOString()).toBe(daysAgo(1).toISOString());

    expect(boraRow).toMatchObject({ name: null, lessonsRead: 0, lessonsSaved: 0 });
    expect(boraRow?.lastActiveAt.toISOString()).toBe(daysAgo(10).toISOString());

    expect(cecaRow?.lastActiveAt.toISOString()).toBe(daysAgo(2).toISOString());
  });

  it('never hands out the Google subject, the picture or the flag', async () => {
    const overview = await getAccountsOverview(connection.db, NOW);
    for (const account of overview.accounts) {
      expect(Object.keys(account).sort()).toEqual(
        [
          'email',
          'id',
          'lastActiveAt',
          'lessonsRead',
          'lessonsSaved',
          'name',
          'registeredAt',
        ].sort(),
      );
    }
  });

  it('gives a new account no privilege', async () => {
    const rows = await connection.db.select({ isAdmin: users.isAdmin }).from(users);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => !row.isAdmin)).toBe(true);
  });

  it('keeps the flag through a later sign-in', async () => {
    const db = connection.db;
    const owner = await upsertGoogleUser(
      db,
      { sub: 's-owner', email: 'owner@example.com', name: 'Vlasnik', picture: null },
      daysAgo(3),
    );
    await db.update(users).set({ isAdmin: true }).where(eq(users.id, owner.id));
    const again = await upsertGoogleUser(
      db,
      { sub: 's-owner', email: 'owner@example.com', name: 'Vlasnik', picture: null },
      NOW,
    );
    expect(again.id).toBe(owner.id);
    expect(again.isAdmin).toBe(true);
  });
});
