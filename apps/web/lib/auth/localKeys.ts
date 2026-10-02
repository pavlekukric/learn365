/**
 * Browser-storage keys the account layer owns (besides the progress /
 * bookmark stores, which have their own keys in `@learn365/core`).
 * All of them are removed on sign-out and on account deletion.
 */

/** `{ userId }` — which account this browser's local progress was last merged into. */
export const PROGRESS_MARKER_KEY = 'learn365:cloud:progress:v1';

/** `{ userId }` — the same for bookmarks. */
export const BOOKMARKS_MARKER_KEY = 'learn365:cloud:bookmarks:v1';

/** `{ dismissedAt }` — the reader answered `Ne sada` to the sign-in ask. */
export const SIGNIN_PROMPT_KEY = 'learn365:signin-prompt:v1';

/**
 * `localStorage` keys. The pending-change queues (`learn365:cloud:pending:v1:…`,
 * `lib/sync/pendingQueue.ts`) are removed by `Odjava` / account deletion
 * too, but kept on an implicit sign-out — tagged with their account.
 */
export const ACCOUNT_LOCAL_KEYS: readonly string[] = [
  PROGRESS_MARKER_KEY,
  BOOKMARKS_MARKER_KEY,
  SIGNIN_PROMPT_KEY,
];

/** `{ lessonId }` — the lesson the sign-in ask was shown on in this browser session. */
export const SIGNIN_PROMPT_SESSION_KEY = 'learn365:signin-prompt:session:v1';

/** `sessionStorage` keys. */
export const ACCOUNT_SESSION_KEYS: readonly string[] = [SIGNIN_PROMPT_SESSION_KEY];
