import { useQuery } from '@tanstack/react-query';
import { groupsApi } from '@/shared/api/groups.api';
import { groupKeys } from '@/shared/queries/keys';
import { ASSIGNABLE_LIST_PAGE_SIZE } from '../lib/constants';
import { mapApiGroupToAssignable } from '../lib/mappers';
import type { AssignableGroup } from '../types';

export function useGroupsQuery() {
  return useQuery({
    queryKey: groupKeys.list({ page: 1, per_page: ASSIGNABLE_LIST_PAGE_SIZE }),
    queryFn: async (): Promise<AssignableGroup[]> => {
      const response = await groupsApi.list({
        page: 1,
        per_page: ASSIGNABLE_LIST_PAGE_SIZE,
      });
      return response.data.map(mapApiGroupToAssignable);
    },
    placeholderData: (prev) => prev,
  });
}
