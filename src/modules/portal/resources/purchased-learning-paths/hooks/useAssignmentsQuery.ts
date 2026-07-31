import { useQuery } from '@tanstack/react-query';
import { assignmentsApi } from '@/shared/api/assignments.api';
import { assignmentKeys } from '@/shared/queries/keys';
import type { ApiAssignment } from '@/shared/types/assignment.types';
import { ASSIGNABLE_LIST_PAGE_SIZE } from '../lib/constants';

export function useAssignmentsQuery() {
  return useQuery({
    queryKey: assignmentKeys.list({ page: 1, per_page: ASSIGNABLE_LIST_PAGE_SIZE }),
    queryFn: async (): Promise<ApiAssignment[]> => {
      const response = await assignmentsApi.list({
        page: 1,
        per_page: ASSIGNABLE_LIST_PAGE_SIZE,
      });
      return response.data;
    },
    placeholderData: (prev) => prev,
  });
}
