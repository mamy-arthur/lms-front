import { useQuery } from '@tanstack/react-query';
import { learningPathCategoriesApi } from '../api';
import { learningPathCategoryKeys } from '@/shared/queries/keys';
import { normalizeLearningPathCategory } from '../types';
import { useAuthStore } from '@/shared/stores/auth.store';
import { apiGet } from '@/shared/lib/apiClient';
import type { ApiLearningPathCategory } from '@/shared/types/learning-path.types';

export function useLearningPathCategoriesQuery(shop = false) {
  const simulatedRole = useAuthStore((s) => s.simulatedRole);
  const liveShop = shop && !!simulatedRole;
  return useQuery({
    queryKey: liveShop ? ['simulation-shop-categories'] : learningPathCategoryKeys.lists(),
    queryFn: async () => {
      const res = liveShop
        ? await apiGet<{ data: ApiLearningPathCategory[] }>(
            'role-simulation/shop/learning-path-categories',
          )
        : await learningPathCategoriesApi.list();
      return res.data.map(normalizeLearningPathCategory);
    },
  });
}
