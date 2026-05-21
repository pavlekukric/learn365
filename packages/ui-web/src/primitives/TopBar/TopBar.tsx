import Link from 'next/link';

import { Brand } from '../Brand/Brand.js';

import styles from './TopBar.module.css';

export type TopBarRoute = 'home' | 'course' | 'lesson' | 'about';

interface TopBarProps {
  /** Current route, used to mark the active nav link. */
  route: TopBarRoute;
  /** Href used by the brand mark and the "Kurs" link. */
  courseHref: string;
  /** Href for the editorial about page (typically /o-aplikaciji). */
  aboutHref: string;
  /** Total lessons in the active course (typically 365). */
  totalLessons: number;
  /** Completed-lesson count for the active course. */
  completedCount: number;
}

export function TopBar({
  route,
  courseHref,
  aboutHref,
  totalLessons,
  completedCount,
}: TopBarProps) {
  const courseActive = route === 'course' || route === 'lesson';
  const aboutActive = route === 'about';
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
            data-link="home"
            className={route === 'home' ? styles.active : undefined}
            aria-current={route === 'home' ? 'page' : undefined}
          >
            Početna
          </Link>
          <Link
            href={courseHref}
            data-link="course"
            className={courseActive ? styles.active : undefined}
            aria-current={courseActive ? 'page' : undefined}
          >
            Kurs
          </Link>
          <Link
            href={aboutHref}
            data-link="about"
            className={aboutActive ? styles.active : undefined}
            aria-current={aboutActive ? 'page' : undefined}
          >
            O aplikaciji
          </Link>

          {/* Total-progress capsule. Hidden on the lesson route at single-column
            * widths (≤1024px) — there the sticky LessonContextHeader already
            * carries a clearly-labelled "Pročitano X / 365", so the bare capsule
            * count would read as a confusing duplicate. Kept everywhere else
            * (Home / Course / About) and on the desktop lesson layout. */}
          <div
            className={styles.progressGroup}
            data-route={route}
            aria-label="Ukupan napredak"
          >
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
