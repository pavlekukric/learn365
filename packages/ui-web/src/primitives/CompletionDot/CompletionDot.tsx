import styles from './CompletionDot.module.css';

type CompletionDotState = 'idle' | 'active' | 'done';

interface CompletionDotProps {
  state: CompletionDotState;
}

export function CompletionDot({ state }: CompletionDotProps) {
  return (
    <span className={`${styles.dot} ${styles[`state_${state}`]}`} aria-hidden="true">
      {state === 'done' ? (
        <svg
          viewBox="0 0 12 12"
          width={10}
          height={10}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2.5 6.2l2.4 2.4L9.5 3.5" />
        </svg>
      ) : null}
    </span>
  );
}
