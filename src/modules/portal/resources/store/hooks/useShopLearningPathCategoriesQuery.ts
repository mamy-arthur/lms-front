import { useQuery } from '@tanstack/react-query';
import { clientShopApi } from '@/shared/api/learning-paths.api';

export function useShopLearningPathCategoriesQuery() {
  return useQuery({
    queryKey: ['portal', 'shop', 'learning-path-categories'],
    queryFn: () => clientShopApi.listCategories(),
    staleTime: 5 * 60 * 1000,
  });
}
