import { getApiErrorMessage } from '@/shared/lib/errors';
import {
  mapPasswordResetError,
  type PasswordResetError,
} from '@/modules/auth/lib/passwordResetErrors';

const INVALID_TOKEN_MESSAGE = "Ce lien d'activation est invalide, a expiré ou a déjà été utilisé.";

/**
 * Traduit une erreur de `POST auth/activate-account`.
 *
 * Contrairement aux endpoints de réinitialisation, celui-ci n'expose pas
 * d'`error_code` : un jeton refusé se reconnaît à la présence d'une erreur de
 * validation sur le champ `token`. Tout le reste suit la même classification
 * que la réinitialisation.
 */
export function mapActivateAccountError(err: unknown): PasswordResetError {
  if (!hasTokenError(err)) return mapPasswordResetError(err);

  return {
    kind: 'invalid_token',
    message: getApiErrorMessage(err, INVALID_TOKEN_MESSAGE),
  };
}

function hasTokenError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;

  const json = (err as { json?: unknown }).json;
  if (!json || typeof json !== 'object') return false;

  const errors = (json as { errors?: unknown }).errors;
  if (!errors || typeof errors !== 'object') return false;

  const tokenErrors = (errors as Record<string, unknown>).token;

  return Array.isArray(tokenErrors) && tokenErrors.length > 0;
}
