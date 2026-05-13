import Link from 'next/link';

import styles from './TopBar.module.css';

export type TopBarRoute = 'home' | 'course' | 'lesson' | 'about';

interface TopBarProps {
  /** Current route, used to mark the active nav link. */
  route: TopBarRoute;
  /** Href used by the brand mark and the "Kurs" link. */
  courseHref: string;
  /** Total lessons in the active course (typically 365). */
  totalLessons: number;
  /** Completed-lesson count for the active course. */
  completedCount: number;
}

function formatCount(n: number): string {
  return String(n).padStart(3, '0');
}

export function TopBar({
  route,
  courseHref,
  totalLessons,
  completedCount,
}: TopBarProps) {
  const courseActive = route === 'course' || route === 'lesson';
  const pct = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;

  return (
    <header className={styles.topbar}>
      <div className={`shell ${styles.inner}`}>
        <Link href="/" className={styles.brand} aria-label="History 365 — Početna">
          <span className={styles.brandMark} aria-hidden="true">
            H
          </span>
          <span className={styles.brandName}>
            History 365 <em>/ Istorija 365</em>
          </span>
        </Link>

        <nav className={styles.nav} aria-label="Glavna navigacija">
          <Link
            href="/"
            className={route === 'home' ? styles.active : undefined}
            aria-current={route === 'home' ? 'page' : undefined}
          >
            Početna
          </Link>
          <Link
            href={courseHref}
            className={courseActive ? styles.active : undefined}
            aria-current={courseActive ? 'page' : undefined}
          >
            Kurs
          </Link>
          <span className={styles.disabledLink} aria-disabled="true" title="Uskoro">
            O aplikaciji
          </span>

          <div className={styles.progressGroup} aria-label="Napredak">
            <span className={`tiny mono ${styles.progressCount}`}>
              {formatCount(completedCount)} / {totalLessons}
            </span>
            <div className={styles.progressTrack} role="presentation">
              <i style={{ width: `${pct}%` }} />
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
