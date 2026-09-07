import { getApiErrorMessage } from '@/shared/lib/errors';

/**
 * Nature d'une erreur 2FA, indépendante de la langue de l'API.
 * Chaque valeur appelle une réaction distincte de l'interface.
 */
export type TwoFactorErrorKind =
  | 'invalid_code'
  | 'invalid_challenge'
  | 'expired'
  | 'locked'
  | 'resend_cooldown'
  | 'account_locked'
  | 'throttled'
  | 'unknown';

export interface TwoFactorError {
  kind: TwoFactorErrorKind;
  message: string;
  /** Renseigné quand l'API impose un délai avant nouvelle tentative. */
  retryAfterSeconds?: number;
}

const KIND_BY_ERROR_CODE: Record<string, TwoFactorErrorKind> = {
  'two_factor.invalid_code': 'invalid_code',
  'two_factor.invalid_challenge': 'invalid_challenge',
  'two_factor.expired': 'expired',
  'two_factor.locked': 'locked',
  'two_factor.resend_cooldown': 'resend_cooldown',
  'two_factor.account_locked': 'account_locked',
};

const FALLBACK_MESSAGE: Record<TwoFactorErrorKind, string> = {
  invalid_code: 'Le code saisi est incorrect.',
  invalid_challenge: 'Cette vérification n’est plus valide. Reprenez la connexion.',
  expired: 'Ce code a expiré. Demandez-en un nouveau.',
  locked: 'Trop de tentatives sur ce code. Demandez-en un nouveau.',
  resend_cooldown: 'Veuillez patienter avant de demander un nouveau code.',
  account_locked: 'Votre compte est bloqué après trop de tentatives. Contactez un administrateur.',
  throttled: 'Trop de requêtes. Réessayez dans un instant.',
  unknown: 'Une erreur est survenue. Veuillez réessayer.',
};

/**
 * Traduit une erreur du apiClient en une nature exploitable par l'interface.
 *
 * Discrimine en priorité sur `error_code`, stable et indépendant de la locale.
 * Le repli structurel (statut + forme du corps) couvre les backends antérieurs
 * à l'introduction de ce champ.
 */
export function mapTwoFactorError(err: unknown): TwoFactorError {
  const retryAfterSeconds = readRetryAfter(err);
  const kind = resolveKind(err);

  return {
    kind,
    message: getApiErrorMessage(err, FALLBACK_MESSAGE[kind]),
    ...(retryAfterSeconds !== undefined ? { retryAfterSeconds } : {}),
  };
}

function resolveKind(err: unknown): TwoFactorErrorKind {
  const body = readJsonObject(err);
  const errorCode = body?.error_code;

  if (typeof errorCode === 'string' && errorCode in KIND_BY_ERROR_CODE) {
    return KIND_BY_ERROR_CODE[errorCode];
  }

  const status = readStatus(err);

  if (status === 423) return 'account_locked';

  if (status === 429) {
    // Les limiteurs de débit du framework ne portent pas d'error_code ; seul le
    // cooldown applicatif expose un Retry-After.
    return readRetryAfter(err) !== undefined ? 'resend_cooldown' : 'throttled';
  }

  if (status === 422) {
    return hasCodeFieldError(body) ? 'invalid_code' : 'expired';
  }

  return 'unknown';
}

function readStatus(err: unknown): number | undefined {
  if (!err || typeof err !== 'object') return undefined;
  const status = (err as { status?: unknown }).status;

  return typeof status === 'number' ? status : undefined;
}

function readJsonObject(err: unknown): Record<string, unknown> | undefined {
  if (!err || typeof err !== 'object') return undefined;
  const json = (err as { json?: unknown }).json;

  return json && typeof json === 'object' ? (json as Record<string, unknown>) : undefined;
}

function hasCodeFieldError(body: Record<string, unknown> | undefined): boolean {
  const errors = body?.errors;
  if (!errors || typeof errors !== 'object') return false;

  return 'code' in (errors as Record<string, unknown>);
}

function readRetryAfter(err: unknown): number | undefined {
  if (!err || typeof err !== 'object') return undefined;
  const headers = (err as { headers?: unknown }).headers;

  if (!headers || typeof (headers as Headers).get !== 'function') return undefined;

  const raw = (headers as Headers).get('Retry-After');
  if (raw === null) return undefined;

  const seconds = Number.parseInt(raw, 10);

  return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined;
}
