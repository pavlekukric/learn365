import Link from 'next/link';

import { Brand } from '../Brand/Brand.js';

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
        <Link href="/" className={styles.brandLink}>
          <Brand />
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

          <div className={styles.progressGroup} aria-label="Ukupan napredak">
            <span className={`eyebrow ${styles.progressLabel}`}>Ukupno</span>
            <span className={`tiny mono ${styles.progressCount}`}>
              {completedCount} / {totalLessons}
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
