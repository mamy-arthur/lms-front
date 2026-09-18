'use client';

import { useEffect, useRef } from 'react';
import { getEcho, resetEcho } from '@/shared/lib/echo';
import { useTenantStore } from '@/shared/stores/tenant.store';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useSimulationStore } from '@/shared/simulation/simulation.store';
import type { ScormPackageStatus } from '@/shared/api/scorm.api';

export interface ScormPackageStatusChangedEvent {
  packageId: string;
  status: ScormPackageStatus;
  errorMessage: string | null;
}

/**
 * S'abonne au channel privé `tenant.{tenantId}.scorm.{packageId}` (WebSocket
 * Reverb, voir API.md §22.11) et notifie `onStatusChanged` à chaque event
 * `scorm.status.changed` reçu. Aucun polling : le statut n'est mis à jour que
 * par ce signal temps réel.
 */
export function useScormPackageChannel(
  packageId: string | null | undefined,
  onStatusChanged: (event: ScormPackageStatusChangedEvent) => void,
  onSubscriptionError?: () => void,
): void {
  const tenantId = useTenantStore((state) => state.tenant?.id);
  const simulatedRole = useAuthStore((state) => state.simulatedRole);
  const phase = useSimulationStore((state) => state.phase);
  const blocked = !!simulatedRole || (phase !== 'idle' && phase !== 'ready');

  const statusHandlerRef = useRef(onStatusChanged);
  statusHandlerRef.current = onStatusChanged;
  const errorHandlerRef = useRef(onSubscriptionError);
  errorHandlerRef.current = onSubscriptionError;

  useEffect(() => {
    const isBlocked = () => {
      const currentPhase = useSimulationStore.getState().phase;
      return (
        !!useAuthStore.getState().simulatedRole ||
        (currentPhase !== 'idle' && currentPhase !== 'ready')
      );
    };
    if (blocked || isBlocked()) {
      resetEcho();
      return;
    }
    if (!packageId || !tenantId) return;

    const channelName = `tenant.${tenantId}.scorm.${packageId}`;
    const echo = getEcho();
    const channel = echo.private(channelName);

    const handleStatusChanged = (event: ScormPackageStatusChangedEvent) => {
      if (!isBlocked()) statusHandlerRef.current(event);
    };
    const handleError = () => {
      if (!isBlocked()) errorHandlerRef.current?.();
    };

    channel.listen('.scorm.status.changed', handleStatusChanged);
    channel.error(handleError);

    let stopped = false;
    const stop = () => {
      if (stopped) return;
      stopped = true;
      channel.stopListening('.scorm.status.changed', handleStatusChanged);
      echo.leave(channelName);
    };
    const stopIfBlocked = () => {
      if (isBlocked()) {
        stop();
        resetEcho();
      }
    };
    const unsubscribeAuth = useAuthStore.subscribe(stopIfBlocked);
    const unsubscribeSimulation = useSimulationStore.subscribe(stopIfBlocked);

    return () => {
      unsubscribeAuth();
      unsubscribeSimulation();
      stop();
    };
  }, [packageId, tenantId, blocked]);
}
