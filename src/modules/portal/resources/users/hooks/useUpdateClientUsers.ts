import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ClientUsersApi } from '../api';
import type { ClientUser, UpdateClientUserPayload } from '../types';
import { normalizeClientUser } from '../types';
import { TENANT_USERS_QUERY_KEY } from './useClientUsersQuery';

export function useUpdateClientUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientUserPayload }) =>
      ClientUsersApi.update(id, data),
    onSuccess: ({ data: rawUser }) => {
      const updated = normalizeClientUser(rawUser as unknown as Record<string, unknown>);
      queryClient.setQueryData<ClientUser[]>(TENANT_USERS_QUERY_KEY, (prev = []) =>
        prev.map((u) => (u.id === updated.id ? updated : u)),
      );
    },
  });
}
