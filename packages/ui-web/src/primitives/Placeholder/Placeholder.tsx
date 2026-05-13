import type { ReactNode } from 'react';

import styles from './Placeholder.module.css';

interface PlaceholderProps {
  label?: string;
  /** CSS `aspect-ratio` value (e.g. "16 / 9", "3 / 4"). Defaults to "16 / 9". */
  ratio?: string;
  children?: ReactNode;
}

export function Placeholder({ label, ratio = '16 / 9', children }: PlaceholderProps) {
  return (
    <div className={styles.placeholder} style={{ aspectRatio: ratio }}>
      <div className={styles.grid} aria-hidden="true" />
      {label ? <span className={styles.label}>{label}</span> : null}
      {children}
    </div>
  );
}
