'use client';

import Link from 'next/link';

import {
  getEras,
  getLessonById,
  type CourseId,
  type Era,
  type EraId,
  type LessonSummary,
} from '@learn365/content';
import { bookmarkedLessonIds } from '@learn365/core';
import { Eyebrow } from '@learn365/ui-web';

import { useBookmarkStore } from '@/lib/bookmarks/BookmarkStoreProvider';

import styles from './CourseOverviewBookmarks.module.css';

interface CourseOverviewBookmarksProps {
  courseId: CourseId;
}

interface ResolvedBookmark {
  lesson: LessonSummary;
  era: Era | undefined;
}

function formatDay(day: number): string {
  return `DAN ${String(day).padStart(3, '0')}`;
}

/**
 * "Sačuvane lekcije" surface on the course overview. Renders nothing when
 * the user has no bookmarks in this course — the bookmark icon in the lesson
 * header is the discovery surface, the overview is the return surface. No
 * generic empty-state copy, matching the Phase 7.10 trust-line rule.
 */
export function CourseOverviewBookmarks({ courseId }: CourseOverviewBookmarksProps) {
  const ids = useBookmarkStore((state) => bookmarkedLessonIds(state, courseId));

  if (ids.length === 0) return null;

  const erasById = new Map<EraId, Era>(
    getEras(courseId).map((era) => [era.id, era]),
  );

  // Resolve ids to lessons. A bookmark for a lesson that no longer exists
  // (corpus regen, slug change) is silently dropped — no broken links.
  const resolved: ResolvedBookmark[] = ids
    .map((id) => {
      const lesson = getLessonById(courseId, id);
      return lesson === null
        ? null
        : { lesson, era: erasById.get(lesson.eraId) };
    })
    .filter((item): item is ResolvedBookmark => item !== null);

  if (resolved.length === 0) return null;

  return (
    <section
      className={styles.section}
      aria-labelledby="bookmarks-heading"
    >
      <header className={styles.header}>
        <Eyebrow>Sačuvano</Eyebrow>
        <h2 id="bookmarks-heading" className="h2">
          Sačuvane lekcije
        </h2>
      </header>
      <ul className={styles.list}>
        {resolved.map(({ lesson, era }) => (
          <li key={lesson.id}>
            <Link
              className={styles.card}
              href={`/course/${courseId}/lesson/${lesson.id}`}
            >
              <span className={`tiny mono ${styles.day}`}>
                {formatDay(lesson.dayNumber)}
              </span>
              <span className={styles.title}>{lesson.title}</span>
              {era ? (
                <span className={`tiny ${styles.era}`}>{era.title}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
