'use client';

import { useEffect } from 'react';

/**
 * Registers a `beforeunload` listener while `active` is true.
 * Warns the user that leaving the page may end their quiz attempt.
 */
export function useBeforeUnload(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers show their own generic message; the return value is ignored in most.
      e.returnValue =
        'Votre tentative est en cours. Quitter cette page pourrait mettre fin à votre examen.';
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [active]);
}
