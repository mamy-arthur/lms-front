'use client';

import { useEffect } from 'react';
import { authApi } from '@/shared/api/auth.api';
import { PLATFORM_ROLES } from '@/shared/constants/roles';
import { useAuthStore } from '@/shared/stores/auth.store';

/**
 * Revalidates the persisted session against the backend.
 *
 * SessionRevoked only reaches tabs that are open when it is broadcast: Reverb
 * never replays events, so a browser closed at that moment reopens with a
 * persisted store and a stale cookie, looking signed in until its first API
 * call. This closes that window by probing /auth/me on mount and whenever the
 * tab regains focus — httpClient already clears the store and redirects on 401.
 */
export function useSessionRevalidation() {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);

  useEffect(() => {
    if (user === null || role === null) return;

    const probe = () => {
      const revalidate = PLATFORM_ROLES.includes(role) ? authApi.platformMe : authApi.me;

      // A rejected probe is already handled by httpClient (401 -> clearAuth +
      // redirect); any other failure must not disrupt a working session.
      void revalidate().catch(() => undefined);
    };

    probe();

    const onVisible = () => {
      if (document.visibilityState === 'visible') probe();
    };

    document.addEventListener('visibilitychange', onVisible);

    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [user, role]);
}
