'use client';

import { useEffect, useRef, useState } from 'react';

import { CompletedFooter } from '../CompletedFooter/CompletedFooter.js';
import { completionAnnouncement, completionMoment } from '../CompletedFooter/completionMoment.js';
import { MarkAsCompletedButton } from '../MarkAsCompletedButton/MarkAsCompletedButton.js';
import { PreviousNextLessonNavigation } from '../PreviousNextLessonNavigation/PreviousNextLessonNavigation.js';
import { SignInPrompt, type SignInPromptProps } from '../SignInPrompt/SignInPrompt.js';

import styles from './LessonFooter.module.css';

export interface LessonFooterLink {
  title: string;
  dayNumber: number;
  href: string;
  /** Short era label (e.g. "Nemanjići") rendered on the post-completion
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
  /**
   * The lesson to continue from when this is the course's last lesson and
   * others are still unread (the shared resume lesson). Ignored otherwise.
   */
  resume?: LessonFooterLink | null | undefined;
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
  resume,
  courseHref,
  signInPrompt,
}: LessonFooterProps) {
  // When the reader *just* completed the lesson, bring the completion moment
  // and the next-lesson card into view — on a phone the footer that appears
  // under the button is otherwise easy to miss. Only after the reader's own
  // click: the store rehydrating after first paint (or another tab's write)
  // also flips `isCompleted` false→true, and must not move the page.
  const completedWrapRef = useRef<HTMLDivElement>(null);
  const toggledByReaderRef = useRef(false);

  // What the live region below says. It is empty until the reader's own
  // toggle and is cleared when the lesson changes, so a page load, a store
  // rehydration or another tab never speaks (review 2026-10-03 item 7).
  const [announcement, setAnnouncement] = useState('');
  const [announcedDay, setAnnouncedDay] = useState(dayNumber);
  if (announcedDay !== dayNumber) {
    setAnnouncedDay(dayNumber);
    setAnnouncement('');
  }

  const handleToggle = (): void => {
    toggledByReaderRef.current = true;
    if (isCompleted) {
      setAnnouncement('Lekcija više nije označena kao pročitana.');
    } else {
      // The store applies the toggle synchronously; the count after it is
      // this one plus the lesson just marked.
      const countAfter = Math.min(completedCount + 1, totalLessons);
      const moment = completionMoment({
        dayNumber,
        isLastLesson: next === null,
        completedCount: countAfter,
        totalLessons,
      });
      setAnnouncement(completionAnnouncement(moment, countAfter, totalLessons));
    }
    onToggleComplete();
  };
  useEffect(() => {
    const byReader = toggledByReaderRef.current;
    toggledByReaderRef.current = false;
    if (!byReader || !isCompleted) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    completedWrapRef.current?.scrollIntoView({
      behavior: reduce ? 'auto' : 'smooth',
      block: 'nearest',
    });
  }, [isCompleted]);

  // The account ask unmounts while its own button holds focus (`Ne sada`,
  // or a sign-in that settles): focus would fall to <body>, and Safari /
  // Firefox would restart Tab at the top of the page. Hand it to the
  // completion moment the ask sat under instead.
  const hasPrompt = signInPrompt !== undefined;
  const hadPromptRef = useRef(hasPrompt);
  useEffect(() => {
    const promptWentAway = hadPromptRef.current && !hasPrompt;
    hadPromptRef.current = hasPrompt;
    if (!promptWentAway) return;
    const focused = document.activeElement;
    if (focused === null || focused === document.body) {
      completedWrapRef.current?.focus({ preventScroll: true });
    }
  }, [hasPrompt]);

  return (
    <footer className={styles.footer}>
      {isUpcoming ? null : (
        <MarkAsCompletedButton isCompleted={isCompleted} onClick={handleToggle} />
      )}
      {/* One persistent, polite region, rendered empty and filled only by
       * the reader's toggle: a region mounted already filled (the old
       * completion moment) is often never read. The visible moment below
       * is plain text. */}
      {isUpcoming ? null : (
        <p className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
          {announcement}
        </p>
      )}
      {/* Pre-completion: symmetric prev/next. Post-completion: a stronger
       * "what's next" moment that promotes the next lesson to the primary
       * action and demotes "previous" to a small text link. Placeholders
       * (which can't be completed) always get the symmetric footer. */}
      {isCompleted && !isUpcoming ? (
        <>
          {/* Focusable (never ringed) only as the target of the focus hand-off above. */}
          <div ref={completedWrapRef} className={styles.completedWrap} tabIndex={-1}>
            <CompletedFooter
              completedDayNumber={dayNumber}
              completedCount={completedCount}
              totalLessons={totalLessons}
              next={next}
              prev={prev}
              resume={resume}
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
