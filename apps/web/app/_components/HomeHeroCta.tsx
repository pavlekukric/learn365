'use client';

import Link from 'next/link';

import { getLessons, type CourseId } from '@learn365/content';
import { completedCount, lastOpenedLessonId } from '@learn365/core';

import { useProgressStore } from '@/lib/progress/ProgressStoreProvider';

import styles from '../page.module.css';

interface HomeHeroCtaProps {
  courseId: CourseId;
}

/**
 * State-aware primary CTA for the Home hero.
 *
 * The continue/start distinction is **completion-driven**: merely opening or
 * peeking at a lesson does not count as progress, so the CTA only switches to
 * "Nastavi" once the user has actually *completed* at least one lesson. This
 * keeps the hero consistent with the progress counter — no "0 / 365" sitting
 * next to a "Nastavi" label.
 *
 * - No completed lessons → "Započni kurs" pointing at the first lesson.
 * - At least one completed → "Nastavi lekciju" pointing at the last-opened
 *   lesson (falling back to the first lesson defensively).
 *
 * The supporting "365 lekcija · oko 8 min dnevno" meta line was removed in
 * Phase 7.0c — the hero body description ("365 kratkih lekcija") and the
 * TopBar progress capsule already carry both facts.
 */
export function HomeHeroCta({ courseId }: HomeHeroCtaProps) {
  const completed = useProgressStore((state) => completedCount(state, courseId));
  const lastId = useProgressStore((state) => lastOpenedLessonId(state, courseId));
  const hasProgress = completed > 0;

  const firstLessonId = getLessons(courseId)[0]?.id ?? null;
  const targetLessonId = hasProgress ? (lastId ?? firstLessonId) : firstLessonId;
  const href = targetLessonId
    ? `/course/${courseId}/lesson/${targetLessonId}`
    : `/course/${courseId}`;
  const label = hasProgress ? 'Nastavi lekciju' : 'Započni kurs';

  return (
    <div className={styles.ctaRow}>
      <Link href={href} className={styles.ctaPrimary}>
        {label} →
      </Link>
    </div>
  );
}
