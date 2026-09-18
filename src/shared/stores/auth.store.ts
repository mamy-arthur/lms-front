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
        set((state) =>
          state.simulatedRole
            ? state
            : {
                user,
                role: user.role,
                // Preserve existing sessionId when updating profile (no new session issued)
                sessionId: sessionId ?? state.sessionId,
              },
        ),
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
