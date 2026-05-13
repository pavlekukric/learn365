'use client';

import type { ReactNode } from 'react';

import { ProgressStoreProvider } from '@/lib/progress/ProgressStoreProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  return <ProgressStoreProvider>{children}</ProgressStoreProvider>;
}
