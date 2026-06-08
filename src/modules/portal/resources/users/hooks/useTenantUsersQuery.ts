import { useQuery } from "@tanstack/react-query";
import { MOCK_TENANT_USERS } from "../mocks/users.mock";
import type { TenantUser } from "../types";

/**
 * Clé de cache partagée — exportée pour permettre aux mutations de mettre
 * à jour la liste sans invalider / refetch (staleTime: Infinity sur mock).
 */
export const TENANT_USERS_QUERY_KEY = ["tenant", "users"] as const;

/**
 * Retourne la liste des utilisateurs du tenant.
 *
 * Actuellement alimenté par un mock (aucun endpoint GET /users disponible).
 * Lorsque l'API sera prête, remplacer `queryFn` par l'appel réel et
 * supprimer `initialData` / `staleTime: Infinity`.
 *
 * `initialData` garantit que le rendu initial est synchrone (pas de spinner).
 * `staleTime: Infinity` empêche tout refetch sur le mock.
 */
export function useTenantUsersQuery() {
  return useQuery<TenantUser[]>({
    queryKey: TENANT_USERS_QUERY_KEY,
    queryFn: (): TenantUser[] => MOCK_TENANT_USERS,
    initialData: MOCK_TENANT_USERS,
    staleTime: Infinity,
  });
}
