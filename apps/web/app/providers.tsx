'use client';

import type { ReactNode } from 'react';

import { BookmarkStoreProvider } from '@/lib/bookmarks/BookmarkStoreProvider';
import { ProgressStoreProvider } from '@/lib/progress/ProgressStoreProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ProgressStoreProvider>
      <BookmarkStoreProvider>{children}</BookmarkStoreProvider>
    </ProgressStoreProvider>
  );
}
