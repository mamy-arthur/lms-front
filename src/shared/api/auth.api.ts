import { apiPost } from "@/shared/lib/apiClient";
import type { AuthUser } from "@/shared/types/auth.types";
import { Role } from "@/shared/constants/roles";

interface BackendUser {
  id: string;
  tenant_id: string | null;
  editor_id: string | null;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  role: Role;
  is_active: boolean;
  email_verified_at: string | null;
  created_at: string;
}

interface LoginApiResponse {
  message: string;
  user: BackendUser;
  token: string;
  token_type: "Bearer";
}

interface MessageApiResponse {
  message: string;
}

export interface ResetPasswordPayload {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}

function toAuthUser(raw: BackendUser): AuthUser {
  return {
    id: raw.id,
    name: raw.full_name,
    email: raw.email,
    role: raw.role,
  };
}

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await apiPost<LoginApiResponse>("auth/login", { email, password });
    return { token: res.token, user: toAuthUser(res.user) };
  },

  logout: () => apiPost<MessageApiResponse>("auth/logout"),

  forgotPassword: (email: string) =>
    apiPost<MessageApiResponse>("auth/forgot-password", { email }),

  resetPassword: (payload: ResetPasswordPayload) =>
    apiPost<MessageApiResponse>("auth/reset-password", payload),

  platformLogin: async (email: string, password: string) => {
    const res = await apiPost<LoginApiResponse>("platform/auth/login", { email, password });
    return { token: res.token, user: toAuthUser(res.user) };
  },

  platformLogout: () => apiPost<MessageApiResponse>("platform/auth/logout"),

  platformForgotPassword: (email: string) =>
    apiPost<MessageApiResponse>("platform/auth/forgot-password", { email }),

  platformResetPassword: (payload: ResetPasswordPayload) =>
    apiPost<MessageApiResponse>("platform/auth/reset-password", payload),
};
