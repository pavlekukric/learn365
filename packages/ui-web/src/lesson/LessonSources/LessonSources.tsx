import type { Source } from '@learn365/content';

import styles from './LessonSources.module.css';

interface LessonSourcesProps {
  sources: readonly Source[];
}

export function LessonSources({ sources }: LessonSourcesProps) {
  if (sources.length === 0) return null;

  return (
    <section className={styles.sources} aria-labelledby="lesson-sources-heading">
      <h2 id="lesson-sources-heading" className="reader-h2">
        Izvori
      </h2>
      <ol className={styles.list}>
        {sources.map((source, idx) => (
          <li key={idx} className={`body ${styles.item}`}>
            <SourceEntry source={source} />
          </li>
        ))}
      </ol>
    </section>
  );
}

function SourceEntry({ source }: { source: Source }) {
  const text = formatSourceText(source);
  if (source.url !== undefined) {
    return (
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.link}
      >
        {text}
      </a>
    );
  }
  return <span>{text}</span>;
}

function formatSourceText(source: Source): string {
  const parts: string[] = [];
  if (source.author !== undefined && source.author.length > 0) {
    parts.push(source.author);
  }
  if (source.year !== undefined) {
    parts.push(`(${String(source.year)})`);
  }
  if (parts.length > 0) parts.push('·');
  parts.push(source.title);
  return parts.join(' ');
}
