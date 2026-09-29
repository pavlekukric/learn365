import type { Metadata } from 'next';

/**
 * Site-wide SEO / share-preview constants. `openGraph` is not deep-merged by
 * Next between layout and page, so every page that sets its own title must
 * rebuild the whole block — `shareMetadata()` does that in one place.
 */
/** Public origin, no trailing slash. Baked in at build time from
 *  `NEXT_PUBLIC_SITE_URL` (apps/web/Dockerfile build arg). The fallback is
 *  the production origin on purpose: any other build of this app (a local
 *  `next start`, a leftover preview) then declares istorija365.com as the
 *  canonical home of every page instead of itself. */
export const PRODUCTION_ORIGIN = 'https://istorija365.com';
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || PRODUCTION_ORIGIN).replace(/\/$/, '');
export const SITE_NAME = 'Istorija 365';
export const SITE_TITLE = 'Istorija 365 — Istorija Srbije kroz 365 lekcija';
export const SITE_DESCRIPTION =
  'Dnevni vodič kroz istoriju Srbije: jedna kratka lekcija svakog dana, kroz osam istorijskih epoha, tokom cele godine.';

/** Static 1200×630 share card (apps/web/public/og/). */
export const DEFAULT_OG_IMAGE = {
  url: '/og/istorija-srbije-365.jpg',
  width: 1200,
  height: 630,
  alt: 'Istorija 365 — Istorija Srbije 365',
} as const;

interface ShareMetadataArgs {
  title: string;
  description: string;
  /** Path relative to the site root, e.g. `/course/istorija-srbije-365`. */
  path: string;
}

/**
 * Canonical URL + Open Graph + Twitter blocks for one page, using the
 * default share card. `path` is resolved against `metadataBase` (set once
 * in the root layout), so the canonical always names the production origin.
 */
export function shareMetadata({
  title,
  description,
  path,
}: ShareMetadataArgs): Pick<Metadata, 'alternates' | 'openGraph' | 'twitter'> {
  return {
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      locale: 'sr_RS',
      siteName: SITE_NAME,
      url: path,
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [DEFAULT_OG_IMAGE.url],
    },
  };
}
