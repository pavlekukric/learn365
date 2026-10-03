import Link from 'next/link';

import { IconUser } from '../../icons/IconUser.js';
import { AccountMark } from '../AccountMark/AccountMark.js';
import { Brand } from '../Brand/Brand.js';

import styles from './TopBar.module.css';

/** `other` = an account, privacy or 404 page: nothing in the nav is active. */
export type TopBarRoute = 'home' | 'course' | 'lesson' | 'about' | 'other';

/**
 * Account slot at the right end of the masthead (Phase 8). The app decides
 * which state applies; the TopBar only renders it:
 *
 * - `loading`    — an invisible placeholder of the mark's width, so the
 *                  capsule does not shift when `/api/me` answers.
 * - `signed-out` — a quiet `Prijava` link (icon-only ≤720px).
 * - `signed-in`  — the reader's `AccountMark`, leading to the account page.
 *
 * `null` / omitted (accounts off) renders nothing at all.
 */
export type TopBarAccount =
  | { readonly kind: 'loading' }
  | { readonly kind: 'signed-out'; readonly href: string }
  | {
      readonly kind: 'signed-in';
      readonly href: string;
      readonly name: string | null;
      readonly pictureUrl: string | null;
    };

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
  /** Account slot; omit or pass `null` when accounts are not enabled. */
  account?: TopBarAccount | null | undefined;
}

function AccountSlot({ account }: { account: TopBarAccount }) {
  switch (account.kind) {
    case 'loading':
      return <span className={styles.accountPlaceholder} aria-hidden="true" />;
    case 'signed-out':
      return (
        <Link
          href={account.href}
          data-link="account"
          className={styles.signIn}
          aria-label="Prijava"
        >
          <IconUser className={styles.signInIcon} />
          <span className={styles.signInLabel}>Prijava</span>
        </Link>
      );
    case 'signed-in':
      return (
        <AccountMark href={account.href} name={account.name} pictureUrl={account.pictureUrl} />
      );
  }
}

export function TopBar({
  route,
  courseHref,
  aboutHref,
  totalLessons,
  completedCount,
  account,
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
            // The overview *is* this page; a lesson is inside it — `true`.
            aria-current={route === 'course' ? 'page' : route === 'lesson' ? 'true' : undefined}
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
           * (Home / Course / About) and on the desktop lesson layout.
           * A labelled group, not a live region: the count renders 0 on the
           * server and N once the store hydrates, so `role="status"`
           * announced 0 → N on every load (review 2026-10-03 item 7). The
           * lesson footer speaks completions itself. */}
          <div
            className={styles.progressGroup}
            data-route={route}
            role="group"
            aria-label="Pročitane lekcije"
          >
            <span className={`eyebrow ${styles.progressLabel}`}>Pročitano</span>
            <span className={`tiny mono ${styles.progressCount}`}>
              {completedCount} / {totalLessons}
            </span>
            <div className={styles.progressTrack} role="presentation">
              <i style={{ width: `${pct}%` }} />
            </div>
          </div>

          {account ? (
            <div className={styles.account}>
              <AccountSlot account={account} />
            </div>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
