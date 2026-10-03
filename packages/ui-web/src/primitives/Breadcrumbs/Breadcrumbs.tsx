import Link from 'next/link';
import type { MouseEventHandler } from 'react';

import styles from './Breadcrumbs.module.css';

export interface BreadcrumbItem {
  label: string;
  /**
   * When set, the crumb renders as a `next/link` anchor and is navigable —
   * wherever it sits in the trail. Takes precedence over `onClick`.
   */
  href?: string | undefined;
  /**
   * Fallback to a `<button>` for crumbs that need an in-page action
   * (e.g. opening a panel) rather than a route change.
   */
  onClick?: MouseEventHandler<HTMLButtonElement> | undefined;
  /**
   * Whether a plain-text crumb is the page itself (`aria-current="page"`).
   * Defaults to "the last crumb, when it has no href or onClick"; pass
   * `false` for a place that is named but has no page (a lesson's section).
   */
  current?: boolean | undefined;
}

interface BreadcrumbsProps {
  items: readonly BreadcrumbItem[];
}

/**
 * Location trail. A crumb with an `href` (or `onClick`) is interactive
 * wherever it sits; a crumb with neither renders as plain text and, when it
 * is the last one, is marked `aria-current="page"` — it *is* the page
 * (unless `current: false`). The lesson page passes Home · course as links
 * and its era · section as plain text — they have no page of their own —
 * and no current crumb: the article title below is the page.
 */
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) return null;
  const lastIndex = items.length - 1;
  return (
    <nav aria-label="Putanja" className={styles.nav}>
      <ol className={styles.list}>
        {items.map((item, idx) => {
          const isLast = idx === lastIndex;
          const isPlain = item.href === undefined && item.onClick === undefined;
          const isCurrentPage = isPlain && (item.current ?? isLast);
          return (
            <li key={`${item.label}-${String(idx)}`} className={styles.item}>
              {item.href !== undefined ? (
                <Link href={item.href} className={styles.link}>
                  {item.label}
                </Link>
              ) : item.onClick !== undefined ? (
                <button type="button" onClick={item.onClick} className={styles.link}>
                  {item.label}
                </button>
              ) : (
                <span
                  className={isCurrentPage ? styles.current : styles.text}
                  aria-current={isCurrentPage ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
              {isLast ? null : (
                <span className={styles.separator} aria-hidden="true">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
