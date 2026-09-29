import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

// First, before any component import: the global type classes (.display,
// .h3, .tiny, .mono …) must land in the cascade *before* the CSS modules, so
// a module rule on the same element wins at equal specificity (review
// 2026-09-30, item 8 — imported last, the globals silently beat them).
import './globals.css';

import { getAllCourseIds, getCourse } from '@learn365/content';
import { Footer } from '@learn365/ui-web';

import { TopBarHost } from '@/components/top-bar/TopBarHost';
import { DEFAULT_COURSE_ID } from '@/lib/defaultCourse';
import { fontVariableClassName } from '@/lib/fonts/fonts';
import { PRE_PAINT_SCRIPT } from '@/lib/progress/prePaint';
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
  shareMetadata,
} from '@/lib/seo/metadata';

import { AppProviders } from './providers';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  ...shareMetadata({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    path: '/',
  }),
};

export const viewport: Viewport = {
  themeColor: '#f5efe3',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const course = getCourse(DEFAULT_COURSE_ID);
  if (!course) {
    throw new Error(`Default course "${DEFAULT_COURSE_ID}" is missing from the content registry.`);
  }
  return (
    // `data-progress` is set by the pre-paint script before hydration.
    <html lang="sr-Latn" data-direction="A" className={fontVariableClassName} suppressHydrationWarning>
      <body>
        {/* Before anything paints: mark a returning reader so the prerendered
         * newcomer blocks stay hidden (lib/progress/prePaint.ts). */}
        <script dangerouslySetInnerHTML={{ __html: PRE_PAINT_SCRIPT }} />
        <a href="#main-content" className="skip-link">
          Preskoči na sadržaj
        </a>
        {/* Course ids resolve here, on the server, so the providers (and
         * with them every route's client graph) never import the content
         * registry. */}
        <AppProviders courseIds={getAllCourseIds()}>
          <TopBarHost courseId={course.id} totalLessons={course.totalLessons} />
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
          <Footer
            aboutHref="/o-aplikaciji"
            sourcesHref="/o-aplikaciji#izvori"
            privacyHref="/privatnost"
          />
        </AppProviders>
      </body>
    </html>
  );
}
