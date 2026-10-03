'use client';

import { useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { useBookmarkStore, useBookmarkSync } from '@/lib/bookmarks/BookmarkStoreProvider';
import { useProgressStore, useProgressSync } from '@/lib/progress/ProgressStoreProvider';
import { flushCloudSync } from '@/lib/sync/flush';
import { pendingQueueKeys } from '@/lib/sync/pendingQueue';

import { hasCloudMarker, isImplicitSignOut, storageChangeNeedsRecheck } from './implicitSignOut';
import { ACCOUNT_LOCAL_KEYS, ACCOUNT_SESSION_KEYS } from './localKeys';

/** Mirror of `PublicUser` on the server — what `/api/me` returns. */
export interface PublicUser {
  readonly id: string;
  readonly name: string | null;
  readonly email: string;
  readonly picture: string | null;
}

interface MeResponse {
  readonly enabled: boolean;
  readonly user: PublicUser | null;
}

export interface AuthState {
  /** Accounts are configured on the server (and reachable, for this load). */
  readonly enabled: boolean;
  readonly user: PublicUser | null;
  /** `loading` until `/api/me` has answered once. */
  readonly status: 'loading' | 'ready';
}

export interface AuthActions {
  /** Sign out, clear everything local, go Home. Resolves `false` if the request failed. */
  signOut(): Promise<boolean>;
  /** Delete the account server-side, then the same as `signOut`. */
  deleteAccount(): Promise<boolean>;
  /** Ask `/api/me` again (the sync layer saw a 401 / 409: the session changed under this tab). */
  recheckSession(): void;
}

export type AuthContextValue = AuthState & AuthActions;

const AuthContext = createContext<AuthContextValue | null>(null);

const OFF: MeResponse = { enabled: false, user: null };

async function fetchMe(): Promise<MeResponse> {
  try {
    const response = await fetch('/api/me', { credentials: 'same-origin', cache: 'no-store' });
    if (!response.ok) return OFF;
    const body = (await response.json()) as Partial<MeResponse>;
    return { enabled: body.enabled === true, user: body.user ?? null };
  } catch {
    return OFF;
  }
}

/**
 * Client-side session state. Pages stay static; the provider asks `/api/me`
 * once per full load, the same way progress hydrates from `localStorage`.
 * A failed or "disabled" answer renders no sign-in surface and touches
 * nothing stored locally. This browser is cleared in exactly two cases, both
 * in an effect that runs *after* the sync layer (a child) has been torn
 * down, so the clearing is never sent to the account as a change: the
 * reader's own `Odjava` / `Obriši nalog`, and an *implicit* sign-out — the
 * server says the session is gone while a cloud marker says the local
 * stores belonged to an account (see `isImplicitSignOut`).
 *
 * Phase 23: the clearing runs outside the sync journal, so it is never
 * queued as "unread everything". `Odjava` first sends the pending queue
 * (best effort, ≤ 2 s) and then deletes it with everything else; an
 * implicit sign-out keeps the queue — it is tagged with that account and
 * only ever replayed into it. A sign-out in another tab (its marker keys
 * disappear) re-asks `/api/me` here; the stores follow the other tab's
 * clearing on their own (`followOtherTabs`). So does a marker rewritten to
 * another user (another tab signed in as someone else without `Odjava`,
 * review 2026-10-03 P1 item 2), and a 401 / 409 from the sync layer.
 */
export function AuthProvider({
  courseIds,
  children,
}: {
  /** Courses whose local stores a sign-out clears; from the server layout. */
  courseIds: readonly string[];
  children: ReactNode;
}) {
  const [state, setState] = useState<AuthState>({ enabled: false, user: null, status: 'loading' });
  const [clearRequested, setClearRequested] = useState<'none' | 'explicit' | 'implicit'>('none');
  const resetCourse = useProgressStore((store) => store.resetCourse);
  const clearCourse = useBookmarkStore((store) => store.clearCourse);
  const { journal: progressJournal } = useProgressSync();
  const { journal: bookmarkJournal } = useBookmarkSync();
  const router = useRouter();
  const userIdRef = useRef<string | null>(null);
  const askRef = useRef<() => void>(() => undefined);
  const userId = state.user?.id ?? null;
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    const ask = (): void => {
      void fetchMe().then((me) => {
        if (cancelled) return;
        setState({ enabled: me.enabled, user: me.user, status: 'ready' });
        if (isImplicitSignOut(me, hasCloudMarker())) setClearRequested('implicit');
      });
    };
    askRef.current = ask;
    ask();
    // Another tab signed out (or its session ended): its clearing removes
    // the markers. Another tab signed in as someone else: it rewrites them.
    // Either way ask the server again rather than trust this tab's state.
    const onStorage = (event: StorageEvent): void => {
      if (event.storageArea !== window.localStorage) return;
      if (storageChangeNeedsRecheck(event.key, event.newValue, userIdRef.current)) ask();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      cancelled = true;
      askRef.current = () => undefined;
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => {
    if (clearRequested === 'none') return;
    const explicit = clearRequested === 'explicit';
    for (const courseId of courseIds) {
      progressJournal.external(() => {
        resetCourse(courseId);
      });
      bookmarkJournal.external(() => {
        clearCourse(courseId);
      });
    }
    const keys = explicit ? [...ACCOUNT_LOCAL_KEYS, ...pendingQueueKeys()] : ACCOUNT_LOCAL_KEYS;
    for (const key of keys) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // private mode / blocked storage — nothing to clear.
      }
    }
    for (const key of ACCOUNT_SESSION_KEYS) {
      try {
        window.sessionStorage.removeItem(key);
      } catch {
        // private mode / blocked storage — nothing to clear.
      }
    }
    setClearRequested('none');
    if (explicit) {
      router.replace('/');
      router.refresh();
    }
  }, [
    clearRequested,
    courseIds,
    resetCourse,
    clearCourse,
    progressJournal,
    bookmarkJournal,
    router,
  ]);

  const leave = useCallback(async (request: () => Promise<Response>): Promise<boolean> => {
    // Send what is still queued while the session is valid; whatever does
    // not make it in 2 s is dropped with the rest of this browser's data.
    await flushCloudSync();
    let response: Response;
    try {
      response = await request();
    } catch {
      return false;
    }
    if (!response.ok) return false;
    // Drop the user first: the sync layer disposes on this render, and the
    // local stores are cleared by the effect above right after.
    setState((previous) => ({ ...previous, user: null }));
    setClearRequested('explicit');
    return true;
  }, []);

  const signOut = useCallback(
    () => leave(() => fetch('/api/auth/signout', { method: 'POST', credentials: 'same-origin' })),
    [leave],
  );

  const deleteAccount = useCallback(
    () => leave(() => fetch('/api/me', { method: 'DELETE', credentials: 'same-origin' })),
    [leave],
  );

  const recheckSession = useCallback(() => {
    askRef.current();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, signOut, deleteAccount, recheckSession }),
    [state, signOut, deleteAccount, recheckSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (value === null) {
    throw new Error('useAuth must be used inside <AuthProvider>.');
  }
  return value;
}
