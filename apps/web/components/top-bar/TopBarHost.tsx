'use client';

import { usePathname } from 'next/navigation';

import { completedCount } from '@learn365/core';
import { TopBar, type TopBarAccount, type TopBarRoute } from '@learn365/ui-web';

import { useAuth } from '@/lib/auth/AuthProvider';
import { useProgressStore } from '@/lib/progress/ProgressStoreProvider';

interface TopBarHostProps {
  courseId: string;
  totalLessons: number;
}

function routeFromPath(pathname: string | null): TopBarRoute {
  if (!pathname || pathname === '/') return 'home';
  if (pathname.startsWith('/course/') && pathname.includes('/lesson/')) {
    return 'lesson';
  }
  if (pathname.startsWith('/course/')) return 'course';
  if (pathname.startsWith('/o-aplikaciji')) return 'about';
  // /prijava, /nalog, /privatnost, 404: no nav item is the current page.
  return 'other';
}

/** Where `/prijava` should send the reader back to — never to an account page itself. */
function returnPathFor(pathname: string | null): string {
  if (!pathname || pathname.startsWith('/prijava') || pathname.startsWith('/nalog')) return '/';
  return pathname;
}

export function TopBarHost({ courseId, totalLessons }: TopBarHostProps) {
  const pathname = usePathname();
  const done = useProgressStore((state) => completedCount(state, courseId));
  const auth = useAuth();

  let account: TopBarAccount | null;
  if (auth.status === 'loading') {
    account = { kind: 'loading' };
  } else if (!auth.enabled) {
    account = null;
  } else if (auth.user !== null) {
    account = {
      kind: 'signed-in',
      href: '/nalog',
      name: auth.user.name,
      pictureUrl: auth.user.picture,
    };
  } else {
    account = {
      kind: 'signed-out',
      href: `/prijava?nazad=${encodeURIComponent(returnPathFor(pathname))}`,
    };
  }

  return (
    <TopBar
      route={routeFromPath(pathname)}
      courseHref={`/course/${courseId}`}
      aboutHref="/o-aplikaciji"
      totalLessons={totalLessons}
      completedCount={done}
      account={account}
    />
  );
}
