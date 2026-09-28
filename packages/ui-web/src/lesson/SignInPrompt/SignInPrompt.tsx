import { Button } from '../../primitives/Button/Button.js';

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
        Prijava Google nalogom. Pročitane lekcije prenose se na nalog.
      </p>
      <div className={styles.actions}>
        <Button href={href} plainAnchor>
          Nastavi sa Google-om
        </Button>
        <Button variant="quiet" onClick={onDismiss}>
          Ne sada
        </Button>
      </div>
    </aside>
  );
}
