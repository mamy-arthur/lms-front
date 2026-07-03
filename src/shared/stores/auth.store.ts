import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@/shared/types/auth.types';
import { Role } from '@/shared/constants/roles';

/**
 * État d'authentification côté client.
 *
 * Le token JWT est géré exclusivement via cookie HttpOnly posé par le backend.
 * Aucun token n'est stocké ici — le store ne conserve que les informations
 * utilisateur nécessaires au rendu (rôle, identité).
 */
interface AuthState {
  user: AuthUser | null;
  role: Role | null;
  setAuth: (user: AuthUser) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      role: null,
      setAuth: (user) => set({ user, role: user.role }),
      clearAuth: () => set({ user: null, role: null }),
    }),
    { name: 'auth-store' },
  ),
);
