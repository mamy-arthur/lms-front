import type { Role } from '@/shared/constants/roles';
import { apiGet, apiPost } from '@/shared/lib/apiClient';
import type { AuthUser } from '@/shared/types/auth.types';

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
  /**
   * Durée de confiance accordée à l'appareil, en jours. Absent des backends
   * antérieurs : l'interface tait alors la durée plutôt que d'en inventer une.
   */
  trusted_device_days?: number;
}

export interface TwoFactorChallengePayload {
  challenge_token: string;
  code: string;
  trust_device?: boolean;
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

/** Même forme que la réinitialisation, mais le jeton provient du mail de bienvenue. */
export type ActivateAccountPayload = ResetPasswordPayload;

export interface ExistingSessionInfo {
  deviceName: string | null;
  browser: string | null;
  lastActivityAt: string;
}

/**
 * Issue de tout appel qui tente d'ouvrir une session : le backend la refuse (409)
 * tant qu'une autre session est active, et fournit alors un jeton de remplacement.
 */
export type SessionResult =
  | { outcome: 'authenticated'; user: AuthUser; sessionId: string }
  | {
      outcome: 'session_conflict';
      existingSession: ExistingSessionInfo;
      replacementToken: string;
    };

/**
 * Le login ajoute un troisième cas : le mot de passe est valide mais le 2FA exige
 * un code avant qu'une session soit ouverte.
 */
export type LoginResult =
  SessionResult | { outcome: 'two_factor_required'; challenge: TwoFactorChallenge };

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

function toAuthenticated(res: LoginSuccessApiResponse): SessionResult {
  return {
    outcome: 'authenticated',
    user: toAuthUser(res.user),
    sessionId: res.session_id,
  };
}

/** Convertit le 409 SESSION_ALREADY_ACTIVE en résultat métier ; toute autre erreur remonte. */
async function withSessionConflict<T>(request: () => Promise<T>): Promise<T | SessionResult> {
  try {
    return await request();
  } catch (err) {
    if (!isApiError(err) || err.status !== 409) throw err;

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
}

function performLogin(endpoint: string, email: string, password: string): Promise<LoginResult> {
  return withSessionConflict<LoginResult>(async () => {
    const res = await apiPost<LoginSuccessApiResponse | TwoFactorChallenge>(endpoint, {
      email,
      password,
    });

    return 'two_factor_required' in res
      ? { outcome: 'two_factor_required', challenge: res }
      : toAuthenticated(res);
  });
}

function performTwoFactorChallenge(
  endpoint: string,
  payload: TwoFactorChallengePayload,
): Promise<SessionResult> {
  return withSessionConflict<SessionResult>(async () =>
    toAuthenticated(await apiPost<LoginSuccessApiResponse>(endpoint, payload)),
  );
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

  /** Valide le code OTP et délivre la session. */
  twoFactorChallenge: (payload: TwoFactorChallengePayload): Promise<SessionResult> =>
    performTwoFactorChallenge('auth/two-factor-challenge', payload),

  /** Réémet un code pour le même challenge ; le challenge_token reste identique. */
  twoFactorResend: (challengeToken: string): Promise<TwoFactorChallenge> =>
    apiPost<TwoFactorChallenge>('auth/two-factor-resend', {
      challenge_token: challengeToken,
    }),

  logout: (): Promise<MessageApiResponse> => apiPost<MessageApiResponse>('auth/logout'),

  me: (): Promise<{ user: AuthUser; sessionId: string | null }> => performMe('auth/me'),

  forgotPassword: (email: string): Promise<MessageApiResponse> =>
    apiPost<MessageApiResponse>('auth/forgot-password', { email }),

  resetPassword: (payload: ResetPasswordPayload): Promise<MessageApiResponse> =>
    apiPost<MessageApiResponse>('auth/reset-password', payload),

  /** Consomme le jeton d'activation : définit le mot de passe et active le compte. */
  activateAccount: (payload: ActivateAccountPayload): Promise<MessageApiResponse> =>
    apiPost<MessageApiResponse>('auth/activate-account', payload),

  replaceSession: (replacementToken: string): Promise<{ user: AuthUser; sessionId: string }> =>
    performReplacement('auth/session/replace', replacementToken),

  platformLogin: (email: string, password: string): Promise<LoginResult> =>
    performLogin('platform/auth/login', email, password),

  platformTwoFactorChallenge: (payload: TwoFactorChallengePayload): Promise<SessionResult> =>
    performTwoFactorChallenge('platform/auth/two-factor-challenge', payload),

  platformTwoFactorResend: (challengeToken: string): Promise<TwoFactorChallenge> =>
    apiPost<TwoFactorChallenge>('platform/auth/two-factor-resend', {
      challenge_token: challengeToken,
    }),

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
