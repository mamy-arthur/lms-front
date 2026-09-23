import {
  formatRetryDelay,
  getApiErrorMessage,
  getApiErrorStatus,
  getRetryAfterSeconds,
} from '@/shared/lib/errors';

/**
 * Nature d'un échec de « mot de passe oublié » / « réinitialisation »,
 * indépendante de la langue de l'API. Chaque valeur appelle une réaction
 * distincte : `invalid_token` doit renvoyer vers une nouvelle demande,
 * `invalid_password` doit pointer le champ mot de passe, les autres se
 * contentent d'inviter à réessayer.
 */
export type PasswordResetErrorKind =
  | 'invalid_token'
  | 'invalid_password'
  | 'validation'
  | 'throttled'
  | 'unavailable'
  | 'network'
  | 'unknown';

export interface PasswordResetError {
  kind: PasswordResetErrorKind;
  message: string;
  /** Renseigné quand l'API impose un délai avant nouvelle tentative. */
  retryAfterSeconds?: number;
}

const KIND_BY_ERROR_CODE: Record<string, PasswordResetErrorKind> = {
  'password_reset.invalid_token': 'invalid_token',
  'password_reset.invalid_password': 'invalid_password',
};

const FALLBACK_MESSAGE: Record<PasswordResetErrorKind, string> = {
  invalid_token: 'Ce lien est invalide, a expiré ou a déjà été utilisé.',
  invalid_password: 'Ce mot de passe ne respecte pas la politique de sécurité.',
  validation: 'Veuillez corriger les informations saisies.',
  throttled: 'Trop de demandes. Réessayez dans quelques instants.',
  unavailable: 'Le service est momentanément indisponible. Réessayez dans quelques instants.',
  network: 'Impossible de joindre le serveur. Vérifiez votre connexion, puis réessayez.',
  unknown: 'Une erreur est survenue. Veuillez réessayer.',
};

/**
 * Traduit une erreur du apiClient en une nature exploitable par l'interface.
 *
 * Discrimine en priorité sur `error_code`, stable et indépendant de la locale ;
 * le statut ne suffit pas ici puisque jeton invalide, mot de passe non conforme
 * et erreur de validation partagent tous le 422.
 */
export function mapPasswordResetError(err: unknown): PasswordResetError {
  const kind = resolveKind(err);
  const retryAfterSeconds = getRetryAfterSeconds(err);

  return {
    kind,
    message: buildMessage(err, kind, retryAfterSeconds),
    ...(retryAfterSeconds !== undefined ? { retryAfterSeconds } : {}),
  };
}

function resolveKind(err: unknown): PasswordResetErrorKind {
  const errorCode = readJsonObject(err)?.error_code;

  if (typeof errorCode === 'string' && errorCode in KIND_BY_ERROR_CODE) {
    return KIND_BY_ERROR_CODE[errorCode];
  }

  const status = getApiErrorStatus(err);

  // Aucune réponse reçue : la demande n'a jamais atteint le serveur.
  if (status === undefined) return 'network';

  if (status === 429) return 'throttled';
  if (status >= 500) return 'unavailable';
  if (status === 422) return 'validation';

  return 'unknown';
}

function buildMessage(
  err: unknown,
  kind: PasswordResetErrorKind,
  retryAfterSeconds: number | undefined,
): string {
  if (kind === 'throttled' && retryAfterSeconds !== undefined) {
    return `Trop de demandes. Réessayez dans ${formatRetryDelay(retryAfterSeconds)}.`;
  }

  // Sur une panne réseau ou serveur, le corps de la réponse n'apporte rien
  // d'exploitable : on impose le message métier.
  if (kind === 'network' || kind === 'unavailable') return FALLBACK_MESSAGE[kind];

  return getApiErrorMessage(err, FALLBACK_MESSAGE[kind]);
}

function readJsonObject(err: unknown): Record<string, unknown> | undefined {
  if (!err || typeof err !== 'object') return undefined;
  const json = (err as { json?: unknown }).json;

  return json && typeof json === 'object' ? (json as Record<string, unknown>) : undefined;
}
