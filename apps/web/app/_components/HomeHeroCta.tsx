'use client';

import Link from 'next/link';

import type { CourseId } from '@learn365/content';

import { useResumeLesson } from '@/lib/progress/useResumeLesson';

import styles from '../page.module.css';

interface HomeHeroCtaProps {
  courseId: CourseId;
}

/**
 * State-aware primary CTA for the Home hero.
 *
 * The start/continue distinction is **completion-driven** (opening a lesson
 * never flips the label) and the target comes from the shared
 * `useResumeLesson` rule, so the hero, the recommended-lesson card and the
 * course overview always open the same lesson:
 *
 * - nothing completed  → "Počni kurs"      → Day 1
 * - something completed → "Nastavi lekciju" → the lesson left unfinished,
 *                          else the next unread day (never a finished one)
 * - everything completed → "Otvori kurs"  → course overview
 */
export function HomeHeroCta({ courseId }: HomeHeroCtaProps) {
  const { hasStarted, lesson } = useResumeLesson(courseId);

  const href = lesson ? `/course/${courseId}/lesson/${lesson.id}` : `/course/${courseId}`;
  const label = !hasStarted ? 'Počni kurs' : lesson ? 'Nastavi lekciju' : 'Otvori kurs';

  return (
    <div className={styles.ctaRow}>
      <Link href={href} className={styles.ctaPrimary}>
        {label} →
      </Link>
    </div>
  );
}
