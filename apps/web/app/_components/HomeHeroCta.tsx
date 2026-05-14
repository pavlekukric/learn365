'use client';

import Link from 'next/link';

import { getLessons, type CourseId } from '@learn365/content';
import { lastOpenedLessonId } from '@learn365/core';

import { useProgressStore } from '@/lib/progress/ProgressStoreProvider';

import styles from '../page.module.css';

interface HomeHeroCtaProps {
  courseId: CourseId;
  totalLessons: number;
  minutesPerLesson: number;
}

/**
 * State-aware primary CTA for the Home hero.
 *
 * - No progress yet  → "Započni kurs" pointing at the first lesson.
 * - Has an open lesson → "Nastavi lekciju" pointing at the last-opened lesson.
 *
 * The supporting metadata stays course-level ("365 lekcija · oko 8 min dnevno")
 * in both states so it never duplicates the lesson card directly below.
 */
export function HomeHeroCta({
  courseId,
  totalLessons,
  minutesPerLesson,
}: HomeHeroCtaProps) {
  const lastId = useProgressStore((state) => lastOpenedLessonId(state, courseId));
  const hasProgress = lastId !== null;

  const firstLessonId = getLessons(courseId)[0]?.id ?? null;
  const targetLessonId = hasProgress ? lastId : firstLessonId;
  const href = targetLessonId
    ? `/course/${courseId}/lesson/${targetLessonId}`
    : `/course/${courseId}`;
  const label = hasProgress ? 'Nastavi lekciju' : 'Započni kurs';

  return (
    <div className={styles.ctaRow}>
      <Link href={href} className={styles.ctaPrimary}>
        {label} →
      </Link>
      <span className="tiny mono">
        {totalLessons} lekcija · oko {minutesPerLesson} min dnevno
      </span>
    </div>
  );
}
