import { useQuery } from '@tanstack/react-query';
import { clientUsersApi } from '../api';
import { normalizeClientUser } from '../types';
import type { ClientUserSearchParams } from '../types';

export const TENANT_USERS_QUERY_KEY = ['tenant', 'users'] as const;

export function useClientUsersQuery(params?: ClientUserSearchParams) {
  return useQuery({
    queryKey: [...TENANT_USERS_QUERY_KEY, params],
    queryFn: async () => {
      const res = await clientUsersApi.list(params);
      return {
        data: res.data.map((u) => normalizeClientUser(u as unknown as Record<string, unknown>)),
        total: res.total,
      };
    },
    placeholderData: (prev) => prev,
  });
}
