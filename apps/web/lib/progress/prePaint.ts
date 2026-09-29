import { DEFAULT_STORAGE_KEY } from '@learn365/core';

/**
 * Returning readers and the prerendered pages (review 2026-09-30, item 7).
 *
 * Home and the course overview are static HTML rendered for a first-time
 * visitor: `Počni kurs`, the three-step block, the start card. The progress
 * store lives in `localStorage`, which only the browser can read, so a
 * reader with progress used to see that newcomer page until the JS ran —
 * then ~400 px collapsed and the CTA changed under their thumb.
 *
 * `PRE_PAINT_SCRIPT` runs inline, first thing in `<body>`, before anything is
 * painted: when any course has a completed lesson it sets
 * `<html data-progress="started">`, and `globals.css` hides what is marked
 * `data-newcomer` — `block` is removed from the flow (the how-it-works
 * block), `inline` keeps its box but is invisible (CTA, anchor, cards). Once
 * the components have rendered the reader's own state (they no longer carry
 * `data-newcomer`), `clearPrePaintMark()` removes the attribute so the page
 * follows the store again — e.g. after sign-out clears progress.
 *
 * Plain ES5, no imports at run time: it is inlined as a string. It never
 * throws (blocked storage, bad JSON) — the worst case is today's behaviour.
 */
export const PRE_PAINT_SCRIPT = `(function(){try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(
  DEFAULT_STORAGE_KEY,
)})||'null');var c=s&&s.state&&s.state.byCourse;if(!c)return;for(var k in c){var ids=c[k]&&c[k].completedLessonIds;if(ids&&ids.length){document.documentElement.setAttribute('data-progress','started');return;}}}catch(e){}})();`;

/**
 * Drop the pre-paint mark once the client has rendered from the store. Two
 * frames: the store's post-hydration render (newcomer → reader) lands one
 * frame after hydration.
 */
export function clearPrePaintMark(): () => void {
  let second = 0;
  const first = requestAnimationFrame(() => {
    second = requestAnimationFrame(() => {
      document.documentElement.removeAttribute('data-progress');
    });
  });
  return () => {
    cancelAnimationFrame(first);
    cancelAnimationFrame(second);
  };
}
