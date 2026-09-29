import Link from 'next/link';

import type { Era } from '@learn365/content';

import { IconArrow } from '../../icons/IconArrow.js';
import { IconCheck } from '../../icons/IconCheck.js';
import { IconChev } from '../../icons/IconChev.js';
import { ProgressBar } from '../../primitives/ProgressBar/ProgressBar.js';

import styles from './CourseCard.module.css';

interface CourseCardProps {
  era: Era;
  totalLessons: number;
  completedLessons: number;
  isCurrent: boolean;
  isAllDone: boolean;
  /**
   * Where the explicit action link opens: the first unread lesson of the
   * era (or its first lesson once everything is read).
   */
  href: string;
  /**
   * Optional editorial paragraph. When provided, the card reads as an
   * editorial block (eyebrow + title + years + description + progress) rather
   * than a navigation row.
   */
  description?: string;
  /** Disclosure state of the era's section list rendered below the card. */
  isOpen: boolean;
  onToggle: () => void;
  /** id of the section-list panel this card controls. */
  panelId: string;
  /** Section count, shown in the disclosure hint. */
  sectionCount: number;
}

/**
 * Era block on the course overview. One card, two clearly different things
 * to do (post-2026-09-25): the card body is the disclosure that opens the
 * era's sections and lessons (what most readers want from an overview), and
 * a single labelled link on the right — `Počni` / `Nastavi` / `Pročitano` —
 * opens the right lesson. Replaces the earlier pairing of a whole-card link
 * plus a separate `Pokaži odeljke` toggle, which read as two competing taps.
 */
export function CourseCard({
  era,
  totalLessons,
  completedLessons,
  isCurrent,
  isAllDone,
  href,
  description,
  isOpen,
  onToggle,
  panelId,
  sectionCount,
}: CourseCardProps) {
  const progress = totalLessons > 0 ? completedLessons / totalLessons : 0;
  const cls = [
    styles.card,
    isCurrent ? styles.current : null,
    isAllDone ? styles.done : null,
    isOpen ? styles.open : null,
  ]
    .filter(Boolean)
    .join(' ');
  const actionLabel = isAllDone ? 'Pročitano' : completedLessons > 0 ? 'Nastavi' : 'Počni';

  return (
    <article className={cls}>
      {/* The era is a heading (h1 → h2 → h3 on the overview) whose content is
       * the disclosure button — the WAI accordion pattern. */}
      <h3 className={styles.heading}>
        <button
          type="button"
          className={styles.toggle}
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={panelId}
          aria-labelledby={`${panelId}-num ${panelId}-title`}
        >
          <span id={`${panelId}-num`} className={`tiny mono ${styles.num}`}>
            EPOHA {era.num}
          </span>
          <span className={styles.titleBlock}>
            <span id={`${panelId}-title`} className={`h3 ${styles.title}`}>
              {era.title}
            </span>
            <span className={`tiny mono ${styles.years}`}>{era.yearsLabel}</span>
            {description ? (
              <span className={`small ${styles.description}`}>{description}</span>
            ) : null}
            <span className={`tiny mono ${styles.hint}`}>
              <span className={`${styles.chev} ${isOpen ? styles.chevOpen : ''}`} aria-hidden="true">
                <IconChev />
              </span>
              {isOpen ? 'Sakrij odeljke' : `Pokaži odeljke · ${String(sectionCount)}`}
            </span>
          </span>
        </button>
      </h3>

      <span className={styles.side}>
        <span className={styles.progressBlock}>
          <span className={`tiny mono ${styles.count}`}>
            {completedLessons} / {totalLessons}
          </span>
          <ProgressBar
            value={progress}
            size="thin"
            ariaLabel={`${era.title} napredak`}
            ariaValueText={`${String(completedLessons)} od ${String(totalLessons)}`}
          />
        </span>
        <Link
          href={href}
          className={`${styles.action} ${isAllDone ? styles.actionDone : ''}`}
          aria-label={`${actionLabel}: ${era.title}`}
        >
          {isAllDone ? <IconCheck className={styles.actionIcon} /> : null}
          <span>{actionLabel}</span>
          {isAllDone ? null : <IconArrow className={styles.actionIcon} />}
        </Link>
      </span>
    </article>
  );
}
