'use client';

import { useEffect, useRef } from 'react';

interface CourseScrollRestoreProps {
  courseId: string;
}

/**
 * Restores the course overview's scroll position on return within a browser
 * session (Phase 7.6). Renders nothing.
 *
 * Why this is needed: the course content (`CourseOverviewEras`) is a client
 * component whose progress-driven accordion settles *after* hydration, so the
 * page's final height is unknown when Next.js App Router runs its built-in
 * scroll restoration — and the restore misses (a live probe measured 0–130px
 * instead of the saved offset).
 *
 * Three framework behaviours have to be worked around, all observed while
 * building this:
 *  1. Browsers (and Next, via cached route scroll) restore the course route to
 *     a stale offset on entry, competing with our restore. We set
 *     `history.scrollRestoration = 'manual'` to own it.
 *  2. On navigating *away*, the framework fires scroll-noise on the still-mounted
 *     page during the transition. A naive save-on-scroll persists that noise and
 *     loses the real offset. We freeze saving the instant a link is clicked and
 *     record the genuine position at that moment; a debounce covers non-link
 *     leaves and is cancelled by unmount before noise can commit.
 *  3. On a forward `Link` return, Next scrolls to top *after* the first rAF, so a
 *     one-shot restore is overridden. We capture the target at mount and run a
 *     short enforcement loop (guarded by `isRestoring`) that re-asserts the
 *     target until it sticks, suppressing saving meanwhile so the reset never
 *     overwrites storage.
 *
 * Storage is `sessionStorage` (not `localStorage`): the position is a
 * within-session affordance, not durable state, and should reset to the top in
 * a brand-new tab/session. It is unrelated to the `learn365:progress` /
 * `learn365:bookmarks` keys and is not part of the backend swap seam.
 */

const KEY_PREFIX = 'learn365:course-scroll:';
/** Debounce (ms) before a scroll position is persisted — long enough that a
 *  burst of navigation-noise scrolls is cancelled by unmount before it
 *  commits, short enough to capture a settled reading position. */
const SAVE_DEBOUNCE_MS = 120;
/** Frames the restore keeps re-asserting the target. Long enough to outlast a
 *  framework scroll-to-top reset that some engines (WebKit, Firefox) defer
 *  several hundred ms past mount — stopping early lets that late reset stick.
 *  ≈1s at 60fps. */
const MAX_RESTORE_FRAMES = 60;

export function CourseScrollRestore({ courseId }: CourseScrollRestoreProps) {
  const storageKey = `${KEY_PREFIX}${courseId}`;
  // True while the restore enforcement loop is running, so the save listener
  // ignores the enforced scrolls and Next's scroll-to-top reset.
  const isRestoringRef = useRef(false);

  // Take ownership of scroll restoration. Browsers (and Next, via cached route
  // scroll) otherwise restore the course route to a stale offset on entry,
  // which competes with — and can clobber — our own restore. We restore the
  // position ourselves below, so disable the automatic behaviour.
  useEffect(() => {
    if (!('scrollRestoration' in window.history)) return;
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

  // Restore once on mount, enforcing the target until it sticks.
  useEffect(() => {
    const raw = sessionStorage.getItem(storageKey);
    const saved = raw === null ? NaN : Number.parseInt(raw, 10);
    if (!Number.isFinite(saved) || saved <= 0) return;

    isRestoringRef.current = true;
    let frame = 0;
    let attempts = 0;

    function enforce() {
      attempts += 1;
      const reachable = document.documentElement.scrollHeight - window.innerHeight;
      const target = Math.min(saved, Math.max(reachable, 0));

      // Re-assert the target every frame (only touching the DOM when it has
      // drifted) so a deferred framework reset is corrected on its next frame.
      if (Math.abs(window.scrollY - target) > 2) {
        window.scrollTo(0, target);
      }

      if (attempts >= MAX_RESTORE_FRAMES) {
        isRestoringRef.current = false;
        frame = 0;
        return;
      }
      frame = requestAnimationFrame(enforce);
    }

    frame = requestAnimationFrame(enforce);
    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      isRestoringRef.current = false;
    };
  }, [storageKey]);

  // Save the latest settled scroll position, debounced. Skips writes while the
  // restore loop is enforcing the target.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Once the user clicks a link to leave, the framework fires scroll-noise on
    // the still-mounted page during the transition. Persisting that noise would
    // clobber the real position (observed under load), so we freeze saving the
    // instant a navigation is initiated — and capture the genuine position at
    // that exact moment, before any noise.
    let navigatingAway = false;

    function persist() {
      sessionStorage.setItem(storageKey, String(window.scrollY));
    }

    function schedule() {
      if (timer !== undefined) clearTimeout(timer);
      timer = setTimeout(() => {
        if (isRestoringRef.current || navigatingAway) return;
        // Save the raw value (including 0) so leaving from the top returns
        // to the top.
        persist();
      }, SAVE_DEBOUNCE_MS);
    }

    function onClickCapture(event: MouseEvent) {
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest('a[href]') !== null &&
        !isRestoringRef.current
      ) {
        // The position at click time is the user's real intent — record it now
        // and stop saving so transition-noise can't overwrite it.
        navigatingAway = true;
        persist();
      }
    }

    window.addEventListener('scroll', schedule, { passive: true });
    document.addEventListener('click', onClickCapture, true);
    return () => {
      if (timer !== undefined) clearTimeout(timer);
      document.removeEventListener('click', onClickCapture, true);
      window.removeEventListener('scroll', schedule);
    };
  }, [storageKey]);

  return null;
}
