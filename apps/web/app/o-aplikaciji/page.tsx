import type { Metadata } from 'next';
import Link from 'next/link';

import { Eyebrow, Flourish } from '@learn365/ui-web';

import { HOW_IT_WORKS_EYEBROW, HOW_IT_WORKS_NOTE, HOW_IT_WORKS_STEPS } from '@/lib/copy/howItWorks';
import { DEFAULT_COURSE_ID } from '@/lib/defaultCourse';
import { readingListHref } from '@/lib/routes';
import { shareMetadata } from '@/lib/seo/metadata';

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
  SOURCES_LINK_LABEL,
  STANDARD_BODY,
  STANDARD_HEADING,
} from './_copy';
import styles from './page.module.css';

const ABOUT_DESCRIPTION =
  'Kako Istorija 365 funkcioniše, ko je uređuje i na koje se izvore oslanja — dnevni vodič kroz istoriju Srbije.';

export const metadata: Metadata = {
  title: 'O aplikaciji',
  description: ABOUT_DESCRIPTION,
  ...shareMetadata({
    title: 'O aplikaciji · Istorija 365',
    description: ABOUT_DESCRIPTION,
    path: '/o-aplikaciji',
  }),
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

        {/* Same three steps as the first-visit block on Home — permanently
         * reachable here once that block has retired. */}
        <section className={styles.section} aria-labelledby="kako-funkcionise">
          <h2 id="kako-funkcionise" className={`h3 ${styles.sectionTitle}`}>
            {HOW_IT_WORKS_EYEBROW}
          </h2>
          <ol className={styles.steps}>
            {HOW_IT_WORKS_STEPS.map((step, index) => (
              <li key={step.title} className={styles.step}>
                <span className={`mono ${styles.stepNum}`}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className={styles.stepBody}>
                  <span className={styles.stepTitle}>{step.title}</span>{' '}
                  <span className={styles.stepText}>{step.text}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className={`body ${styles.paragraph}`}>{HOW_IT_WORKS_NOTE}</p>
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
          <p className={styles.contactLine}>
            <Link className={styles.contactLink} href={readingListHref(DEFAULT_COURSE_ID)}>
              {SOURCES_LINK_LABEL}
            </Link>
          </p>
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
