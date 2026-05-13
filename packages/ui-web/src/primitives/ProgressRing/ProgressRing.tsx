import type { ReactNode } from 'react';

import { clamp01, toPercentInt } from '../../_internal/progressMath.js';

import styles from './ProgressRing.module.css';

interface ProgressRingProps {
  /** 0..1. Values outside the range are clamped. */
  value: number;
  /** Outer diameter in px. */
  size?: number;
  /** Stroke width in px. */
  stroke?: number;
  /** Centered content (typically a percentage label). */
  children: ReactNode;
}

export function ProgressRing({
  value,
  size = 120,
  stroke = 6,
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
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${String(pct)} percent completed`}
    >
      <svg
        className={styles.svg}
        width={size}
        height={size}
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
