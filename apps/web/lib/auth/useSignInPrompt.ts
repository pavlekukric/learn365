'use client';

import { useCallback, useEffect, useState } from 'react';

import { completedCount } from '@learn365/core';

import { useProgressStore } from '@/lib/progress/ProgressStoreProvider';

import { useAuth } from './AuthProvider';
import { SIGNIN_PROMPT_KEY, SIGNIN_PROMPT_SESSION_KEY } from './localKeys';
import { isSignInAskDue } from './signInAsk';

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

/** The lesson the ask was first shown on in this browser session, if any. */
function readShownOn(): string | null {
  try {
    const raw = window.sessionStorage.getItem(SIGNIN_PROMPT_SESSION_KEY);
    if (raw === null) return null;
    const parsed = JSON.parse(raw) as { lessonId?: unknown };
    return typeof parsed.lessonId === 'string' ? parsed.lessonId : null;
  } catch {
    return null;
  }
}

function writeShownOn(lessonId: string): void {
  try {
    window.sessionStorage.setItem(SIGNIN_PROMPT_SESSION_KEY, JSON.stringify({ lessonId }));
  } catch {
    // blocked storage — the card falls back to showing under every completed lesson.
  }
}

export interface SignInPromptState {
  /** Render the card: see `isSignInAskDue`. */
  readonly show: boolean;
  /** `/api/auth/google?return_to=<this lesson>`. */
  readonly href: string;
  readonly dismiss: () => void;
}

export function useSignInPrompt(courseId: string, lessonId: string): SignInPromptState {
  const { enabled, user, status } = useAuth();
  const completed = useProgressStore((state) => completedCount(state, courseId));
  // `null` / `undefined` until mounted: both records live in browser storage,
  // which the server render cannot see.
  const [dismissed, setDismissed] = useState<boolean | null>(null);
  const [shownOnLessonId, setShownOnLessonId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    setDismissed(readDismissed());
    setShownOnLessonId(readShownOn());
  }, []);

  const dismiss = useCallback(() => {
    writeDismissed();
    setDismissed(true);
  }, []);

  const show = isSignInAskDue({
    ready: status === 'ready',
    accountsEnabled: enabled,
    signedIn: user !== null,
    dismissed,
    completedCount: completed,
    lessonId,
    shownOnLessonId,
  });

  // The first lesson the card appears on owns it for the rest of the session.
  useEffect(() => {
    if (!show || shownOnLessonId !== null) return;
    writeShownOn(lessonId);
    setShownOnLessonId(lessonId);
  }, [show, shownOnLessonId, lessonId]);

  const returnTo = `/course/${courseId}/lesson/${lessonId}`;
  const href = `/api/auth/google?return_to=${encodeURIComponent(returnTo)}`;

  return { show, href, dismiss };
}
