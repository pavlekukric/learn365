'use client';

import { useEffect, useRef, useState } from 'react';

import { Button } from '@learn365/ui-web';

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
  // `Obriši nalog` disappears when pressed and reappears on `Odustani`: move
  // focus with it, or it falls to <body> (review 2026-09-30, item 9).
  const confirmRef = useRef<HTMLDivElement | null>(null);
  const actionsRef = useRef<HTMLDivElement | null>(null);
  const wasConfirming = useRef(false);
  useEffect(() => {
    if (confirming) confirmRef.current?.focus();
    else if (wasConfirming.current) actionsRef.current?.querySelector<HTMLElement>('button:last-of-type')?.focus();
    wasConfirming.current = confirming;
  }, [confirming]);

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

      <div ref={actionsRef} className={styles.actions}>
        <Button variant="outline" onClick={() => void handleSignOut()} disabled={busy !== null}>
          {busy === 'signout' ? 'Odjava…' : 'Odjava'}
        </Button>
        {!confirming ? (
          <Button
            variant="quiet"
            onClick={() => {
              setConfirming(true);
            }}
            disabled={busy !== null}
          >
            Obriši nalog
          </Button>
        ) : null}
      </div>

      {confirming ? (
        <div
          ref={confirmRef}
          tabIndex={-1}
          className={styles.confirm}
          role="group"
          aria-labelledby="brisanje-naslov"
        >
          <p id="brisanje-naslov" className={styles.confirmText}>
            Ovo briše nalog, napredak i sačuvane lekcije, odmah i trajno. Sigurno?
          </p>
          <div className={styles.actions}>
            <Button variant="outline" onClick={() => void handleDelete()} disabled={busy !== null}>
              {busy === 'delete' ? 'Brisanje…' : 'Obriši'}
            </Button>
            <Button
              variant="quiet"
              onClick={() => {
                setConfirming(false);
              }}
              disabled={busy !== null}
            >
              Odustani
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
