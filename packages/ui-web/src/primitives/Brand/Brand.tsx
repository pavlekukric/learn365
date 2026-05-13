import styles from './Brand.module.css';

interface BrandProps {
  /** Optional extra className applied to the root element. */
  className?: string;
}

/**
 * Visual-only brand mark. Stateless. The host (e.g. TopBar) is responsible
 * for wrapping it in the appropriate router link.
 */
export function Brand({ className }: BrandProps) {
  return (
    <span className={`${styles.brand}${className ? ` ${className}` : ''}`}>
      <span className={styles.mark} aria-hidden="true">
        H
      </span>
      <span className={styles.name}>
        History 365 <em>/ Istorija 365</em>
      </span>
    </span>
  );
}
