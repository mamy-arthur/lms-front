import { apiGet } from '@/shared/lib/apiClient';
import type { ApiEnrollmentsHistoryWithLearnerListResponse } from '@/shared/types/enrollment.types';
import type {
  ApiPurchasedLearningPathLearnersResponse,
  ApiPurchasedLearningPathsResponse,
  PurchasedLearningPathEnrollmentsParams,
  PurchasedLearningPathLearnersParams,
  PurchasedLearningPathListParams,
} from '@/shared/types/purchased-learning-path.types';

/**
 * Parcours achetés — routes /purchased-learning-paths
 * Authentification : token tenant (ability:tenant:{id})
 * Authorization : Gate client manager
 */
export const purchasedLearningPathsApi = {
  list: (params?: PurchasedLearningPathListParams) =>
    apiGet<ApiPurchasedLearningPathsResponse>(
      'purchased-learning-paths',
      params as Record<string, unknown>,
    ),

  listLearners: (id: string, params?: PurchasedLearningPathLearnersParams) =>
    apiGet<ApiPurchasedLearningPathLearnersResponse>(
      `purchased-learning-paths/${id}/learners`,
      params as Record<string, unknown>,
    ),

  listEnrollmentsHistory: (id: string, params?: PurchasedLearningPathEnrollmentsParams) =>
    apiGet<ApiEnrollmentsHistoryWithLearnerListResponse>(
      `purchased-learning-paths/${id}/enrollments/history`,
      params as Record<string, unknown>,
    ),
};
