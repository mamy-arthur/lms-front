import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { purchasedLearningPathKeys } from '@/shared/queries/keys';
import type { EnrollmentStatus } from '@/shared/types/enrollment.types';
import { purchasedLearningPathsManagementApi } from '../api';
import { ASSIGNABLE_LIST_PAGE_SIZE } from '../lib/constants';
import type { PurchasedLearningPathStatKey } from '../types';

const STAT_TO_STATUS: Record<PurchasedLearningPathStatKey, EnrollmentStatus | undefined> = {
  cumulative: undefined,
  inProgress: 'in_progress',
  notStarted: 'not_started',
};

export function usePurchasedLearningPathEnrollmentsHistoryQuery(
  plpId: string | null | undefined,
  stat: PurchasedLearningPathStatKey = 'cumulative',
) {
  const status = STAT_TO_STATUS[stat];

  const query = useQuery({
    queryKey: purchasedLearningPathKeys.enrollmentsHistory(plpId ?? '', { status }),
    queryFn: () => {
      if (!plpId) return Promise.resolve({ data: [], total: 0 });
      return purchasedLearningPathsManagementApi.listEnrollmentsHistory(plpId, {
        ...(status ? { status } : {}),
        per_page: ASSIGNABLE_LIST_PAGE_SIZE,
      });
    },
    enabled: Boolean(plpId),
    placeholderData: (prev) => prev,
  });

  const enrollments = useMemo(() => (plpId ? (query.data?.data ?? []) : []), [plpId, query.data]);

  return {
    enrollments,
    total: plpId ? (query.data?.total ?? 0) : 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
  };
}
