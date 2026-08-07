import { apiGet } from "@/shared/lib/apiClient";
import type { ApiEnrollmentsListResponse } from "@/shared/types/enrollment.types";
import type {
  ApiPurchasedLearningPathsResponse,
  PurchasedLearningPathEnrollmentsParams,
  PurchasedLearningPathListParams,
} from "@/shared/types/purchased-learning-path.types";

/**
 * Parcours achetés — routes /purchased-learning-paths
 * Authentification : token tenant (ability:tenant:{id})
 * Authorization : Gate client manager
 */
export const purchasedLearningPathsApi = {
  list: (params?: PurchasedLearningPathListParams) =>
    apiGet<ApiPurchasedLearningPathsResponse>(
      "purchased-learning-paths",
      params as Record<string, unknown>,
    ),

  listEnrollments: (
    id: string,
    params?: PurchasedLearningPathEnrollmentsParams,
  ) =>
    apiGet<ApiEnrollmentsListResponse>(
      `purchased-learning-paths/${id}/enrollments`,
      params as Record<string, unknown>,
    ),
};
