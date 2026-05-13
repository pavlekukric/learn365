import type { MouseEventHandler, ReactNode } from 'react';

import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'accent' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
  'aria-pressed'?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  disabled,
  onClick,
  type = 'button',
  children,
  ...aria
}: ButtonProps) {
  const cls = [
    styles.button,
    styles[`variant_${variant}`],
    styles[`size_${size}`],
    iconRight ? styles.hasIconRight : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={cls}
      onClick={onClick}
      disabled={disabled}
      aria-label={aria['aria-label']}
      aria-pressed={aria['aria-pressed']}
    >
      {iconLeft ? <span className={styles.icon} aria-hidden="true">{iconLeft}</span> : null}
      <span className={styles.label}>{children}</span>
      {iconRight ? (
        <span className={`${styles.icon} ${styles.iconRight}`} aria-hidden="true">
          {iconRight}
        </span>
      ) : null}
    </button>
  );
}
