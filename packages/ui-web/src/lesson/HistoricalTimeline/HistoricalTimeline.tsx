import Link from 'next/link';
import type { CSSProperties } from 'react';

import type { Era, EraId } from '@learn365/content';

import { flooredWeights, markerPositionPercent, timelineFillPercent } from './timelineMath.js';

import styles from './HistoricalTimeline.module.css';

/** Per-era stats that drive proportional widths and progress styling. */
export interface EraStat {
  /** Total lessons in the era — drives the band's proportional width. */
  readonly lessonCount: number;
  /** Completed lessons in the era — drives the fill and completed-state. */
  readonly completedCount: number;
}

interface HistoricalTimelineProps {
  eras: readonly Era[];
  currentLesson: { eraId: EraId; year: number };
  /** Optional href builder for jumping to an era's first lesson or course anchor. */
  eraHref?: ((eraId: EraId) => string) | undefined;
  /**
   * Per-era stats keyed by `EraId`. `lessonCount` makes the bands proportional;
   * `completedCount` drives the progress fill and completed-station styling.
   * Optional and backward-compatible: when omitted the timeline degrades to
   * equal-width bands with no progress styling — the marker still shows.
   */
  eraStats?: ReadonlyMap<EraId, EraStat> | undefined;
  /**
   * Layout variant. `'full'` (default) is the responsive journey rail used by
   * the lesson reader. `'compact'` forces the condensed vertical layout
   * regardless of viewport — used inside the mobile "Sadržaj" drawer, where it
   * must not depend on the `≤720px` media query (the drawer can be open up to
   * 1024px). `'home'` is a heavier-weight desktop register for the landing
   * surface — taller panel, larger rail and marker, bigger typography — so the
   * rail reads as the centerpiece of a 365-day journey rather than a band of
   * tabs. Mobile behaviour is inherited from the base styles (the `'home'`
   * overrides are scoped to `min-width: 721px`).
   */
  variant?: 'full' | 'compact' | 'home';
}

type EraState = 'completed' | 'current' | 'upcoming';

/**
 * Compact year label for the desktop timeline rail. Negative years (BCE)
 * become "9500 p.n.e." rather than the raw "-9500". For positive years we
 * keep the bare numeral — that's the existing CE convention in the rail.
 */
function formatYearShort(year: number): string {
  return year < 0 ? `${String(Math.abs(year))} p.n.e.` : String(year);
}

/**
 * The "journey rail" — the 8 historical eras as one connected timeline.
 *
 * Desktop: a horizontal rail above proportionally-sized era bands, with a
 * progress fill and a year-interpolated marker. Mobile (≤720px): the same data
 * rotated into a vertical rail with one full-width row per era — all 8 visible,
 * no horizontal scroll — where each era's node carries its completed / current
 * state and the current node stands in for the marker.
 */
export function HistoricalTimeline({
  eras,
  currentLesson,
  eraHref,
  eraStats,
  variant = 'full',
}: HistoricalTimelineProps) {
  // Per-era lesson counts → proportional band weights, with the smallest era
  // raised to MIN_BAND_SHARE so its label has room (Phase 13). The same weights
  // size the bands (CSS `--weight`), place the marker and draw the fill, so the
  // three always agree. Without `eraStats` every band weighs 1 (equal widths).
  const weights = eraStats
    ? flooredWeights(eras.map((era) => eraStats.get(era.id)?.lessonCount ?? 0))
    : eras.map(() => 1);

  const markerPct = markerPositionPercent(
    eras,
    currentLesson.eraId,
    currentLesson.year,
    weights,
  );

  const fillPct = eraStats
    ? timelineFillPercent(
        eras.map((era) => {
          const stat = eraStats.get(era.id);
          return {
            lessonCount: stat?.lessonCount ?? 0,
            completedCount: stat?.completedCount ?? 0,
          };
        }),
        weights,
      )
    : 0;

  function eraStateFor(era: Era): EraState {
    const stat = eraStats?.get(era.id);
    if (stat && stat.lessonCount > 0 && stat.completedCount >= stat.lessonCount) {
      return 'completed';
    }
    if (era.id === currentLesson.eraId) return 'current';
    return 'upcoming';
  }

  const rootClass =
    variant === 'compact'
      ? `${styles.timeline} ${styles.compact}`
      : variant === 'home'
        ? `${styles.timeline} ${styles.home}`
        : styles.timeline;

  return (
    <nav className={rootClass} aria-label="Vremenska osa epoha">
      <div className={styles.panel}>
        <div className={styles.rail} aria-hidden="true">
          <span
            className={styles.railFill}
            style={{ '--fill': `${String(fillPct)}%` } as CSSProperties}
          />
          <span
            className={styles.marker}
            style={{ '--pos': `${String(markerPct)}%` } as CSSProperties}
          />
        </div>

        <ol className={styles.bands}>
          {eras.map((era, idx) => {
            const state = eraStateFor(era);
            const cls = `${styles.band} ${styles[state] ?? ''}`;
            const content = (
              <>
                <span className={styles.node} aria-hidden="true" />
                <span className={`${styles.text} ${era.yearStart < 0 ? styles.textBce : ''}`}>
                  <span className={`mono ${styles.num}`}>{era.num}</span>
                  {/* Short label on the desktop rail, full title in the vertical rows;
                      CSS shows one of the two (Phase 13). */}
                  <span className={`${styles.title} ${styles.titleShort}`}>{era.eraShort}</span>
                  <span className={`${styles.title} ${styles.titleFull}`}>{era.title}</span>
                  <span className={`tiny mono ${styles.yearShort}`}>
                    {formatYearShort(era.yearStart)}
                  </span>
                  <span className={`tiny mono ${styles.yearFull}`}>
                    {era.yearsLabel}
                  </span>
                </span>
              </>
            );
            return (
              <li
                key={era.id}
                className={styles.bandItem}
                style={{ '--weight': String(weights[idx] ?? 1) } as CSSProperties}
              >
                {eraHref ? (
                  <Link
                    href={eraHref(era.id)}
                    className={cls}
                    title={`${era.title} (${era.yearsLabel})`}
                    aria-current={state === 'current' ? 'true' : undefined}
                  >
                    {content}
                  </Link>
                ) : (
                  <span
                    className={cls}
                    title={`${era.title} (${era.yearsLabel})`}
                    aria-current={state === 'current' ? 'true' : undefined}
                  >
                    {content}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
