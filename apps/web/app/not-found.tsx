import type { Metadata } from 'next';
import Link from 'next/link';

import { Button } from '@learn365/ui-web';

import { DEFAULT_COURSE_ID } from '@/lib/defaultCourse';

import styles from './not-found.module.css';

/**
 * Its own title and no canonical: without `canonical: null` the page
 * inherits the root layout's `canonical: /` and every bad URL would declare
 * itself a copy of Home (review 2026-09-30). `noindex` Next adds by itself
 * to every not-found render.
 */
export const metadata: Metadata = {
  title: 'Stranica nije pronađena',
  alternates: { canonical: null },
};

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
            Ova stranica ne postoji ili je premeštena. Vrati se na početnu ili otvori kurs i
            nastavi dalje.
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
