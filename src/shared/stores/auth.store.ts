import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@/shared/types/auth.types';
import { Role } from '@/shared/constants/roles';

/**
 * État d'authentification côté client.
 *
 * Le token Sanctum est géré exclusivement via cookie HttpOnly posé par le backend.
 * sessionId est l'UUID public de la session, nécessaire à l'abonnement WebSocket.
 */
interface AuthState {
  user: AuthUser | null;
  role: Role | null;
  /** Presentation only: user and sessionId always identify the real account. */
  simulatedRole: Role | null;
  sessionId: string | null;
  setSimulatedRole: (role: Role | null) => void;
  setAuth: (user: AuthUser, sessionId?: string) => void;
  clearAuth: () => void;
}

/**
 * Identifies the real authenticated session (account + session UUID), or null
 * when logged out. A simulation check started for one identity must be
 * dropped once it changes (see synchronizeSimulation).
 */
export const selectSessionIdentity = (
  state: Pick<AuthState, 'user' | 'sessionId'>,
): string | null => (state.user ? JSON.stringify([state.user.id, state.sessionId]) : null);

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      role: null,
      simulatedRole: null,
      sessionId: null,
      setSimulatedRole: (simulatedRole) =>
        set((state) => ({ simulatedRole, role: simulatedRole ?? state.user?.role ?? null })),
      setAuth: (user, sessionId) =>
        set((state) => {
          // Preserve existing sessionId when updating profile (no new session issued)
          const nextSessionId = sessionId ?? state.sessionId;
          const sameSession = state.user?.id === user.id && nextSessionId === state.sessionId;
          // A refresh of the same session during a simulation must not replace the
          // simulated presentation (role) nor the real profile with fictional data.
          if (state.simulatedRole && sameSession) return state;
          // Another account or a new session never inherits a simulation: it is
          // token-scoped server-side, and SimulationProvider resynchronizes on
          // the identity change (see selectSessionIdentity).
          return { user, role: user.role, sessionId: nextSessionId, simulatedRole: null };
        }),
      clearAuth: () => set({ user: null, role: null, sessionId: null, simulatedRole: null }),
    }),
    {
      name: 'auth-store',
      // Never persist a simulated identity/role as the next real login.
      partialize: (state) => ({
        user: state.user,
        role: state.user?.role ?? null,
        sessionId: state.sessionId,
      }),
    },
  ),
);
