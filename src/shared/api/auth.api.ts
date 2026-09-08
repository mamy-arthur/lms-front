import { apiGet, apiPost } from '@/shared/lib/apiClient';
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

interface LoginSuccessApiResponse {
  message: string;
  user: BackendUser;
  session_id: string;
}

interface TwoFactorApiResponse {
  two_factor_required: true;
  challenge_token: string;
  expires_in: number;
}

interface SessionConflictApiResponse {
  code: 'SESSION_ALREADY_ACTIVE';
  message: string;
  replacement_token: string;
  active_session: {
    device_name: string | null;
    browser: string | null;
    last_activity_at: string;
  };
}

interface MessageApiResponse {
  message: string;
}

interface MeApiResponse {
  user: BackendUser;
  session_id: string | null;
}

export interface ResetPasswordPayload {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}

export interface ExistingSessionInfo {
  deviceName: string | null;
  browser: string | null;
  lastActivityAt: string;
}

export type LoginResult =
  | { outcome: 'authenticated'; user: AuthUser; sessionId: string }
  | { outcome: 'two_factor_required'; challengeToken: string; expiresIn: number }
  | { outcome: 'session_conflict'; existingSession: ExistingSessionInfo; replacementToken: string };

function toAuthUser(raw: BackendUser): AuthUser {
  return {
    id: raw.id,
    name: raw.full_name,
    email: raw.email,
    role: raw.role,
    avatar: raw.profile_photo?.url ?? null,
  };
}

function isApiError(err: unknown): err is { status: number; json: unknown } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    typeof (err as Record<string, unknown>).status === 'number'
  );
}

async function performLogin(
  endpoint: string,
  email: string,
  password: string,
): Promise<LoginResult> {
  try {
    const res = await apiPost<LoginSuccessApiResponse | TwoFactorApiResponse>(endpoint, {
      email,
      password,
    });
    if ('two_factor_required' in res) {
      return {
        outcome: 'two_factor_required',
        challengeToken: res.challenge_token,
        expiresIn: res.expires_in,
      };
    }
    const r = res as LoginSuccessApiResponse;
    return { outcome: 'authenticated', user: toAuthUser(r.user), sessionId: r.session_id };
  } catch (err) {
    if (isApiError(err) && err.status === 409) {
      const body = err.json as SessionConflictApiResponse;
      return {
        outcome: 'session_conflict',
        existingSession: {
          deviceName: body.active_session.device_name,
          browser: body.active_session.browser,
          lastActivityAt: body.active_session.last_activity_at,
        },
        replacementToken: body.replacement_token,
      };
    }
    throw err;
  }
}

async function performReplacement(
  endpoint: string,
  replacementToken: string,
): Promise<{ user: AuthUser; sessionId: string }> {
  const res = await apiPost<LoginSuccessApiResponse>(endpoint, {
    replacement_token: replacementToken,
  });
  return { user: toAuthUser(res.user), sessionId: res.session_id };
}

async function performMe(endpoint: string): Promise<{ user: AuthUser; sessionId: string | null }> {
  const res = await apiGet<MeApiResponse>(endpoint);
  return { user: toAuthUser(res.user), sessionId: res.session_id };
}

export const authApi = {
  login: (email: string, password: string): Promise<LoginResult> =>
    performLogin('auth/login', email, password),

  logout: (): Promise<MessageApiResponse> => apiPost<MessageApiResponse>('auth/logout'),

  me: (): Promise<{ user: AuthUser; sessionId: string | null }> => performMe('auth/me'),

  forgotPassword: (email: string): Promise<MessageApiResponse> =>
    apiPost<MessageApiResponse>('auth/forgot-password', { email }),

  resetPassword: (payload: ResetPasswordPayload): Promise<MessageApiResponse> =>
    apiPost<MessageApiResponse>('auth/reset-password', payload),

  replaceSession: (replacementToken: string): Promise<{ user: AuthUser; sessionId: string }> =>
    performReplacement('auth/session/replace', replacementToken),

  platformLogin: (email: string, password: string): Promise<LoginResult> =>
    performLogin('platform/auth/login', email, password),

  platformLogout: (): Promise<MessageApiResponse> =>
    apiPost<MessageApiResponse>('platform/auth/logout'),

  platformMe: (): Promise<{ user: AuthUser; sessionId: string | null }> =>
    performMe('platform/auth/me'),

  platformForgotPassword: (email: string): Promise<MessageApiResponse> =>
    apiPost<MessageApiResponse>('platform/auth/forgot-password', { email }),

  platformResetPassword: (payload: ResetPasswordPayload): Promise<MessageApiResponse> =>
    apiPost<MessageApiResponse>('platform/auth/reset-password', payload),

  platformReplaceSession: (
    replacementToken: string,
  ): Promise<{ user: AuthUser; sessionId: string }> =>
    performReplacement('platform/auth/session/replace', replacementToken),
};
