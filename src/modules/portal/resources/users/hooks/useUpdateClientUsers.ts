import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ClientUsersApi } from '../api';
import type { UpdateClientUserPayload } from '../types';
import { TENANT_USERS_QUERY_KEY } from './useClientUsersQuery';

export function useUpdateClientUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientUserPayload }) =>
      ClientUsersApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TENANT_USERS_QUERY_KEY }),
  });
}
