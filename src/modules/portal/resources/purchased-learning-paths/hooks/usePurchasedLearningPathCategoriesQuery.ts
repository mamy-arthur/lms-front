import { useQuery } from '@tanstack/react-query';
import { clientShopApi } from '@/shared/api/learning-paths.api';
import { useAuthStore } from '@/shared/stores/auth.store';
import { apiGet } from '@/shared/lib/apiClient';
import type { ApiLearningPathCategory } from '@/shared/types/learning-path.types';

export function usePurchasedLearningPathCategoriesQuery() {
  const simulatedRole = useAuthStore((state) => state.simulatedRole);
  return useQuery({
    queryKey: ['portal', 'purchased-learning-path-categories'],
    queryFn: async () => {
      // Training screens must not reuse the live shop's category data in simulation.
      const res = simulatedRole
        ? await apiGet<{ data: ApiLearningPathCategory[] }>('platform/learning-path-categories')
        : await clientShopApi.listCategories();
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
