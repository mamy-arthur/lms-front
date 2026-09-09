'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type Echo from 'laravel-echo';

const EchoContext = createContext<Echo<'reverb'> | null>(null);

export function useEcho(): Echo<'reverb'> | null {
  return useContext(EchoContext);
}

interface Props {
  children: React.ReactNode;
}

/**
 * Expose le singleton Echo aux composants clients. L'import est dynamique pour
 * garder laravel-echo/pusher-js hors du bundle initial des layouts.
 */
export function EchoProvider({ children }: Props) {
  const [echo, setEcho] = useState<Echo<'reverb'> | null>(null);

  useEffect(() => {
    let cancelled = false;

    import('@/shared/lib/echo')
      .then(({ getEcho }) => {
        if (!cancelled) setEcho(getEcho());
      })
      .catch((err: unknown) => console.error('[EchoProvider] Failed to initialize Echo:', err));

    // L'instance est partagée (useScormPackageChannel l'utilise aussi) : on ne la
    // déconnecte pas ici, chaque hook quitte son propre channel.
    return () => {
      cancelled = true;
    };
  }, []);

  return <EchoContext.Provider value={echo}>{children}</EchoContext.Provider>;
}
