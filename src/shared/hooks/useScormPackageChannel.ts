'use client';

import { useEffect, useRef } from 'react';
import { getEcho } from '@/shared/lib/echo';
import { useTenantStore } from '@/shared/stores/tenant.store';
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

  const statusHandlerRef = useRef(onStatusChanged);
  statusHandlerRef.current = onStatusChanged;
  const errorHandlerRef = useRef(onSubscriptionError);
  errorHandlerRef.current = onSubscriptionError;

  useEffect(() => {
    if (!packageId || !tenantId) return;

    const channelName = `tenant.${tenantId}.scorm.${packageId}`;
    const echo = getEcho();
    const channel = echo.private(channelName);

    const handleStatusChanged = (event: ScormPackageStatusChangedEvent) =>
      statusHandlerRef.current(event);
    const handleError = () => errorHandlerRef.current?.();

    channel.listen('.scorm.status.changed', handleStatusChanged);
    channel.error(handleError);

    return () => {
      channel.stopListening('.scorm.status.changed', handleStatusChanged);
      echo.leave(channelName);
    };
  }, [packageId, tenantId]);
}
