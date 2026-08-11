import { useQuery } from '@tanstack/react-query';
import { purchasedLearningPathKeys } from '@/shared/queries/keys';
import { purchasedLearningPathsManagementApi } from '../api';
import type { PurchasedLearningPathQueryParams, PurchasedLearningPathsQueryResult } from '../types';

export function usePurchasedLearningPathsQuery(params: PurchasedLearningPathQueryParams = {}) {
  return useQuery<PurchasedLearningPathsQueryResult>({
    queryKey: purchasedLearningPathKeys.list(params),
    queryFn: () => purchasedLearningPathsManagementApi.list(params),
    placeholderData: (prev) => prev,
  });
}
