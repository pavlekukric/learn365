/**
 * `localStorage` keys the account layer owns in the browser (besides the
 * progress / bookmark stores, which have their own keys in `@learn365/core`).
 * All of them are removed on sign-out and on account deletion.
 */

/** `{ userId }` — which account this browser's local progress was last merged into. */
export const PROGRESS_MARKER_KEY = 'learn365:cloud:progress:v1';

/** `{ userId }` — the same for bookmarks. */
export const BOOKMARKS_MARKER_KEY = 'learn365:cloud:bookmarks:v1';

/** `{ dismissedAt }` — the reader answered `Ne sada` to the sign-in ask. */
export const SIGNIN_PROMPT_KEY = 'learn365:signin-prompt:v1';

export const ACCOUNT_LOCAL_KEYS: readonly string[] = [
  PROGRESS_MARKER_KEY,
  BOOKMARKS_MARKER_KEY,
  SIGNIN_PROMPT_KEY,
];
