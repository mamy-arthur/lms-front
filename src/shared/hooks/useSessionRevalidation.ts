'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { authApi } from '@/shared/api/auth.api';
import { PLATFORM_ROLES } from '@/shared/constants/roles';
import { resolveLoginPath } from '@/shared/lib/apiClient';
import { resetEcho } from '@/shared/lib/echo';
import { queryClient } from '@/shared/lib/query-client';
import { useAuthStore } from '@/shared/stores/auth.store';

/** Un alt-tab ne doit pas valoir une requête : la session ne change quasiment jamais. */
const MIN_PROBE_INTERVAL_MS = 60_000;

/**
 * Revalidates the persisted session against the backend.
 *
 * SessionRevoked only reaches tabs that are open when it is broadcast: Reverb
 * never replays events, so a browser closed at that moment reopens with a
 * persisted store and a stale cookie, looking signed in until its first API
 * call. This closes that window by probing /auth/me on mount and whenever the
 * tab regains focus — httpClient already clears the store and redirects on 401.
 *
 * La sonde tranche aussi le cas des sessions sans sessionId local : si le serveur
 * en renvoie un, on le rapatrie ; seule une réponse `null` signale une session
 * antérieure au suivi des sessions, qui impose alors une reconnexion.
 */
export function useSessionRevalidation() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const lastProbeAt = useRef(0);

  useEffect(() => {
    if (user === null || role === null) return;

    const probe = () => {
      const now = Date.now();
      if (now - lastProbeAt.current < MIN_PROBE_INTERVAL_MS) return;
      lastProbeAt.current = now;

      const revalidate = PLATFORM_ROLES.includes(role) ? authApi.platformMe : authApi.me;

      // A rejected probe is already handled by httpClient (401 -> clearAuth +
      // redirect); any other failure must not disrupt a working session.
      void revalidate()
        .then((session) => {
          if (useAuthStore.getState().user === null) return;

          if (session.sessionId !== null) {
            if (useAuthStore.getState().sessionId === null) {
              useAuthStore.getState().setAuth(session.user, session.sessionId);
            }

            return;
          }

          // Sans sessionId côté serveur, aucune révocation temps réel n'est
          // possible : on force une reconnexion pour en obtenir un.
          resetEcho();
          useAuthStore.getState().clearAuth();
          queryClient.clear();
          router.replace(resolveLoginPath(pathname ?? '/'));
        })
        .catch(() => undefined);
    };

    probe();

    const onVisible = () => {
      if (document.visibilityState === 'visible') probe();
    };

    document.addEventListener('visibilitychange', onVisible);

    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [user, role, router, pathname]);
}
