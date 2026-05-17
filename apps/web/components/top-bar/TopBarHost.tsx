'use client';

import { usePathname } from 'next/navigation';

import { completedCount } from '@learn365/core';
import { TopBar, type TopBarRoute } from '@learn365/ui-web';

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
  return 'home';
}

export function TopBarHost({ courseId, totalLessons }: TopBarHostProps) {
  const pathname = usePathname();
  const done = useProgressStore((state) => completedCount(state, courseId));
  return (
    <TopBar
      route={routeFromPath(pathname)}
      courseHref={`/course/${courseId}`}
      aboutHref="/o-aplikaciji"
      totalLessons={totalLessons}
      completedCount={done}
    />
  );
}
