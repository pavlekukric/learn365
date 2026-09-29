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
 */
export function LessonBookmarkButton({ isBookmarked, onToggle }: LessonBookmarkButtonProps) {
  return (
    <button
      type="button"
      className={styles.bookmark}
      aria-pressed={isBookmarked}
      aria-label={isBookmarked ? 'Ukloni iz sačuvanih' : 'Sačuvaj lekciju'}
      title="Sačuvane lekcije se nalaze na strani kursa"
      onClick={onToggle}
    >
      <IconBookmark filled={isBookmarked} />
      <span className={styles.bookmarkLabel}>{isBookmarked ? 'Sačuvano' : 'Sačuvaj'}</span>
    </button>
  );
}
