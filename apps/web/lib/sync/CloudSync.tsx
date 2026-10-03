'use client';

import { useEffect } from 'react';

import { useAuth } from '@/lib/auth/AuthProvider';
import { useBookmarkSync } from '@/lib/bookmarks/BookmarkStoreProvider';
import { useProgressSync } from '@/lib/progress/ProgressStoreProvider';

import { runningSync } from './flush';
import { startSync } from './syncEngine';

function logSyncError(error: unknown): void {
  console.warn('[sync]', error instanceof Error ? error.message : error);
}

/**
 * Mounts the sync engines (progress + bookmarks) while a reader is signed
 * in; renders nothing. Lives inside `AuthProvider`, so on sign-out its
 * effect cleanup (dispose) runs before the provider's own effect clears the
 * local stores — the clearing never reaches the account as a delta.
 */
export function CloudSync({
  courseIds,
}: {
  /** Courses to keep in sync; from the server layout, not the registry. */
  courseIds: readonly string[];
}) {
  const { status, enabled, user, recheckSession } = useAuth();
  const progress = useProgressSync();
  const bookmarks = useBookmarkSync();
  const userId = user?.id ?? null;

  useEffect(() => {
    if (status !== 'ready' || !enabled || userId === null) return;
    // A 401 / 409 means the session changed under this tab: let `/api/me`
    // decide between the sign-out and the account-switch path.
    const shared = { courseIds, userId, onError: logSyncError, onSessionLost: recheckSession };
    const handles = [startSync({ ...progress, ...shared }), startSync({ ...bookmarks, ...shared })];
    for (const handle of handles) runningSync.add(handle);
    return () => {
      for (const handle of handles) {
        handle.dispose();
        runningSync.delete(handle);
      }
    };
  }, [status, enabled, userId, courseIds, progress, bookmarks, recheckSession]);

  return null;
}
