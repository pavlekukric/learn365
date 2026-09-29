import Link from 'next/link';

import { Brand } from '../Brand/Brand.js';

import styles from './Footer.module.css';

interface FooterProps {
  /** Href for the editorial about page (typically /o-aplikaciji). */
  aboutHref: string;
  /** Deep-link to the sources section inside the about page. */
  sourcesHref: string;
  /** Privacy page (Phase 8). Omit to leave the link out. */
  privacyHref?: string | undefined;
}

export function Footer({ aboutHref, sourcesHref, privacyHref }: FooterProps) {
  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={`shell ${styles.inner}`}>
        <Link href="/" className={styles.brandLink} aria-label="Istorija 365 — početna">
          <Brand />
        </Link>

        <p className={styles.tagline}>Dnevni vodič kroz istoriju Srbije.</p>

        <nav className={styles.links} aria-label="Podaci o aplikaciji">
          <Link href={aboutHref}>O aplikaciji</Link>
          <span className={styles.sep} aria-hidden="true">
            ·
          </span>
          <Link href={sourcesHref}>Izvori</Link>
          {privacyHref ? (
            <>
              <span className={styles.sep} aria-hidden="true">
                ·
              </span>
              <Link href={privacyHref}>Privatnost</Link>
            </>
          ) : null}
        </nav>

        <p className={`tiny ${styles.copy}`}>© 2026 Istorija 365</p>
      </div>
    </footer>
  );
}
