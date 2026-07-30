import { purchasedLearningPathsApi } from '@/shared/api/purchased-learning-paths.api';
import { getAllTenantAssignableUsers, getAllTenantGroups } from '../data/assignable.mock';
import { mapToPurchasedLearningPath } from '../lib/mappers';
import type {
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

    const purchasedLearningPaths = response.data.map(mapToPurchasedLearningPath);
    const users = getAllTenantAssignableUsers().map((user) => ({ ...user }));
    const groups = getAllTenantGroups().map((group) => ({ ...group, userIds: [...group.userIds] }));

    return {
      purchasedLearningPaths,
      users,
      groups,
      meta: {
        total: response.meta.total,
        page: response.meta.page,
        perPage: response.meta.per_page,
      },
    };
  },
} as const;
