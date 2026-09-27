'use client';

import type { ReactNode } from 'react';

import { AuthProvider } from '@/lib/auth/AuthProvider';
import { BookmarkStoreProvider } from '@/lib/bookmarks/BookmarkStoreProvider';
import { ProgressStoreProvider } from '@/lib/progress/ProgressStoreProvider';
import { CloudSync } from '@/lib/sync/CloudSync';

/**
 * Store providers first, then the account layer: sign-out clears both
 * stores, so `AuthProvider` must sit inside them. `CloudSync` sits inside
 * `AuthProvider` so its cleanup runs before the provider's clearing effect.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ProgressStoreProvider>
      <BookmarkStoreProvider>
        <AuthProvider>
          <CloudSync />
          {children}
        </AuthProvider>
      </BookmarkStoreProvider>
    </ProgressStoreProvider>
  );
}
