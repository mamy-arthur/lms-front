/**
 * Transforme le paramètre `category` (utilisé dans les filtres frontend)
 * en `status` attendu par l'API backend.
 */
export function buildResourceQueryParams<T extends Record<string, unknown>>(
  params?: T,
): Record<string, unknown> {
  const { category, ...rest } = (params ?? {}) as Record<string, unknown>;
  return { ...rest, ...(category !== undefined ? { status: category } : {}) };
}
