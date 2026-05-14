'use client';

import { useRouter } from 'next/navigation';
import { useId, useState, type FormEvent } from 'react';

import { getLessons, type CourseId } from '@learn365/content';

import styles from './JumpToDay.module.css';

interface JumpToDayProps {
  courseId: CourseId;
}

/**
 * Compact "jump to day N" navigator. With 365 lessons, scrolling to a specific
 * day is slow — this lets the reader go straight there.
 *
 * The component owns the day → lesson-route mapping (via the `@learn365/content`
 * registry) so callers only pass a `courseId`. That keeps it usable directly
 * from server components, where a function prop (e.g. an href builder) could
 * not be passed across the boundary.
 */
export function JumpToDay({ courseId }: JumpToDayProps) {
  const router = useRouter();
  const inputId = useId();
  const errorId = useId();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const lessons = getLessons(courseId);
  const totalDays = lessons.length;

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const day = Number.parseInt(value.trim(), 10);
    if (!Number.isInteger(day) || day < 1 || day > totalDays) {
      setError(`Unesi broj između 1 i ${String(totalDays)}.`);
      return;
    }
    const lesson = lessons.find((l) => l.dayNumber === day);
    if (!lesson) {
      setError(`Dan ${String(day)} nije pronađen.`);
      return;
    }
    setError(null);
    router.push(`/course/${courseId}/lesson/${lesson.id}`);
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <label htmlFor={inputId} className={`tiny mono ${styles.label}`}>
        Idi na dan
      </label>
      <div className={styles.row}>
        <input
          id={inputId}
          className={styles.input}
          type="number"
          inputMode="numeric"
          min={1}
          max={totalDays}
          placeholder={`1–${String(totalDays)}`}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (error) setError(null);
          }}
          aria-invalid={error !== null}
          aria-describedby={error ? errorId : undefined}
        />
        <button type="submit" className={styles.button}>
          Idi
        </button>
      </div>
      {error ? (
        <p id={errorId} className={`tiny ${styles.error}`} role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
