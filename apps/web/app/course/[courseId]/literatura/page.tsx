import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getCourse, getEras, getLessonsByEra } from '@learn365/content';
import { Breadcrumbs, Eyebrow, Flourish } from '@learn365/ui-web';

import { courseHref, eraAnchorId, lessonHref, readingListHref } from '@/lib/routes';
import { shareMetadata } from '@/lib/seo/metadata';
import {
  ERA_WORKS_LABEL,
  getReadingList,
  LIMITS_HEADING,
  LIMITS_PARAGRAPHS,
  METHOD_HEADING,
  METHOD_PARAGRAPHS,
  READING_LIST_EYEBROW,
  READING_LIST_LEDE,
  READING_LIST_TITLE,
  readingListCourseIds,
  type ReadingWork,
} from '@/lib/trust/readingList';

import styles from './page.module.css';

interface PageProps {
  params: Promise<{ courseId: string }>;
}

/** Prerendered for every course that has a reading list; anything else is a 404. */
export const dynamicParams = false;

export function generateStaticParams(): { courseId: string }[] {
  return readingListCourseIds().map((courseId) => ({ courseId }));
}

const DESCRIPTION =
  'Kako su proverene činjenice u lekcijama Istorije 365 i na koja dela i izvore se ta provera oslanjala, po epohama.';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { courseId } = await params;
  const course = getCourse(courseId);
  if (!course) return {};
  const title = `${READING_LIST_EYEBROW} · ${course.title}`;
  return {
    title,
    description: DESCRIPTION,
    ...shareMetadata({ title, description: DESCRIPTION, path: readingListHref(course.id) }),
  };
}

/**
 * „Literatura i provera" (review 2026-10-03 P1 4): one page per course — the
 * method and its limits first, then the eight eras, each an anchored section
 * (`#era-<id>`) that the trust line under every lesson links to. Copy and
 * data live in `lib/trust/readingList.ts`; the eras' names come from the
 * content registry, so the page never restates them.
 */
export default async function ReadingListPage({ params }: PageProps) {
  const { courseId } = await params;
  const course = getCourse(courseId);
  const readingList = getReadingList(courseId);
  if (!course || !readingList) notFound();

  const eras = getEras(course.id);
  const sections = readingList.eras.flatMap((list) => {
    const era = eras.find((candidate) => candidate.id === list.eraId);
    return era ? [{ era, list }] : [];
  });

  return (
    <div className="shell">
      <article className={styles.page}>
        <header className={styles.header}>
          <Breadcrumbs
            items={[
              { label: 'Početna', href: '/' },
              { label: course.title, href: courseHref(course.id) },
              { label: READING_LIST_EYEBROW },
            ]}
          />
          <Eyebrow>{READING_LIST_EYEBROW}</Eyebrow>
          <h1 className={`reader-title ${styles.title}`}>{READING_LIST_TITLE}</h1>
          <p className={`lede ${styles.lede}`}>{READING_LIST_LEDE}</p>
          <Flourish />
        </header>

        <div className={styles.body}>
          <section className={styles.section} aria-labelledby="kako-je-provereno">
            <h2 id="kako-je-provereno" className={`h3 ${styles.sectionTitle}`}>
              {METHOD_HEADING}
            </h2>
            {METHOD_PARAGRAPHS.map((text) => (
              <p key={text} className={`body ${styles.paragraph}`}>
                {text}
              </p>
            ))}
          </section>

          <section className={styles.section} aria-labelledby="granice-provere">
            <h2 id="granice-provere" className={`h3 ${styles.sectionTitle}`}>
              {LIMITS_HEADING}
            </h2>
            {LIMITS_PARAGRAPHS.map((text) => (
              <p key={text} className={`body ${styles.paragraph}`}>
                {text}
              </p>
            ))}
            <p className={`body ${styles.paragraph}`}>
              Adresa za prijavu greške je na stranici{' '}
              <Link className={styles.inlineLink} href="/o-aplikaciji#kontakt">
                O aplikaciji
              </Link>
              .
            </p>
          </section>

          <nav className={styles.toc} aria-labelledby="po-epohama">
            <h2 id="po-epohama" className={`h3 ${styles.sectionTitle}`}>
              Po epohama
            </h2>
            <ol className={styles.tocList}>
              {sections.map(({ era }) => (
                <li key={era.id}>
                  <a className={styles.tocLink} href={`#${eraAnchorId(era.id)}`}>
                    <span className={`mono ${styles.num}`}>{era.num}</span>
                    <span>{era.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {sections.map(({ era, list }) => {
            const firstLesson = getLessonsByEra(course.id, era.id)[0];
            const headingId = `${eraAnchorId(era.id)}-naslov`;
            return (
              <section
                key={era.id}
                id={eraAnchorId(era.id)}
                className={`${styles.section} ${styles.era}`}
                aria-labelledby={headingId}
              >
                <p className={`mono ${styles.eraMeta}`}>
                  <span className={styles.num}>{era.num}</span>
                  <span>{list.days}</span>
                  <span>{era.yearsLabel}</span>
                </p>
                <h2 id={headingId} className={`h3 ${styles.sectionTitle}`}>
                  {era.title}
                </h2>
                <p className={`eyebrow ${styles.worksLabel}`}>{ERA_WORKS_LABEL}</p>
                <ul className={styles.works}>
                  {list.works.map((work) => (
                    <li key={`${work.author ?? ''}${work.title}`} className={styles.work}>
                      <WorkEntry work={work} />
                    </li>
                  ))}
                </ul>
                {list.caveat !== undefined ? (
                  <p className={`small ${styles.caveat}`}>{list.caveat}</p>
                ) : null}
                {firstLesson ? (
                  <p className={styles.eraLink}>
                    <Link
                      className={styles.inlineLink}
                      href={lessonHref(course.id, firstLesson.id)}
                    >
                      Prva lekcija epohe
                    </Link>
                  </p>
                ) : null}
              </section>
            );
          })}
        </div>
      </article>
    </div>
  );
}

/** „Autor, *Knjiga* — detalj": books in italics, articles in quotes, descriptions upright. */
function WorkEntry({ work }: { work: ReadingWork }) {
  const form = work.form ?? 'book';
  return (
    <>
      {work.author !== undefined ? <span>{work.author}, </span> : null}
      {form === 'book' ? (
        <cite>{work.title}</cite>
      ) : form === 'article' ? (
        <span>„{work.title}”</span>
      ) : (
        <span>{work.title}</span>
      )}
      {work.detail !== undefined ? (
        <span className={styles.workDetail}> — {work.detail}</span>
      ) : null}
    </>
  );
}
