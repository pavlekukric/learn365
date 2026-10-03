'use client';

import type { CourseId } from '@learn365/content';
import { formatJourneyDay } from '@learn365/core';

import { useResumeLesson } from '@/lib/progress/useResumeLesson';

import styles from '../page.module.css';

interface HomeDailyAnchorProps {
  courseId: CourseId;
}

/**
 * Daily-ritual framing block. Makes the "one lesson a day" premise explicit
 * on Home without changing the content model or storage shape.
 *
 * Three states:
 *   - idle (nothing completed): no counter, one calm framing line.
 *   - in-progress: "TVOJ N. DAN" + a framing line, where N is the day of
 *     the lesson the recommended card beneath opens (`useResumeLesson`), so
 *     the eyebrow and the card's `DAN nnn` tell one story.
 *   - finished (every lesson read): there is no "your day" left, so the
 *     eyebrow says the course is done and the card beneath offers Day 1
 *     again (review 2026-10-03 item 6).
 *
 * Mirrors Phase 6.5's completion-driven rule: merely opening a lesson does
 * not flip into in-progress. The action lives in `HomeHeroCta`; this block
 * is framing only.
 */
export function HomeDailyAnchor({ courseId }: HomeDailyAnchorProps) {
  const { journeyDay, lesson, total } = useResumeLesson(courseId);

  if (journeyDay === null) {
    return (
      <section className={styles.dailyAnchor} aria-label="Danas" data-newcomer="inline">
        <p className={`body ${styles.dailyAnchorLine}`}>
          Pred tobom je {total} dana kroz srpsku istoriju.
        </p>
      </section>
    );
  }

  if (lesson === null) {
    return (
      <section className={styles.dailyAnchor} aria-label="Danas">
        <span className={`eyebrow ${styles.dailyAnchorEyebrow}`}>Kurs završen</span>
        <p className={`body ${styles.dailyAnchorLine}`}>
          {`Svih ${String(total)} dana je iza tebe. Možeš ponovo krenuti od prvog.`}
        </p>
      </section>
    );
  }

  return (
    <section className={styles.dailyAnchor} aria-label="Danas">
      <span className={`eyebrow ${styles.dailyAnchorEyebrow}`}>{formatJourneyDay(journeyDay)}</span>
      <p className={`body ${styles.dailyAnchorLine}`}>Sledeća lekcija te čeka.</p>
    </section>
  );
}
