import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tenantUsersApi } from "../api";
import { normalizeTenantUser } from "../types";
import { TENANT_USERS_QUERY_KEY } from "./useTenantUsersQuery";
import type { CreateTenantUserPayload, TenantUser } from "../types";

/**
 * Mutation de création d'un utilisateur via POST /v1/users.
 *
 * Sur succès, le nouvel utilisateur est injecté en tête de la liste via
 * `setQueryData` — aucun refetch réseau nécessaire (données mock).
 */
export function useCreateTenantUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTenantUserPayload) => tenantUsersApi.create(data),
    onSuccess: ({ data: rawUser }) => {
      const newUser = normalizeTenantUser(
        rawUser as unknown as Record<string, unknown>,
      );
      queryClient.setQueryData<TenantUser[]>(
        TENANT_USERS_QUERY_KEY,
        (prev = []) => [newUser, ...prev],
      );
    },
  });
}
