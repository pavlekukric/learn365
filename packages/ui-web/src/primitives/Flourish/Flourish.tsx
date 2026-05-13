import styles from './Flourish.module.css';

export function Flourish() {
  return (
    <div className={styles.flourish} aria-hidden="true">
      <span className={styles.line} />
      <span className={styles.glyph}>✦</span>
      <span className={styles.line} />
    </div>
  );
}
