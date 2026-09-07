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

/** Challenge émis par l'API quand le 2FA est actif et qu'aucun appareil de confiance n'est présenté. */
export interface TwoFactorChallenge {
  two_factor_required: true;
  challenge_token: string;
  /** Durée de validité du code, en secondes. */
  expires_in: number;
  /** Nombre de chiffres attendus, configurable de 6 à 10 côté backend. */
  code_length: number;
  /** Délai avant qu'un renvoi soit accepté, décompté depuis le dernier envoi. */
  resend_cooldown_seconds: number;
}

/**
 * Le login répond soit par une session, soit par un challenge 2FA : les deux cas
 * doivent être distingués avant toute lecture de `user`.
 */
export type LoginOutcome =
  { kind: 'session'; user: AuthUser } | { kind: 'challenge'; challenge: TwoFactorChallenge };

export interface TwoFactorChallengePayload {
  challenge_token: string;
  code: string;
  trust_device?: boolean;
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

function toLoginOutcome(res: LoginApiResponse | TwoFactorChallenge): LoginOutcome {
  return (res as TwoFactorChallenge).two_factor_required === true
    ? { kind: 'challenge', challenge: res as TwoFactorChallenge }
    : { kind: 'session', user: toAuthUser((res as LoginApiResponse).user) };
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginOutcome> => {
    const res = await apiPost<LoginApiResponse | TwoFactorChallenge>('auth/login', {
      email,
      password,
    });
    return toLoginOutcome(res);
  },

  /** Valide le code OTP et délivre la session. */
  twoFactorChallenge: async (payload: TwoFactorChallengePayload): Promise<{ user: AuthUser }> => {
    const res = await apiPost<LoginApiResponse>('auth/two-factor-challenge', payload);
    return { user: toAuthUser(res.user) };
  },

  /** Réémet un code pour le même challenge ; le challenge_token reste identique. */
  twoFactorResend: (challengeToken: string): Promise<TwoFactorChallenge> =>
    apiPost<TwoFactorChallenge>('auth/two-factor-resend', {
      challenge_token: challengeToken,
    }),

  logout: (): Promise<MessageApiResponse> => apiPost<MessageApiResponse>('auth/logout'),

  forgotPassword: (email: string): Promise<MessageApiResponse> =>
    apiPost<MessageApiResponse>('auth/forgot-password', { email }),

  resetPassword: (payload: ResetPasswordPayload): Promise<MessageApiResponse> =>
    apiPost<MessageApiResponse>('auth/reset-password', payload),

  platformLogin: async (email: string, password: string): Promise<LoginOutcome> => {
    const res = await apiPost<LoginApiResponse | TwoFactorChallenge>('platform/auth/login', {
      email,
      password,
    });
    return toLoginOutcome(res);
  },

  platformTwoFactorChallenge: async (
    payload: TwoFactorChallengePayload,
  ): Promise<{ user: AuthUser }> => {
    const res = await apiPost<LoginApiResponse>('platform/auth/two-factor-challenge', payload);
    return { user: toAuthUser(res.user) };
  },

  platformTwoFactorResend: (challengeToken: string): Promise<TwoFactorChallenge> =>
    apiPost<TwoFactorChallenge>('platform/auth/two-factor-resend', {
      challenge_token: challengeToken,
    }),

  platformLogout: (): Promise<MessageApiResponse> =>
    apiPost<MessageApiResponse>('platform/auth/logout'),

  platformForgotPassword: (email: string): Promise<MessageApiResponse> =>
    apiPost<MessageApiResponse>('platform/auth/forgot-password', { email }),

  platformResetPassword: (payload: ResetPasswordPayload): Promise<MessageApiResponse> =>
    apiPost<MessageApiResponse>('platform/auth/reset-password', payload),
};
