'use client';

import type { CourseId } from '@learn365/content';
import { Eyebrow } from '@learn365/ui-web';

import {
  HOW_IT_WORKS_EYEBROW,
  HOW_IT_WORKS_NOTE,
  HOW_IT_WORKS_STEPS,
  HOW_IT_WORKS_TITLE,
} from '@/lib/copy/howItWorks';
import { useResumeLesson } from '@/lib/progress/useResumeLesson';

import styles from '../page.module.css';

interface HomeHowItWorksProps {
  courseId: CourseId;
}

/**
 * Three-step "how it works" block for a first-time visitor. Renders only
 * until the first completed lesson — after that the reader knows the ritual
 * and the block would be noise between the hero and the daily anchor. The
 * same copy stays permanently reachable on /o-aplikaciji.
 */
export function HomeHowItWorks({ courseId }: HomeHowItWorksProps) {
  const { hasStarted } = useResumeLesson(courseId);
  if (hasStarted) return null;

  return (
    <section className={styles.how} aria-labelledby="kako-funkcionise">
      <header className={styles.howHeader}>
        <Eyebrow>{HOW_IT_WORKS_EYEBROW}</Eyebrow>
        <h2 id="kako-funkcionise" className="h2">
          {HOW_IT_WORKS_TITLE}
        </h2>
      </header>
      <ol className={styles.howSteps}>
        {HOW_IT_WORKS_STEPS.map((step, index) => (
          <li key={step.title} className={styles.howStep}>
            <span className={`mono ${styles.howNum}`}>{String(index + 1).padStart(2, '0')}</span>
            <span className={styles.howTitle}>{step.title}</span>
            <span className={styles.howText}>{step.text}</span>
          </li>
        ))}
      </ol>
      <p className={styles.howNote}>{HOW_IT_WORKS_NOTE}</p>
    </section>
  );
}
