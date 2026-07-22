import { useMutation, useQueryClient } from '@tanstack/react-query';
import { learningPathsApi } from '../api';
import { learningPathKeys } from '@/shared/queries/keys';

export function useDeleteLearningPath() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => learningPathsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: learningPathKeys.lists() });
    },
  });
}
