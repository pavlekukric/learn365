import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Eyebrow } from '@learn365/ui-web';

import { getCurrentSession } from '@/lib/server/auth/currentUser';
import { sanitizeReturnTo } from '@/lib/server/auth/returnTo';
import { getAuthConfig } from '@/lib/server/env';

import styles from '../account.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Prijava',
  robots: { index: false, follow: false },
};

type SearchParams = Record<string, string | string[] | undefined>;

interface PageProps {
  searchParams: Promise<SearchParams>;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const ERROR_LINES: Readonly<Record<string, string>> = {
  odbijeno: 'Prijava je otkazana na Google-u. Možeš da pokušaš ponovo kad god želiš.',
  neuspesno: 'Prijava nije uspela. Pokušaj ponovo; ako se ponovi, javi nam se.',
};

/**
 * The sign-in page. One button, one sentence about what the account is
 * for, one line about what we keep. `?nazad=` carries the path to return
 * to; `?greska=` renders the calm error line the callback redirects with.
 * With accounts off the page says so instead of a button.
 */
export default async function PrijavaPage({ searchParams }: PageProps) {
  const auth = getAuthConfig();
  const params = await searchParams;
  if (auth !== null && (await getCurrentSession()) !== null) {
    redirect('/nalog');
  }

  const returnTo = sanitizeReturnTo(first(params['nazad']));
  const greska = first(params['greska']);
  const errorLine = greska === undefined ? undefined : ERROR_LINES[greska];

  return (
    <div className={`shell ${styles.wrap}`}>
      <section className={styles.card} aria-labelledby="prijava-naslov">
        <Eyebrow>Nalog</Eyebrow>
        <h1 id="prijava-naslov" className={`h1 ${styles.title}`}>
          Prijava
        </h1>
        <p className={`body ${styles.body}`}>
          Nalog služi samo jednom: da se pročitane i sačuvane lekcije prenesu na svaki tvoj
          uređaj. Čitanje ostaje otvoreno i bez njega.
        </p>

        {auth === null ? (
          <p className={`small ${styles.note}`} role="status">
            Prijava trenutno nije dostupna. Napredak se i dalje pamti u ovom pregledaču.
          </p>
        ) : (
          <>
            {errorLine !== undefined ? (
              <p className={`small ${styles.error}`} role="alert">
                {errorLine}
              </p>
            ) : null}
            <div className={styles.actions}>
              <a
                href={`/api/auth/google?return_to=${encodeURIComponent(returnTo)}`}
                className={styles.primary}
              >
                Nastavi sa Google-om
              </a>
            </div>
            <p className={`tiny ${styles.privacy}`}>
              Od Google-a dobijamo ime, e-adresu i sliku, ništa više.{' '}
              <Link href="/privatnost">Šta tačno čuvamo</Link>
            </p>
          </>
        )}

        <Link href="/" className={styles.secondary}>
          Nazad na čitanje
        </Link>
      </section>
    </div>
  );
}
