'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ScanEye } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';
import { useAuthStore } from '@/shared/stores/auth.store';
import { Role } from '@/shared/constants/roles';
import { clearSimulationContext, endSimulation, synchronizeSimulation } from './service';
import { SIMULATION_ROLE_LABELS, useSimulationStore } from './simulation.store';

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const role = useAuthStore((s) => s.simulatedRole);
  const realRole = useAuthStore((s) => s.user?.role);
  const trainingPreview =
    role === Role.TRAINEE && (realRole === Role.EDITOR || realRole === Role.CLIENT_MANAGER);
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
  return (
    <>
      {role && (
        <>
          <div className="h-16" aria-hidden="true" />
          <aside
            aria-label="Mode simulation"
            className="fixed inset-x-0 top-0 z-100 flex min-h-16 items-center justify-between gap-3 border-b border-amber-300 bg-amber-100 px-4 py-2 text-amber-950 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <ScanEye className="hidden size-5 shrink-0 sm:block" />
              <div>
                <p className="text-sm font-semibold">
                  Mode simulation : rôle {SIMULATION_ROLE_LABELS[role]}
                </p>
                <p className="hidden text-xs sm:block">
                  {trainingPreview
                    ? 'Formations réelles en aperçu · Progression et actions sans effet réel'
                    : 'Données fictives · Actions et achats sans effet réel'}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void exit()}
              disabled={phase === 'transition' || phase === 'checking'}
            >
              Quitter la simulation
            </Button>
          </aside>
        </>
      )}
      {blocked ? (
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
        <div data-simulation={role ? 'active' : undefined}>
          {children}
        </div>
      )}
    </>
  );
}
