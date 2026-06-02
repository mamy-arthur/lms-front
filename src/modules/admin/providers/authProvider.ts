import { AuthProvider } from "react-admin";
import { authApi } from "@/shared/api/auth.api";
import { useAuthStore } from "@/shared/stores/auth.store";
import { Role, PLATFORM_ROLES } from "@/shared/constants/roles";

export const authProvider: AuthProvider = {
  login: async ({ username, password }) => {
    const data = await authApi.platformLogin(username, password);
    useAuthStore.getState().setAuth(data.user);
  },

  logout: async () => {
    try {
      await authApi.platformLogout();
    } catch {
      // Token already expired — clear locally regardless
    }
    useAuthStore.getState().clearAuth();
  },

  checkAuth: async () => {
    const { user, role } = useAuthStore.getState();
    if (!user || !role || !PLATFORM_ROLES.includes(role)) {
      throw new Error("Not authenticated");
    }
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
