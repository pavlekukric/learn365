import Link from 'next/link';

import { IconUser } from '../../icons/IconUser.js';

import styles from './AccountMark.module.css';

export interface AccountMarkProps {
  /** Display name from the identity provider; initials fall back on it. */
  name: string | null;
  /** Profile picture URL (Google); the image is requested without a referrer. */
  pictureUrl: string | null;
  /** Where the mark leads — the account page. */
  href: string;
  /** Accessible name. Defaults to `Nalog: <name>` / `Nalog`. */
  label?: string;
}

/** Up to two initials from a display name (`Pavle Kukrić` → `PK`, `Ana` → `A`). */
export function initialsFor(name: string | null): string {
  if (name === null) return '';
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toLocaleUpperCase('sr-Latn');
}

/**
 * The signed-in mark in the masthead: a 28px circle with the reader's
 * picture, or their initials, or a neutral person glyph. Deliberately
 * quiet — it is a way to reach the account page, not a status display.
 */
export function AccountMark({ name, pictureUrl, href, label }: AccountMarkProps) {
  const initials = initialsFor(name);
  const accessibleName = label ?? (name ? `Nalog: ${name}` : 'Nalog');
  return (
    <Link href={href} className={styles.mark} aria-label={accessibleName} data-link="account">
      {pictureUrl ? (
        // A plain <img>: 28px, no optimisation needed, and Google's CDN
        // must not receive the page URL as a referrer.
        <img
          className={styles.image}
          src={pictureUrl}
          alt=""
          width={28}
          height={28}
          referrerPolicy="no-referrer"
          decoding="async"
        />
      ) : initials ? (
        <span className={styles.initials} aria-hidden="true">
          {initials}
        </span>
      ) : (
        <IconUser className={styles.icon} />
      )}
    </Link>
  );
}
