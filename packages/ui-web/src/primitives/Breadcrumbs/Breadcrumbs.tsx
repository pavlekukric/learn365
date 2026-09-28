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
}

interface BreadcrumbsProps {
  items: readonly BreadcrumbItem[];
}

/**
 * Location trail. A crumb with an `href` (or `onClick`) is interactive
 * wherever it sits; a crumb with neither renders as plain text and, when it
 * is the last one, is marked `aria-current="page"` — it *is* the page. The
 * lesson page passes four ancestor links (Home · course · era · section)
 * and no current crumb: the article title below is the page.
 */
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) return null;
  const lastIndex = items.length - 1;
  return (
    <nav aria-label="Breadcrumbs" className={styles.nav}>
      <ol className={styles.list}>
        {items.map((item, idx) => {
          const isLast = idx === lastIndex;
          const isCurrentPage = isLast && item.href === undefined && item.onClick === undefined;
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
                  className={styles.current}
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
