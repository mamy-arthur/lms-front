import { useMutation, useQueryClient } from '@tanstack/react-query';
import { learningPathCategoriesApi } from '../api';
import { learningPathCategoryKeys } from '@/shared/queries/keys';
import type { CreateLearningPathCategoryPayload } from '../types';

export function useCreateLearningPathCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLearningPathCategoryPayload) => learningPathCategoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: learningPathCategoryKeys.lists() });
    },
  });
}
