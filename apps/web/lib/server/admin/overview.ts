import 'server-only';

import { and, count, desc, eq, exists, gte, inArray, max, or, sql } from 'drizzle-orm';

import type { Db } from '../db/client';
import { bookmarks, courseProgress, lessonCompletions, users } from '../db/schema';

/**
 * The accounts overview behind `/pregled` (Phase 16): read-only, for the
 * owner. It reads what the account pages already describe on `/privatnost`
 * — name, e-mail, dates, counts — and never Google's `sub`, the picture or
 * anything about sessions.
 */

/** The list shows the newest accounts only; the totals count all of them. */
export const OVERVIEW_ROW_LIMIT = 500;
/** "New" and "active" look back this many days. */
export const OVERVIEW_WINDOW_DAYS = 7;

const DAY_MS = 86_400_000;

export interface AccountOverviewRow {
  readonly id: string;
  readonly name: string | null;
  readonly email: string;
  readonly registeredAt: Date;
  /**
   * The later of the last sign-in and the last change of progress — a session
   * lasts thirty days, so the sign-in alone would understate it. Falls back
   * to the registration for an account that has neither.
   */
  readonly lastActiveAt: Date;
  readonly lessonsRead: number;
  readonly lessonsSaved: number;
}

export interface AccountsOverview {
  /** Every account, not only the listed ones. */
  readonly total: number;
  readonly newInWindow: number;
  readonly activeInWindow: number;
  /** Newest first, at most `OVERVIEW_ROW_LIMIT`. */
  readonly accounts: readonly AccountOverviewRow[];
}

function later(a: Date, b: Date | null | undefined): Date {
  return b !== null && b !== undefined && b.getTime() > a.getTime() ? b : a;
}

export async function getAccountsOverview(
  db: Db,
  now: Date = new Date(),
): Promise<AccountsOverview> {
  const since = new Date(now.getTime() - OVERVIEW_WINDOW_DAYS * DAY_MS);

  const [totalRow] = await db.select({ value: count() }).from(users);
  const [newRow] = await db
    .select({ value: count() })
    .from(users)
    .where(gte(users.createdAt, since));
  const [activeRow] = await db
    .select({ value: count() })
    .from(users)
    .where(
      or(
        gte(users.createdAt, since),
        gte(users.lastSeenAt, since),
        exists(
          db
            .select({ one: sql`1` })
            .from(courseProgress)
            .where(and(eq(courseProgress.userId, users.id), gte(courseProgress.updatedAt, since))),
        ),
      ),
    );

  const listed = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
      lastSeenAt: users.lastSeenAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt), users.id)
    .limit(OVERVIEW_ROW_LIMIT);

  const ids = listed.map((row) => row.id);
  const read = new Map<string, number>();
  const saved = new Map<string, number>();
  const progressAt = new Map<string, Date>();
  if (ids.length > 0) {
    const readRows = await db
      .select({ userId: lessonCompletions.userId, value: count() })
      .from(lessonCompletions)
      .where(inArray(lessonCompletions.userId, ids))
      .groupBy(lessonCompletions.userId);
    for (const row of readRows) read.set(row.userId, row.value);

    const savedRows = await db
      .select({ userId: bookmarks.userId, value: count() })
      .from(bookmarks)
      .where(inArray(bookmarks.userId, ids))
      .groupBy(bookmarks.userId);
    for (const row of savedRows) saved.set(row.userId, row.value);

    const progressRows = await db
      .select({ userId: courseProgress.userId, value: max(courseProgress.updatedAt) })
      .from(courseProgress)
      .where(inArray(courseProgress.userId, ids))
      .groupBy(courseProgress.userId);
    for (const row of progressRows) {
      if (row.value !== null) progressAt.set(row.userId, row.value);
    }
  }

  return {
    total: totalRow?.value ?? 0,
    newInWindow: newRow?.value ?? 0,
    activeInWindow: activeRow?.value ?? 0,
    accounts: listed.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      registeredAt: row.createdAt,
      lastActiveAt: later(later(row.createdAt, row.lastSeenAt), progressAt.get(row.id)),
      lessonsRead: read.get(row.id) ?? 0,
      lessonsSaved: saved.get(row.id) ?? 0,
    })),
  };
}
