'use client';

import { useEffect, useRef } from 'react';

import styles from './ReadingProgress.module.css';

/**
 * Thin top progress line that tracks how far the user has scrolled through
 * the lesson body. Uses requestAnimationFrame coalescing on scroll/resize
 * and writes only a CSS transform, so it costs nothing on the main thread.
 *
 * Hidden (fill stays at 0) when the page isn't tall enough to scroll — no
 * point teasing a progress affordance on a placeholder lesson that fits in
 * one viewport.
 */
export function ReadingProgress() {
  const fillRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const fill = fillRef.current;
    if (!fill) return;

    let frame = 0;

    function update() {
      frame = 0;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 0) {
        if (fill) fill.style.transform = 'scaleX(0)';
        return;
      }
      const progress = Math.min(1, Math.max(0, window.scrollY / scrollable));
      if (fill) fill.style.transform = `scaleX(${String(progress)})`;
    }

    function schedule() {
      if (frame !== 0) return;
      frame = requestAnimationFrame(update);
    }

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  return (
    <div className={styles.bar} aria-hidden="true">
      <span ref={fillRef} className={styles.fill} />
    </div>
  );
}
