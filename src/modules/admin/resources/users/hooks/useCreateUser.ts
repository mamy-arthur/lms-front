import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminUsersApi } from '../api';
import type { CreateUserPayload, User } from '../types';
import { normalizeUser } from '../types';
import { ADMIN_USERS_QUERY_KEY } from './useUsersQuery';

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserPayload) => adminUsersApi.create(data),
    onSuccess: ({ data: rawUser }) => {
      const newUser = normalizeUser(rawUser as unknown as Record<string, unknown>);
      queryClient.setQueryData<{ data: User[]; total: number }>(ADMIN_USERS_QUERY_KEY, (prev) => ({
        data: [newUser, ...(prev?.data ?? [])],
        total: (prev?.total ?? 0) + 1,
      }));
    },
  });
}
