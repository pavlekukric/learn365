import type { Metadata } from 'next';

import { Eyebrow, Flourish } from '@learn365/ui-web';

import {
  CONTACT_BODY,
  CONTACT_EMAIL,
  CONTACT_HEADING,
  EDITOR_BODY,
  EDITOR_HEADING,
  MISSION_BODY,
  MISSION_HEADING,
  PAGE_EYEBROW,
  PAGE_LEDE,
  PAGE_TITLE,
  SOURCES_BODY,
  SOURCES_HEADING,
  STANDARD_BODY,
  STANDARD_HEADING,
} from './_copy';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'O aplikaciji',
  description:
    'O misiji, uredničkom standardu i izvorima History 365 — premium dnevnog vodiča kroz istoriju Srbije.',
};

export default function AboutPage() {
  return (
    <article className={`shell ${styles.page}`}>
      <header className={styles.header}>
        <Eyebrow>{PAGE_EYEBROW}</Eyebrow>
        <h1 className={`reader-title ${styles.title}`}>{PAGE_TITLE}</h1>
        <p className={`lede ${styles.lede}`}>{PAGE_LEDE}</p>
        <Flourish />
      </header>

      <div className={styles.body}>
        <section className={styles.section} aria-labelledby="misija">
          <h2 id="misija" className={`h3 ${styles.sectionTitle}`}>
            {MISSION_HEADING}
          </h2>
          <p className={`body ${styles.paragraph}`}>{MISSION_BODY}</p>
        </section>

        <section className={styles.section} aria-labelledby="standard">
          <h2 id="standard" className={`h3 ${styles.sectionTitle}`}>
            {STANDARD_HEADING}
          </h2>
          <p className={`body ${styles.paragraph}`}>{STANDARD_BODY}</p>
        </section>

        <section className={styles.section} aria-labelledby="izvori">
          <h2 id="izvori" className={`h3 ${styles.sectionTitle}`}>
            {SOURCES_HEADING}
          </h2>
          <p className={`body ${styles.paragraph}`}>{SOURCES_BODY}</p>
        </section>

        <section className={styles.section} aria-labelledby="urednistvo">
          <h2 id="urednistvo" className={`h3 ${styles.sectionTitle}`}>
            {EDITOR_HEADING}
          </h2>
          <p className={`body ${styles.paragraph}`}>{EDITOR_BODY}</p>
        </section>

        <section className={styles.section} aria-labelledby="kontakt">
          <h2 id="kontakt" className={`h3 ${styles.sectionTitle}`}>
            {CONTACT_HEADING}
          </h2>
          <p className={`body ${styles.paragraph}`}>{CONTACT_BODY}</p>
          <p className={styles.contactLine}>
            <a className={styles.contactLink} href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
          </p>
        </section>
      </div>
    </article>
  );
}
