/**
 * Extrait un message d'erreur lisible depuis une erreur HTTP du apiClient
 * (objet Error enrichi avec `status` / `json`).
 *
 * Gère les réponses Laravel classiques :
 * - `{ message: "..." }`
 * - `{ message: "...", errors: { field: ["..."] } }` (validation 422)
 */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (!err || typeof err !== 'object') return fallback;

  const e = err as { message?: unknown; json?: unknown };
  const json = e.json;

  if (json && typeof json === 'object') {
    const body = json as Record<string, unknown>;

    if (body.errors && typeof body.errors === 'object' && body.errors !== null) {
      const fieldMessages = Object.values(body.errors as Record<string, unknown>)
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .filter((m): m is string => typeof m === 'string' && m.trim().length > 0);
      if (fieldMessages.length > 0) {
        return fieldMessages.join(' ');
      }
    }

    if (typeof body.message === 'string' && body.message.trim()) {
      return body.message.trim();
    }
  }

  if (typeof e.message === 'string' && e.message.trim() && !isGenericHttpStatusText(e.message)) {
    return e.message.trim();
  }

  return fallback;
}

/** StatusText issus de `fetch` — trop vagues pour l'utilisateur. */
function isGenericHttpStatusText(message: string): boolean {
  return /^(OK|Created|Bad Request|Unauthorized|Forbidden|Not Found|Conflict|Unprocessable (Entity|Content)|Internal Server Error|Unknown Error)$/i.test(
    message.trim(),
  );
}

/**
 * Construit un message toast à partir des erreurs de validation react-hook-form / zod.
 */
export function getFormValidationMessage(
  errors: Record<string, { message?: string } | undefined>,
  fallback = 'Veuillez corriger les erreurs du formulaire avant d’enregistrer.',
): string {
  const messages = Object.values(errors)
    .map((e) => e?.message)
    .filter((m): m is string => typeof m === 'string' && m.trim().length > 0);

  if (messages.length === 0) return fallback;
  if (messages.length === 1) return messages[0];
  return messages.join(' · ');
}
