import { purchasedLearningPathsApi } from '@/shared/api/purchased-learning-paths.api';
import type { PurchasedLearningPathEnrollmentsParams } from '@/shared/types/purchased-learning-path.types';
import { mapEnrollmentToRow, mapToPurchasedLearningPath } from '../lib/mappers';
import type {
  PurchasedLearningPathEnrollment,
  PurchasedLearningPathQueryParams,
  PurchasedLearningPathsQueryResult,
} from '../types';

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
  ): Promise<{ data: PurchasedLearningPathEnrollment[]; total: number }> {
    const response = await purchasedLearningPathsApi.listEnrollments(id, params);
    return { data: response.data.map(mapEnrollmentToRow), total: response.meta.total };
  },
} as const;
