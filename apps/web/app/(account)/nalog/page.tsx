import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Eyebrow } from '@learn365/ui-web';

import { getCurrentSession } from '@/lib/server/auth/currentUser';
import { getAuthConfig } from '@/lib/server/env';

import styles from '../account.module.css';

import { NalogActions } from './NalogActions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Nalog',
  robots: { index: false, follow: false },
  // noindex: no canonical either (the root layout would hand it `/`).
  alternates: { canonical: null },
};

/**
 * The account page: who is signed in, what the account holds, and the two
 * actions — sign out, delete. No settings, no profile editing; the account
 * exists only to carry progress between devices.
 */
export default async function NalogPage() {
  if (getAuthConfig() === null) redirect('/prijava');
  const session = await getCurrentSession();
  if (session === null) redirect('/prijava?nazad=%2Fnalog');
  const { user } = session;

  return (
    // `.shell` (gutters) and `.wrap` (vertical room) on separate elements —
    // see `/prijava`.
    <div className="shell">
      <div className={styles.wrap}>
        <section className={styles.card} aria-labelledby="nalog-naslov">
          <Eyebrow>Nalog</Eyebrow>
          <h1 id="nalog-naslov" className={`h1 ${styles.title}`}>
            {user.name ?? user.email}
          </h1>
          {user.name !== null ? <p className={`tiny mono ${styles.email}`}>{user.email}</p> : null}
          <p className={`body ${styles.body}`}>
            Pročitane i sačuvane lekcije čuvaju se na ovom nalogu i prenose na svaki uređaj na kojem
            se prijaviš.
          </p>
          <NalogActions />
          {/* The owner's accounts overview (Phase 16) — offered to an account
           * that carries the flag and to nobody else. */}
          {user.isAdmin ? (
            <Link href="/pregled" className={styles.secondary}>
              Pregled naloga
            </Link>
          ) : null}
          <Link href="/" className={styles.secondary}>
            Nazad na čitanje
          </Link>
        </section>
      </div>
    </div>
  );
}
