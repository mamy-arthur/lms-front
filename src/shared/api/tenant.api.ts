import type { Tenant } from "@/shared/types/tenant.types";

/**
 * Récupère le tenant associé au slug courant via GET /api/tenant/current.
 *
 * On utilise fetch natif (pas apiClient) car cet appel est effectué
 * avant toute authentification, au démarrage du TenantProvider.
 *
 * Le backend identifie le tenant grâce à l'en-tête X-Tenant-Slug.
 * L'AbortSignal permet d'annuler la requête si le composant est démonté.
 */
export async function fetchTenantBySlug(
  slug: string,
  signal?: AbortSignal,
): Promise<Tenant> {
  const response = await fetch("/api/tenant/current", {
    headers: { "X-Tenant-Slug": slug },
    signal,
  });

  if (!response.ok) {
    const error = new Error("Tenant not found");
    (error as Error & { status: number }).status = response.status;
    throw error;
  }

  return response.json() as Promise<Tenant>;
}
