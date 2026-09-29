import type { ReactNode } from 'react';

import { LessonShell } from './LessonShell';

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ courseId: string }>;
}

/**
 * The lesson route's persistent shell (Phase 15). A layout survives navigation
 * between its pages, so everything that belongs to the course rather than to
 * one lesson — the outline, the drawer, the sticky context header — lives
 * here and keeps its state (open eras and sections, the list's scroll
 * position) across previous / next. The page below it is the article.
 */
export default async function LessonLayout({ children, params }: LayoutProps) {
  const { courseId } = await params;
  return <LessonShell courseId={courseId}>{children}</LessonShell>;
}
