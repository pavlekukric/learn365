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
    <div className={`shell ${styles.wrap}`}>
      <section className={styles.card} aria-labelledby="nalog-naslov">
        <Eyebrow>Nalog</Eyebrow>
        <h1 id="nalog-naslov" className={`h1 ${styles.title}`}>
          {user.name ?? user.email}
        </h1>
        {user.name !== null ? <p className={`tiny mono ${styles.email}`}>{user.email}</p> : null}
        <p className={`body ${styles.body}`}>
          Pročitane i sačuvane lekcije čuvaju se na ovom nalogu i prenose na svaki uređaj na
          kojem se prijaviš.
        </p>
        <NalogActions />
        <Link href="/" className={styles.secondary}>
          Nazad na čitanje
        </Link>
      </section>
    </div>
  );
}
