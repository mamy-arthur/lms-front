import { useQuery } from '@tanstack/react-query';
import { adminUsersApi } from '../api';
import type { UserSearchParams } from '../types';
import { normalizeUser } from '../types';

export const ADMIN_USERS_QUERY_KEY = ['admin', 'users'] as const;

export function useUsersQuery(params?: UserSearchParams) {
  return useQuery({
    queryKey: [...ADMIN_USERS_QUERY_KEY, params],
    queryFn: async () => {
      const res = await adminUsersApi.list(params);
      return {
        data: res.data.map((u) => normalizeUser(u as unknown as Record<string, unknown>)),
        total: res.total,
      };
    },
    placeholderData: (prev) => prev,
  });
}
