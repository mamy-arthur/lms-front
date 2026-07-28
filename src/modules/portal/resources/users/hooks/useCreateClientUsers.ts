import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ClientUsersApi } from '../api';
import type { CreateClientUserPayload } from '../types';
import { TENANT_USERS_QUERY_KEY } from './useClientUsersQuery';

export function useCreateClientUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateClientUserPayload) => ClientUsersApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TENANT_USERS_QUERY_KEY }),
  });
}
