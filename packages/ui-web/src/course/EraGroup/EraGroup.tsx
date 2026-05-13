import type { ReactNode } from 'react';

import type { Era } from '@learn365/content';

import styles from './EraGroup.module.css';

interface EraGroupProps {
  era: Era;
  children: ReactNode;
}

export function EraGroup({ era, children }: EraGroupProps) {
  return (
    <section className={styles.group} aria-labelledby={`era-${era.id}`}>
      <header className={styles.header}>
        <span className={`tiny mono ${styles.num}`}>EPOHA {era.num}</span>
        <h3 id={`era-${era.id}`} className={styles.title}>
          {era.title}
        </h3>
        <span className={`tiny mono ${styles.years}`}>{era.yearsLabel}</span>
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
