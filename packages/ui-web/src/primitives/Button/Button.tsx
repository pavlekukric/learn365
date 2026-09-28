import Link from 'next/link';
import type { MouseEventHandler, ReactNode } from 'react';

import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'outline' | 'quiet';

interface ButtonBaseProps {
  /**
   * `primary` — the ink pill, one per surface (Home hero, course start, 404,
   * sign-in). `outline` — the same pill, hollow (`Odjava`, the delete
   * confirmation). `quiet` — a text action (`Ne sada`, `Obriši nalog`).
   */
  variant?: ButtonVariant | undefined;
  /** Trailing glyph (an arrow, a check); slides 2 px right on hover. */
  iconRight?: ReactNode;
  /** Layout-only hook for the host (grid placement); never restyles the pill. */
  className?: string | undefined;
  'aria-label'?: string | undefined;
  children: ReactNode;
}

export interface ButtonLinkProps extends ButtonBaseProps {
  href: string;
  /**
   * Render a plain `<a>` instead of `next/link` — for hrefs the client router
   * must not handle, such as `/api/auth/google?…` (a server redirect).
   */
  plainAnchor?: boolean | undefined;
  /** A link without a target yet: stays in the tree, looks and acts inert. */
  'aria-disabled'?: boolean | undefined;
  onClick?: undefined;
  type?: undefined;
  disabled?: undefined;
  'aria-pressed'?: undefined;
}

export interface ButtonButtonProps extends ButtonBaseProps {
  href?: undefined;
  plainAnchor?: undefined;
  'aria-disabled'?: undefined;
  type?: 'button' | 'submit' | 'reset' | undefined;
  onClick?: MouseEventHandler<HTMLButtonElement> | undefined;
  disabled?: boolean | undefined;
  'aria-pressed'?: boolean | undefined;
}

export type ButtonProps = ButtonLinkProps | ButtonButtonProps;

/**
 * The one pill (Phase 14, review P2 item 21). Every filled, outlined or quiet
 * action in the app is this component; surfaces carry no pill CSS of their
 * own. An `href` makes it a real anchor, otherwise it is a native `<button>`.
 */
export function Button(props: ButtonProps) {
  const { variant = 'primary', iconRight, className, children } = props;
  const cls = [styles.button, styles[variant], className].filter(Boolean).join(' ');
  const icon = iconRight ? (
    <span className={styles.icon} aria-hidden="true">
      {iconRight}
    </span>
  ) : null;

  if (props.href !== undefined) {
    if (props.plainAnchor === true) {
      return (
        <a
          href={props.href}
          className={cls}
          aria-label={props['aria-label']}
          aria-disabled={props['aria-disabled']}
        >
          {children}
          {icon}
        </a>
      );
    }
    return (
      <Link
        href={props.href}
        className={cls}
        aria-label={props['aria-label']}
        aria-disabled={props['aria-disabled']}
      >
        {children}
        {icon}
      </Link>
    );
  }

  return (
    <button
      type={props.type ?? 'button'}
      className={cls}
      onClick={props.onClick}
      disabled={props.disabled}
      aria-label={props['aria-label']}
      aria-pressed={props['aria-pressed']}
    >
      {children}
      {icon}
    </button>
  );
}
