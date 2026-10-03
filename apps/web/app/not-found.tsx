import type { Metadata } from 'next';
import Link from 'next/link';

import { Button } from '@learn365/ui-web';

import { DEFAULT_COURSE_ID } from '@/lib/defaultCourse';
import { courseHref } from '@/lib/routes';
import { SITE_DESCRIPTION, SITE_NAME, shareMetadata } from '@/lib/seo/metadata';

import styles from './not-found.module.css';

const NOT_FOUND_TITLE = 'Stranica nije pronađena';

/**
 * Its own title, no canonical and no `og:url`: inherited from the root
 * layout, every bad URL would declare itself a copy of Home (reviews
 * 2026-09-30, 2026-10-03). `noindex` Next adds by itself to every not-found
 * render.
 */
export const metadata: Metadata = {
  title: NOT_FOUND_TITLE,
  ...shareMetadata({
    title: `${NOT_FOUND_TITLE} · ${SITE_NAME}`,
    description: SITE_DESCRIPTION,
    path: null,
  }),
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
            Ova stranica ne postoji ili je premeštena. Vrati se na početnu ili otvori kurs i nastavi
            dalje.
          </p>
          <div className={styles.actions}>
            <Button href="/">Početna</Button>
            <Link href={courseHref(DEFAULT_COURSE_ID)} className={styles.secondary}>
              Otvori kurs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
