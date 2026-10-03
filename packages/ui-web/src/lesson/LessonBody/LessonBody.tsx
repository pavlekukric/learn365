import Image from 'next/image';
import type { CSSProperties } from 'react';

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

/** Tallest a figure renders, in CSS px at the reading measure (mirrors `.figure`). */
const FIGURE_MAX_HEIGHT_PX = 720;

/**
 * A figure is never taller than `min(80vh, 720px)` (review 2026-10-03 P2 9):
 * the figure's width is capped at that height × the image's aspect ratio, so
 * a portrait plate (1440×2141) sits centred at about 480 px wide instead of
 * running 1000 px down the page, and its caption stays the image's width.
 * Landscape figures are wider than the measure at that height, so nothing
 * changes for them. The ratio comes from the block's own width / height,
 * which also reserve the box before the image loads (no layout shift).
 */
function figureStyle(
  width: number,
  height: number,
): CSSProperties & Record<'--figure-ratio', string> {
  return { '--figure-ratio': (width / height).toFixed(4) };
}

/** `sizes` for a figure: the measure, or narrower when the height cap binds. */
function figureSizes(width: number, height: number): string {
  const desktopWidth = Math.min(720, Math.round((FIGURE_MAX_HEIGHT_PX * width) / height));
  return `(max-width: 720px) 100vw, ${String(desktopWidth)}px`;
}

function BlockRenderer({ block, index }: { block: LessonBlock; index: number }) {
  switch (block.type) {
    case 'paragraph': {
      const useDropcap = block.dropcap === true || index === 0;
      return <p className={`body ${useDropcap ? styles.dropcap : ''}`}>{block.text}</p>;
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
        <figure className={styles.figure} style={figureStyle(block.width, block.height)}>
          <Image
            src={block.src}
            alt={block.alt}
            width={block.width}
            height={block.height}
            className={styles.image}
            sizes={figureSizes(block.width, block.height)}
          />
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
