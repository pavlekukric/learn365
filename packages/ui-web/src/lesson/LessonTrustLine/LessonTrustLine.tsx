import type { LessonByline } from '@learn365/content';

import styles from './LessonTrustLine.module.css';

interface LessonTrustLineProps {
  byline?: LessonByline | undefined;
  /** ISO `YYYY-MM-DD`, already validated by the content loader. */
  lastReviewedAt?: string | undefined;
}

/**
 * Byline + last-reviewed date, in the same mono-uppercase register as the
 * header eyebrow. Rendered at the *end* of the article (next to `Izvori`),
 * where a reader who wants to judge the text looks for it — not in the
 * header, where it delayed the first sentence. Rendered only if the lesson
 * carries at least one of the two; no generic course-wide fallback.
 */
export function LessonTrustLine({ byline, lastReviewedAt }: LessonTrustLineProps) {
  const text = formatTrustLine(byline, lastReviewedAt);
  if (text === null) return null;
  return <p className={`tiny mono ${styles.trust}`}>{text}</p>;
}

function formatTrustLine(
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
