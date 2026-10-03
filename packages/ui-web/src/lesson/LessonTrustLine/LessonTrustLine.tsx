import type { LessonByline } from '@learn365/content';

import styles from './LessonTrustLine.module.css';

export interface LessonTrustLink {
  readonly label: string;
  /** A site path (the reading list) or a `mailto:` URL (the error report). */
  readonly href: string;
}

interface LessonTrustLineProps {
  byline?: LessonByline | undefined;
  /** ISO `YYYY-MM-DD`; the loader only accepts it next to `byline.reviewer`. */
  lastReviewedAt?: string | undefined;
  /**
   * The course-wide note on how the text was made and checked (review
   * 2026-10-03 P1 4). Copy belongs to the app; this component only sets it.
   */
  note?: string | undefined;
  /** Quiet links after the note, in order: reading list, error report. */
  links?: readonly LessonTrustLink[] | undefined;
}

/**
 * The closing trust block, at the *end* of the article (after `Izvori`),
 * where a reader who wants to judge the text looks for it — not in the
 * header, where it delayed the first sentence.
 *
 * Two lines, each only when it has something to say: the lesson's own
 * byline + reviewed date (mono, uppercase — absent on every lesson today),
 * then the course-wide check note with its links. Names are never invented:
 * there is no generic byline fallback.
 */
export function LessonTrustLine({ byline, lastReviewedAt, note, links }: LessonTrustLineProps) {
  const credit = formatCredit(byline, lastReviewedAt);
  const hasNote = note !== undefined && note.length > 0;
  const hasLinks = links !== undefined && links.length > 0;
  if (credit === null && !hasNote && !hasLinks) return null;
  return (
    <div className={styles.trust}>
      {credit !== null ? <p className={`tiny mono ${styles.credit}`}>{credit}</p> : null}
      {hasNote || hasLinks ? (
        <p className={`small ${styles.note}`} data-testid="lesson-trust-note">
          {hasNote ? <span>{note}</span> : null}
          {links?.map((link) => (
            <span key={link.href} className={styles.linkItem}>
              <a className={styles.link} href={link.href}>
                {link.label}
              </a>
            </span>
          ))}
        </p>
      ) : null}
    </div>
  );
}

function formatCredit(
  byline: LessonByline | undefined,
  lastReviewedAt: string | undefined,
): string | null {
  const parts: string[] = [];
  if (byline?.author !== undefined && byline.author.length > 0) {
    parts.push(`NAPISAO: ${byline.author}`);
  }
  if (byline?.reviewer !== undefined && byline.reviewer.length > 0) {
    parts.push(`PREGLEDAO: ${byline.reviewer}`);
  }
  if (lastReviewedAt !== undefined) {
    parts.push(`POSLEDNJI PREGLED: ${formatReviewDate(lastReviewedAt)}`);
  }
  return parts.length === 0 ? null : parts.join(' · ');
}

function formatReviewDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  return new Intl.DateTimeFormat('sr-RS', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
