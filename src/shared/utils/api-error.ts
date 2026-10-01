import { getApiErrorStatus } from '@/shared/lib/errors';

/**
 * Le backend refuse la gestion d'un utilisateur dont le rôle n'est pas strictement
 * inférieur à celui du demandeur, y compris un pair que celui-ci a pu créer.
 */
export const PEER_MANAGEMENT_REFUSED =
  'Vous ne pouvez pas gérer un utilisateur dont le rôle est équivalent ou supérieur au vôtre.';

/** Message d'un refus portant sur un utilisateur, l'API n'en fournissant qu'un générique en anglais. */
export function extractUserFormError(err: unknown, isEdit: boolean): string {
  if (getApiErrorStatus(err) === 403) {
    return isEdit
      ? PEER_MANAGEMENT_REFUSED
      : "Vous n'avez pas les droits pour créer cet utilisateur.";
  }

  return extractApiError(err, isEdit);
}

/**
 * The server's own message when it sent one, the caller's fallback otherwise.
 *
 * Used for refusals the user can act on — a 409 from the catalogue sale lock names
 * the module and learning path responsible, which a generic "une erreur est
 * survenue" would throw away.
 */
export function apiMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    const maybeJson = (err as Record<string, unknown>).json;
    if (maybeJson && typeof maybeJson === 'object') {
      const msg = (maybeJson as Record<string, unknown>).message;
      if (typeof msg === 'string' && msg.length > 0) return msg;
    }
  }
  return fallback;
}

export function extractApiError(err: unknown, isEdit: boolean): string {
  if (err && typeof err === 'object') {
    const maybeJson = (err as Record<string, unknown>).json;
    if (maybeJson && typeof maybeJson === 'object') {
      const msg = (maybeJson as Record<string, unknown>).message;
      if (typeof msg === 'string' && msg.length > 0) return msg;
    }
  }
  return isEdit
    ? 'Une erreur est survenue lors de la modification.'
    : 'Une erreur est survenue lors de la création.';
}
