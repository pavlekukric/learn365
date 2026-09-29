import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { getAllCourseIds, getCourse } from '@learn365/content';
import { Eyebrow } from '@learn365/ui-web';

import { formatAccountDate, formatLastActivity } from '@/lib/copy/accountDates';
import { resolveOverviewAccess } from '@/lib/server/admin/access';
import {
  OVERVIEW_WINDOW_DAYS,
  getAccountsOverview,
  type AccountsOverview,
} from '@/lib/server/admin/overview';
import { getCurrentSession } from '@/lib/server/auth/currentUser';
import { getDb } from '@/lib/server/db/client';
import { getAuthConfig } from '@/lib/server/env';

import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pregled naloga',
  robots: { index: false, follow: false },
  // noindex: no canonical either (the root layout would hand it `/`).
  alternates: { canonical: null },
};

async function loadOverview(): Promise<AccountsOverview | null> {
  try {
    return await getAccountsOverview(await getDb());
  } catch (error) {
    console.error('[pregled] overview failed', error);
    return null;
  }
}

/**
 * The owner's accounts overview (Phase 16): who has an account, since when,
 * and how far they have read. Read-only, and it exists only for an account
 * whose row carries `is_admin` — everybody else gets the 404 a wrong address
 * gets. Nothing is decided or read before `resolveOverviewAccess` answers.
 */
export default async function PregledPage() {
  const authEnabled = getAuthConfig() !== null;
  const session = authEnabled ? await getCurrentSession() : null;
  const access = resolveOverviewAccess({ authEnabled, user: session?.user ?? null });
  if (access === 'not-found') notFound();
  if (access === 'sign-in') redirect('/prijava?nazad=%2Fpregled');

  const overview = await loadOverview();
  const totalLessons = getAllCourseIds().reduce(
    (sum, courseId) => sum + (getCourse(courseId)?.totalLessons ?? 0),
    0,
  );
  const now = new Date();

  return (
    // `.shell` (gutters) and `.page` (vertical room, width) on separate
    // elements — see `/prijava`.
    <div className="shell">
      <div className={styles.page}>
        <header className={styles.header}>
          <Eyebrow>Pregled</Eyebrow>
          <h1 className="h1">Nalozi</h1>
          <p className={`body ${styles.lede}`}>
            Ko ima nalog, od kada, i dokle je stigao sa čitanjem. Ovu stranu vidiš samo ti.
          </p>
        </header>

        {overview === null ? (
          <p className={`body ${styles.note}`} role="status">
            Pregled trenutno nije dostupan. Pokušaj ponovo za koji minut.
          </p>
        ) : (
          <>
            <dl className={styles.figures}>
              <div className={styles.figure}>
                <dt className="tiny mono">Naloga</dt>
                <dd>{overview.total}</dd>
              </div>
              <div className={styles.figure}>
                <dt className="tiny mono">Novih · {OVERVIEW_WINDOW_DAYS} dana</dt>
                <dd>{overview.newInWindow}</dd>
              </div>
              <div className={styles.figure}>
                <dt className="tiny mono">Aktivnih · {OVERVIEW_WINDOW_DAYS} dana</dt>
                <dd>{overview.activeInWindow}</dd>
              </div>
            </dl>

            {overview.accounts.length === 0 ? (
              <p className={`body ${styles.note}`}>Još niko nije otvorio nalog.</p>
            ) : (
              <section className={styles.listSection} aria-labelledby="pregled-spisak">
                <h2 id="pregled-spisak" className={styles.visuallyHidden}>
                  Spisak naloga
                </h2>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col" className="tiny mono">
                        Nalog
                      </th>
                      <th scope="col" className="tiny mono">
                        Registrovan
                      </th>
                      <th scope="col" className="tiny mono">
                        Poslednja aktivnost
                      </th>
                      <th scope="col" className={`tiny mono ${styles.number}`}>
                        Pročitano
                      </th>
                      <th scope="col" className={`tiny mono ${styles.number}`}>
                        Sačuvano
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.accounts.map((account) => (
                      <tr key={account.id}>
                        <th scope="row" className={styles.who}>
                          <span className={styles.name}>{account.name ?? account.email}</span>
                          {account.name !== null ? (
                            <span className={`tiny mono ${styles.email}`}>{account.email}</span>
                          ) : null}
                        </th>
                        <td data-label="Registrovan">{formatAccountDate(account.registeredAt)}</td>
                        <td data-label="Poslednja aktivnost">
                          {formatLastActivity(account.lastActiveAt, now)}
                        </td>
                        <td data-label="Pročitano" className={styles.number}>
                          {account.lessonsRead} / {totalLessons}
                        </td>
                        <td data-label="Sačuvano" className={styles.number}>
                          {account.lessonsSaved}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {overview.total > overview.accounts.length ? (
                  <p className={`small ${styles.note}`}>
                    Prikazano je {overview.accounts.length} najnovijih naloga od ukupno{' '}
                    {overview.total}.
                  </p>
                ) : null}
              </section>
            )}
          </>
        )}

        <Link href="/nalog" className={styles.back}>
          Nazad na nalog
        </Link>
      </div>
    </div>
  );
}
