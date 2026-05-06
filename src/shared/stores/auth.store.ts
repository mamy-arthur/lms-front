import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Role } from "@/shared/constants/roles";
import { AuthUser } from "@/shared/types/auth.types";

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  role: Role | null;
  setAuth: (data: { token: string; user: AuthUser }) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      role: null,
      setAuth: ({ token, user }) => {
        if (typeof document !== "undefined") {
          document.cookie = `auth-token=${token}; path=/; SameSite=Lax`;
        }
        set({ token, user, role: user.role });
      },
      clearAuth: () => {
        if (typeof document !== "undefined") {
          document.cookie = "auth-token=; path=/; max-age=0";
        }
        set({ token: null, user: null, role: null });
      },
    }),
    { name: "auth-store" }
  )
);

export function getToken(): string | null {
  return useAuthStore.getState().token;
}
