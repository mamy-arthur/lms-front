'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/shared/stores/auth.store';
import { queryClient } from '@/shared/lib/query-client';
import { resolveLoginPath } from '@/shared/lib/apiClient';
import { useEcho } from '@/shared/providers/EchoProvider';

/**
 * Subscribes to the private session channel and reacts to SessionRevoked events.
 * Must be used inside a component rendered within EchoProvider.
 *
 * Sessions created before the sessionId feature was deployed have sessionId = null.
 * Those sessions fall back to the 401 mechanism in apiClient.ts.
 *
 * On receiving SessionRevoked with reason NEW_LOGIN:
 * 1. Disconnects Echo
 * 2. Clears Zustand auth store
 * 3. Clears TanStack Query cache (no stale data from revoked account)
 * 4. Sets a one-shot sessionStorage key for the login page to show a message
 * 5. Redirects to the contextual login page
 */
export function useSessionRevocation() {
  const echo = useEcho();
  const router = useRouter();
  const pathname = usePathname();
  const sessionId = useAuthStore((s) => s.sessionId);

  useEffect(() => {
    if (!echo || !sessionId) return;

    const channel = echo.private(`session.${sessionId}`);

    channel.listen('.SessionRevoked', (event: { reason: string }) => {
      if (event.reason !== 'NEW_LOGIN') return;

      echo.disconnect();
      useAuthStore.getState().clearAuth();
      queryClient.clear();
      sessionStorage.setItem('revocation_reason', 'NEW_LOGIN');
      router.replace(resolveLoginPath(pathname ?? '/'));
    });

    return () => {
      channel.stopListening('.SessionRevoked');
      echo.leave(`session.${sessionId}`);
    };
  }, [echo, sessionId, router, pathname]);
}
