import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ClientUsersApi } from '../api';
import { TENANT_USERS_QUERY_KEY } from './useClientUsersQuery';

export function useToggleClientUserActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      ClientUsersApi.update(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TENANT_USERS_QUERY_KEY }),
  });
}
