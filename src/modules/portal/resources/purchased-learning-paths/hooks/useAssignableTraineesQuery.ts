import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/shared/api/users.api';
import { userKeys } from '@/shared/queries/keys';
import { ASSIGNABLE_LIST_PAGE_SIZE } from '../lib/constants';
import { mapToAssignableUser } from '../lib/mappers';
import type { TenantAssignableUser } from '../types';

export function useAssignableTraineesQuery(enabled = true) {

  return useQuery({
    queryKey: userKeys.list({
      role: 'TRAINEE',
      page: 0,
      page_size: ASSIGNABLE_LIST_PAGE_SIZE,
    }),
    queryFn: async (): Promise<TenantAssignableUser[]> => {
      const response = await usersApi.list({
        role: 'TRAINEE',
        page: 0,
        page_size: ASSIGNABLE_LIST_PAGE_SIZE,
      });
      return response.data.map((user) => mapToAssignableUser(user));
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}
