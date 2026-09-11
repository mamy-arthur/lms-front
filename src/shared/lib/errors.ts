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
 * Statut HTTP porté par une erreur du apiClient.
 * `undefined` signale une panne réseau : la requête n'a jamais reçu de réponse.
 */
export function getApiErrorStatus(err: unknown): number | undefined {
  if (!err || typeof err !== 'object') return undefined;
  const status = (err as { status?: unknown }).status;

  return typeof status === 'number' ? status : undefined;
}

/** Valeur de l'en-tête `Retry-After`, en secondes, quand l'API en pose un. */
export function getRetryAfterSeconds(err: unknown): number | undefined {
  if (!err || typeof err !== 'object') return undefined;
  const headers = (err as { headers?: unknown }).headers;

  if (!headers || typeof (headers as Headers).get !== 'function') return undefined;

  const raw = (headers as Headers).get('Retry-After');
  if (raw === null) return undefined;

  const seconds = Number.parseInt(raw, 10);

  return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined;
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
