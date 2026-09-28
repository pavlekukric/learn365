'use client';

import { useEffect } from 'react';

import { useAuth } from '@/lib/auth/AuthProvider';
import { useBookmarkStoreApi } from '@/lib/bookmarks/BookmarkStoreProvider';
import { useProgressStoreApi } from '@/lib/progress/ProgressStoreProvider';

import { createBookmarkAdapter } from './bookmarkAdapter';
import { createProgressAdapter } from './progressAdapter';
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
  const { status, enabled, user } = useAuth();
  const progressStore = useProgressStoreApi();
  const bookmarkStore = useBookmarkStoreApi();
  const userId = user?.id ?? null;

  useEffect(() => {
    if (status !== 'ready' || !enabled || userId === null) return;
    const handles = [
      startSync({
        adapter: createProgressAdapter(progressStore),
        courseIds,
        userId,
        onError: logSyncError,
      }),
      startSync({
        adapter: createBookmarkAdapter(bookmarkStore),
        courseIds,
        userId,
        onError: logSyncError,
      }),
    ];
    return () => {
      for (const handle of handles) handle.dispose();
    };
  }, [status, enabled, userId, courseIds, progressStore, bookmarkStore]);

  return null;
}
