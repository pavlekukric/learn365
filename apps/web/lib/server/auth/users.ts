import 'server-only';

import { eq } from 'drizzle-orm';

import type { Db } from '../db/client';
import { users, type UserRow } from '../db/schema';

import type { GoogleIdentity } from './google';

/**
 * Users are keyed by Google's `sub`. Every sign-in refreshes the profile
 * fields we mirror (email, name, picture) and `last_seen_at`; nothing else
 * about the row changes.
 */
export async function upsertGoogleUser(
  db: Db,
  identity: GoogleIdentity,
  now: Date = new Date(),
): Promise<UserRow> {
  const profile = {
    email: identity.email,
    name: identity.name,
    pictureUrl: identity.picture,
    lastSeenAt: now,
  };
  const [row] = await db
    .insert(users)
    .values({ googleSub: identity.sub, ...profile })
    .onConflictDoUpdate({ target: users.googleSub, set: profile })
    .returning();
  if (row === undefined) {
    throw new Error('user upsert returned no row');
  }
  return row;
}

/** Delete the account; sessions, progress and bookmarks cascade in the schema. */
export async function deleteUser(db: Db, userId: string): Promise<void> {
  await db.delete(users).where(eq(users.id, userId));
}

/** The shape the browser sees — never the Google sub or timestamps. */
export interface PublicUser {
  readonly id: string;
  readonly name: string | null;
  readonly email: string;
  readonly picture: string | null;
}

export function toPublicUser(row: UserRow): PublicUser {
  return { id: row.id, name: row.name, email: row.email, picture: row.pictureUrl };
}
