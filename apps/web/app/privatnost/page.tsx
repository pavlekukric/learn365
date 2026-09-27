import type { Metadata } from 'next';

import { Eyebrow, Flourish } from '@learn365/ui-web';

import { shareMetadata } from '@/lib/seo/metadata';

import { CONTACT_EMAIL } from '../o-aplikaciji/_copy';

import {
  PRIVACY_CONTACT_BODY,
  PRIVACY_CONTACT_HEADING,
  PRIVACY_EYEBROW,
  PRIVACY_LEDE,
  PRIVACY_SECTIONS,
  PRIVACY_TITLE,
  PRIVACY_UPDATED,
} from './_copy';
import styles from './page.module.css';

const PRIVACY_DESCRIPTION =
  'Šta History 365 čuva sa Google nalogom i bez njega, gde, koliko dugo i kako se briše.';

export const metadata: Metadata = {
  title: 'Privatnost',
  description: PRIVACY_DESCRIPTION,
  ...shareMetadata({
    title: 'Privatnost · History 365',
    description: PRIVACY_DESCRIPTION,
    path: '/privatnost',
  }),
};

export default function PrivacyPage() {
  return (
    <article className={`shell ${styles.page}`}>
      <header className={styles.header}>
        <Eyebrow>{PRIVACY_EYEBROW}</Eyebrow>
        <h1 className={`reader-title ${styles.title}`}>{PRIVACY_TITLE}</h1>
        <p className={`lede ${styles.lede}`}>{PRIVACY_LEDE}</p>
        <Flourish />
      </header>

      <div className={styles.body}>
        {PRIVACY_SECTIONS.map((section) => (
          <section key={section.id} className={styles.section} aria-labelledby={section.id}>
            <h2 id={section.id} className={`h3 ${styles.sectionTitle}`}>
              {section.heading}
            </h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className={`body ${styles.paragraph}`}>
                {paragraph}
              </p>
            ))}
          </section>
        ))}

        <section className={styles.section} aria-labelledby="kontakt">
          <h2 id="kontakt" className={`h3 ${styles.sectionTitle}`}>
            {PRIVACY_CONTACT_HEADING}
          </h2>
          <p className={`body ${styles.paragraph}`}>{PRIVACY_CONTACT_BODY}</p>
          <p className={styles.contactLine}>
            <a className={styles.contactLink} href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
          </p>
        </section>

        <p className={`tiny ${styles.updated}`}>{PRIVACY_UPDATED}</p>
      </div>
    </article>
  );
}
