'use client';

import Link from 'next/link';
import { useEffect } from 'react';

import type { Lesson } from '@learn365/content';
import { isCompleted } from '@learn365/core';

import { useProgressStore } from '@/lib/progress/ProgressStoreProvider';

import { LessonBody } from './LessonBody';
import styles from './LessonReader.module.css';

interface AdjacentLesson {
  readonly id: string;
  readonly title: string;
  readonly dayNumber: number;
}

interface LessonReaderProps {
  courseId: string;
  lesson: Lesson;
  eraTitle: string | null;
  sectionTitle: string | null;
  prev: AdjacentLesson | null;
  next: AdjacentLesson | null;
}

export function LessonReader({
  courseId,
  lesson,
  eraTitle,
  sectionTitle,
  prev,
  next,
}: LessonReaderProps) {
  const completed = useProgressStore((state) => isCompleted(state, courseId, lesson.id));
  const toggleComplete = useProgressStore((state) => state.toggleComplete);
  const markOpened = useProgressStore((state) => state.markOpened);

  useEffect(() => {
    markOpened(courseId, lesson.id);
  }, [courseId, lesson.id, markOpened]);

  return (
    <article className={`shell ${styles.page}`}>
      <header className={styles.header}>
        <p className={`tiny mono ${styles.dayStrip}`}>
          DAN {String(lesson.dayNumber).padStart(3, '0')} ·{' '}
          {eraTitle ?? 'Epoha'} · {sectionTitle ?? 'Odeljak'}
        </p>
        <h1 className="reader-title">{lesson.title}</h1>
        {lesson.subtitle ? <p className="lede">{lesson.subtitle}</p> : null}
        <p className={`tiny mono ${styles.meta}`}>
          {lesson.readingTimeMinutes} min čitanja · {lesson.year}
          {lesson.dateLabel ? ` · ${lesson.dateLabel}` : ''}
        </p>
      </header>

      <div className={styles.body}>
        <LessonBody blocks={lesson.content} />
      </div>

      <footer className={styles.footer}>
        <button
          type="button"
          onClick={() => toggleComplete(courseId, lesson.id)}
          className={`${styles.completeButton} ${completed ? styles.completed : ''}`}
          aria-pressed={completed}
        >
          {completed ? '✓ Završeno' : 'Označi kao završeno'}
        </button>

        <nav className={styles.prevNext} aria-label="Prethodna i sledeća lekcija">
          {prev ? (
            <Link
              href={`/course/${courseId}/lesson/${prev.id}`}
              className={styles.navLink}
            >
              <span className={`tiny mono ${styles.navLabel}`}>
                ← DAN {String(prev.dayNumber).padStart(3, '0')}
              </span>
              <span className={`small ${styles.navTitle}`}>{prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/course/${courseId}/lesson/${next.id}`}
              className={`${styles.navLink} ${styles.navLinkRight}`}
            >
              <span className={`tiny mono ${styles.navLabel}`}>
                DAN {String(next.dayNumber).padStart(3, '0')} →
              </span>
              <span className={`small ${styles.navTitle}`}>{next.title}</span>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </footer>
    </article>
  );
}
