'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

import { IconClose } from '../../icons/IconClose.js';

import styles from './MobileLessonDrawer.module.css';

interface MobileLessonDrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Optional aria label for the dialog. Defaults to "Sadržaj i vremenska osa". */
  ariaLabel?: string;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])';

export function MobileLessonDrawer({
  open,
  onClose,
  children,
  ariaLabel = 'Sadržaj i vremenska osa',
}: MobileLessonDrawerProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Lock body scroll, manage focus, listen for ESC + Tab.
  useEffect(() => {
    if (!open) return;

    previouslyFocused.current =
      typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null;

    const panel = panelRef.current;
    // Land focus on the close button so screen readers announce the dialog
    // exit affordance first; the focus trap below cycles through the rest.
    const closeButton = panel?.querySelector<HTMLElement>(`button[data-drawer-close]`);
    const firstFocusable =
      closeButton ?? panel?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    firstFocusable?.focus();

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => !el.hasAttribute('aria-hidden'));
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.root}>
      <div
        className={styles.backdrop}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
      >
        <button
          type="button"
          data-drawer-close
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Zatvori"
        >
          <IconClose />
        </button>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
