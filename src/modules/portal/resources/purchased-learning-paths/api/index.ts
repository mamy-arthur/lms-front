import { purchasedLearningPathsApi } from '@/shared/api/purchased-learning-paths.api';
import type { ApiEnrollment } from '@/shared/types/enrollment.types';
import type { PurchasedLearningPathEnrollmentsParams } from '@/shared/types/purchased-learning-path.types';
import { mapToPurchasedLearningPath } from '../lib/mappers';
import type { PurchasedLearningPathQueryParams, PurchasedLearningPathsQueryResult } from '../types';

export const purchasedLearningPathsManagementApi = {
  async list(
    params: PurchasedLearningPathQueryParams = {},
  ): Promise<PurchasedLearningPathsQueryResult> {
    const response = await purchasedLearningPathsApi.list({
      page: params.page,
      per_page: params.perPage,
    });

    return {
      purchasedLearningPaths: response.data.map(mapToPurchasedLearningPath),
      meta: {
        total: response.meta.total,
        page: response.meta.page,
        perPage: response.meta.per_page,
      },
    };
  },

  async listEnrollments(
    id: string,
    params: PurchasedLearningPathEnrollmentsParams = {},
  ): Promise<ApiEnrollment[]> {
    const response = await purchasedLearningPathsApi.listEnrollments(id, params);
    return response.data;
  },
} as const;
