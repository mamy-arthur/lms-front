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
  sessionId: string | null;
  setAuth: (user: AuthUser, sessionId?: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      role: null,
      sessionId: null,
      setAuth: (user, sessionId) =>
        set((state) => ({
          user,
          role: user.role,
          // Preserve existing sessionId when updating profile (no new session issued)
          sessionId: sessionId ?? state.sessionId,
        })),
      clearAuth: () => set({ user: null, role: null, sessionId: null }),
    }),
    { name: 'auth-store' },
  ),
);
