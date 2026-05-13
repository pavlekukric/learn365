import type { MouseEventHandler } from 'react';

import styles from './Breadcrumbs.module.css';

export interface BreadcrumbItem {
  label: string;
  onClick?: MouseEventHandler<HTMLButtonElement> | undefined;
}

interface BreadcrumbsProps {
  items: readonly BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) return null;
  const lastIndex = items.length - 1;
  return (
    <nav aria-label="Breadcrumbs" className={styles.nav}>
      <ol className={styles.list}>
        {items.map((item, idx) => {
          const isLast = idx === lastIndex;
          return (
            <li key={`${item.label}-${String(idx)}`} className={styles.item}>
              {isLast || !item.onClick ? (
                <span
                  className={styles.current}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={item.onClick}
                  className={styles.link}
                >
                  {item.label}
                </button>
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
