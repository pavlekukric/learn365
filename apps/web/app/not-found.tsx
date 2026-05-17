import Link from 'next/link';

import styles from './not-found.module.css';

const DEFAULT_COURSE_ID = 'istorija-srbije-365';

export default function NotFound() {
  return (
    <div className={`shell ${styles.wrap}`}>
      <div className={styles.card}>
        <p className={`eyebrow ${styles.eyebrow}`}>404</p>
        <h1 className={`h1 ${styles.title}`}>Stranica nije pronađena</h1>
        <p className={`body ${styles.body}`}>
          Lekcija ili kurs ne postoji. Vrati se na početnu ili otvori kurs i
          nastavi odakle si stao.
        </p>
        <div className={styles.actions}>
          <Link href="/" className={styles.primary}>
            Početna
          </Link>
          <Link href={`/course/${DEFAULT_COURSE_ID}`} className={styles.secondary}>
            Otvori kurs
          </Link>
        </div>
      </div>
    </div>
  );
}
