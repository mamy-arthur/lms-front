import { AuthProvider } from "react-admin";
import { apiPost } from "@/shared/lib/apiClient";
import { useAuthStore } from "@/shared/stores/auth.store";
import { Role } from "@/shared/constants/roles";
import { AuthUser } from "@/shared/types/auth.types";

interface LoginResponse {
  token: string;
  user: AuthUser;
}

export const authProvider: AuthProvider = {
  login: async ({ username, password }) => {
    const data = await apiPost<LoginResponse>("auth/login", {
      email: username,
      password,
    });
    useAuthStore.getState().setAuth({ token: data.token, user: data.user });
  },

  logout: async () => {
    useAuthStore.getState().clearAuth();
  },

  checkAuth: async () => {
    const token = useAuthStore.getState().token;
    if (!token) throw new Error("Not authenticated");
  },

  checkError: async ({ status }) => {
    if (status === 401 || status === 403) {
      useAuthStore.getState().clearAuth();
      throw new Error("Session expirée");
    }
  },

  getPermissions: async () => {
    const { role } = useAuthStore.getState();
    if (!role) return null;
    return { role, isSuperAdmin: role === Role.SUPER_ADMIN };
  },

  getIdentity: async () => {
    const { user } = useAuthStore.getState();
    if (!user) throw new Error("No user");
    return {
      id: user.id,
      fullName: user.name,
      avatar: user.avatar,
    };
  },
};
