import styles from './SignInPrompt.module.css';

export interface SignInPromptProps {
  /** Where the primary action leads — the app's Google sign-in route with a return path. */
  href: string;
  /** `Ne sada`: the app records the dismissal and never auto-shows the card again. */
  onDismiss: () => void;
}

/**
 * The one ask for an account, shown by the app under the completion moment
 * once a reader has finished their second lesson and is not signed in.
 * Paper card in the completed-footer register: a serif line, one sentence
 * of body, a primary pill and a quiet way to say no. Never a modal.
 */
export function SignInPrompt({ href, onDismiss }: SignInPromptProps) {
  return (
    <aside className={styles.card} aria-labelledby="signin-prompt-title">
      <p className={`eyebrow ${styles.eyebrow}`}>Nalog</p>
      <p id="signin-prompt-title" className={styles.title}>
        Sačuvaj napredak i na drugim uređajima.
      </p>
      <p className={`small ${styles.body}`}>
        Prijava Google nalogom. Ono što si ovde pročitao prenosi se na nalog.
      </p>
      <div className={styles.actions}>
        <a href={href} className={styles.primary}>
          Nastavi sa Google-om
        </a>
        <button type="button" className={styles.dismiss} onClick={onDismiss}>
          Ne sada
        </button>
      </div>
    </aside>
  );
}
