import { clamp01, toPercentInt } from '../../_internal/progressMath.js';

import styles from './ProgressBar.module.css';

type ProgressBarSize = 'thin' | 'regular' | 'thick';

interface ProgressBarProps {
  /** 0..1. Values outside the range are clamped. */
  value: number;
  size?: ProgressBarSize;
  ariaLabel?: string;
  /** Optional human label for screen readers, e.g. "1 of 365 completed". */
  ariaValueText?: string;
}

export function ProgressBar({
  value,
  size = 'regular',
  ariaLabel,
  ariaValueText,
}: ProgressBarProps) {
  const clamped = clamp01(value);
  const pct = toPercentInt(clamped);
  return (
    <div
      className={`${styles.track} ${styles[`size_${size}`]}`}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
      aria-valuetext={ariaValueText}
    >
      <i className={styles.fill} style={{ width: `${clamped * 100}%` }} />
    </div>
  );
}
