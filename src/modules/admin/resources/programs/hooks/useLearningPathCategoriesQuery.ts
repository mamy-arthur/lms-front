import { useQuery } from '@tanstack/react-query';
import { learningPathCategoriesApi } from '../api';
import { learningPathCategoryKeys } from '@/shared/queries/keys';
import { normalizeLearningPathCategory } from '../types';

export function useLearningPathCategoriesQuery() {
  return useQuery({
    queryKey: learningPathCategoryKeys.lists(),
    queryFn: async () => {
      const res = await learningPathCategoriesApi.list();
      return res.data.map(normalizeLearningPathCategory);
    },
  });
}
