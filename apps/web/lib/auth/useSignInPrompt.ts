'use client';

import { useCallback, useEffect, useState } from 'react';

import { completedCount } from '@learn365/core';

import { useProgressStore } from '@/lib/progress/ProgressStoreProvider';

import { useAuth } from './AuthProvider';
import { SIGNIN_PROMPT_KEY } from './localKeys';

/** The ask appears once this many lessons are completed (the second `Završi`). */
export const SIGN_IN_ASK_AFTER = 2;

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(SIGNIN_PROMPT_KEY) !== null;
  } catch {
    return false;
  }
}

function writeDismissed(): void {
  try {
    window.localStorage.setItem(
      SIGNIN_PROMPT_KEY,
      JSON.stringify({ dismissedAt: new Date().toISOString() }),
    );
  } catch {
    // private mode — the card will simply return next load.
  }
}

export interface SignInPromptState {
  /** Render the card: accounts on, signed out, not dismissed, ≥ 2 completed. */
  readonly show: boolean;
  /** `/api/auth/google?return_to=<this lesson>`. */
  readonly href: string;
  readonly dismiss: () => void;
}

export function useSignInPrompt(courseId: string, lessonId: string): SignInPromptState {
  const { enabled, user, status } = useAuth();
  const completed = useProgressStore((state) => completedCount(state, courseId));
  // `null` until mounted: the dismissal lives in localStorage, which the
  // server render cannot see.
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    setDismissed(readDismissed());
  }, []);

  const dismiss = useCallback(() => {
    writeDismissed();
    setDismissed(true);
  }, []);

  const show =
    status === 'ready' &&
    enabled &&
    user === null &&
    dismissed === false &&
    completed >= SIGN_IN_ASK_AFTER;
  const returnTo = `/course/${courseId}/lesson/${lessonId}`;
  const href = `/api/auth/google?return_to=${encodeURIComponent(returnTo)}`;

  return { show, href, dismiss };
}
