'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

import { IconClose } from '../../icons/IconClose.js';

import styles from './MobileLessonDrawer.module.css';

interface MobileLessonDrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Optional aria label for the dialog. Defaults to "Sadržaj kursa". */
  ariaLabel?: string;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])';

export function MobileLessonDrawer({
  open,
  onClose,
  children,
  ariaLabel = 'Sadržaj kursa',
}: MobileLessonDrawerProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Hold the latest onClose in a ref so the open-effect can depend only on
  // `open`. Otherwise an inline onClose (new identity each render) would make
  // the effect tear down + re-run on every parent re-render — e.g. when the
  // user expands another era inside the drawer — re-firing the scroll-to-
  // current-lesson and yanking them away from where they're browsing.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Lock body scroll, manage focus, listen for ESC + Tab. Runs once per open
  // (keyed on `open` only) so the initial scroll/focus happens exactly once
  // and is not re-triggered while the user browses the open drawer.
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

    // Scroll the current lesson row into view so the user lands on "where
    // am I in the course" instead of always at the top of Era I. Defer one
    // frame so the panel + sidebar tree have committed layout before we
    // scroll; reduced-motion users get an instant jump.
    const scrollFrame = requestAnimationFrame(() => {
      const current = panel?.querySelector<HTMLElement>('[aria-current="page"]');
      if (!current) return;
      const prefersReducedMotion = typeof window !== 'undefined'
        && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      current.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'center',
      });
    });

    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current();
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

    // Rotated or resized to the two-column layout, where the trigger is
    // hidden and the outline sits beside the article: the drawer closes.
    const desktop = window.matchMedia('(min-width: 1025px)');
    function handleDesktop(event: MediaQueryListEvent) {
      if (event.matches) onCloseRef.current();
    }
    desktop.addEventListener('change', handleDesktop);

    return () => {
      cancelAnimationFrame(scrollFrame);
      document.removeEventListener('keydown', handleKey);
      desktop.removeEventListener('change', handleDesktop);
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

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
        {/* Any link inside closes the drawer — also one to the page already
         * open (the current row, the current era), where no navigation
         * happens and the shell would otherwise keep it open. */}
        <div
          className={styles.body}
          onClick={(event) => {
            if ((event.target as Element).closest('a[href]')) onClose();
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
