import { useMutation, useQueryClient } from '@tanstack/react-query';
import { learningPathCategoriesApi } from '../api';
import { learningPathCategoryKeys } from '@/shared/queries/keys';
import type { UpdateLearningPathCategoryPayload } from '../types';

export function useUpdateLearningPathCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & UpdateLearningPathCategoryPayload) =>
      learningPathCategoriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: learningPathCategoryKeys.lists() });
    },
  });
}
