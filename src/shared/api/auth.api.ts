import { apiPost } from '@/shared/lib/apiClient';
import type { AuthUser } from '@/shared/types/auth.types';
import { Role } from '@/shared/constants/roles';

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
  profile_photo: { id: string; url: string; mime_type: string } | null;
  email_verified_at: string | null;
  created_at: string;
}

interface LoginApiResponse {
  message: string;
  user: BackendUser;
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
    avatar: raw.profile_photo?.url ?? null,
  };
}

export const authApi = {
  login: async (email: string, password: string): Promise<{ user: AuthUser }> => {
    const res = await apiPost<LoginApiResponse>('auth/login', {
      email,
      password,
    });
    return { user: toAuthUser(res.user) };
  },

  logout: (): Promise<MessageApiResponse> => apiPost<MessageApiResponse>('auth/logout'),

  forgotPassword: (email: string): Promise<MessageApiResponse> =>
    apiPost<MessageApiResponse>('auth/forgot-password', { email }),

  resetPassword: (payload: ResetPasswordPayload): Promise<MessageApiResponse> =>
    apiPost<MessageApiResponse>('auth/reset-password', payload),

  platformLogin: async (email: string, password: string): Promise<{ user: AuthUser }> => {
    const res = await apiPost<LoginApiResponse>('platform/auth/login', {
      email,
      password,
    });
    return { user: toAuthUser(res.user) };
  },

  platformLogout: (): Promise<MessageApiResponse> =>
    apiPost<MessageApiResponse>('platform/auth/logout'),

  platformForgotPassword: (email: string): Promise<MessageApiResponse> =>
    apiPost<MessageApiResponse>('platform/auth/forgot-password', { email }),

  platformResetPassword: (payload: ResetPasswordPayload): Promise<MessageApiResponse> =>
    apiPost<MessageApiResponse>('platform/auth/reset-password', payload),
};
