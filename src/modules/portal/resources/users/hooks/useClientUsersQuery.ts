import { useQuery } from '@tanstack/react-query';
import { MOCK_USERS } from '@modules/shared/components/users/mocks/users.mock';
import { normalizeClientUser } from '../types';
import type { ClientUser, ClientUserSearchParams } from '../types';

export const TENANT_USERS_QUERY_KEY = ['tenant', 'users'] as const;

export function useClientUsersQuery(params?: ClientUserSearchParams) {
  return useQuery<{ data: ClientUser[]; total: number }>({
    queryKey: [...TENANT_USERS_QUERY_KEY, params],
    queryFn: () => {
      const data = MOCK_USERS.map((u) => normalizeClientUser(u));
      return { data, total: data.length };
    },
    placeholderData: (prev) => prev,
  });
}
