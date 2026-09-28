import { IconCheck } from '../../icons/IconCheck.js';

import styles from './MarkAsCompletedButton.module.css';

interface MarkAsCompletedButtonProps {
  isCompleted: boolean;
  onClick: () => void;
}

/**
 * The completion toggle. One vocabulary with every counter in the app
 * (`Pročitano N / 365`, the era card's `Pročitano ✓`, the how-it-works
 * step): the action is "Označi kao pročitano", the state is "Pročitano".
 */
export function MarkAsCompletedButton({
  isCompleted,
  onClick,
}: MarkAsCompletedButtonProps) {
  return (
    <button
      type="button"
      className={`${styles.button} ${isCompleted ? styles.completed : ''}`}
      onClick={onClick}
      aria-pressed={isCompleted}
    >
      <span>{isCompleted ? 'Pročitano' : 'Označi kao pročitano'}</span>
      <IconCheck className={styles.icon} />
    </button>
  );
}
