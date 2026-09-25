import type { ReactNode } from 'react';

import { clamp01, toPercentInt } from '../../_internal/progressMath.js';

import styles from './ProgressRing.module.css';

interface ProgressRingProps {
  /** 0..1. Values outside the range are clamped. */
  value: number;
  /**
   * Geometry reference in px (drives the SVG viewBox and stroke maths).
   * The rendered box is `--ring-size` (defaults to 120px) so a host can
   * shrink the ring responsively from CSS without re-rendering.
   */
  size?: number;
  /** Stroke width in px, relative to `size`. */
  stroke?: number;
  /** Accessible label. Defaults to a percent-completed phrase. */
  label?: string;
  /** Centered content (typically a count or percentage label). */
  children: ReactNode;
}

export function ProgressRing({
  value,
  size = 120,
  stroke = 6,
  label,
  children,
}: ProgressRingProps) {
  const clamped = clamp01(value);
  const pct = toPercentInt(clamped);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clamped);
  const center = size / 2;

  return (
    <div
      className={styles.ring}
      role="img"
      aria-label={label ?? `${String(pct)} percent completed`}
    >
      <svg
        className={styles.svg}
        viewBox={`0 0 ${String(size)} ${String(size)}`}
        aria-hidden="true"
      >
        <circle
          className={styles.track}
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          className={styles.fill}
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${String(center)} ${String(center)})`}
        />
      </svg>
      <div className={styles.center}>{children}</div>
    </div>
  );
}
