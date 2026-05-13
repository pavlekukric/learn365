import type { LessonBlock } from '@learn365/content';

import styles from './LessonBody.module.css';

interface LessonBodyProps {
  blocks: readonly LessonBlock[];
}

export function LessonBody({ blocks }: LessonBodyProps) {
  return (
    <div className={styles.body}>
      {blocks.map((block, idx) => (
        <BlockRenderer key={idx} block={block} index={idx} />
      ))}
    </div>
  );
}

function BlockRenderer({ block, index }: { block: LessonBlock; index: number }) {
  switch (block.type) {
    case 'paragraph': {
      const useDropcap = block.dropcap === true || index === 0;
      return (
        <p className={`body ${useDropcap ? styles.dropcap : ''}`}>{block.text}</p>
      );
    }
    case 'heading':
      return block.level === 2 ? (
        <h2 className="reader-h2">{block.text}</h2>
      ) : (
        <h3 className="h3">{block.text}</h3>
      );
    case 'quote':
      return (
        <blockquote className={styles.quote}>
          <p className="body">{block.text}</p>
          {block.attribution ? (
            <cite className={`small ${styles.attribution}`}>— {block.attribution}</cite>
          ) : null}
        </blockquote>
      );
    case 'image':
      return (
        <figure className={styles.figure}>
          <div className={styles.imagePlaceholder} role="img" aria-label={block.alt} />
          {block.caption ? (
            <figcaption className={`small ${styles.caption}`}>{block.caption}</figcaption>
          ) : null}
        </figure>
      );
    default: {
      const _exhaustive: never = block;
      void _exhaustive;
      return null;
    }
  }
}
