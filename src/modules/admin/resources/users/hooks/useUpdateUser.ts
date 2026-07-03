import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminUsersApi } from '../api';
import type { CreateUserPayload, User } from '../types';
import { normalizeUser } from '../types';
import { ADMIN_USERS_QUERY_KEY } from './useUsersQuery';

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateUserPayload> }) =>
      adminUsersApi.update(id, data),
    onSuccess: ({ data: rawUser }) => {
      const updated = normalizeUser(rawUser as unknown as Record<string, unknown>);
      queryClient.setQueryData<{ data: User[]; total: number }>(ADMIN_USERS_QUERY_KEY, (prev) => ({
        data: (prev?.data ?? []).map((u) => (u.id === updated.id ? updated : u)),
        total: prev?.total ?? 0,
      }));
    },
  });
}
