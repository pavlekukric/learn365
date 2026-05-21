import type { CSSProperties } from 'react';

import { Flourish } from '../../primitives/Flourish/Flourish.js';

import {
  buildLessonTimelineScale,
  formatTickYear,
} from './lessonTimelineScale.js';

import styles from './LessonTimeline.module.css';

interface LessonTimelineProps {
  /** Lesson's representative year. Negative = BCE. */
  year: number;
  /**
   * Short editorial label for the marker, e.g. "15. vek" or "1804." — typically
   * the lesson's `dateLabel`. Falls back to the formatted year when absent.
   */
  label?: string | undefined;
}

/**
 * Editorial timeline divider — a refined replacement for the decorative
 * flourish below the lesson title. It reads first as a divider, but quietly
 * answers "where in historical time am I?": a hairline rule, a few round year
 * labels, and one stylised accent marker for the current lesson.
 *
 * Informational only — not interactive (no links, no scroll), so it carries no
 * roles or tab stops and is hidden from assistive tech (`aria-hidden`); the
 * lesson's date is already announced by the header eyebrow. The scale is
 * intentionally approximate (a local window of round ticks centred on the
 * lesson), not a globally-proportional academic chart.
 *
 * If the year can't produce a sensible scale, falls back to the plain
 * decorative {@link Flourish} so the reader never loses its divider.
 */
export function LessonTimeline({ year, label }: LessonTimelineProps) {
  const scale = buildLessonTimelineScale(year);
  if (scale === null) return <Flourish />;

  const markerLabel = label ?? formatTickYear(year);
  // Keep the floating marker label clear of the edges so it never clips on
  // narrow phones, while the pin itself stays at the true position.
  const labelLeft = Math.min(Math.max(scale.markerPercent, 12), 88);

  return (
    <div className={styles.timeline} aria-hidden="true">
      <div className={styles.track}>
        <span
          className={styles.markerLabel}
          style={{ '--label-pos': `${String(labelLeft)}%` } as CSSProperties}
        >
          {markerLabel}
        </span>
        <span className={styles.line} />
        <span
          className={styles.marker}
          style={{ '--pos': `${String(scale.markerPercent)}%` } as CSSProperties}
        >
          <span className={styles.markerCap} />
          <span className={styles.markerStem} />
        </span>
      </div>
      <ol className={styles.ticks}>
        {scale.ticks.map((tick) => (
          <li key={tick} className={`tiny mono ${styles.tick}`}>
            {formatTickYear(tick)}
          </li>
        ))}
      </ol>
    </div>
  );
}
