'use client';

import { useState } from 'react';

import { useAuth } from '@/lib/auth/AuthProvider';

import styles from '../account.module.css';

type Busy = 'signout' | 'delete' | null;

/**
 * `Odjava` and the two-step `Obriši nalog`. Both go through `useAuth()`,
 * which also clears everything stored in this browser and returns Home.
 */
export function NalogActions() {
  const { signOut, deleteAccount } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setBusy('signout');
    setError(null);
    const ok = await signOut();
    if (!ok) {
      setBusy(null);
      setError('Odjava nije uspela. Pokušaj ponovo.');
    }
  };

  const handleDelete = async () => {
    setBusy('delete');
    setError(null);
    const ok = await deleteAccount();
    if (!ok) {
      setBusy(null);
      setError('Brisanje nije uspelo. Pokušaj ponovo.');
    }
  };

  return (
    <div className={styles.actionsColumn}>
      {error !== null ? (
        <p className={`small ${styles.error}`} role="alert">
          {error}
        </p>
      ) : null}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.outline}
          onClick={() => void handleSignOut()}
          disabled={busy !== null}
        >
          {busy === 'signout' ? 'Odjava…' : 'Odjava'}
        </button>
        {!confirming ? (
          <button
            type="button"
            className={styles.quiet}
            onClick={() => {
              setConfirming(true);
            }}
            disabled={busy !== null}
          >
            Obriši nalog
          </button>
        ) : null}
      </div>

      {confirming ? (
        <div className={styles.confirm} role="group" aria-labelledby="brisanje-naslov">
          <p id="brisanje-naslov" className={styles.confirmText}>
            Ovo briše nalog, napredak i sačuvane lekcije, odmah i trajno. Sigurno?
          </p>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.outline}
              onClick={() => void handleDelete()}
              disabled={busy !== null}
            >
              {busy === 'delete' ? 'Brisanje…' : 'Obriši'}
            </button>
            <button
              type="button"
              className={styles.quiet}
              onClick={() => {
                setConfirming(false);
              }}
              disabled={busy !== null}
            >
              Odustani
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
