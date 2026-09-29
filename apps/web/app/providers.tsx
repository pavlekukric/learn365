'use client';

import { useEffect, type ReactNode } from 'react';

import { AuthProvider } from '@/lib/auth/AuthProvider';
import { BookmarkStoreProvider } from '@/lib/bookmarks/BookmarkStoreProvider';
import { clearPrePaintMark } from '@/lib/progress/prePaint';
import { ProgressStoreProvider } from '@/lib/progress/ProgressStoreProvider';
import { CloudSync } from '@/lib/sync/CloudSync';

/**
 * Store providers first, then the account layer: sign-out clears both
 * stores, so `AuthProvider` must sit inside them. `CloudSync` sits inside
 * `AuthProvider` so its cleanup runs before the provider's clearing effect.
 */
export function AppProviders({
  courseIds,
  children,
}: {
  /** Every course in the registry — resolved by the root layout on the server. */
  courseIds: readonly string[];
  children: ReactNode;
}) {
  // The components render from the store now; the pre-paint mark is done.
  useEffect(() => clearPrePaintMark(), []);
  return (
    <ProgressStoreProvider>
      <BookmarkStoreProvider>
        <AuthProvider courseIds={courseIds}>
          <CloudSync courseIds={courseIds} />
          {children}
        </AuthProvider>
      </BookmarkStoreProvider>
    </ProgressStoreProvider>
  );
}
