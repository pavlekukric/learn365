import { useId, type ReactNode } from 'react';

import type { Era } from '@learn365/content';

import { IconChev } from '../../icons/IconChev.js';

import styles from './EraGroup.module.css';

interface EraGroupProps {
  era: Era;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}

/**
 * Era-level accordion in the CourseSidebar. Collapsed by default so the user
 * lands on "where am I" instead of the full 8-era / 28-section wall; the
 * current era is expanded by the parent's state. Mirrors the visual treatment
 * of `SectionAccordion` (chevron + transparent button row + hairline divider)
 * so the two levels of accordion read as a consistent hierarchy.
 */
export function EraGroup({ era, isOpen, onToggle, children }: EraGroupProps) {
  const panelId = useId();
  return (
    <section className={styles.group}>
      <button
        type="button"
        className={`${styles.header} ${isOpen ? styles.headerOpen : ''}`}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span className={`${styles.chev} ${isOpen ? styles.chevOpen : ''}`} aria-hidden="true">
          <IconChev />
        </span>
        <span className={styles.titleBlock}>
          <span className={`tiny mono ${styles.num}`}>EPOHA {era.num}</span>
          {/* Short era label: the full title in caps wrapped to four lines in
           * the 300px sidebar / drawer. The full title stays available as a
           * tooltip and on the course overview + breadcrumb. */}
          <span className={styles.title} title={era.title}>
            {era.eraShort}
          </span>
        </span>
        <span className={`tiny mono ${styles.years}`}>{era.yearsLabel}</span>
      </button>
      {isOpen ? (
        <div id={panelId} className={styles.body}>
          {children}
        </div>
      ) : null}
    </section>
  );
}
