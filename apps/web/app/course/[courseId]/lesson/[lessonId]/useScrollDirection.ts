'use client';

import { useEffect, useState } from 'react';

/**
 * Returns whether the lesson context header's secondary meta row should be
 * collapsed, based on scroll direction.
 *
 * Mirrors the rAF-coalesced, passive scroll listener used by `ReadingProgress`:
 * we sample `window.scrollY` once per animation frame and only flip state on a
 * genuine direction change, so React re-renders are rare (one per flip, not one
 * per scroll event).
 *
 * Two guards keep the motion calm rather than twitchy:
 *  - a dead-zone (`DELTA_THRESHOLD`) absorbs sub-pixel / momentum jitter so the
 *    row does not flicker on tiny deltas;
 *  - a top-of-page guard (`REVEAL_BELOW`) keeps the row shown while the page
 *    header region is still in view, so it never collapses near the very top.
 */

/** Minimum scroll delta (px) before a direction change is acted on. */
const DELTA_THRESHOLD = 8;
/** Always show the meta row while within this many px of the top. */
const REVEAL_BELOW = 96;

export function useMetaRowCollapsed(): boolean {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let frame = 0;
    let lastY = window.scrollY;

    function update() {
      frame = 0;
      const y = window.scrollY;
      const delta = y - lastY;

      // Near the top: always reveal, and reset the baseline so the first
      // downward scroll past the threshold collapses cleanly.
      if (y <= REVEAL_BELOW) {
        lastY = y;
        setCollapsed(false);
        return;
      }

      if (Math.abs(delta) < DELTA_THRESHOLD) return;

      setCollapsed(delta > 0);
      lastY = y;
    }

    function schedule() {
      if (frame !== 0) return;
      frame = requestAnimationFrame(update);
    }

    update();
    window.addEventListener('scroll', schedule, { passive: true });

    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
    };
  }, []);

  return collapsed;
}
