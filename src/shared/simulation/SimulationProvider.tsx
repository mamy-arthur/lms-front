'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';
import { selectSessionIdentity, useAuthStore } from '@/shared/stores/auth.store';
import { queryClient } from '@/shared/lib/query-client';
import { clearSimulationContext, endSimulation, synchronizeSimulation } from './service';
import { hasSimulationChanges, hasSimulationData } from './local-api';
import { useSimulationStore } from './simulation.store';

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  // Account + session: simulation state is token-scoped, so a new session of
  // the same account must be re-verified too.
  const identity = useAuthStore(selectSessionIdentity);
  const role = useAuthStore((s) => s.simulatedRole);
  const { phase, error } = useSimulationStore();
  const [hydrated, setHydrated] = useState(() => useAuthStore.persist.hasHydrated());
  const [checkedIdentity, setCheckedIdentity] = useState(() =>
    phase === 'ready' ? identity : null,
  );
  const checkedIdentityRef = useRef(checkedIdentity);

  useEffect(() => {
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!role) return;
    const root = document.documentElement;
    const names = ['--color-primary', '--color-secondary', '--font-brand'];
    const previous = names.map((name) => root.style.getPropertyValue(name));
    const title = document.title;
    root.style.setProperty('--color-primary', '#2563eb');
    root.style.setProperty('--color-secondary', '#64748b');
    root.style.setProperty('--font-brand', 'Inter');
    document.title = 'Learneo — Simulation';
    return () => {
      names.forEach((name, index) =>
        previous[index]
          ? root.style.setProperty(name, previous[index])
          : root.style.removeProperty(name),
      );
      document.title = title;
    };
  }, [role]);

  // Demo data only lives in memory: warn before a reload/close discards what the
  // user did. Nothing to lose before the first change, nor after a normal exit
  // (client-side navigation never fires beforeunload).
  useEffect(() => {
    if (!role) return;
    const warn = (event: BeforeUnloadEvent) => {
      if (!hasSimulationChanges()) return;
      event.preventDefault();
      // Older browsers only show the confirmation when returnValue is set.
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [role]);

  useEffect(() => {
    if (!hydrated) return;
    if (!identity) {
      clearSimulationContext();
      checkedIdentityRef.current = null;
      setCheckedIdentity(null);
      return;
    }
    let disposed = false;
    // Only a check applied for this very identity unblocks it; a superseded one
    // resolves false and the effect run for the new identity takes over.
    void synchronizeSimulation().then((applied) => {
      if (!disposed && applied && checkedIdentityRef.current !== identity) {
        checkedIdentityRef.current = identity;
        setCheckedIdentity(identity);
      }
    });
    const sync = () => {
      if (useSimulationStore.getState().phase !== 'transition') void synchronizeSimulation();
    };
    const visible = () => {
      if (document.visibilityState === 'visible') sync();
    };
    const channel =
      typeof BroadcastChannel === 'undefined'
        ? null
        : new BroadcastChannel('learneo-role-simulation');
    if (channel) channel.onmessage = sync;
    document.addEventListener('visibilitychange', visible);
    return () => {
      disposed = true;
      channel?.close();
      document.removeEventListener('visibilitychange', visible);
    };
  }, [identity, hydrated]);

  useEffect(() => {
    if (!hydrated || !userId) return;
    const recoverMissingData = (failure: unknown) => {
      const error = failure as { status?: number; json?: { code?: unknown } } | null;
      if (error?.status !== 409 || error.json?.code !== 'SIMULATION_INACTIVE') return;
      const role = useAuthStore.getState().simulatedRole;
      if (!role || useSimulationStore.getState().phase !== 'ready' || hasSimulationData(role)) {
        return;
      }

      // Fast Refresh can reset local-api memory while retaining stores and this
      // provider. Retrying the same query cannot rebuild it. Reconfirm authority
      // first: synchronizeSimulation blocks/unmounts pages, clears stale queries
      // and restores the local engine only after the server response. Never
      // replay mutations or fall back to a real enrollment request.
      void synchronizeSimulation();
    };
    const cache = queryClient.getQueryCache();
    const unsubscribe = cache.subscribe((event) => {
      if (event.type === 'updated' && event.action.type === 'error') {
        recoverMissingData(event.action.error);
      }
    });
    // Covers errors already cached when this effect is installed/reloaded.
    for (const query of cache.getAll()) recoverMissingData(query.state.error);
    return unsubscribe;
  }, [hydrated, userId]);

  const exit = async () => {
    try {
      router.replace(await endSimulation());
    } catch {
      toast.error('La sortie n’a pas pu être confirmée. La simulation reste isolée.');
    }
  };

  const blocked = !hydrated || (!!identity && (phase !== 'ready' || checkedIdentity !== identity));
  return blocked ? (
    error ? (
      <div
        role="alert"
        className="flex min-h-64 flex-col items-center justify-center gap-4 p-8 text-center"
      >
        <p>{error}</p>
        <Button onClick={() => void synchronizeSimulation()}>Réessayer</Button>
        <Button variant="outline" onClick={() => void exit()}>
          Quitter la simulation
        </Button>
      </div>
    ) : (
      <LoadingSpinner className="h-screen" />
    )
  ) : (
    <div data-simulation={role ? 'active' : undefined}>{children}</div>
  );
}
