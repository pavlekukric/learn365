'use client';

import { IconBookmark } from '../../icons/IconBookmark.js';

import styles from './LessonBookmarkButton.module.css';

export interface LessonBookmarkButtonProps {
  isBookmarked: boolean;
  onToggle: () => void;
}

/**
 * Save-for-later toggle, pinned to the top-right corner of `LessonHeader`
 * (which hands it in through its `bookmark` slot). The one interactive part
 * of the header, so it is its own client component and the header itself can
 * render on the server.
 *
 * One name in both states (Phase 21, WCAG 2.5.3 *Label in Name*): the
 * visible word is always "Sačuvaj", the accessible name "Sačuvaj lekciju"
 * contains it, and `aria-pressed` plus the filled ribbon carry the state.
 * The old pair — a visible "Sačuvano" against the name "Ukloni iz
 * sačuvanih", pressed — said the state twice and gave voice control nothing
 * to match.
 */
export function LessonBookmarkButton({ isBookmarked, onToggle }: LessonBookmarkButtonProps) {
  return (
    <button
      type="button"
      className={styles.bookmark}
      aria-pressed={isBookmarked}
      aria-label="Sačuvaj lekciju"
      title="Sačuvane lekcije se nalaze na strani kursa"
      onClick={onToggle}
    >
      <IconBookmark filled={isBookmarked} />
      <span className={styles.bookmarkLabel}>Sačuvaj</span>
    </button>
  );
}
