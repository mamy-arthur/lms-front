import { useQuery } from '@tanstack/react-query';
import { clientShopApi } from '@/shared/api/learning-paths.api';

export function usePurchasedLearningPathCategoriesQuery() {
  return useQuery({
    queryKey: ['portal', 'purchased-learning-path-categories'],
    queryFn: async () => {
      const res = await clientShopApi.listCategories();
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
