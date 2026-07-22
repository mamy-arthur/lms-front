import { useMutation, useQueryClient } from '@tanstack/react-query';
import { learningPathCategoriesApi } from '../api';
import { learningPathCategoryKeys, learningPathKeys } from '@/shared/queries/keys';

export function useDeleteLearningPathCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => learningPathCategoriesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: learningPathCategoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: learningPathKeys.lists() });
    },
  });
}
