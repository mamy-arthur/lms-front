'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';
import { useAuthStore } from '@/shared/stores/auth.store';
import { clearSimulationContext, endSimulation, synchronizeSimulation } from './service';
import { useSimulationStore } from './simulation.store';

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const role = useAuthStore((s) => s.simulatedRole);
  const { phase, error } = useSimulationStore();
  const [hydrated, setHydrated] = useState(() => useAuthStore.persist.hasHydrated());
  const [checkedUserId, setCheckedUserId] = useState(() =>
    phase === 'ready' ? userId : undefined,
  );
  const checkedIdentity = useRef(checkedUserId);

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

  useEffect(() => {
    if (!hydrated) return;
    if (!userId) {
      clearSimulationContext();
      checkedIdentity.current = undefined;
      setCheckedUserId(undefined);
      return;
    }
    let disposed = false;
    void synchronizeSimulation().then(() => {
      if (!disposed && checkedIdentity.current !== userId) {
        checkedIdentity.current = userId;
        setCheckedUserId(userId);
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
  }, [userId, hydrated]);

  const exit = async () => {
    try {
      router.replace(await endSimulation());
    } catch {
      toast.error('La sortie n’a pas pu être confirmée. La simulation reste isolée.');
    }
  };

  const blocked = !hydrated || (!!userId && (phase !== 'ready' || checkedUserId !== userId));
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
