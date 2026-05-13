import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { getCourse } from '@learn365/content';

import { TopBarHost } from '@/components/top-bar/TopBarHost';
import { fontVariableClassName } from '@/lib/fonts/fonts';

import { AppProviders } from './providers';

import './globals.css';

const DEFAULT_COURSE_ID = 'istorija-srbije-365';

export const metadata: Metadata = {
  title: {
    default: 'History 365 — Istorija Srbije 365',
    template: '%s · History 365',
  },
  description:
    'Premium dnevni vodič kroz istoriju Srbije. Jedna kratka lekcija svakog dana, kroz osam istorijskih epoha.',
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
        <AppProviders>
          <TopBarHost
            courseId={course.id}
            totalLessons={course.totalLessons}
          />
          <main id="main-content" tabIndex={-1}>{children}</main>
        </AppProviders>
      </body>
    </html>
  );
}
