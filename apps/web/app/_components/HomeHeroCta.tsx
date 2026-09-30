'use client';

import type { CourseId } from '@learn365/content';
import { Button, IconArrow } from '@learn365/ui-web';

import { useResumeLesson } from '@/lib/progress/useResumeLesson';

import styles from '../page.module.css';

interface HomeHeroCtaProps {
  courseId: CourseId;
  /** The hero lede — shown with the CTA, to first-time visitors only. */
  description: string;
}

/**
 * The newcomer half of the Home hero: the lede and "Počni kurs" → Day 1.
 *
 * A returning reader (something completed) gets neither: the hero shrinks to
 * the title, and the recommended-lesson card right under it is the one
 * action — the "Tvoj N. dan" card is then above the fold on a phone, and no
 * second "continue" button competes with it (review 2026-09-30, user pass).
 * Completion-driven like the rest of Home: opening a lesson changes nothing.
 * `data-newcomer="block"` keeps the prerendered newcomer version out of the
 * flow for a returning reader before the JS runs (lib/progress/prePaint.ts).
 */
export function HomeHeroCta({ courseId, description }: HomeHeroCtaProps) {
  const { hasStarted, lesson } = useResumeLesson(courseId);
  if (hasStarted) return null;
  const href = lesson ? `/course/${courseId}/lesson/${lesson.id}` : `/course/${courseId}`;

  return (
    <div data-newcomer-wrap data-newcomer="block">
      <p className={`body ${styles.description}`}>{description}</p>
      <div className={styles.ctaRow}>
        <Button href={href} iconRight={<IconArrow />}>
          Počni kurs
        </Button>
      </div>
    </div>
  );
}
