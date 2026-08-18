import { purchasedLearningPathsApi } from '@/shared/api/purchased-learning-paths.api';
import type {
  PurchasedLearningPathEnrollmentsParams,
  PurchasedLearningPathLearnersParams,
} from '@/shared/types/purchased-learning-path.types';
import {
  mapEnrollmentHistoryToRow,
  mapLearnerToRow,
  mapToPurchasedLearningPath,
} from '../lib/mappers';
import type {
  PurchasedLearningPathEnrollment,
  PurchasedLearningPathLearner,
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

  async listLearners(
    id: string,
    params: PurchasedLearningPathLearnersParams = {},
  ): Promise<{ data: PurchasedLearningPathLearner[]; total: number }> {
    const response = await purchasedLearningPathsApi.listLearners(id, params);
    return { data: response.data.map(mapLearnerToRow), total: response.meta.total };
  },

  async listEnrollmentsHistory(
    id: string,
    params: PurchasedLearningPathEnrollmentsParams = {},
  ): Promise<{ data: PurchasedLearningPathEnrollment[]; total: number }> {
    const response = await purchasedLearningPathsApi.listEnrollmentsHistory(id, params);
    return { data: response.data.map(mapEnrollmentHistoryToRow), total: response.meta.total };
  },
} as const;
