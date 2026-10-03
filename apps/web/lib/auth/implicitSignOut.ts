import { localStorageMarker, markerUserId } from '@/lib/sync/marker';

import { BOOKMARKS_MARKER_KEY, PROGRESS_MARKER_KEY } from './localKeys';

/**
 * Whether a `/api/me` answer means this browser was signed out without
 * pressing `Odjava`: accounts are on, the server sees no valid session
 * (expired, cookie gone, account deleted on another device), and a cloud
 * marker says the local stores were once merged into an account. The
 * previous reader's local copy must then be cleared so it can never be
 * unioned into whoever signs in next; their account still holds it.
 *
 * `enabled: false` never counts — a database outage answers that way and
 * must not wipe a reader's local copy.
 */
export function isImplicitSignOut(
  me: { readonly enabled: boolean; readonly user: unknown },
  markerPresent: boolean,
): boolean {
  return me.enabled && me.user === null && markerPresent;
}

/** Does either cloud marker name an account in this browser? */
export function hasCloudMarker(): boolean {
  return [PROGRESS_MARKER_KEY, BOOKMARKS_MARKER_KEY].some(
    (key) => localStorageMarker(key).read() !== null,
  );
}

/**
 * Whether another tab's `localStorage` change means this tab should ask
 * `/api/me` again: storage was cleared, a cloud marker was removed (a
 * sign-out), or a marker now names someone other than `currentUserId` (a
 * sign-in as another account without `Odjava`, review 2026-10-03 P1 item 2).
 */
export function storageChangeNeedsRecheck(
  key: string | null,
  newValue: string | null,
  currentUserId: string | null,
): boolean {
  if (key === null) return true;
  if (key !== PROGRESS_MARKER_KEY && key !== BOOKMARKS_MARKER_KEY) return false;
  const named = markerUserId(newValue);
  return named === null || named !== currentUserId;
}
