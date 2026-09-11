import { getApiErrorMessage, getApiErrorStatus, getRetryAfterSeconds } from '@/shared/lib/errors';

const INVALID_CREDENTIALS = 'Email ou mot de passe incorrect.';

/**
 * Traduit l'échec d'un `POST auth/login` en message affichable.
 *
 * L'étape mot de passe ne renvoie pas que des identifiants invalides : le compte
 * peut être bloqué (423), la route limitée en débit (429), le backend en panne
 * (5xx) ou injoignable. Présenter tous ces cas comme une erreur de saisie pousse
 * l'utilisateur à réessayer, ce qui aggrave précisément le blocage et le throttle.
 */
export function getLoginErrorMessage(err: unknown): string {
  const status = getApiErrorStatus(err);

  // Aucune réponse reçue : le serveur n'a jamais validé le mot de passe.
  if (status === undefined) {
    return 'Impossible de joindre le serveur. Vérifiez votre connexion, puis réessayez.';
  }

  if (status === 423) {
    return getApiErrorMessage(
      err,
      'Votre compte est bloqué après trop de tentatives. Contactez un administrateur.',
    );
  }

  if (status === 429) {
    const retryAfter = getRetryAfterSeconds(err);

    return retryAfter === undefined
      ? 'Trop de tentatives de connexion. Réessayez dans quelques instants.'
      : `Trop de tentatives de connexion. Réessayez dans ${formatRetryDelay(retryAfter)}.`;
  }

  if (status >= 500) {
    return 'Le service est momentanément indisponible. Réessayez dans quelques instants.';
  }

  return getApiErrorMessage(err, INVALID_CREDENTIALS);
}

function formatRetryDelay(seconds: number): string {
  if (seconds < 60) return `${Math.max(seconds, 1)} seconde${seconds > 1 ? 's' : ''}`;

  const minutes = Math.ceil(seconds / 60);

  return `${minutes} minute${minutes > 1 ? 's' : ''}`;
}
