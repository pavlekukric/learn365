import Link from 'next/link';

import { Brand } from '../Brand/Brand.js';

import styles from './Footer.module.css';

interface FooterProps {
  /** Href for the editorial about page (typically /o-aplikaciji). */
  aboutHref: string;
  /** Deep-link to the sources section inside the about page. */
  sourcesHref: string;
}

export function Footer({ aboutHref, sourcesHref }: FooterProps) {
  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={`shell ${styles.inner}`}>
        <Link href="/" className={styles.brandLink} aria-label="History 365 — početna">
          <Brand />
        </Link>

        <p className={styles.tagline}>Dnevni vodič kroz istoriju Srbije.</p>

        <nav className={styles.links} aria-label="Podaci o aplikaciji">
          <Link href={aboutHref}>O aplikaciji</Link>
          <span className={styles.sep} aria-hidden="true">
            ·
          </span>
          <Link href={sourcesHref}>Izvori</Link>
        </nav>

        <p className={`tiny ${styles.copy}`}>© 2026 History 365</p>
      </div>
    </footer>
  );
}
