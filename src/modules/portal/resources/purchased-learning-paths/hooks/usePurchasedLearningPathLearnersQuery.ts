import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { purchasedLearningPathKeys } from '@/shared/queries/keys';
import { purchasedLearningPathsManagementApi } from '../api';
import { ASSIGNABLE_LIST_PAGE_SIZE } from '../lib/constants';

/** enrollment: null = jamais inscrit à ce parcours. */
export function usePurchasedLearningPathLearnersQuery(plpId: string | null | undefined) {
  const query = useQuery({
    queryKey: purchasedLearningPathKeys.learners(plpId ?? ''),
    queryFn: () => {
      if (!plpId) return Promise.resolve({ data: [], total: 0 });
      return purchasedLearningPathsManagementApi.listLearners(plpId, {
        per_page: ASSIGNABLE_LIST_PAGE_SIZE,
      });
    },
    enabled: Boolean(plpId),
    placeholderData: (prev) => prev,
  });

  const learners = useMemo(() => (plpId ? (query.data?.data ?? []) : []), [plpId, query.data]);

  return {
    learners,
    total: plpId ? (query.data?.total ?? 0) : 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
  };
}
