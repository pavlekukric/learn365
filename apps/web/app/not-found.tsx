import Link from 'next/link';

import { Button } from '@learn365/ui-web';

import styles from './not-found.module.css';

const DEFAULT_COURSE_ID = 'istorija-srbije-365';

export default function NotFound() {
  return (
    // `.shell` (gutters) and `.wrap` (vertical room) on separate elements: on
    // one element their paddings override each other, and which one wins
    // depends on the order the stylesheets load in.
    <div className="shell">
      <div className={styles.wrap}>
        <div className={styles.card}>
          <p className={`eyebrow ${styles.eyebrow}`}>404</p>
          <h1 className={`h1 ${styles.title}`}>Stranica nije pronađena</h1>
          <p className={`body ${styles.body}`}>
            Lekcija ili kurs ne postoji. Vrati se na početnu ili otvori kurs i nastavi dalje.
          </p>
          <div className={styles.actions}>
            <Button href="/">Početna</Button>
            <Link href={`/course/${DEFAULT_COURSE_ID}`} className={styles.secondary}>
              Otvori kurs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
