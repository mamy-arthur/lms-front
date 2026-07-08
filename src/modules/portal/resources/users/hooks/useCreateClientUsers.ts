import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ClientUsersApi } from '../api';
import type { CreateClientUserPayload, ClientUser } from '../types';
import { normalizeClientUser } from '../types';
import { TENANT_USERS_QUERY_KEY } from './useClientUsersQuery';

/**
 * Mutation de création d'un utilisateur via POST /v1/users.
 *
 * Sur succès, le nouvel utilisateur est injecté en tête de la liste via
 * `setQueryData` — aucun refetch réseau nécessaire (données mock).
 */
export function useCreateClientUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateClientUserPayload) => ClientUsersApi.create(data),
    onSuccess: ({ data: rawUser }) => {
      const newUser = normalizeClientUser(rawUser as unknown as Record<string, unknown>);
      queryClient.setQueryData<ClientUser[]>(TENANT_USERS_QUERY_KEY, (prev = []) => [
        newUser,
        ...prev,
      ]);
    },
  });
}
