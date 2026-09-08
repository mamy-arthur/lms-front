'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/shared/stores/auth.store';
import { queryClient } from '@/shared/lib/query-client';
import { resolveLoginPath } from '@/shared/lib/apiClient';
import { useSessionRevocation } from '@/shared/hooks/useSessionRevocation';
import { useSessionRevalidation } from '@/shared/hooks/useSessionRevalidation';

/**
 * Thin client wrapper that runs useSessionRevocation inside a server layout.
 * Also handles legacy sessions (logged in before sessionId was introduced):
 * if the user has a user but no sessionId, we force re-auth so the next login
 * stores a sessionId and enables real-time revocation.
 */
export function SessionRevocationListener() {
  useSessionRevocation();
  useSessionRevalidation();

  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const sessionId = useAuthStore((s) => s.sessionId);

  useEffect(() => {
    // Legacy session: user is logged in but session predates sessionId tracking.
    // Force re-auth so the next login stores a sessionId and enables WebSocket revocation.
    if (user !== null && sessionId === null) {
      useAuthStore.getState().clearAuth();
      queryClient.clear();
      router.replace(resolveLoginPath(pathname ?? '/'));
    }
  }, [user, sessionId, router, pathname]);

  return null;
}
