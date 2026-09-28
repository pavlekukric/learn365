'use client';

import { useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { getAllCourseIds } from '@learn365/content';

import { useBookmarkStore } from '@/lib/bookmarks/BookmarkStoreProvider';
import { useProgressStore } from '@/lib/progress/ProgressStoreProvider';

import { hasCloudMarker, isImplicitSignOut } from './implicitSignOut';
import { ACCOUNT_LOCAL_KEYS } from './localKeys';

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
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ enabled: false, user: null, status: 'loading' });
  const [clearRequested, setClearRequested] = useState<'none' | 'explicit' | 'implicit'>('none');
  const resetCourse = useProgressStore((store) => store.resetCourse);
  const clearCourse = useBookmarkStore((store) => store.clearCourse);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    void fetchMe().then((me) => {
      if (cancelled) return;
      setState({ enabled: me.enabled, user: me.user, status: 'ready' });
      if (isImplicitSignOut(me, hasCloudMarker())) setClearRequested('implicit');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (clearRequested === 'none') return;
    for (const courseId of getAllCourseIds()) {
      resetCourse(courseId);
      clearCourse(courseId);
    }
    for (const key of ACCOUNT_LOCAL_KEYS) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // private mode / blocked storage — nothing to clear.
      }
    }
    const explicit = clearRequested === 'explicit';
    setClearRequested('none');
    if (explicit) {
      router.replace('/');
      router.refresh();
    }
  }, [clearRequested, resetCourse, clearCourse, router]);

  const leave = useCallback(async (request: () => Promise<Response>): Promise<boolean> => {
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

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, signOut, deleteAccount }),
    [state, signOut, deleteAccount],
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
