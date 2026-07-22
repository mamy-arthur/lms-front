import { useMutation, useQueryClient } from '@tanstack/react-query';
import { learningPathsApi } from '../api';
import { learningPathKeys } from '@/shared/queries/keys';
import type { CreateLearningPathPayload } from '../types';

export function useCreateLearningPath() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLearningPathPayload) => learningPathsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: learningPathKeys.lists() });
    },
  });
}
