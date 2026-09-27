'use client';

import type { ReactNode } from 'react';

import { AuthProvider } from '@/lib/auth/AuthProvider';
import { BookmarkStoreProvider } from '@/lib/bookmarks/BookmarkStoreProvider';
import { ProgressStoreProvider } from '@/lib/progress/ProgressStoreProvider';

/**
 * Store providers first, then the account layer: sign-out clears both
 * stores, so `AuthProvider` must sit inside them.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ProgressStoreProvider>
      <BookmarkStoreProvider>
        <AuthProvider>{children}</AuthProvider>
      </BookmarkStoreProvider>
    </ProgressStoreProvider>
  );
}
