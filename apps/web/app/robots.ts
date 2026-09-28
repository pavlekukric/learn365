import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/lib/seo/metadata';

/** `/robots.txt` — reading is public; the API and the account pages are not for crawlers. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/prijava', '/nalog'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
