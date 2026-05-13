import Link from 'next/link';

import type { Era, EraId } from '@learn365/content';

import { markerPositionPercent } from './timelineMath.js';

import styles from './HistoricalTimeline.module.css';

interface HistoricalTimelineProps {
  eras: readonly Era[];
  currentLesson: { eraId: EraId; year: number };
  /** Optional href builder for jumping to an era's first lesson or course anchor. */
  eraHref?: ((eraId: EraId) => string) | undefined;
}

export function HistoricalTimeline({
  eras,
  currentLesson,
  eraHref,
}: HistoricalTimelineProps) {
  const left = markerPositionPercent(eras, currentLesson.eraId, currentLesson.year);
  const bandWidth = eras.length > 0 ? 100 / eras.length : 100;

  return (
    <nav className={styles.timeline} aria-label="Vremenska osa epoha">
      <div className={styles.track} aria-hidden="true">
        <span
          className={styles.marker}
          style={{ left: `${left}%` }}
          aria-hidden="true"
        />
      </div>
      <ol className={styles.bands}>
        {eras.map((era) => {
          const isCurrent = era.id === currentLesson.eraId;
          const cls = `${styles.band}${isCurrent ? ` ${styles.current}` : ''}`;
          const content = (
            <>
              <span className={`tiny mono ${styles.bandNum}`}>{era.num}</span>
              <span className={styles.bandTitle}>{era.title}</span>
              <span className={`tiny mono ${styles.bandYears}`}>
                {String(era.yearStart)}
              </span>
            </>
          );
          return (
            <li
              key={era.id}
              className={styles.bandItem}
              style={{ width: `${bandWidth}%` }}
            >
              {eraHref ? (
                <Link
                  href={eraHref(era.id)}
                  className={cls}
                  aria-label={`Otvori epohu ${era.num}: ${era.title}`}
                  aria-current={isCurrent ? 'true' : undefined}
                >
                  {content}
                </Link>
              ) : (
                <span className={cls} aria-current={isCurrent ? 'true' : undefined}>
                  {content}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
