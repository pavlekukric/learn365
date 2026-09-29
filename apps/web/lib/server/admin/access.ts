/**
 * Who may open `/pregled`, the owner's accounts overview (Phase 16).
 *
 * The flag lives on the account's own row (`users.is_admin`) and is set by
 * hand on the box; a signed-in account without it gets the same 404 a wrong
 * address gets. Pure, so the whole rule is unit-tested.
 */
export type OverviewAccess = 'not-found' | 'sign-in' | 'allow';

export interface OverviewAccessInput {
  /** Accounts are configured on the server (database + origin + Google client). */
  readonly authEnabled: boolean;
  /** The signed-in account, or `null` when nobody is signed in. */
  readonly user: { readonly isAdmin: boolean } | null;
}

export function resolveOverviewAccess(input: OverviewAccessInput): OverviewAccess {
  if (!input.authEnabled) return 'not-found';
  if (input.user === null) return 'sign-in';
  return input.user.isAdmin ? 'allow' : 'not-found';
}
