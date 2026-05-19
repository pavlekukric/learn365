import { getCourse } from '@learn365/content';
import { Eyebrow, Flourish } from '@learn365/ui-web';

import { HomeCurrentLessonCard } from './_components/HomeCurrentLessonCard';
import { HomeDailyAnchor } from './_components/HomeDailyAnchor';
import { HomeEraTimeline } from './_components/HomeEraTimeline';
import { HomeHeroCta } from './_components/HomeHeroCta';
import styles from './page.module.css';

const DEFAULT_COURSE_ID = 'istorija-srbije-365';

/**
 * Home-only hero copy. Kept here as a page-level presentational string rather
 * than in `course.description`, which is shared with the course overview and
 * stays factual/structural. This line is allowed to be warmer and more
 * editorial without changing the canonical course data.
 */
const HERO_DESCRIPTION =
  'Kroz osam epoha i 365 kratkih lekcija prati razvoj Srbije — od najstarijih kultura na Balkanu do savremenog doba. Jedan dan, jedna lekcija, jedan jasan put.';

/**
 * Daily-contract caption under the hero title (Phase 7.8 D2). Makes the
 * "one lesson a day" premise explicit above the fold. Replaces the prior
 * chronological scope caption — era years are already encoded in the
 * timeline below and on every era card / lesson eyebrow, so the hero is
 * the right place to state the daily contract instead of restating scope.
 */
const HERO_CONTRACT_LINE = '365 lekcija · 1 dnevno · ~8 minuta';

export default function HomePage() {
  const course = getCourse(DEFAULT_COURSE_ID);
  if (!course) {
    throw new Error(`Course "${DEFAULT_COURSE_ID}" is missing.`);
  }

  return (
    <div className={`shell ${styles.page}`}>
      <section className={styles.hero}>
        {/*
         * Atmospheric hero backdrop. Pure-CSS parchment wash by default; the
         * final image is dropped in by setting the `--hero-image` CSS variable
         * in page.module.css — no JSX change required. See `.heroBackdrop`.
         */}
        <div className={styles.heroBackdrop} aria-hidden="true" />

        <div className={styles.heroInner}>
          {/* No hero eyebrow: the TopBar already holds the History 365 brand,
            * and the h1 below carries the course identity. A second naming
            * line between them only stutters the same idea. The chronological
            * caption below the title is a scope statement, not a brand label —
            * different register, so it sits under the h1 rather than above. */}
          <h1 className="display">{course.title}</h1>
          <p className={`mono ${styles.dateLine}`}>{HERO_CONTRACT_LINE}</p>
          <p className={`body ${styles.description}`}>{HERO_DESCRIPTION}</p>

          <Flourish />

          <HomeHeroCta courseId={course.id} />
        </div>
      </section>

      <section className={styles.current} aria-label="Preporučena lekcija">
        <HomeDailyAnchor courseId={course.id} />
        <HomeCurrentLessonCard courseId={course.id} />
      </section>

      <section className={styles.eras} aria-label="Osam epoha">
        <header className={styles.erasHeader}>
          <Eyebrow>Osam epoha</Eyebrow>
          <h2 className="h2">Putovanje kroz 365 dana</h2>
        </header>
        <div className={styles.timeline}>
          <HomeEraTimeline courseId={course.id} />
        </div>
      </section>
    </div>
  );
}
