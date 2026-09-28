import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { getAllCourseIds, getCourse } from '@learn365/content';
import { Footer } from '@learn365/ui-web';

import { TopBarHost } from '@/components/top-bar/TopBarHost';
import { fontVariableClassName } from '@/lib/fonts/fonts';
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
  shareMetadata,
} from '@/lib/seo/metadata';

import { AppProviders } from './providers';

import './globals.css';

const DEFAULT_COURSE_ID = 'istorija-srbije-365';

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
    <html lang="sr" data-direction="A" className={fontVariableClassName}>
      <body>
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
