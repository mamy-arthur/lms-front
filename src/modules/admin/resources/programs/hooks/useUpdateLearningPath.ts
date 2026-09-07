import { useMutation, useQueryClient } from '@tanstack/react-query';
import { learningPathsApi } from '../api';
import { learningPathKeys, shopLearningPathKeys } from '@/shared/queries/keys';
import type { UpdateLearningPathPayload } from '../types';

// Feedback utilisateur (toast) géré par l'appelant (learning-path-form-drawer.tsx), pas ici.
export function useUpdateLearningPath() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & UpdateLearningPathPayload) =>
      learningPathsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: learningPathKeys.lists() });
      queryClient.invalidateQueries({ queryKey: learningPathKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: shopLearningPathKeys.all });
    },
  });
}
