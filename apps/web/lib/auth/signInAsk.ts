/** The ask appears once this many lessons are completed (the second `Označi kao pročitano`). */
export const SIGN_IN_ASK_AFTER = 2;

export interface SignInAskInput {
  /** `/api/me` has answered for this page load. */
  readonly ready: boolean;
  /** Accounts are configured on the server. */
  readonly accountsEnabled: boolean;
  readonly signedIn: boolean;
  /** `Ne sada` was pressed in this browser; `null` until `localStorage` was read. */
  readonly dismissed: boolean | null;
  /** Lessons completed in the course. */
  readonly completedCount: number;
  /** The lesson being rendered. */
  readonly lessonId: string;
  /**
   * The lesson the ask was first shown on in this browser session: `null` —
   * not shown yet; `undefined` — `sessionStorage` was not read yet.
   */
  readonly shownOnLessonId: string | null | undefined;
}

/**
 * Whether the account ask is rendered under this lesson.
 *
 * When it becomes due is unchanged since Phase 8: accounts on, nobody signed
 * in, `Ne sada` never pressed, at least two lessons completed. Phase 15 adds
 * the session rule: the ask belongs to the first lesson it was shown on and
 * appears on no other lesson until the browser session ends — it stays put on
 * a reload of that lesson instead of vanishing under the reader.
 */
export function isSignInAskDue(input: SignInAskInput): boolean {
  if (!input.ready || !input.accountsEnabled || input.signedIn) return false;
  if (input.dismissed !== false) return false;
  if (input.completedCount < SIGN_IN_ASK_AFTER) return false;
  if (input.shownOnLessonId === undefined) return false;
  return input.shownOnLessonId === null || input.shownOnLessonId === input.lessonId;
}
