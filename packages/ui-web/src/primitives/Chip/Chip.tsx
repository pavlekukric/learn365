import type { ReactNode } from 'react';

import styles from './Chip.module.css';

type ChipVariant = 'default' | 'accent';

interface ChipProps {
  variant?: ChipVariant;
  children: ReactNode;
}

export function Chip({ variant = 'default', children }: ChipProps) {
  return <span className={`${styles.chip} ${styles[`variant_${variant}`]}`}>{children}</span>;
}
