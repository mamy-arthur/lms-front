import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminUsersApi } from '../api';
import type { UpdateUserPayload } from '../types';
import { ADMIN_USERS_QUERY_KEY } from './useUsersQuery';

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserPayload }) =>
      adminUsersApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY }),
  });
}
