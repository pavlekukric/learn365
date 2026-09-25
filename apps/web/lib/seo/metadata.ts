import type { Metadata } from 'next';

/**
 * Site-wide SEO / share-preview constants. `openGraph` is not deep-merged by
 * Next between layout and page, so every page that sets its own title must
 * rebuild the whole block — `shareMetadata()` does that in one place.
 */
export const SITE_URL = 'https://learn365-web.vercel.app';
export const SITE_NAME = 'History 365';
export const SITE_TITLE = 'History 365 — Istorija Srbije 365';
export const SITE_DESCRIPTION =
  'Dnevni vodič kroz istoriju Srbije: jedna kratka lekcija svakog dana, kroz osam istorijskih epoha, tokom cele godine.';

/** Static 1200×630 share card (apps/web/public/og/). */
export const DEFAULT_OG_IMAGE = {
  url: '/og/istorija-srbije-365.jpg',
  width: 1200,
  height: 630,
  alt: 'History 365 — Istorija Srbije 365',
} as const;

interface ShareMetadataArgs {
  title: string;
  description: string;
  /** Path relative to the site root, e.g. `/course/istorija-srbije-365`. */
  path: string;
}

/** Open Graph + Twitter blocks for one page, using the default share card. */
export function shareMetadata({
  title,
  description,
  path,
}: ShareMetadataArgs): Pick<Metadata, 'openGraph' | 'twitter'> {
  return {
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
