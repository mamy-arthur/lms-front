import { apiGet } from '@/shared/lib/apiClient';
import type {
  ApiPurchasedLearningPathsResponse,
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
};
