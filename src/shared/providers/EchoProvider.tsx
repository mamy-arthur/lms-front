'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type Echo from 'laravel-echo';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useSimulationStore } from '@/shared/simulation/simulation.store';

function realtimeBlocked() {
  const phase = useSimulationStore.getState().phase;
  return !!useAuthStore.getState().simulatedRole || (phase !== 'idle' && phase !== 'ready');
}

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
  const simulatedRole = useAuthStore((s) => s.simulatedRole);
  const phase = useSimulationStore((s) => s.phase);
  const blocked = !!simulatedRole || (phase !== 'idle' && phase !== 'ready');

  useEffect(() => {
    let cancelled = false;
    let disconnect: (() => void) | undefined;
    const stopIfBlocked = () => {
      if (realtimeBlocked()) {
        disconnect?.();
        setEcho(null);
      }
    };
    // Stop synchronously when a transition begins, before React effect cleanup.
    const unsubscribeAuth = useAuthStore.subscribe(stopIfBlocked);
    const unsubscribeSimulation = useSimulationStore.subscribe(stopIfBlocked);

    import('@/shared/lib/echo')
      .then(({ getEcho, resetEcho }) => {
        if (cancelled) return;
        disconnect = resetEcho;
        if (realtimeBlocked()) stopIfBlocked();
        else setEcho(getEcho());
      })
      .catch((err: unknown) => console.error('[EchoProvider] Failed to initialize Echo:', err));

    // L'instance est partagée (useScormPackageChannel l'utilise aussi) : on ne la
    // déconnecte pas ici, chaque hook quitte son propre channel.
    return () => {
      cancelled = true;
      unsubscribeAuth();
      unsubscribeSimulation();
    };
  }, [blocked]);

  return <EchoContext.Provider value={blocked ? null : echo}>{children}</EchoContext.Provider>;
}
