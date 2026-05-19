'use client';

import type { CourseId } from '@learn365/content';
import { completedCount } from '@learn365/core';

import { useProgressStore } from '@/lib/progress/ProgressStoreProvider';

import styles from '../page.module.css';

interface HomeDailyAnchorProps {
  courseId: CourseId;
}

const TOTAL_DAYS = 365;

/**
 * Daily-ritual framing block. Makes the "one lesson a day" premise explicit
 * on Home without changing the content model or storage shape.
 *
 * Two states only (Phase 7.8 D1):
 *   - idle (completedCount === 0): no counter, one calm framing line.
 *   - in-progress (completedCount > 0): "TVOJ N. DAN" + journey line, where
 *     N = min(completedCount + 1, 365) — the day the user is *on*, not the
 *     last one they finished.
 *
 * Mirrors Phase 6.5's completion-driven rule: merely opening a lesson does
 * not flip into in-progress. The action lives in `HomeHeroCta`; this block
 * is framing only.
 */
export function HomeDailyAnchor({ courseId }: HomeDailyAnchorProps) {
  const completed = useProgressStore((state) => completedCount(state, courseId));

  if (completed === 0) {
    return (
      <section className={styles.dailyAnchor} aria-label="Danas">
        <p className={`body ${styles.dailyAnchorLine}`}>
          Pred tobom je 365 dana kroz srpsku istoriju.
        </p>
      </section>
    );
  }

  const dayNumber = Math.min(completed + 1, TOTAL_DAYS);

  return (
    <section className={styles.dailyAnchor} aria-label="Danas">
      <span className={`eyebrow ${styles.dailyAnchorEyebrow}`}>
        Tvoj {dayNumber}. dan
      </span>
      <p className={`body ${styles.dailyAnchorLine}`}>
        Nastavi tamo gde si stao.
      </p>
    </section>
  );
}
