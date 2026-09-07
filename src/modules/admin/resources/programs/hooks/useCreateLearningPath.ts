import { useMutation, useQueryClient } from '@tanstack/react-query';
import { learningPathsApi } from '../api';
import { learningPathKeys, shopLearningPathKeys } from '@/shared/queries/keys';
import type { CreateLearningPathPayload } from '../types';

// Feedback utilisateur (toast) géré par l'appelant (learning-path-form-drawer.tsx), pas ici.
export function useCreateLearningPath() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLearningPathPayload) => learningPathsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: learningPathKeys.lists() });
      queryClient.invalidateQueries({ queryKey: shopLearningPathKeys.all });
    },
  });
}
