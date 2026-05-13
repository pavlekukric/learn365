import type { MouseEventHandler, ReactNode } from 'react';

import styles from './Card.module.css';

type CardPadding = 'sm' | 'md' | 'lg';

interface CommonProps {
  padding?: CardPadding;
  className?: string;
  children: ReactNode;
}

interface DivCardProps extends CommonProps {
  as?: 'div';
}

interface ButtonCardProps extends CommonProps {
  as: 'button';
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  'aria-label'?: string;
}

export type CardProps = DivCardProps | ButtonCardProps;

export function Card(props: CardProps) {
  const padding = props.padding ?? 'md';
  const cls = [
    styles.card,
    styles[`pad_${padding}`],
    props.as === 'button' ? styles.interactive : null,
    props.className,
  ]
    .filter(Boolean)
    .join(' ');

  if (props.as === 'button') {
    return (
      <button
        type="button"
        className={cls}
        onClick={props.onClick}
        disabled={props.disabled}
        aria-label={props['aria-label']}
      >
        {props.children}
      </button>
    );
  }

  return <div className={cls}>{props.children}</div>;
}
