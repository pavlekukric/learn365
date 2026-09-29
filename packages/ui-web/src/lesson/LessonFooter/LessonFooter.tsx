'use client';

import { useEffect, useRef } from 'react';

import { CompletedFooter } from '../CompletedFooter/CompletedFooter.js';
import { MarkAsCompletedButton } from '../MarkAsCompletedButton/MarkAsCompletedButton.js';
import { PreviousNextLessonNavigation } from '../PreviousNextLessonNavigation/PreviousNextLessonNavigation.js';
import { SignInPrompt, type SignInPromptProps } from '../SignInPrompt/SignInPrompt.js';

import styles from './LessonFooter.module.css';

export interface LessonFooterLink {
  title: string;
  dayNumber: number;
  href: string;
  /** Era label (e.g. "Nemanjićka Srbija") rendered on the post-completion
   * next-lesson card. Optional so callers that don't have it pass nothing. */
  eraLabel?: string;
  readingTimeMinutes?: number;
}

export interface LessonFooterProps {
  /** Day number of the open lesson. */
  dayNumber: number;
  /** Placeholder lessons cannot be completed: no button, symmetric prev / next. */
  isUpcoming?: boolean;
  isCompleted: boolean;
  onToggleComplete: () => void;
  /** Course-wide completed count, shown in the post-completion moment. */
  completedCount: number;
  /** Total lessons in the course (typically 365). */
  totalLessons: number;
  prev: LessonFooterLink | null;
  next: LessonFooterLink | null;
  /** Href back to the course overview, used by the end-of-course footer
   * when there is no next lesson. */
  courseHref: string;
  /** The account ask, rendered after the next-lesson card and the previous
   * link when the app decides it is due (second completed lesson, not signed
   * in, not dismissed, not yet shown in this session). Omit to render
   * nothing. */
  signInPrompt?: SignInPromptProps | undefined;
}

/**
 * Everything under the article that depends on the reader: the completion
 * toggle and what follows it. The one part of the lesson page that has to be
 * a client component — the article above it is rendered on the server.
 */
export function LessonFooter({
  dayNumber,
  isUpcoming = false,
  isCompleted,
  onToggleComplete,
  completedCount,
  totalLessons,
  prev,
  next,
  courseHref,
  signInPrompt,
}: LessonFooterProps) {
  // When the reader *just* completed the lesson, bring the completion moment
  // and the next-lesson card into view — on a phone the footer that appears
  // under the button is otherwise easy to miss. Only on the false→true edge,
  // never on first paint of an already-completed lesson.
  const completedWrapRef = useRef<HTMLDivElement>(null);
  const wasCompletedRef = useRef(isCompleted);
  useEffect(() => {
    const justCompleted = isCompleted && !wasCompletedRef.current;
    wasCompletedRef.current = isCompleted;
    if (!justCompleted) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    completedWrapRef.current?.scrollIntoView({
      behavior: reduce ? 'auto' : 'smooth',
      block: 'nearest',
    });
  }, [isCompleted]);

  return (
    <footer className={styles.footer}>
      {isUpcoming ? null : (
        <MarkAsCompletedButton isCompleted={isCompleted} onClick={onToggleComplete} />
      )}
      {/* Pre-completion: symmetric prev/next. Post-completion: a stronger
       * "what's next" moment that promotes the next lesson to the primary
       * action and demotes "previous" to a small text link. Placeholders
       * (which can't be completed) always get the symmetric footer. */}
      {isCompleted && !isUpcoming ? (
        <>
          <div ref={completedWrapRef} className={styles.completedWrap}>
            <CompletedFooter
              completedDayNumber={dayNumber}
              completedCount={completedCount}
              totalLessons={totalLessons}
              next={next}
              prev={prev}
              courseHref={courseHref}
            />
          </div>
          {/* The account ask comes last (Phase 15): the next lesson is what
           * the reader is brought to; the ask waits under it, outside the
           * scroll target. */}
          {signInPrompt ? (
            <SignInPrompt href={signInPrompt.href} onDismiss={signInPrompt.onDismiss} />
          ) : null}
        </>
      ) : (
        <PreviousNextLessonNavigation prev={prev} next={next} />
      )}
    </footer>
  );
}
