import { IconCheck } from '../../icons/IconCheck.js';

import styles from './MarkAsCompletedButton.module.css';

interface MarkAsCompletedButtonProps {
  isCompleted: boolean;
  onClick: () => void;
}

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
      <span>{isCompleted ? 'Završeno' : 'Završi'}</span>
      <IconCheck className={styles.icon} />
    </button>
  );
}
